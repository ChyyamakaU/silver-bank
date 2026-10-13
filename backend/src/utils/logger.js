'use strict';

const config = require('../config/env');

/**
 * Minimal structured logger. It intentionally never logs request bodies,
 * passwords, tokens or other secrets.
 */
function write(level, message, meta) {
  if (config.isTest) return;
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
  };
  if (meta && typeof meta === 'object') {
    entry.meta = meta;
  }
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
