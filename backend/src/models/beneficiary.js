'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Beneficiary = sequelize.define(
    'Beneficiary',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      accountNumber: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'account_number',
      },
      accountName: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'account_name',
      },
      bankName: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Silver Bank',
        field: 'bank_name',
      },
      nickname: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
    },
    {
      tableName: 'beneficiaries',
      underscored: true,
      indexes: [
        { unique: true, fields: ['user_id', 'account_number'] },
      ],
    }
  );

  return Beneficiary;
};
