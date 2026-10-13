'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ledger_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'transactions', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bank_accounts', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      direction: {
        type: Sequelize.ENUM('DEBIT', 'CREDIT'),
        allowNull: false,
        enumName: 'enum_ledger_entries_direction',
      },
      amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'NGN' },
      balance_after: { type: Sequelize.BIGINT, allowNull: false },
      description: { type: Sequelize.STRING(200), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_amount_positive" CHECK (amount > 0);'
    );

    await queryInterface.addIndex('ledger_entries', ['transaction_id'], {
      name: 'ledger_entries_transaction_idx',
    });
    await queryInterface.addIndex('ledger_entries', ['account_id'], {
      name: 'ledger_entries_account_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ledger_entries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ledger_entries_direction";');
  },
};
