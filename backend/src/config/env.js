'use strict';

const fs = require('fs');
const path = require('path');
const Joi = require('joi');

// Load .env from the backend directory unless the caller already provided
// variables (e.g. CI or a container). dotenv does not override existing vars.
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().min(0).max(65535).default(4000),

  DB_HOST: Joi.string().default('127.0.0.1'),
  DB_PORT: Joi.number().integer().default(5432),
  DB_NAME: Joi.string().default('silver_bank_dev'),
  DB_TEST_NAME: Joi.string().default('silver_bank_test'),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_SSL: Joi.boolean().default(false),
  // Verify the server certificate against the CA (keep true in production).
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),
  // Path to a CA certificate file (e.g. Aiven's ca.pem). Relative paths are
  // resolved from the backend directory. Takes precedence over DB_SSL_CA.
  DB_SSL_CA_PATH: Joi.string().allow('').default(''),
  // Alternatively, the CA certificate inline: either the raw PEM (with \n
  // escapes) or a base64-encoded PEM.
  DB_SSL_CA: Joi.string().allow('').default(''),
  DB_LOGGING: Joi.boolean().default(false),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('silver-bank'),
  JWT_AUDIENCE: Joi.string().default('silver-bank-customers'),

  BCRYPT_ROUNDS: Joi.number().integer().min(4).max(15).default(12),

  COOKIE_SECRET: Joi.string().min(16).required(),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),

  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),

  CURRENCY: Joi.string().length(3).uppercase().default('NGN'),
  CURRENCY_MINOR_UNITS: Joi.number().integer().min(0).max(4).default(2),
  TRANSFER_MIN_AMOUNT: Joi.number().integer().min(1).default(100),
  TRANSFER_MAX_AMOUNT: Joi.number().integer().min(1).default(100000000),
  TRANSFER_DAILY_LIMIT: Joi.number().integer().min(1).default(500000000),
  BCRYPT_MAX_BYTES: Joi.number().integer().min(32).default(72),
  SIGNUP_BONUS: Joi.number().integer().min(0).default(100000),
  FUNDING_ACCOUNT_BALANCE: Joi.number().integer().min(0).default(1000000000),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(300),
  AUTH_RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(20),

  ADMIN_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .default('admin@silverbank.test'),
  ADMIN_PASSWORD: Joi.string().min(8).default('Admin@Silver123'),
  ADMIN_NAME: Joi.string().default('Silver Bank Administrator'),

  FRONTEND_URL: Joi.string().default('http://localhost:5173'),
}).unknown(true);

const { value, error } = schema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  const details = error.details.map((d) => `  - ${d.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const isTest = value.NODE_ENV === 'test';
const isProduction = value.NODE_ENV === 'production';

// Resolve an optional TLS CA certificate for managed providers such as Aiven.
// Precedence: DB_SSL_CA_PATH (file) -> DB_SSL_CA (inline PEM or base64).
function resolveSslCa() {
  const caPath = String(value.DB_SSL_CA_PATH || '').trim();
  if (caPath) {
    const resolved = path.isAbsolute(caPath)
      ? caPath
      : path.resolve(__dirname, '..', '..', caPath);
    try {
      return fs.readFileSync(resolved, 'utf8');
    } catch (err) {
      throw new Error(
        `DB_SSL_CA_PATH could not be read (${resolved}): ${err.message}. ` +
          'Provide an existing file, use DB_SSL_CA (inline PEM or base64) instead, ' +
          'or on Render add the cert as a Secret File and point DB_SSL_CA_PATH at ' +
          '/etc/secrets/<filename>.',
        { cause: err }
      );
    }
  }

  const inline = String(value.DB_SSL_CA || '').trim();
  if (inline) {
    if (inline.includes('BEGIN CERTIFICATE')) {
      return inline.replace(/\\n/g, '\n');
    }
    return Buffer.from(inline, 'base64').toString('utf8');
  }

  return null;
}

const sslCa = resolveSslCa();

const config = {
  env: value.NODE_ENV,
  isTest,
  isProduction,
  port: value.PORT,

  db: {
    host: value.DB_HOST,
    port: value.DB_PORT,
    name: isTest ? value.DB_TEST_NAME : value.DB_NAME,
    user: value.DB_USER,
    password: value.DB_PASSWORD,
    // A configured CA implies TLS even if DB_SSL was not explicitly enabled.
    ssl: value.DB_SSL || Boolean(sslCa),
    sslRejectUnauthorized: value.DB_SSL_REJECT_UNAUTHORIZED,
    sslCa,
    logging: value.DB_LOGGING && !isTest,
    poolMax: value.DB_POOL_MAX,
  },

  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET,
    refreshSecret: value.JWT_REFRESH_SECRET,
    accessExpiresIn: value.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
    issuer: value.JWT_ISSUER,
    audience: value.JWT_AUDIENCE,
  },

  bcrypt: {
    rounds: value.BCRYPT_ROUNDS,
    maxBytes: value.BCRYPT_MAX_BYTES,
  },

  cookie: {
    secret: value.COOKIE_SECRET,
    secure: value.COOKIE_SECURE || isProduction,
    sameSite: value.COOKIE_SAMESITE,
  },

  corsOrigins: value.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),

  banking: {
    currency: value.CURRENCY,
    minorUnits: value.CURRENCY_MINOR_UNITS,
    transferMinAmount: value.TRANSFER_MIN_AMOUNT,
    transferMaxAmount: value.TRANSFER_MAX_AMOUNT,
    transferDailyLimit: value.TRANSFER_DAILY_LIMIT,
    signupBonus: value.SIGNUP_BONUS,
    fundingAccountBalance: value.FUNDING_ACCOUNT_BALANCE,
  },

  rateLimit: {
    windowMs: value.RATE_LIMIT_WINDOW_MS,
    max: value.RATE_LIMIT_MAX,
    authWindowMs: value.AUTH_RATE_LIMIT_WINDOW_MS,
    authMax: value.AUTH_RATE_LIMIT_MAX,
  },

  admin: {
    email: value.ADMIN_EMAIL,
    password: value.ADMIN_PASSWORD,
    name: value.ADMIN_NAME,
  },

  frontendUrl: value.FRONTEND_URL,
};

module.exports = config;
