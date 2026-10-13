'use strict';

const { Op } = require('sequelize');
const models = require('../models');
const { BankAccount, Transaction, LedgerEntry, Beneficiary } = models;
const config = require('../config/env');
const { toMinorUnits, formatCurrency, formatMajor, compareMinor } = require('../utils/money');
const {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnprocessableError,
  AuthError,
} = require('../utils/errors');
const { verifyPin } = require('../utils/password');
const { generateTransactionReference } = require('../utils/reference');
const { requireAccountByUserId, toTransactionDetailDTO } = require('./accountService');
const { record: audit } = require('./auditService');
const { AUDIT_ACTIONS, ACCOUNT_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

const BANK_NAME = 'Silver Bank';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function lookupRecipient(accountNumber, { transaction = null } = {}) {
  if (!/^\d{10}$/.test(String(accountNumber || ''))) {
    throw new ValidationError('Invalid account number', {
      accountNumber: 'Account number must be exactly 10 digits',
    });
  }
  const account = await BankAccount.findOne({
    where: { accountNumber: String(accountNumber), isSystem: false },
    transaction,
    attributes: ['id', 'accountNumber', 'accountName', 'currency', 'status'],
  });
  if (!account) {
    throw new NotFoundError('Recipient account not found');
  }
  // Only the minimum information required to identify the recipient is exposed.
  return {
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    bankName: BANK_NAME,
    currency: account.currency,
    receivable: account.status === ACCOUNT_STATUS.ACTIVE,
  };
}

async function dailyOutgoingTotal(senderAccountId, transaction) {
  const result = await Transaction.findOne({
    where: {
      senderAccountId,
      status: 'COMPLETED',
      type: 'TRANSFER',
      createdAt: { [Op.gte]: startOfToday() },
    },
    attributes: [[models.sequelize.fn('COALESCE', models.sequelize.fn('SUM', models.sequelize.col('amount')), 0), 'total']],
    raw: true,
    transaction,
  });
  return (result && result.total ? BigInt(result.total) : 0n).toString();
}

/**
 * Execute an internal transfer between two Silver Bank accounts.
 * All balance mutations, the transaction record and both ledger entries are
 * written inside a single database transaction with row locks taken in a
 * consistent (account id) order to reduce deadlocks.
 */
async function executeTransfer(user, payload) {
  const { recipientAccountNumber, narration = null } = payload;
  const idempotencyKey = payload.idempotencyKey
    ? String(payload.idempotencyKey).slice(0, 120)
    : null;

  const amount = toMinorUnits(payload.amount, { field: 'amount', allowZero: false });
  const amountBig = BigInt(amount);

  // Every transfer must be authorised with the customer's transaction PIN.
  if (!user.pinHash) {
    throw new UnprocessableError(
      'No transaction PIN is set for this account',
      'PIN_NOT_SET'
    );
  }
  const pinOk = await verifyPin(payload.pin, user.pinHash);
  if (!pinOk) {
    throw new AuthError('Incorrect transaction PIN', 'INVALID_PIN');
  }

  if (compareMinor(amount, String(config.banking.transferMinAmount)) < 0) {
    throw new ValidationError('Amount below minimum', {
      amount: `Minimum transfer is ${formatCurrency(config.banking.transferMinAmount)}`,
    });
  }
  if (compareMinor(amount, String(config.banking.transferMaxAmount)) > 0) {
    throw new ValidationError('Amount above maximum', {
      amount: `Maximum transfer is ${formatCurrency(config.banking.transferMaxAmount)}`,
    });
  }

  // Fast idempotency check (also covers retries after a prior success).
  if (idempotencyKey) {
    const existing = await Transaction.findOne({ where: { idempotencyKey } });
    if (existing) {
      if (existing.initiatingUserId !== user.id) {
        throw new ConflictError('Idempotency key already used', 'IDEMPOTENCY_CONFLICT');
      }
      return buildTransferResult(existing, { idempotentReplay: true });
    }
  }

  let transaction;
  try {
    transaction = await models.sequelize.transaction(async (t) => {
      // Resolve accounts first (no lock) to determine a stable lock order.
      const senderHeader = await requireAccountByUserId(user.id, { transaction: t });
      const recipientHeader = await BankAccount.findOne({
        where: { accountNumber: String(recipientAccountNumber || ''), isSystem: false },
        transaction: t,
        attributes: ['id'],
      });
      if (!recipientHeader) {
        throw new NotFoundError('Recipient account not found');
      }
      if (recipientHeader.id === senderHeader.id) {
        throw new ValidationError('Invalid recipient', {
          recipientAccountNumber: 'You cannot transfer to your own account',
        });
      }

      // Lock both rows in a deterministic order (ascending id).
      const lockedAccounts = await BankAccount.findAll({
        where: { id: { [Op.in]: [senderHeader.id, recipientHeader.id] } },
        order: [['id', 'ASC']],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      const sender = lockedAccounts.find((a) => a.id === senderHeader.id);
      const recipient = lockedAccounts.find((a) => a.id === recipientHeader.id);

      if (!sender || !recipient) {
        throw new NotFoundError('Account could not be locked');
      }

      // Re-validate status and balance inside the lock.
      if (sender.status !== ACCOUNT_STATUS.ACTIVE) {
        throw new UnprocessableError(
          `Your account is ${sender.status.toLowerCase()} and cannot send transfers`,
          'SENDER_ACCOUNT_INACTIVE'
        );
      }
      if (recipient.status !== ACCOUNT_STATUS.ACTIVE) {
        throw new UnprocessableError(
          'Recipient account is not able to receive transfers',
          'RECIPIENT_ACCOUNT_INACTIVE'
        );
      }

      const senderAvailable = BigInt(sender.availableBalance);
      if (senderAvailable < amountBig) {
        throw new UnprocessableError('Insufficient funds', 'INSUFFICIENT_FUNDS');
      }

      const todayTotal = await dailyOutgoingTotal(sender.id, t);
      if (BigInt(todayTotal) + amountBig > BigInt(config.banking.transferDailyLimit)) {
        throw new UnprocessableError(
          'Daily transfer limit exceeded',
          'DAILY_LIMIT_EXCEEDED'
        );
      }

      const senderAvailableAfter = senderAvailable - amountBig;
      const senderLedgerAfter = BigInt(sender.ledgerBalance) - amountBig;
      const recipientAvailableAfter = BigInt(recipient.availableBalance) + amountBig;
      const recipientLedgerAfter = BigInt(recipient.ledgerBalance) + amountBig;

      const reference = generateTransactionReference('SB-TRF');

      const txRecord = await Transaction.create(
        {
          reference,
          idempotencyKey,
          initiatingUserId: user.id,
          senderAccountId: sender.id,
          recipientAccountId: recipient.id,
          type: 'TRANSFER',
          status: 'COMPLETED',
          amount,
          currency: sender.currency,
          narration: narration ? String(narration).slice(0, 200) : null,
          metadata: { channel: 'WEB', senderName: sender.accountName, recipientName: recipient.accountName },
        },
        { transaction: t }
      );

      await LedgerEntry.bulkCreate(
        [
          {
            transactionId: txRecord.id,
            accountId: sender.id,
            direction: 'DEBIT',
            amount,
            currency: sender.currency,
            balanceAfter: senderLedgerAfter.toString(),
            description: `Transfer to ${recipient.accountName} (${recipient.accountNumber})`,
          },
          {
            transactionId: txRecord.id,
            accountId: recipient.id,
            direction: 'CREDIT',
            amount,
            currency: recipient.currency,
            balanceAfter: recipientLedgerAfter.toString(),
            description: `Transfer from ${sender.accountName} (${sender.accountNumber})`,
          },
        ],
        { transaction: t }
      );

      await sender.update(
        {
          availableBalance: senderAvailableAfter.toString(),
          ledgerBalance: senderLedgerAfter.toString(),
        },
        { transaction: t }
      );
      await recipient.update(
        {
          availableBalance: recipientAvailableAfter.toString(),
          ledgerBalance: recipientLedgerAfter.toString(),
        },
        { transaction: t }
      );

      return txRecord;
    });
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      const fields = err.fields || {};
      if (idempotencyKey && (fields.idempotency_key || fields.idempotencyKey)) {
        const existing = await Transaction.findOne({ where: { idempotencyKey } });
        if (existing) {
          if (existing.initiatingUserId !== user.id) {
            throw new ConflictError('Idempotency key already used', 'IDEMPOTENCY_CONFLICT');
          }
          return buildTransferResult(existing, { idempotentReplay: true });
        }
      }
    }
    throw err;
  }

  // Re-fetch with associations for the response.
  const full = await Transaction.findByPk(transaction.id, {
    include: [
      { association: 'senderAccount', attributes: ['id', 'accountName', 'accountNumber'] },
      { association: 'recipientAccount', attributes: ['id', 'accountName', 'accountNumber'] },
    ],
  });

  await audit(
    {
      actorUserId: user.id,
      actorRole: user.role,
      action: AUDIT_ACTIONS.TRANSFER_COMPLETED,
      entityType: 'Transaction',
      entityId: full.id,
      metadata: {
        reference: full.reference,
        amount: String(full.amount),
        senderAccountId: full.senderAccountId,
        recipientAccountId: full.recipientAccountId,
      },
    },
    {}
  );

  logger.info('Transfer completed', { reference: full.reference, amount: String(full.amount) });
  return buildTransferResult(full, { idempotentReplay: false });
}

function buildTransferResult(txRecord, { idempotentReplay }) {
  const account = {
    id: txRecord.senderAccountId,
  };
  void account;
  const detail = {
    id: txRecord.id,
    reference: txRecord.reference,
    type: txRecord.type,
    status: txRecord.status,
    amount: String(txRecord.amount),
    amountFormatted: formatCurrency(txRecord.amount, txRecord.currency, config.banking.minorUnits),
    amountMajor: formatMajor(txRecord.amount, config.banking.minorUnits),
    currency: txRecord.currency,
    narration: txRecord.narration,
    sender: txRecord.senderAccount
      ? {
          accountName: txRecord.senderAccount.accountName,
          accountNumber: txRecord.senderAccount.accountNumber,
        }
      : null,
    recipient: txRecord.recipientAccount
      ? {
          accountName: txRecord.recipientAccount.accountName,
          accountNumber: txRecord.recipientAccount.accountNumber,
        }
      : null,
    createdAt: txRecord.createdAt,
    idempotentReplay,
  };
  return detail;
}

async function getTransferByReference(user, reference) {
  const { getOwnedTransaction } = require('./accountService');
  const { tx, account } = await getOwnedTransaction(user, reference);
  return toTransactionDetailDTO(tx, account);
}

async function getReceipt(user, reference) {
  const detail = await getTransferByReference(user, reference);
  return {
    bank: {
      name: BANK_NAME,
      tagline: 'Banking built on trust',
    },
    receiptNumber: `RCPT-${detail.reference}`,
    reference: detail.reference,
    status: detail.status,
    type: detail.type,
    date: detail.createdAt,
    sender: detail.sender,
    recipient: detail.recipient,
    amount: detail.amount,
    amountMajor: detail.amountMajor,
    amountFormatted: detail.amountFormatted,
    currency: detail.currency,
    narration: detail.narration,
  };
}

async function saveBeneficiary(user, { accountNumber, nickname = null }) {
  const recipient = await lookupRecipient(accountNumber);
  const { requireAccountByUserId } = require('./accountService');
  const own = await requireAccountByUserId(user.id);
  if (own.accountNumber === recipient.accountNumber) {
    throw new ValidationError('Invalid beneficiary', {
      accountNumber: 'You cannot save your own account as a beneficiary',
    });
  }
  const [beneficiary, created] = await Beneficiary.findOrCreate({
    where: { userId: user.id, accountNumber: recipient.accountNumber },
    defaults: {
      accountName: recipient.accountName,
      bankName: BANK_NAME,
      nickname: nickname ? String(nickname).slice(0, 80) : null,
    },
  });
  if (!created && nickname) {
    await beneficiary.update({ nickname: String(nickname).slice(0, 80) });
  }
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.BENEFICIARY_ADDED,
    entityType: 'Beneficiary',
    entityId: beneficiary.id,
    metadata: { accountNumber: beneficiary.accountNumber },
  });
  return beneficiary;
}

module.exports = {
  lookupRecipient,
  executeTransfer,
  getTransferByReference,
  getReceipt,
  saveBeneficiary,
  BANK_NAME,
};
