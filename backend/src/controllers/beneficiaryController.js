'use strict';

const beneficiaryService = require('../services/beneficiaryService');
const asyncHandler = require('../utils/asyncHandler');

const index = asyncHandler(async (req, res) => {
  const data = await beneficiaryService.list(req.user.id);
  res.status(200).json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await beneficiaryService.create(req.user, req.body);
  res.status(201).json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  await beneficiaryService.remove(req.user, req.params.id);
  res.status(200).json({ success: true, data: { message: 'Beneficiary removed' } });
});

module.exports = { index, create, remove };