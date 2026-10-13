'use strict';

const express = require('express');
const transferController = require('../controllers/transferController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { transferLimiter } = require('../middleware/rateLimiter');
const {
  lookupRecipientSchema,
  transferSchema,
  transferParamsSchema,
} = require('../validators/transfer');

const router = express.Router();

router.use(authenticate);

router.post('/lookup-recipient', validate(lookupRecipientSchema), transferController.lookupRecipient);
router.post('/', transferLimiter, validate(transferSchema), transferController.createTransfer);
router.get('/:reference', validate(transferParamsSchema, 'params'), transferController.getByReference);
router.get('/:reference/receipt', validate(transferParamsSchema, 'params'), transferController.getReceipt);

module.exports = router;