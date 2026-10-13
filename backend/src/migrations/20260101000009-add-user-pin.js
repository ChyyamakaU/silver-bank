'use strict';

/**
 * Adds a transaction PIN (hashed) to users. The PIN authorises financial
 * operations and is stored separately from the login password.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'pin_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'pin_hash');
  },
};
