'use strict';

const { DataTypes } = require('sequelize');
const {
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
} = require('../utils/constants');

module.exports = (sequelize) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reference: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      idempotencyKey: {
        type: DataTypes.STRING(120),
        allowNull: true,
        unique: true,
        field: 'idempotency_key',
      },
      initiatingUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'initiating_user_id',
      },
      senderAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'sender_account_id',
      },
      recipientAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'recipient_account_id',
      },
      type: {
        type: DataTypes.ENUM(...Object.values(TRANSACTION_TYPE)),
        allowNull: false,
        defaultValue: TRANSACTION_TYPE.TRANSFER,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(TRANSACTION_STATUS)),
        allowNull: false,
        defaultValue: TRANSACTION_STATUS.PENDING,
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
      narration: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      failureReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'failure_reason',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'transactions',
      underscored: true,
      indexes: [
        { fields: ['sender_account_id'] },
        { fields: ['recipient_account_id'] },
        { fields: ['initiating_user_id'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Transaction;
};
