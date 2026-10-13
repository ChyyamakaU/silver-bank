'use strict';

const { verifyAccessToken } = require('../services/tokenService');
const { User } = require('../models');
const { AuthError, ForbiddenError } = require('../utils/errors');

/**
 * Authenticate a request by verifying the bearer access token, then load the
 * user from the database. The authenticated identity always comes from the
 * token payload (never from client-supplied identifiers).
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) {
      throw new AuthError('Authentication required', 'TOKEN_MISSING');
    }

    const payload = verifyAccessToken(token);

    const user = await User.findByPk(payload.sub);
    if (!user) {
      throw new AuthError('Account no longer exists', 'ACCOUNT_NOT_FOUND');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('This account is not active', 'ACCOUNT_INACTIVE');
    }

    req.user = user;
    req.auth = { token, payload };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;