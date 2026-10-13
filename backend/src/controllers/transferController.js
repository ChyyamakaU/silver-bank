'use strict';

const transferService = require('../services/transferService');
const asyncHandler = require('../utils/asyncHandler');

const lookupRecipient = asyncHandler(async (req, res) => {
  const data = await transferService.lookupRecipient(req.body.accountNumber);
  res.status(200).json({ success: true, data });
});

const createTransfer = asyncHandler(async (req, res) => {
  const data = await transferService.executeTransfer(req.user, req.body);
  res.status(201).json({ success: true, data });
});

const getByReference = asyncHandler(async (req, res) => {
  const data = await transferService.getTransferByReference(req.user, req.params.reference);
  res.status(200).json({ success: true, data });
});

const getReceipt = asyncHandler(async (req, res) => {
  const data = await transferService.getReceipt(req.user, req.params.reference);
  res.status(200).json({ success: true, data });
});

module.exports = { lookupRecipient, createTransfer, getByReference, getReceipt };