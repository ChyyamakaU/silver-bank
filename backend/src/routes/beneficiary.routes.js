'use strict';

const express = require('express');
const beneficiaryController = require('../controllers/beneficiaryController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  createBeneficiarySchema,
  beneficiaryIdParamsSchema,
} = require('../validators/beneficiary');

const router = express.Router();

router.use(authenticate);

router.get('/', beneficiaryController.index);
router.post('/', validate(createBeneficiarySchema), beneficiaryController.create);
router.delete('/:id', validate(beneficiaryIdParamsSchema, 'params'), beneficiaryController.remove);

module.exports = router;