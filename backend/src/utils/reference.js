'use strict';

const crypto = require('crypto');

/**
 * Generate a 10-digit Nigerian-style bank account number. Uniqueness is
 * enforced by a database unique constraint; callers retry on collision.
 */
function generateAccountNumber() {
  // First digit is non-zero so the account number is always 10 digits.
  const first = crypto.randomInt(1, 10);
  let rest = '';
  for (let i = 0; i < 9; i += 1) {
    rest += crypto.randomInt(0, 10).toString();
  }
  return `${first}${rest}`;
}

function generateCustomerCode() {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SB-C-${suffix}`;
}

/**
 * Unique, human-readable transaction reference, e.g.
 * SB-20261013-9F3A2C7D1B4E.
 */
function generateTransactionReference(prefix = 'SB') {
  const now = new Date();
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');
  const rand = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

function generateRandomToken(bytes = 40) {
  return crypto.randomBytes(bytes).toString('hex');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = {
  generateAccountNumber,
  generateCustomerCode,
  generateTransactionReference,
  generateRandomToken,
  sha256,
};
