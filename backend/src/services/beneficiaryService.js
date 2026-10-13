'use strict';

const models = require('../models');
const { Beneficiary } = models;
const { NotFoundError } = require('../utils/errors');
const { saveBeneficiary } = require('./transferService');
const { record: audit } = require('./auditService');
const { AUDIT_ACTIONS } = require('../utils/constants');

async function list(userId) {
  const rows = await Beneficiary.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
  return rows.map(toDTO);
}

function toDTO(b) {
  return {
    id: b.id,
    accountNumber: b.accountNumber,
    accountName: b.accountName,
    bankName: b.bankName,
    nickname: b.nickname,
    createdAt: b.createdAt,
  };
}

async function create(user, payload) {
  const beneficiary = await saveBeneficiary(user, payload);
  return toDTO(beneficiary);
}

async function remove(user, id) {
  const beneficiary = await Beneficiary.findOne({ where: { id, userId: user.id } });
  if (!beneficiary) {
    throw new NotFoundError('Beneficiary not found');
  }
  await beneficiary.destroy();
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.BENEFICIARY_REMOVED,
    entityType: 'Beneficiary',
    entityId: id,
    metadata: { accountNumber: beneficiary.accountNumber },
  });
}

module.exports = { list, create, remove, toDTO };
