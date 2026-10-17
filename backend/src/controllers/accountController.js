'use strict';

const accountService = require('../services/accountService');
const asyncHandler = require('../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const account = await accountService.requireAccountByUserId(req.user.id);
  res.status(200).json({ success: true, data: accountService.toAccountDTO(account) });
});

const getBalance = asyncHandler(async (req, res) => {
  const data = await accountService.getBalance(req.user.id);
  res.status(200).json({ success: true, data });
});

const getTransactions = asyncHandler(async (req, res) => {
  const data = await accountService.listTransactions(req.user.id, req.query);
  res.status(200).json({ success: true, data });
});

const getDashboard = asyncHandler(async (req, res) => {
  const account = await accountService.requireAccountByUserId(req.user.id);
  const recent = await accountService.listTransactions(req.user.id, { page: 1, limit: 6 });
  const notifications = buildNotifications(accountService.toAccountDTO(account), recent.items);

  res.status(200).json({
    success: true,
    data: {
      account: accountService.toAccountDTO(account),
      recentTransactions: recent.items,
      notifications,
    },
  });
});

function buildNotifications(account, recentTransactions) {
  const notifications = [];
  if (account.status !== 'ACTIVE') {
    notifications.push({
      type: 'warning',
      message: `Your account is currently ${account.status.toLowerCase()}. Some operations are unavailable.`,
    });
  }
  if (recentTransactions.length === 0) {
    notifications.push({
      type: 'info',
      message: 'Welcome to Silver Bank. Your new account is ready and your balance starts at NGN 0.00.',
    });
  }
  return notifications;
}

module.exports = { getMe, getBalance, getTransactions, getDashboard };