'use strict';

const { ForbiddenError } = require('../utils/errors');

/**
 * Factory that returns role-guard middleware. Must run after `authenticate`.
 */
function authorize(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = authorize;