'use strict';

const { Op } = require('sequelize');
const models = require('../models');
const { User, BankAccount, Transaction, AuditLog } = models;
const { NotFoundError, ValidationError } = require('../utils/errors');
const { formatCurrency, formatMajor } = require('../utils/money');
const config = require('../config/env');
const { toAccountDTO } = require('./accountService');
const { runReconciliation, formatReport } = require('./ledgerService');
const { record: audit } = require('./auditService');
const { AUDIT_ACTIONS, ACCOUNT_STATUS } = require('../utils/constants');

async function listCustomers({ search, status, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const where = { role: 'CUSTOMER' };
  if (status) where.status = status;
  if (search) {
    const term = `%${String(search).slice(0, 80)}%`;
    where[Op.or] = [
      { fullName: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { customerId: { [Op.iLike]: term } },
      { '$account.account_number$': { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ association: 'account' }],
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    subQuery: false,
    distinct: true,
  });

  return {
    items: rows.map((u) => ({
      id: u.id,
      customerId: u.customerId,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      role: u.role,
      createdAt: u.createdAt,
      account: u.account ? toAccountDTO(u.account) : null,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

async function listTransactions({ search, status, type, from, to, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (search) where.reference = { [Op.iLike]: `%${String(search).slice(0, 40)}%` };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = end;
    }
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

  return {
    items: rows.map((tx) => ({
      id: tx.id,
      reference: tx.reference,
      type: tx.type,
      status: tx.status,
      amount: String(tx.amount),
      amountFormatted: formatCurrency(tx.amount, tx.currency, config.banking.minorUnits),
      amountMajor: formatMajor(tx.amount, config.banking.minorUnits),
      currency: tx.currency,
      narration: tx.narration,
      sender: tx.senderAccount
        ? { accountName: tx.senderAccount.accountName, accountNumber: tx.senderAccount.accountNumber }
        : null,
      recipient: tx.recipientAccount
        ? { accountName: tx.recipientAccount.accountName, accountNumber: tx.recipientAccount.accountNumber }
        : null,
      createdAt: tx.createdAt,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

async function setAccountStatus(adminUser, accountId, status, reason = null, meta = {}) {
  if (!Object.values(ACCOUNT_STATUS).includes(status)) {
    throw new ValidationError('Invalid account status', {
      status: `Status must be one of ${Object.values(ACCOUNT_STATUS).join(', ')}`,
    });
  }

  const account = await BankAccount.findByPk(accountId);
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  const previousStatus = account.status;
  if (previousStatus === status) {
    return { account: toAccountDTO(account), changed: false };
  }

  await account.update({ status });

  await audit({
    actorUserId: adminUser.id,
    actorRole: adminUser.role,
    action: AUDIT_ACTIONS.ACCOUNT_STATUS_CHANGED,
    entityType: 'BankAccount',
    entityId: account.id,
    metadata: { previousStatus, newStatus: status, reason: reason ? String(reason).slice(0, 200) : null },
    req: meta.req,
  });

  return { account: toAccountDTO(account), changed: true };
}

async function listAuditLogs({ action, actorUserId, page = 1, limit = 50 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const where = {};
  if (action) where.action = action;
  if (actorUserId) where.actorUserId = actorUserId;

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ association: 'actor', attributes: ['id', 'fullName', 'email', 'role'] }],
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });

  return {
    items: rows.map((log) => ({
      id: log.id,
      action: log.action,
      actorUserId: log.actorUserId,
      actorRole: log.actorRole,
      actor: log.actor ? { fullName: log.actor.fullName, email: log.actor.email } : null,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

async function getStatistics() {
  const [customerCount, activeAccountCount, frozenAccountCount, txCount] = await Promise.all([
    User.count({ where: { role: 'CUSTOMER' } }),
    BankAccount.count({ where: { status: 'ACTIVE', isSystem: false } }),
    BankAccount.count({ where: { status: 'FROZEN', isSystem: false } }),
    Transaction.count(),
  ]);

  const balanceRow = await BankAccount.findOne({
    where: { isSystem: false },
    attributes: [
      [models.sequelize.fn('COALESCE', models.sequelize.fn('SUM', models.sequelize.col('ledger_balance')), 0), 'total'],
    ],
    raw: true,
  });

  const volumeRow = await Transaction.findOne({
    where: { status: 'COMPLETED', type: 'TRANSFER' },
    attributes: [
      [models.sequelize.fn('COALESCE', models.sequelize.fn('SUM', models.sequelize.col('amount')), 0), 'total'],
    ],
    raw: true,
  });

  const totalBalance = (balanceRow && balanceRow.total) || '0';
  const totalVolume = (volumeRow && volumeRow.total) || '0';

  return {
    customers: customerCount,
    activeAccounts: activeAccountCount,
    frozenAccounts: frozenAccountCount,
    transactions: txCount,
    totalDeposits: String(totalBalance),
    totalDepositsFormatted: formatCurrency(totalBalance),
    totalTransferVolume: String(totalVolume),
    totalTransferVolumeFormatted: formatCurrency(totalVolume),
  };
}

async function reconciliation() {
  const report = await runReconciliation();
  return formatReport(report);
}

module.exports = {
  listCustomers,
  listTransactions,
  setAccountStatus,
  listAuditLogs,
  getStatistics,
  reconciliation,
};
