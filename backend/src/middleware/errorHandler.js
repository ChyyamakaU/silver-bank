'use strict';

const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack });
    }
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || undefined,
      },
    });
  }

  // Sequelize and other library errors -> never leak internals.
  if (err && err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with those details already exists' },
    });
  }
  if (err && (err.name === 'SequelizeValidationError' || err.name === 'SequelizeConstraintError')) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
    });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
    });
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack });

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}

module.exports = { notFound, errorHandler };