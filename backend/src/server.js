'use strict';

const app = require('./app');
const config = require('./config/env');
const { sequelize } = require('./models');
const { getOrCreateFundingAccount } = require('./services/bankFundingService');
const logger = require('./utils/logger');

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
  } catch (err) {
    logger.error('Unable to connect to the database', { message: err.message });
    process.exit(1);
  }

  // Ensure the internal bank funding account exists before serving traffic so
  // the first signup bonus cannot race two concurrent account creations.
  if (!config.isTest && config.banking.signupBonus > 0) {
    try {
      await getOrCreateFundingAccount();
    } catch (err) {
      logger.error('Unable to initialise system funding account', { message: err.message });
    }
  }

  const server = app.listen(config.port, () => {
    logger.info(`Silver Bank API listening on port ${config.port} (${config.env})`);
  });

  async function shutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      try {
        await sequelize.close();
      } finally {
        process.exit(0);
      }
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();