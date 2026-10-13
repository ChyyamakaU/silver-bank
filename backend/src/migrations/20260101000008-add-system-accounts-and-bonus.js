'use strict';

/**
 * Adds support for bank-owned system accounts (e.g. the signup-bonus funding
 * account) and a BONUS transaction type used for double-entry welcome credits.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bank_accounts', 'is_system', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // PostgreSQL 12+ allows adding an enum value; the new value is not used
    // within this migration, so it is safe.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_transactions_type" ADD VALUE IF NOT EXISTS 'BONUS';`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bank_accounts', 'is_system');

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_transactions_type" RENAME TO "enum_transactions_type_old";
      CREATE TYPE "enum_transactions_type" AS ENUM ('TRANSFER', 'REVERSAL', 'ADJUSTMENT');
      ALTER TABLE "transactions"
        ALTER COLUMN "type" DROP DEFAULT,
        ALTER COLUMN "type" TYPE "enum_transactions_type" USING ("type"::text::"enum_transactions_type"),
        ALTER COLUMN "type" SET DEFAULT 'TRANSFER';
      DROP TYPE "enum_transactions_type_old";
    `);

    void Sequelize;
  },
};
