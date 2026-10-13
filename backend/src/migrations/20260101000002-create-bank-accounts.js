'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bank_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      account_number: { type: Sequelize.STRING(10), allowNull: false, unique: true },
      account_name: { type: Sequelize.STRING(120), allowNull: false },
      account_type: {
        type: Sequelize.ENUM('SAVINGS', 'CURRENT'),
        allowNull: false,
        defaultValue: 'SAVINGS',
        enumName: 'enum_bank_accounts_account_type',
      },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'NGN' },
      available_balance: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      ledger_balance: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        enumName: 'enum_bank_accounts_status',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // Financial integrity: balances can never be negative at the database level.
    await queryInterface.sequelize.query(
      'ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_available_balance_non_negative" CHECK (available_balance >= 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_ledger_balance_non_negative" CHECK (ledger_balance >= 0);'
    );

    await queryInterface.addIndex('bank_accounts', ['account_number'], {
      name: 'bank_accounts_account_number_idx',
    });
    await queryInterface.addIndex('bank_accounts', ['status'], {
      name: 'bank_accounts_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bank_accounts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bank_accounts_account_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bank_accounts_status";');
  },
};
