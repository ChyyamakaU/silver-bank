'use strict';

const models = require('../models');
const { User } = models;
const config = require('../config/env');
const { hashPassword, verifyPassword, hashPin, dummyCompare } = require('../utils/password');
const {
  ConflictError,
  AuthError,
  ForbiddenError,
  ValidationError,
} = require('../utils/errors');
const { generateCustomerCode } = require('../utils/reference');
const { createAccountForUser, toAccountDTO, getAccountByUserId } = require('./accountService');
const { creditWelcomeBonus } = require('./bankFundingService');
const tokenService = require('./tokenService');
const { record: audit } = require('./auditService');
const { AUDIT_ACTIONS } = require('../utils/constants');

function toUserDTO(user) {
  return {
    id: user.id,
    customerId: user.customerId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    hasPin: Boolean(user.pinHash),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

async function register(payload, meta = {}) {
  const email = String(payload.email).trim().toLowerCase();
  const phone = String(payload.phone).trim();

  const existingEmail = await User.findOne({ where: { email }, attributes: ['id'] });
  if (existingEmail) {
    throw new ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
  }
  const existingPhone = await User.findOne({ where: { phone }, attributes: ['id'] });
  if (existingPhone) {
    throw new ConflictError('An account with this phone number already exists', 'PHONE_TAKEN');
  }

  const passwordHash = await hashPassword(payload.password);

  const { user, account } = await models.sequelize.transaction(async (t) => {
    const createdUser = await User.create(
      {
        customerId: generateCustomerCode(),
        fullName: String(payload.fullName).trim(),
        email,
        phone,
        passwordHash,
        // No PIN yet: the customer creates one from the dashboard.
        // Registration can never grant a privileged role.
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
      { transaction: t }
    );

    let createdAccount = await createAccountForUser(createdUser, { transaction: t });

    // Welcome bonus for new customers: a real double-entry transfer from the
    // bank's funding account (DEBIT funding, CREDIT customer). Disabled in the
    // test environment so tests can control opening balances deterministically.
    if (!config.isTest && config.banking.signupBonus > 0) {
      createdAccount = await creditWelcomeBonus(createdAccount, config.banking.signupBonus, {
        transaction: t,
      });
    }

    return { user: createdUser, account: createdAccount };
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.USER_REGISTERED,
    entityType: 'User',
    entityId: user.id,
    metadata: { accountNumber: account.accountNumber },
    req: meta.req,
  });

  return {
    user: toUserDTO(user),
    account: toAccountDTO(account),
  };
}

async function login({ email, password }, meta = {}) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    await dummyCompare(password);
    await audit({
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      entityType: 'User',
      metadata: { email: normalizedEmail },
      req: meta.req,
    });
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await audit({
      actorUserId: user.id,
      actorRole: user.role,
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      entityType: 'User',
      entityId: user.id,
      req: meta.req,
    });
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'ACTIVE') {
    throw new ForbiddenError('This account is not active. Please contact support.', 'ACCOUNT_INACTIVE');
  }

  await user.update({ lastLoginAt: new Date() });

  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = await tokenService.issueRefreshToken(user, {
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.USER_LOGIN,
    entityType: 'User',
    entityId: user.id,
    req: meta.req,
  });

  return { user, accessToken, refreshToken };
}

async function logout(user, rawRefreshToken, meta = {}) {
  if (rawRefreshToken) {
    await tokenService.revokeRefreshToken(rawRefreshToken);
  }
  if (user) {
    await audit({
      actorUserId: user.id,
      actorRole: user.role,
      action: AUDIT_ACTIONS.USER_LOGOUT,
      entityType: 'User',
      entityId: user.id,
      req: meta.req,
    });
  }
}

async function refresh(rawRefreshToken, meta = {}) {
  const { user, refreshToken } = await tokenService.rotateRefreshToken(rawRefreshToken, meta);
  const accessToken = tokenService.signAccessToken(user);
  return { user, accessToken, refreshToken };
}

async function getProfile(user) {
  const account = await getAccountByUserId(user.id);
  return {
    user: toUserDTO(user),
    account: account ? toAccountDTO(account) : null,
  };
}

async function updateProfile(user, payload, meta = {}) {
  // Explicit allow-list: protected fields can never be mass-assigned.
  const updates = {};
  if (payload.fullName !== undefined) updates.fullName = String(payload.fullName).trim();
  if (payload.phone !== undefined) updates.phone = String(payload.phone).trim();

  if (updates.phone) {
    const clash = await User.findOne({
      where: { phone: updates.phone },
      attributes: ['id'],
    });
    if (clash && clash.id !== user.id) {
      throw new ConflictError('An account with this phone number already exists', 'PHONE_TAKEN');
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No permitted fields supplied');
  }

  const previous = { fullName: user.fullName, phone: user.phone };
  await user.update(updates);

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    entityType: 'User',
    entityId: user.id,
    metadata: { previous, updated: updates },
    req: meta.req,
  });

  return getProfile(user);
}

async function changePassword(user, { currentPassword, newPassword }, meta = {}) {
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new ValidationError('Current password is incorrect', {
      currentPassword: 'Current password is incorrect',
    });
  }
  if (currentPassword === newPassword) {
    throw new ValidationError('New password must be different', {
      newPassword: 'New password must be different from the current password',
    });
  }

  const passwordHash = await hashPassword(newPassword);
  await user.update({ passwordHash });

  // Invalidate every existing refresh token, then issue a fresh session for
  // the current device.
  await tokenService.revokeAllForUser(user.id);
  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = await tokenService.issueRefreshToken(user, {
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.PASSWORD_CHANGED,
    entityType: 'User',
    entityId: user.id,
    req: meta.req,
  });

  return { accessToken, refreshToken };
}

async function changePin(user, { currentPassword, pin }, meta = {}) {
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new ValidationError('Current password is incorrect', {
      currentPassword: 'Current password is incorrect',
    });
  }

  const pinHash = await hashPin(pin);
  await user.update({ pinHash });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.PIN_CHANGED,
    entityType: 'User',
    entityId: user.id,
    req: meta.req,
  });

  return { message: 'Transaction PIN updated successfully' };
}

module.exports = {
  toUserDTO,
  register,
  login,
  logout,
  refresh,
  getProfile,
  updateProfile,
  changePassword,
  changePin,
  config,
};
