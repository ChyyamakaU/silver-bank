'use strict';

const { Op } = require('sequelize');
const { BankAccount, Transaction, LedgerEntry } = require('../models');
const { generateAccountNumber, generateTransactionReference } = require('../utils/reference');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { formatCurrency, formatMajor } = require('../utils/money');
const config = require('../config/env');

const MAX_ACCOUNT_NUMBER_ATTEMPTS = 6;

async function generateUniqueAccountNumber(transaction = null) {
  for (let attempt = 0; attempt < MAX_ACCOUNT_NUMBER_ATTEMPTS; attempt += 1) {
    const candidate = generateAccountNumber();
    const existing = await BankAccount.findOne({
      where: { accountNumber: candidate },
      transaction,
      attributes: ['id'],
    });
    if (!existing) return candidate;
  }
  throw new Error('Unable to allocate a unique account number');
}

async function createAccountForUser(user, { transaction, accountType = 'SAVINGS' } = {}) {
  const accountNumber = await generateUniqueAccountNumber(transaction);
  return BankAccount.create(
    {
      userId: user.id,
      accountNumber,
      accountName: user.fullName,
      accountType,
      currency: config.banking.currency,
      availableBalance: 0,
      ledgerBalance: 0,
      status: 'ACTIVE',
    },
    { transaction }
  );
}

/**
 * Credit an account by a positive amount (minor units) with a matching
 * ADJUSTMENT transaction and CREDIT ledger entry. Keeps the double-entry
 * invariant intact: sum(credits) - sum(debits) === ledgerBalance.
 */
async function fundAccount(account, amountMinorUnits, { transaction, reference, narration, description, metadata } = {}) {
  const amount = BigInt(amountMinorUnits);
  if (amount <= 0n) return account;

  const availableAfter = BigInt(account.availableBalance) + amount;
  const ledgerAfter = BigInt(account.ledgerBalance) + amount;

  const tx = await Transaction.create(
    {
      reference: reference || generateTransactionReference('SB-ADJ'),
      initiatingUserId: null,
      senderAccountId: null,
      recipientAccountId: account.id,
      type: 'ADJUSTMENT',
      status: 'COMPLETED',
      amount: amount.toString(),
      currency: account.currency,
      narration: narration || null,
      metadata: metadata || null,
    },
    { transaction }
  );

  await LedgerEntry.create(
    {
      transactionId: tx.id,
      accountId: account.id,
      direction: 'CREDIT',
      amount: amount.toString(),
      currency: account.currency,
      balanceAfter: ledgerAfter.toString(),
      description: description || null,
    },
    { transaction }
  );

  await account.update(
    {
      availableBalance: availableAfter.toString(),
      ledgerBalance: ledgerAfter.toString(),
    },
    { transaction }
  );

  return account;
}

async function getAccountByUserId(userId, { transaction = null, lock = false } = {}) {
  return BankAccount.findOne({
    where: { userId },
    transaction,
    lock: lock ? transaction.LOCK.UPDATE : undefined,
  });
}

async function requireAccountByUserId(userId, options = {}) {
  const account = await getAccountByUserId(userId, options);
  if (!account) {
    throw new NotFoundError('No bank account found for this customer');
  }
  return account;
}

function toAccountDTO(account) {
  if (!account) return null;
  const available = account.availableBalance;
  const ledger = account.ledgerBalance;
  return {
    id: account.id,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    accountType: account.accountType,
    currency: account.currency,
    availableBalance: String(available),
    ledgerBalance: String(ledger),
    availableBalanceFormatted: formatCurrency(available, account.currency, config.banking.minorUnits),
    ledgerBalanceFormatted: formatCurrency(ledger, account.currency, config.banking.minorUnits),
    status: account.status,
    createdAt: account.createdAt,
  };
}

async function getBalance(userId) {
  const account = await requireAccountByUserId(userId);
  return toAccountDTO(account);
}

/**
 * Resolve the direction of a transaction from the perspective of an account.
 */
function directionForAccount(tx, accountId) {
  if (tx.senderAccountId === accountId) return 'DEBIT';
  if (tx.recipientAccountId === accountId) return 'CREDIT';
  return 'CREDIT';
}

async function listTransactions(userId, options = {}) {
  const account = await requireAccountByUserId(userId);
  const {
    page = 1,
    limit = 20,
    type,
    status,
    direction,
    from,
    to,
    search,
  } = options;

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const where = {
    [Op.or]: [
      { senderAccountId: account.id },
      { recipientAccountId: account.id },
    ],
  };
  if (type) where.type = type;
  if (status) where.status = status;
  if (direction === 'incoming') where.recipientAccountId = account.id;
  if (direction === 'outgoing') where.senderAccountId = account.id;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = end;
    }
  }
  if (search) {
    where.reference = { [Op.iLike]: `%${String(search).slice(0, 40)}%` };
  }

  const { rows, count } = await Transaction.findAndCountAll({
    where,
    include: [
      { association: 'senderAccount', attributes: ['id', 'accountName', 'accountNumber'] },
      { association: 'recipientAccount', attributes: ['id', 'accountName', 'accountNumber'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });

  const items = rows.map((tx) => toTransactionDTO(tx, account));

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

function toTransactionDTO(tx, account) {
  const isDebit = tx.senderAccountId === account.id;
  const counterpartyAccount = isDebit ? tx.recipientAccount : tx.senderAccount;
  return {
    id: tx.id,
    reference: tx.reference,
    type: tx.type,
    status: tx.status,
    direction: isDebit ? 'DEBIT' : 'CREDIT',
    amount: String(tx.amount),
    amountFormatted: formatCurrency(tx.amount, tx.currency, config.banking.minorUnits),
    amountMajor: formatMajor(tx.amount, config.banking.minorUnits),
    currency: tx.currency,
    narration: tx.narration,
    counterparty: counterpartyAccount
      ? {
          accountName: counterpartyAccount.accountName,
          accountNumber: counterpartyAccount.accountNumber,
        }
      : null,
    createdAt: tx.createdAt,
  };
}

/**
 * Fetch a single transaction, but only if the authenticated customer owns one
 * of the accounts involved. Never trust an arbitrary transaction id.
 */
async function getOwnedTransaction(user, reference) {
  const account = await requireAccountByUserId(user.id);
  const tx = await Transaction.findOne({
    where: {
      reference,
      [Op.or]: [
        { senderAccountId: account.id },
        { recipientAccountId: account.id },
        { initiatingUserId: user.id },
      ],
    },
    include: [
      { association: 'senderAccount', attributes: ['id', 'accountName', 'accountNumber'] },
      { association: 'recipientAccount', attributes: ['id', 'accountName', 'accountNumber'] },
    ],
  });
  if (!tx) {
    throw new NotFoundError('Transaction not found');
  }
  return { tx, account };
}

function toTransactionDetailDTO(tx, account) {
  const base = toTransactionDTO(tx, account);
  return {
    ...base,
    sender: tx.senderAccount
      ? {
          accountName: tx.senderAccount.accountName,
          accountNumber: tx.senderAccount.accountNumber,
        }
      : null,
    recipient: tx.recipientAccount
      ? {
          accountName: tx.recipientAccount.accountName,
          accountNumber: tx.recipientAccount.accountNumber,
        }
      : null,
    failureReason: tx.failureReason || null,
  };
}

async function assertOwnsAccount(user, accountId) {
  const account = await requireAccountByUserId(user.id);
  if (account.id !== accountId) {
    throw new ForbiddenError('You do not have access to this account');
  }
  return account;
}

module.exports = {
  generateUniqueAccountNumber,
  createAccountForUser,
  fundAccount,
  getAccountByUserId,
  requireAccountByUserId,
  toAccountDTO,
  getBalance,
  directionForAccount,
  listTransactions,
  toTransactionDTO,
  getOwnedTransaction,
  toTransactionDetailDTO,
  assertOwnsAccount,
};
