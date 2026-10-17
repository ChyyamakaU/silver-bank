'use strict';

const bcrypt = require('bcrypt');
const config = require('../config/env');
const { generateCustomerCode } = require('../utils/reference');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = await bcrypt.hash(config.admin.password, config.bcrypt.rounds);
    const email = config.admin.email.toLowerCase();

    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1;',
      { replacements: { email }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      // Keep the seeded admin's password in sync with the configured value.
      await queryInterface.sequelize.query(
        'UPDATE users SET password_hash = :hash, role = :role, status = :status, updated_at = :now WHERE email = :email;',
        {
          replacements: {
            hash: passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            now,
            email,
          },
        }
      );
      return;
    }

    await queryInterface.bulkInsert('users', [
      {
        customer_id: generateCustomerCode(),
        full_name: config.admin.name,
        email,
        phone: '08000000000',
        password_hash: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: config.admin.email.toLowerCase(),
    });
  },
};
