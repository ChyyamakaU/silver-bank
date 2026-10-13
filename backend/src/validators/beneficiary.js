'use strict';

const Joi = require('joi');

const createBeneficiarySchema = Joi.object({
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
    'string.pattern.base': 'Account number must be exactly 10 digits',
    'any.required': 'Account number is required',
  }),
  nickname: Joi.string().trim().max(80).allow('').optional(),
});

const beneficiaryIdParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { createBeneficiarySchema, beneficiaryIdParamsSchema };