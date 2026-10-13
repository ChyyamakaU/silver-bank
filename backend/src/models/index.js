'use strict';

const sequelize = require('../config/database');

const User = require('./user')(sequelize);
const BankAccount = require('./bankAccount')(sequelize);
const Transaction = require('./transaction')(sequelize);
const LedgerEntry = require('./ledgerEntry')(sequelize);
const Beneficiary = require('./beneficiary')(sequelize);
const RefreshToken = require('./refreshToken')(sequelize);
const AuditLog = require('./auditLog')(sequelize);

// --- User <-> BankAccount (one-to-one) --------------------------------------
User.hasOne(BankAccount, { foreignKey: 'userId', as: 'account' });
BankAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- User <-> Beneficiary ----------------------------------------------------
User.hasMany(Beneficiary, { foreignKey: 'userId', as: 'beneficiaries' });
Beneficiary.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- User <-> RefreshToken ---------------------------------------------------
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Transfers: sender / recipient accounts ---------------------------------
Transaction.belongsTo(BankAccount, {
  foreignKey: 'senderAccountId',
  as: 'senderAccount',
});
Transaction.belongsTo(BankAccount, {
  foreignKey: 'recipientAccountId',
  as: 'recipientAccount',
});
BankAccount.hasMany(Transaction, {
  foreignKey: 'senderAccountId',
  as: 'outgoingTransactions',
});
BankAccount.hasMany(Transaction, {
  foreignKey: 'recipientAccountId',
  as: 'incomingTransactions',
});

// --- User <-> initiated transactions ----------------------------------------
User.hasMany(Transaction, {
  foreignKey: 'initiatingUserId',
  as: 'initiatedTransactions',
});
Transaction.belongsTo(User, {
  foreignKey: 'initiatingUserId',
  as: 'initiatingUser',
});

// --- Transaction <-> LedgerEntry --------------------------------------------
Transaction.hasMany(LedgerEntry, {
  foreignKey: 'transactionId',
  as: 'ledgerEntries',
});
LedgerEntry.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  as: 'transaction',
});

BankAccount.hasMany(LedgerEntry, {
  foreignKey: 'accountId',
  as: 'ledgerEntries',
});
LedgerEntry.belongsTo(BankAccount, {
  foreignKey: 'accountId',
  as: 'account',
});

// --- AuditLog <-> User -------------------------------------------------------
AuditLog.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });
User.hasMany(AuditLog, { foreignKey: 'actorUserId', as: 'auditLogs' });

module.exports = {
  sequelize,
  User,
  BankAccount,
  Transaction,
  LedgerEntry,
  Beneficiary,
  RefreshToken,
  AuditLog,
};
