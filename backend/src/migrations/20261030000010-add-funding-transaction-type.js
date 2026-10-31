'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_transactions_type" ADD VALUE IF NOT EXISTS 'FUNDING';
    `);
  },

  async down(queryInterface) {
    // PostgreSQL does not support removing an individual enum value.
    // Leave FUNDING in the enum during rollback.
  },
};