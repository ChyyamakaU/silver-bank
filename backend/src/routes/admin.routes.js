'use strict';

const express = require('express');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authzRole');
const validate = require('../middleware/validate');
const {
  customerQuerySchema,
  adminTransactionsQuerySchema,
  accountStatusParamsSchema,
  accountStatusSchema,
  auditLogQuerySchema,
} = require('../validators/admin');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/statistics', adminController.statistics);
router.get('/customers', validate(customerQuerySchema, 'query'), adminController.listCustomers);
router.get('/transactions', validate(adminTransactionsQuerySchema, 'query'), adminController.listTransactions);
router.patch(
  '/accounts/:id/status',
  validate(accountStatusParamsSchema, 'params'),
  validate(accountStatusSchema),
  adminController.setStatus
);
router.get('/audit-logs', validate(auditLogQuerySchema, 'query'), adminController.listAuditLogs);
router.get('/reconciliation', adminController.reconciliation);

module.exports = router;