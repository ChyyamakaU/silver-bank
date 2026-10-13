'use strict';

const models = require('../models');
const { User, BankAccount, Transaction, LedgerEntry } = models;
const config = require('../config/env');
const { hashPassword } = require('../utils/password');
const {
  generateCustomerCode,
  generateTransactionReference,
  generateRandomToken,
} = require('../utils/reference');
const { fundAccount, generateUniqueAccountNumber } = require('./accountService');
const logger = require('../utils/logger');

// The bank's own funding account. Owned by a locked, non-loginable system user
// and flagged isSystem so it never appears as a customer.
const SYSTEM_EMAIL = 'operations@silverbank.internal';
const SYSTEM_PHONE = '08000000001';
const SYSTEM_NAME = 'Silver Bank Operations';

/**
 * Return the singleton bank funding account, creating it (and its system owner)
 * on first use. The account is capitalised with the bank's funding capital,
 * which is the external source of the welcome-bonus credits.
 */
async function getOrCreateFundingAccount({ transaction } = {}) {
  const existing = await BankAccount.findOne({
    where: { isSystem: true },
    order: [['createdAt', 'ASC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (existing) return existing;

  const passwordHash = await hashPassword(generateRandomToken(32));
  const [systemUser] = await User.findOrCreate({
    where: { email: SYSTEM_EMAIL },
    defaults: {
      customerId: generateCustomerCode(),
      fullName: SYSTEM_NAME,
      email: SYSTEM_EMAIL,
      phone: SYSTEM_PHONE,
      passwordHash,
      role: 'ADMIN',
      status: 'SUSPENDED',
    },
    transaction,
  });

  const accountNumber = await generateUniqueAccountNumber(transaction);
  const account = await BankAccount.create(
    {
      userId: systemUser.id,
      accountNumber,
      accountName: SYSTEM_NAME,
      accountType: 'CURRENT',
      currency: config.banking.currency,
      availableBalance: 0,
      ledgerBalance: 0,
      status: 'ACTIVE',
      isSystem: true,
    },
    { transaction }
  );

  // Bank capital: the external funding source for bonuses. This single-sided
  // credit represents the bank's own capital, not a customer deposit.
  if (config.banking.fundingAccountBalance > 0) {
    await fundAccount(account, config.banking.fundingAccountBalance, {
      transaction,
      reference: generateTransactionReference('SB-CAP'),
      narration: 'Bank funding capital',
      description: 'Bank funding capital',
      metadata: { source: 'system_funding' },
    });
  }

  logger.info('Created system funding account', { accountNumber: account.accountNumber });
  return account;
}

/**
 * Credit a new customer's account with the welcome bonus as a proper
 * double-entry posting: DEBIT the bank funding account, CREDIT the customer.
 */
async function creditWelcomeBonus(recipientAccount, amountMinorUnits, { transaction } = {}) {
  const amount = BigInt(amountMinorUnits);
  if (amount <= 0n) return recipientAccount;

  const funding = await getOrCreateFundingAccount({ transaction });

  const fundingAvailableAfter = BigInt(funding.availableBalance) - amount;
  const fundingLedgerAfter = BigInt(funding.ledgerBalance) - amount;
  if (fundingAvailableAfter < 0n || fundingLedgerAfter < 0n) {
    throw new Error('System funding account has insufficient balance for signup bonus');
  }

  const recipientAvailableAfter = BigInt(recipientAccount.availableBalance) + amount;
  const recipientLedgerAfter = BigInt(recipientAccount.ledgerBalance) + amount;

  const tx = await Transaction.create(
    {
      reference: generateTransactionReference('SB-BON'),
      initiatingUserId: null,
      senderAccountId: funding.id,
      recipientAccountId: recipientAccount.id,
      type: 'BONUS',
      status: 'COMPLETED',
      amount: amount.toString(),
      currency: recipientAccount.currency,
      narration: 'Welcome bonus',
      metadata: { source: 'signup_bonus' },
    },
    { transaction }
  );

  await LedgerEntry.bulkCreate(
    [
      {
        transactionId: tx.id,
        accountId: funding.id,
        direction: 'DEBIT',
        amount: amount.toString(),
        currency: funding.currency,
        balanceAfter: fundingLedgerAfter.toString(),
        description: 'Signup bonus funding',
      },
      {
        transactionId: tx.id,
        accountId: recipientAccount.id,
        direction: 'CREDIT',
        amount: amount.toString(),
        currency: recipientAccount.currency,
        balanceAfter: recipientLedgerAfter.toString(),
        description: 'Welcome bonus',
      },
    ],
    { transaction }
  );

  await funding.update(
    {
      availableBalance: fundingAvailableAfter.toString(),
      ledgerBalance: fundingLedgerAfter.toString(),
    },
    { transaction }
  );
  await recipientAccount.update(
    {
      availableBalance: recipientAvailableAfter.toString(),
      ledgerBalance: recipientLedgerAfter.toString(),
    },
    { transaction }
  );

  return recipientAccount;
}

module.exports = {
  getOrCreateFundingAccount,
  creditWelcomeBonus,
  SYSTEM_NAME,
};
