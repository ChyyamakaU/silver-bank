'use strict';

const Joi = require('joi');
const { passwordSchema, pinSchema } = require('./auth');

const updateProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).optional(),
  phone: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).optional().messages({
    'string.pattern.base': 'Phone number must be 7-15 digits and may start with +',
  }),
})
  .min(1)
  .messages({ 'object.min': 'No permitted profile fields were provided' });

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: passwordSchema,
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'New passwords do not match',
    'any.required': 'Please confirm your new password',
  }),
});

const changePinSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  pin: pinSchema,
  confirmPin: Joi.string().valid(Joi.ref('pin')).required().messages({
    'any.only': 'PINs do not match',
    'any.required': 'Please confirm your PIN',
  }),
});

module.exports = { updateProfileSchema, changePasswordSchema, changePinSchema };