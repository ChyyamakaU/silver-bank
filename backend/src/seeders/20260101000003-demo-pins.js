/* eslint-disable no-undef */
'use strict';

const bcrypt = require('bcrypt');
const config = require('../config/env');

// Backfills the demo transaction PIN for any seeded customer that does not
// already have one (e.g. accounts created before PINs were introduced).
const DEMO_PIN = '1234';
const DEMO_EMAILS = ['ada@silverbank.test', 'chidi@silverbank.test'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const pinHash = await bcrypt.hash(DEMO_PIN, config.bcrypt.rounds);

    for (const email of DEMO_EMAILS) {
      await queryInterface.sequelize.query(
        'UPDATE users SET pin_hash = :pinHash, updated_at = NOW() WHERE email = :email AND pin_hash IS NULL;',
        { replacements: { pinHash, email } }
      );
    }
  },

  async down(queryInterface) {
    for (const email of DEMO_EMAILS) {
      await queryInterface.sequelize.query(
        'UPDATE users SET pin_hash = NULL, updated_at = NOW() WHERE email = :email;',
        { replacements: { email } }
      );
    }
  },
};
