'use strict';

const Joi = require('joi');

const accountMeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const customerQuerySchema = Joi.object({
  search: Joi.string().trim().max(80).optional(),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'CLOSED').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const adminTransactionsQuerySchema = Joi.object({
  search: Joi.string().trim().max(60).optional(),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REVERSED').optional(),
  type: Joi.string().valid('TRANSFER', 'REVERSAL', 'ADJUSTMENT', 'BONUS').optional(),
  from: Joi.string().isoDate().optional(),
  to: Joi.string().isoDate().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const accountStatusParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const accountStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'FROZEN', 'CLOSED').required().messages({
    'any.only': 'Status must be ACTIVE, FROZEN or CLOSED',
    'any.required': 'Status is required',
  }),
  reason: Joi.string().trim().max(200).optional(),
});

const auditLogQuerySchema = Joi.object({
  action: Joi.string().trim().max(60).optional(),
  actorUserId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

module.exports = {
  accountMeQuerySchema,
  customerQuerySchema,
  adminTransactionsQuerySchema,
  accountStatusParamsSchema,
  accountStatusSchema,
  auditLogQuerySchema,
};