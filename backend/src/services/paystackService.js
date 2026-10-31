'use strict';

const models = require('../models');
const { BankAccount, User, Transaction, LedgerEntry } = models;
const config = require('../config/env');
const { requireAccountByUserId } = require('./accountService');
const { toMinorUnits } = require('../utils/money');
const { generateTransactionReference } = require('../utils/reference');
const { ValidationError, NotFoundError, UnprocessableError } = require('../utils/errors');

async function initializeFunding(user, payload) {
  const amount = toMinorUnits(payload.amount, {
    field: 'amount',
    allowZero: false,
  });

  const account = await requireAccountByUserId(user.id);

  if (account.status !== 'ACTIVE') {
    throw new UnprocessableError('Your account cannot receive funding');
  }

  const customer = await User.findByPk(user.id);
  if (!customer || !customer.email) {
    throw new ValidationError('A valid email address is required');
  }

  const reference = generateTransactionReference('SB-FND');

  const tx = await Transaction.create({
    reference,
    initiatingUserId: user.id,
    senderAccountId: null,
    recipientAccountId: account.id,
    type: 'FUNDING',
    status: 'PENDING',
    amount,
    currency: account.currency,
    narration: 'Account funding',
    metadata: { provider: 'PAYSTACK' },
  });

  try {
    const response = await fetch(
      `${config.paystack.baseUrl}/transaction/initialize`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customer.email,
          amount: Number(amount),
          currency: account.currency,
          reference,
          callback_url: `${config.frontendUrl}/payment/verify`,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || 'Paystack initialization failed');
    }

    return {
      reference,
      authorizationUrl: result.data.authorization_url,
      accessCode: result.data.access_code,
    };
  } catch (error) {
    await tx.update({
      status: 'FAILED',
      failureReason: error.message,
    });
    throw error;
  }
}

async function verifyFunding(user, reference) {
  const response = await fetch(
    `${config.paystack.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${config.paystack.secretKey}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok || !result.status || result.data.status !== 'success') {
    throw new UnprocessableError('Payment has not been confirmed');
  }

  const payment = result.data;

  const completed = await models.sequelize.transaction(async (t) => {
    const tx = await Transaction.findOne({
      where: {
        reference,
        initiatingUserId: user.id,
        type: 'FUNDING',
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!tx) throw new NotFoundError('Funding transaction not found');

    if (tx.status === 'COMPLETED') return tx;

    if (
      payment.reference !== tx.reference ||
      String(payment.amount) !== String(tx.amount) ||
      payment.currency !== tx.currency
    ) {
      throw new UnprocessableError('Payment details do not match');
    }

    const account = await BankAccount.findByPk(tx.recipientAccountId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!account || account.userId !== user.id) {
      throw new NotFoundError('Account not found');
    }

    if (account.status !== 'ACTIVE') {
      throw new UnprocessableError('Account cannot receive funding');
    }

    const availableAfter = BigInt(account.availableBalance) + BigInt(tx.amount);
    const ledgerAfter = BigInt(account.ledgerBalance) + BigInt(tx.amount);

    await LedgerEntry.create({
      transactionId: tx.id,
      accountId: account.id,
      direction: 'CREDIT',
      amount: String(tx.amount),
      currency: tx.currency,
      balanceAfter: ledgerAfter.toString(),
      description: 'Paystack account funding',
    }, { transaction: t });

    await account.update({
      availableBalance: availableAfter.toString(),
      ledgerBalance: ledgerAfter.toString(),
    }, { transaction: t });

    await tx.update({
      status: 'COMPLETED',
      metadata: {
        ...tx.metadata,
        paystackTransactionId: payment.id,
        channel: payment.channel,
      },
    }, { transaction: t });

    return tx;
  });

  return {
    reference: completed.reference,
    status: completed.status,
    amount: String(completed.amount),
    currency: completed.currency,
  };
}

module.exports = { initializeFunding, verifyFunding };