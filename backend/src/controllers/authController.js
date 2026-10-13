'use strict';

const authService = require('../services/authService');
const { rotateRefreshToken } = require('../services/tokenService');
const asyncHandler = require('../utils/asyncHandler');
const { AuthError } = require('../utils/errors');
const config = require('../config/env');

const REFRESH_COOKIE = 'sb_refresh';

function getRefreshExpiryMs() {
  const ttl = config.jwt.refreshExpiresIn;
  const match = /^(\d+)\s*([smhd])$/.exec(String(ttl));
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const value = match ? Number(match[1]) : 7;
  const unit = match ? unitMs[match[2]] : 86400000;
  return value * unit;
}

function setRefreshCookie(res, rawToken) {
  res.cookie(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: getRefreshExpiryMs(),
    path: '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

function requestMeta(req) {
  return {
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || null,
    userAgent: req.headers['user-agent'] || null,
    req,
  };
}

async function attachProfile(data) {
  const profile = await authService.getProfile(data.user);
  return {
    user: profile.user,
    account: profile.account,
    accessToken: data.accessToken,
  };
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, requestMeta(req));
  res.status(201).json({ success: true, data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, requestMeta(req));
  setRefreshCookie(res, result.refreshToken);
  res.status(200).json({ success: true, data: await attachProfile(result) });
});

const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies[REFRESH_COOKIE];
  if (!rawToken) {
    throw new AuthError('Refresh token missing', 'REFRESH_MISSING');
  }
  const result = await rotateRefreshToken(rawToken, requestMeta(req));
  setRefreshCookie(res, result.refreshToken);
  res.status(200).json({ success: true, data: await attachProfile(result) });
});

const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies[REFRESH_COOKIE] || null;
  await authService.logout(req.user || null, rawToken, requestMeta(req));
  clearRefreshCookie(res);
  res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user);
  res.status(200).json({ success: true, data: profile });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE,
};