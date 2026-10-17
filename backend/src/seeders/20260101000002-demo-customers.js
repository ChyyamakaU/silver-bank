'use strict';

const bcrypt = require('bcrypt');
const config = require('../config/env');
const models = require('../models');
const {
  generateAccountNumber,
  generateCustomerCode,
  generateTransactionReference,
} = require('../utils/reference');

const DEMO_PASSWORD = 'Customer@123';
const DEMO_PIN = '1234';

const DEMO_CUSTOMERS = [
  {
    fullName: 'Ada Okafor',
    email: 'ada@silverbank.test',
    phone: '08011111111',
    openingBalance: '50000000', // NGN 500,000.00 in kobo
  },
  {
    fullName: 'Chidi Bello',
    email: 'chidi@silverbank.test',
    phone: '08022222222',
    openingBalance: '25000000', // NGN 250,000.00 in kobo
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up() {
    const { User, BankAccount, Transaction, LedgerEntry } = models;
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, config.bcrypt.rounds);
    const pinHash = await bcrypt.hash(DEMO_PIN, config.bcrypt.rounds);

    for (const demo of DEMO_CUSTOMERS) {
      const existing = await User.findOne({ where: { email: demo.email } });
      if (existing) continue;

      await models.sequelize.transaction(async (t) => {
        const user = await User.create(
          {
            customerId: generateCustomerCode(),
            fullName: demo.fullName,
            email: demo.email,
            phone: demo.phone,
            passwordHash,
            pinHash,
            role: 'CUSTOMER',
            status: 'ACTIVE',
          },
          { transaction: t }
        );

        const account = await BankAccount.create(
          {
            userId: user.id,
            accountNumber: generateAccountNumber(),
            accountName: demo.fullName,
            accountType: 'SAVINGS',
            currency: 'NGN',
            availableBalance: demo.openingBalance,
            ledgerBalance: demo.openingBalance,
            status: 'ACTIVE',
          },
          { transaction: t }
        );

        // Opening balance is represented as an ADJUSTMENT transaction with a
        // single funding credit entry (per-account reconciliation holds:
        // sum(credits) - sum(debits) === ledger_balance).
        const tx = await Transaction.create(
          {
            reference: generateTransactionReference('SB-ADJ'),
            initiatingUserId: null,
            senderAccountId: null,
            recipientAccountId: account.id,
            type: 'ADJUSTMENT',
            status: 'COMPLETED',
            amount: demo.openingBalance,
            currency: 'NGN',
            narration: 'Opening balance (development seed)',
            metadata: { source: 'seeder' },
          },
          { transaction: t }
        );

        await LedgerEntry.create(
          {
            transactionId: tx.id,
            accountId: account.id,
            direction: 'CREDIT',
            amount: demo.openingBalance,
            currency: 'NGN',
            balanceAfter: demo.openingBalance,
            description: 'Opening balance',
          },
          { transaction: t }
        );
      });
    }
  },

  async down() {
    const { User } = models;
    const emails = DEMO_CUSTOMERS.map((c) => c.email);
    await User.destroy({ where: { email: emails } });
  },
};
