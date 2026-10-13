'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      reference: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      idempotency_key: { type: Sequelize.STRING(120), allowNull: true, unique: true },
      initiating_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      sender_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'bank_accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      recipient_account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'bank_accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('TRANSFER', 'REVERSAL', 'ADJUSTMENT'),
        allowNull: false,
        defaultValue: 'TRANSFER',
        enumName: 'enum_transactions_type',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED'),
        allowNull: false,
        defaultValue: 'PENDING',
        enumName: 'enum_transactions_status',
      },
      amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'NGN' },
      narration: { type: Sequelize.STRING(200), allowNull: true },
      failure_reason: { type: Sequelize.STRING(255), allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_positive" CHECK (amount > 0);'
    );

    await queryInterface.addIndex('transactions', ['sender_account_id'], {
      name: 'transactions_sender_account_idx',
    });
    await queryInterface.addIndex('transactions', ['recipient_account_id'], {
      name: 'transactions_recipient_account_idx',
    });
    await queryInterface.addIndex('transactions', ['initiating_user_id'], {
      name: 'transactions_initiating_user_idx',
    });
    await queryInterface.addIndex('transactions', ['status'], { name: 'transactions_status_idx' });
    await queryInterface.addIndex('transactions', ['created_at'], {
      name: 'transactions_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_status";');
  },
};
