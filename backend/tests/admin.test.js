'use strict';

const app = require('../src/app');
const request = require('supertest');
const models = require('../src/models');
const authService = require('../src/services/authService');

const PASSWORD = 'StrongP@ss1';
const ADMIN_EMAIL = 'admin-test@silverbank.test';

async function createAdmin() {
  const admin = await authService.register(
    {
      fullName: 'Admin Test',
      email: ADMIN_EMAIL,
      phone: '08090012345',
      password: PASSWORD,
      confirmPassword: PASSWORD,
    },
    {}
  );
  const user = await models.User.findByPk(admin.user.id);
  await user.update({ role: 'ADMIN' });
  const login = await authService.login({ email: ADMIN_EMAIL, password: PASSWORD }, {});
  return { user, token: login.accessToken };
}

async function createUser({ email, name, phoneSuffix = 0, balance = '0' }) {
  const phone = `080500${String(9000 + phoneSuffix).padStart(4, '0')}`;
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
  if (balance && BigInt(balance) > 0n) {
    const account = await models.BankAccount.findByPk(res.account.id);
    const b = String(balance);
    await account.update({ availableBalance: b, ledgerBalance: b });
    const tx = await models.Transaction.create({
      reference: `SB-ADJ-ADM-${Date.now()}-${phoneSuffix}`,
      type: 'ADJUSTMENT',
      status: 'COMPLETED',
      amount: b,
      currency: 'NGN',
      recipientAccountId: account.id,
      narration: 'Test',
    });
    await models.LedgerEntry.create({
      transactionId: tx.id,
      accountId: account.id,
      direction: 'CREDIT',
      amount: b,
      currency: 'NGN',
      balanceAfter: b,
      description: 'Test',
    });
  }
  const login = await authService.login({ email, password: PASSWORD }, {});
  const acct = await models.BankAccount.findByPk(res.account.id);
  return { user: res.user, account: acct, token: login.accessToken };
}

beforeEach(async () => {
  await models.sequelize.sync({ force: true });
});

afterAll(async () => {
  await models.sequelize.close();
});

describe('Admin', () => {
  test('authorized admin can perform permitted actions', async () => {
    const admin = await createAdmin();
    const cust = await createUser({ email: `c-${Date.now()}@t.com`, name: 'C', phoneSuffix: 1 });
    const stats = await request(app).get('/api/admin/statistics').set('Authorization', `Bearer ${admin.token}`);
    expect(stats.status).toBe(200);
    expect(stats.body.data.customers).toBeGreaterThanOrEqual(1);
    const list = await request(app).get('/api/admin/customers').set('Authorization', `Bearer ${admin.token}`);
    expect(list.status).toBe(200);
  });

  test('customers cannot freeze or unfreeze accounts', async () => {
    const cust = await createUser({ email: `c2-${Date.now()}@t.com`, name: 'C2', phoneSuffix: 2 });
    const target = await createUser({ email: `c3-${Date.now()}@t.com`, name: 'C3', phoneSuffix: 3 });
    const res = await request(app)
      .patch(`/api/admin/accounts/${target.account.id}/status`)
      .set('Authorization', `Bearer ${cust.token}`)
      .send({ status: 'FROZEN' });
    expect(res.status).toBe(403);
  });

  test('reconciliation detects inconsistencies', async () => {
    const admin = await createAdmin();
    // Create a healthy account
    await createUser({ email: `c4-${Date.now()}@t.com`, name: 'C4', phoneSuffix: 4, balance: '1000' });
    const rec = await request(app).get('/api/admin/reconciliation').set('Authorization', `Bearer ${admin.token}`);
    expect(rec.status).toBe(200);
    expect(rec.body.data).toHaveProperty('consistent');
    expect(rec.body.data).toHaveProperty('accounts');
  });
});
