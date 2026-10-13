'use strict';

const config = require('./env');

const ssl = config.db.ssl
  ? {
      require: true,
      rejectUnauthorized: config.db.sslRejectUnauthorized,
      ...(config.db.sslCa ? { ca: config.db.sslCa } : {}),
    }
  : null;

const base = {
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: config.db.logging ? (msg) => console.log(`[sql] ${msg}`) : false,
  define: {
    underscored: true,
    timestamps: true,
  },
  dialectOptions: ssl ? { ssl } : {},
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
