'use strict';

const express = require('express');
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');
const transferRoutes = require('./transfer.routes');
const beneficiaryRoutes = require('./beneficiary.routes');
const profileRoutes = require('./profile.routes');
const adminRoutes = require('./admin.routes');
const config = require('../config/env');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'silver-bank-api',
      status: 'ok',
      time: new Date().toISOString(),
      environment: config.env,
    },
  });
});

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transfers', transferRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);

module.exports = router;