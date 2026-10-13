'use strict';

const { DataTypes } = require('sequelize');
const { USER_ROLES } = require('../utils/constants');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'customer_id',
      },
      fullName: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'full_name',
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        set(value) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        },
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },
      // Hashed transaction PIN. Null until the customer sets one.
      pinHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'pin_hash',
      },
      role: {
        type: DataTypes.ENUM(...Object.values(USER_ROLES)),
        allowNull: false,
        defaultValue: USER_ROLES.CUSTOMER,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'CLOSED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at',
      },
    },
    {
      tableName: 'users',
      underscored: true,
    }
  );

  User.prototype.toSafeJSON = function toSafeJSON() {
    const { passwordHash, ...safe } = this.get({ plain: true });
    void passwordHash;
    return safe;
  };

  return User;
};
