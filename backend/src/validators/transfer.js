'use strict';

const Joi = require('joi');
const { pinSchema } = require('./auth');

const accountNumber = Joi.string().trim().pattern(/^\d{10}$/).required().messages({
  'string.pattern.base': 'Account number must be exactly 10 digits',
  'any.required': 'Account number is required',
});

const amount = Joi.alternatives()
  .try(
    Joi.number().positive().max(1000000000000),
    Joi.string().trim().pattern(/^\d+(\.\d{1,2})?$/).required()
  )
  .required()
  .messages({
    'alternatives.match': 'Enter a valid amount with at most 2 decimal places',
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
  });

const lookupRecipientSchema = Joi.object({
  accountNumber,
});

const transferSchema = Joi.object({
  recipientAccountNumber: accountNumber,
  amount,
  pin: pinSchema,
  narration: Joi.string().trim().max(200).allow('').optional(),
  idempotencyKey: Joi.string().trim().max(120).optional(),
});

const transferParamsSchema = Joi.object({
  reference: Joi.string().trim().max(40).required(),
});

const transactionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid('TRANSFER', 'REVERSAL', 'ADJUSTMENT', 'BONUS').optional(),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REVERSED').optional(),
  direction: Joi.string().valid('incoming', 'outgoing').optional(),
  from: Joi.string().isoDate().optional(),
  to: Joi.string().isoDate().optional(),
  search: Joi.string().trim().max(60).optional(),
});

module.exports = {
  lookupRecipientSchema,
  transferSchema,
  transferParamsSchema,
  transactionQuerySchema,
};