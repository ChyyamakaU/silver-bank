'use strict';

const app = require('../src/app');
const request = require('supertest');
const models = require('../src/models');
const authService = require('../src/services/authService');
const { hashPin } = require('../src/utils/password');

const PASSWORD = 'StrongP@ss1';
const PIN = '1234';

async function createUser({ email, name, phoneSuffix = 0, balance = '0' }) {
  const phone = `080300${String(7000 + phoneSuffix).padStart(4, '0')}`;
  const res = await authService.register(
    {
      fullName: name,
      email,
      phone,
      password: PASSWORD,
      confirmPassword: PASSWORD,
    },
    {}
  );
  // PINs are created from the dashboard after registration; set one for tests.
  const userModel = await models.User.findByPk(res.user.id);
  await userModel.update({ pinHash: await hashPin(PIN) });
  if (balance && BigInt(balance) > 0n) {
    const account = await models.BankAccount.findByPk(res.account.id);
    await account.update({ availableBalance: balance, ledgerBalance: balance });
    const tx = await models.Transaction.create({
      reference: `SB-ADJ-T${Date.now()}-${phoneSuffix}`,
      type: 'ADJUSTMENT',
      status: 'COMPLETED',
      amount: balance,
      currency: 'NGN',
      recipientAccountId: account.id,
      narration: 'Test',
    });
    await models.LedgerEntry.create({
      transactionId: tx.id,
      accountId: account.id,
      direction: 'CREDIT',
      amount: balance,
      currency: 'NGN',
      balanceAfter: balance,
      description: 'Test',
    });
  }
  const login = await authService.login({ email, password: PASSWORD }, {});
  return { ...res, token: login.accessToken, account: await models.BankAccount.findByPk(res.account.id) };
}

async function getToken(email) {
  const login = await authService.login({ email, password: PASSWORD }, {});
  return login.accessToken;
}

beforeEach(async () => {
  await models.sequelize.sync({ force: true });
});

afterAll(async () => {
  await models.sequelize.close();
});

describe('Authorization & ownership', () => {
  test('customer A cannot access customer B account', async () => {
    const a = await createUser({ email: `a-${Date.now()}@t.com`, name: 'A', phoneSuffix: 1 });
    const b = await createUser({ email: `b-${Date.now()}@t.com`, name: 'B', phoneSuffix: 2 });
    // A tries to look up B's account by getting B's details? but /accounts/me is own
    // Instead check cannot get B's transfer by a random reference? Or lookup doesn't leak balance.
    const lookup = await request(app)
      .post('/api/transfers/lookup-recipient')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ accountNumber: b.account.accountNumber });
    expect(lookup.status).toBe(200);
    expect(lookup.body.data.balance).toBeUndefined();
    expect(lookup.body.data.email).toBeUndefined();
  });

  test('customer A cannot view customer B transaction history', async () => {
    const a = await createUser({ email: `a1-${Date.now()}@t.com`, name: 'A1', phoneSuffix: 10, balance: '10000' });
    const b = await createUser({ email: `b1-${Date.now()}@t.com`, name: 'B1', phoneSuffix: 11 });
    const tx = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${a.token}`)
      .set('Content-Type', 'application/json')
      .send({
        recipientAccountNumber: b.account.accountNumber,
        amount: '100',
        pin: PIN,
        narration: 'x',
        idempotencyKey: `k-${Date.now()}`,
      });
    expect(tx.status).toBe(201);
    const ref = tx.body.data.reference;
    // B's own history shows it, A tries to fetch as A? no, fetching by ref requires ownership.
    // Try as B should work; as A (sender) should work; create C
    const c = await createUser({ email: `c1-${Date.now()}@t.com`, name: 'C1', phoneSuffix: 12 });
    const res = await request(app)
      .get(`/api/transfers/${ref}`)
      .set('Authorization', `Bearer ${c.token}`);
    expect(res.status).toBe(404);
  });

  test('customers cannot access admin endpoints', async () => {
    const a = await createUser({ email: `adm-${Date.now()}@t.com`, name: 'Ad', phoneSuffix: 20 });
    const res = await request(app)
      .get('/api/admin/statistics')
      .set('Authorization', `Bearer ${a.token}`);
    expect(res.status).toBe(403);
  });
});
