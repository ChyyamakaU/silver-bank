'use strict';

const { ValidationError } = require('../utils/errors');

/**
 * Validate a part of the request against a Joi schema.
 *   validate(schema, 'body')
 *   validate(schema, 'query')
 *   validate(schema, 'params')
 */
/**
 * Assign the sanitised value to the request part. Express 5 defines req.query
 * (and friends) as prototype accessors, so a plain assignment can throw.
 * `Object.defineProperty` creates a shadowing own property instead.
 */
function assignValue(target, key, value) {
  try {
    target[key] = value;
  } catch (err) {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
}

function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = {};
      for (const detail of error.details) {
        const key = detail.path.join('.');
        details[key] = details[key] || [];
        details[key].push(detail.message.replace(/"/g, "'"));
      }
      return next(new ValidationError('Validation failed', details));
    }

    assignValue(req, source, value);
    return next();
  };
}

module.exports = validate;