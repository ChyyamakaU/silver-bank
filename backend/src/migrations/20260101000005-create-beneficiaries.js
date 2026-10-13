'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('beneficiaries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      account_number: { type: Sequelize.STRING(10), allowNull: false },
      account_name: { type: Sequelize.STRING(120), allowNull: false },
      bank_name: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'Silver Bank' },
      nickname: { type: Sequelize.STRING(80), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addConstraint('beneficiaries', {
      fields: ['user_id', 'account_number'],
      type: 'unique',
      name: 'beneficiaries_user_account_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('beneficiaries');
  },
};
