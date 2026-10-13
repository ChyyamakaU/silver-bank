'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { RefreshToken } = require('../models');
const { generateRandomToken, sha256 } = require('../utils/reference');
const { AuthError } = require('../utils/errors');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      cid: user.customerId,
      typ: 'access',
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }
  );
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    if (payload.typ !== 'access') {
      throw new Error('wrong token type');
    }
    return payload;
  } catch (err) {
    throw new AuthError('Invalid or expired access token', 'INVALID_TOKEN');
  }
}

function refreshExpiryDate() {
  const ttl = config.jwt.refreshExpiresIn;
  const match = /^(\d+)\s*([smhd])$/.exec(String(ttl));
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return new Date(now + value * unitMs);
}

async function issueRefreshToken(user, meta = {}, transaction = null) {
  const raw = generateRandomToken(40);
  const tokenHash = sha256(raw);
  await RefreshToken.create(
    {
      userId: user.id,
      tokenHash,
      expiresAt: refreshExpiryDate(),
      userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 255) : null,
      ipAddress: meta.ipAddress || null,
    },
    { transaction }
  );
  return raw;
}

/**
 * Rotate a refresh token: validate it, revoke it, and issue a new one. If a
 * revoked token is presented again we treat it as theft and revoke the whole
 * family for that user.
 */
async function rotateRefreshToken(rawToken, meta = {}) {
  if (!rawToken) throw new AuthError('Refresh token missing', 'REFRESH_MISSING');
  const tokenHash = sha256(rawToken);

  return RefreshToken.sequelize.transaction(async (t) => {
    const record = await RefreshToken.findOne({
      where: { tokenHash },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!record) throw new AuthError('Invalid refresh token', 'REFRESH_INVALID');

    if (record.revokedAt) {
      // Possible token reuse / replay attack: revoke everything for the user.
      await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: record.userId, revokedAt: null }, transaction: t }
      );
      throw new AuthError('Refresh token has been revoked', 'REFRESH_REVOKED');
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await record.update({ revokedAt: new Date() }, { transaction: t });
      throw new AuthError('Refresh token expired', 'REFRESH_EXPIRED');
    }

    const newRaw = generateRandomToken(40);
    const newHash = sha256(newRaw);

    await record.update(
      { revokedAt: new Date(), replacedByHash: newHash },
      { transaction: t }
    );

    const { User } = require('../models');
    const user = await User.findByPk(record.userId, { transaction: t });
    if (!user || user.status !== 'ACTIVE') {
      throw new AuthError('Account is not active', 'ACCOUNT_INACTIVE');
    }

    await RefreshToken.create(
      {
        userId: user.id,
        tokenHash: newHash,
        expiresAt: refreshExpiryDate(),
        userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 255) : null,
        ipAddress: meta.ipAddress || null,
      },
      { transaction: t }
    );

    return { user, refreshToken: newRaw };
  });
}

async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = sha256(rawToken);
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { tokenHash, revokedAt: null } }
  );
}

async function revokeAllForUser(userId) {
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } }
  );
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
};
