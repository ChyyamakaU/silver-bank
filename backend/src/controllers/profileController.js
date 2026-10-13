'use strict';

const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const data = await authService.getProfile(req.user);
  res.status(200).json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await authService.updateProfile(req.user, req.body, { req });
  res.status(200).json({ success: true, data });
});

const changePassword = asyncHandler(async (req, res) => {
  const authCtl = require('./authController');
  const data = await authService.changePassword(req.user, req.body, { req });
  authCtl.setRefreshCookie(res, data.refreshToken);
  res.status(200).json({
    success: true,
    data: {
      message: 'Password changed successfully',
      accessToken: data.accessToken,
    },
  });
});

const changePin = asyncHandler(async (req, res) => {
  const data = await authService.changePin(req.user, req.body, { req });
  res.status(200).json({ success: true, data });
});

module.exports = { getProfile, updateProfile, changePassword, changePin };