'use strict';

const { ValidationError } = require('./errors');

const CURRENCY_SYMBOLS = {
  NGN: '\u20A6',
};

/**
 * All monetary values in Silver Bank are stored as INTEGER minor units
 * (kobo). 100 kobo = NGN 1.00. This module is the ONLY authoritative place
 * where money is parsed, added and formatted. Floating point arithmetic is
 * never used for balances.
 */

function assertMinorInteger(value, field = 'amount') {
  let big;
  try {
    big = BigInt(value);
  } catch (err) {
    throw new ValidationError(`Invalid ${field}`, { [field]: 'Must be an integer minor-unit amount' });
  }
  if (big < 0n) {
    throw new ValidationError(`Invalid ${field}`, { [field]: 'Amount must not be negative' });
  }
  return big;
}

/**
 * Parse a human-entered major-unit amount (e.g. "1,250.50", 1250.5) into
 * integer minor units (kobo). Rejects anything with more than the supported
 * number of decimal places and rejects floating point drift.
 */
function toMinorUnits(input, { field = 'amount', allowZero = false } = {}) {
  if (input === null || input === undefined || input === '') {
    throw new ValidationError(`Invalid ${field}`, { [field]: 'Amount is required' });
  }

  const raw = String(input).trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new ValidationError(`Invalid ${field}`, {
      [field]: 'Enter a valid amount with at most 2 decimal places',
    });
  }

  const [whole, fraction = ''] = raw.split('.');
  const paddedFraction = (fraction + '00').slice(0, 2);
  const minor = BigInt(whole) * 100n + BigInt(paddedFraction);

  if (!allowZero && minor <= 0n) {
    throw new ValidationError(`Invalid ${field}`, { [field]: 'Amount must be greater than zero' });
  }

  return minor.toString();
}

function fromMinorUnits(minor) {
  return BigInt(minor || 0);
}

function addMinor(a, b) {
  return (BigInt(a) + BigInt(b)).toString();
}

function subtractMinor(a, b) {
  return (BigInt(a) - BigInt(b)).toString();
}

function isPositiveMinor(value) {
  return BigInt(value) > 0n;
}

function compareMinor(a, b) {
  const left = BigInt(a);
  const right = BigInt(b);
  if (left === right) return 0;
  return left > right ? 1 : -1;
}

/**
 * Format integer minor units as a decimal string with the given number of
 * minor places, e.g. formatMajor(125050) -> "1250.50".
 */
function formatMajor(minor, minorUnits = 2) {
  const negative = BigInt(minor) < 0n;
  const abs = negative ? -BigInt(minor) : BigInt(minor);
  const divisor = 10n ** BigInt(minorUnits);
  const whole = abs / divisor;
  const fraction = abs % divisor;
  const fractionStr = fraction.toString().padStart(minorUnits, '0');
  const sign = negative ? '-' : '';
  return minorUnits > 0 ? `${sign}${whole}.${fractionStr}` : `${sign}${whole}`;
}

/**
 * Format minor units with thousands separators and a currency symbol,
 * e.g. formatCurrency(125050) -> "₦1,250.50".
 */
function formatCurrency(minor, currency = 'NGN', minorUnits = 2) {
  const plain = formatMajor(minor, minorUnits);
  const negative = plain.startsWith('-');
  const unsigned = negative ? plain.slice(1) : plain;
  const [whole, fraction] = unsigned.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const body = fraction ? `${grouped}.${fraction}` : grouped;
  return `${symbol}${negative ? '-' : ''}${body}`;
}

module.exports = {
  CURRENCY_SYMBOLS,
  assertMinorInteger,
  toMinorUnits,
  fromMinorUnits,
  addMinor,
  subtractMinor,
  isPositiveMinor,
  compareMinor,
  formatMajor,
  formatCurrency,
};
