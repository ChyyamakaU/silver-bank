'use strict';

const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');

const listCustomers = asyncHandler(async (req, res) => {
  const data = await adminService.listCustomers(req.query);
  res.status(200).json({ success: true, data });
});

const listTransactions = asyncHandler(async (req, res) => {
  const data = await adminService.listTransactions(req.query);
  res.status(200).json({ success: true, data });
});

const setStatus = asyncHandler(async (req, res) => {
  const data = await adminService.setAccountStatus(req.user, req.params.id, req.body.status, req.body.reason, { req });
  res.status(200).json({ success: true, data });
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const data = await adminService.listAuditLogs(req.query);
  res.status(200).json({ success: true, data });
});

const reconciliation = asyncHandler(async (req, res) => {
  const data = await adminService.reconciliation();
  res.status(200).json({ success: true, data });
});

const statistics = asyncHandler(async (req, res) => {
  const data = await adminService.getStatistics();
  res.status(200).json({ success: true, data });
});

module.exports = {
  listCustomers,
  listTransactions,
  setStatus,
  listAuditLogs,
  reconciliation,
  statistics,
};