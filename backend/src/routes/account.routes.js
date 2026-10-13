'use strict';

const express = require('express');
const accountController = require('../controllers/accountController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { transactionQuerySchema } = require('../validators/transfer');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', accountController.getDashboard);
router.get('/me', accountController.getMe);
router.get('/me/balance', accountController.getBalance);
router.get('/me/transactions', validate(transactionQuerySchema, 'query'), accountController.getTransactions);

module.exports = router;