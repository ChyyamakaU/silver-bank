'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config/env');

function noopMiddleware(req, res, next) {
  next();
}

function makeLimiter({ windowMs, max, message }) {
  if (config.isTest) return noopMiddleware;
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message,
      },
    },
  });
}

/** General API limiter. */
const apiLimiter = makeLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests. Please try again later.',
});

/** Stricter limiter for authentication endpoints (login/register/refresh). */
const authLimiter = makeLimiter({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  message: 'Too many authentication attempts. Please try again later.',
});

/** Limiter for financial operations. */
const transferLimiter = makeLimiter({
  windowMs: 60000,
  max: 30,
  message: 'Too many transfer requests. Please slow down.',
});

module.exports = { apiLimiter, authLimiter, transferLimiter };