'use strict';

const { DataTypes } = require('sequelize');
const { LEDGER_DIRECTION } = require('../utils/constants');

/**
 * Immutable double-entry ledger postings. A completed transfer produces one
 * DEBIT entry (sender) and one CREDIT entry (recipient) with identical amount
 * and currency. Entries are never updated or deleted through the API.
 */
module.exports = (sequelize) => {
  const LedgerEntry = sequelize.define(
    'LedgerEntry',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transactionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'transaction_id',
      },
      accountId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'account_id',
      },
      direction: {
        type: DataTypes.ENUM(...Object.values(LEDGER_DIRECTION)),
        allowNull: false,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'NGN',
      },
      balanceAfter: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'balance_after',
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    },
    {
      tableName: 'ledger_entries',
      underscored: true,
      updatedAt: false,
      indexes: [
        { fields: ['transaction_id'] },
        { fields: ['account_id'] },
      ],
    }
  );

  return LedgerEntry;
};
