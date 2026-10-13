'use strict';

const bcrypt = require('bcrypt');
const config = require('../config/env');
const { ValidationError } = require('./errors');

const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO1yq9r8bJ0Q4mY0m7pQq0nJ8xY0aV3u2';

function assertWithinBcryptLimit(password) {
  const bytes = Buffer.byteLength(String(password), 'utf8');
  if (bytes > config.bcrypt.maxBytes) {
    throw new ValidationError('Password is too long', {
      password: `Password must be at most ${config.bcrypt.maxBytes} bytes`,
    });
  }
}

async function hashPassword(password) {
  assertWithinBcryptLimit(password);
  return bcrypt.hash(String(password), config.bcrypt.rounds);
}

async function verifyPassword(password, hash) {
  assertWithinBcryptLimit(password);
  return bcrypt.compare(String(password), hash);
}

/** Transaction PINs are short and low-entropy; hash them the same way. */
async function hashPin(pin) {
  return hashPassword(pin);
}

async function verifyPin(pin, hash) {
  if (!hash) return false;
  return verifyPassword(pin, hash);
}

/**
 * Constant-work comparison used when a login email does not exist, so response
 * timing does not reveal whether the account is registered.
 */
async function dummyCompare(password) {
  try {
    await bcrypt.compare(String(password), DUMMY_HASH);
  } catch (err) {
    void err;
  }
  return false;
}

module.exports = {
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  dummyCompare,
};
