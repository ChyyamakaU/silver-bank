'use strict';

const Joi = require('joi');
const config = require('../config/env');

const passwordSchema = Joi.string()
  .min(8)
  .custom((value, helpers) => {
    const bytes = Buffer.byteLength(String(value), 'utf8');
    if (bytes > config.bcrypt.maxBytes) {
      return helpers.error('password.tooManyBytes');
    }
    return value;
  }, 'bcrypt byte limit')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[0-9]/, 'digit')
  .pattern(/[^A-Za-z0-9]/, 'special')
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.name': 'Password must contain {#name}',
    'password.tooManyBytes': 'Password is too long (max 72 bytes)',
    'any.required': 'Password is required',
  });

const pinSchema = Joi.string().pattern(/^\d{4}$/).required().messages({
  'string.pattern.base': 'Transaction PIN must be exactly 4 digits',
  'string.empty': 'Transaction PIN is required',
  'any.required': 'Transaction PIN is required',
});

const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'any.required': 'Full name is required',
  }),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(160).required()
    .messages({
      'string.email': 'Enter a valid email address',
      'any.required': 'Email is required',
    }),
  phone: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).required().messages({
    'string.pattern.base': 'Phone number must be 7-15 digits and may start with +',
    'any.required': 'Phone number is required',
  }),
  password: passwordSchema,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
  // The transaction PIN is deliberately NOT collected at registration; it is
  // created later from the customer dashboard before authorising transactions.
  // Explicitly not allowed: role, balance, account status, account number.
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

module.exports = { registerSchema, loginSchema, passwordSchema, pinSchema };