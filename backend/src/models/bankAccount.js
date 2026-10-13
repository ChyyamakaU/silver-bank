'use strict';

const { DataTypes } = require('sequelize');
const { ACCOUNT_STATUS, ACCOUNT_TYPE } = require('../utils/constants');

module.exports = (sequelize) => {
  const BankAccount = sequelize.define(
    'BankAccount',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
      },
      accountNumber: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        field: 'account_number',
      },
      accountName: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'account_name',
      },
      accountType: {
        type: DataTypes.ENUM(...Object.values(ACCOUNT_TYPE)),
        allowNull: false,
        defaultValue: ACCOUNT_TYPE.SAVINGS,
        field: 'account_type',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'NGN',
      },
      // Balances are integer minor units (kobo). BIGINT returns a string from
      // node-postgres, which money.js handles with BigInt arithmetic.
      availableBalance: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        field: 'available_balance',
      },
      ledgerBalance: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        field: 'ledger_balance',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ACCOUNT_STATUS)),
        allowNull: false,
        defaultValue: ACCOUNT_STATUS.ACTIVE,
      },
      // Internal bank-owned accounts (funding, settlement). Hidden from
      // customer-facing lookups and excluded from customer statistics.
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_system',
      },
    },
    {
      tableName: 'bank_accounts',
      underscored: true,
    }
  );

  return BankAccount;
};
