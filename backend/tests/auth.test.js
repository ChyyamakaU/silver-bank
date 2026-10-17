'use strict';

const app = require('../src/app');
const request = require('supertest');
const models = require('../src/models');
const authService = require('../src/services/authService');

const PASSWORD = 'StrongP@ss1';

async function createUserWithAccount({ email, name = 'Test User', phoneSuffix = 0, balance = '0' } = {}) {
  const phone = `080200${String(5000 + phoneSuffix).padStart(4, '0')}`;
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
  // Fund account via a completed adjustment credit if balance > 0.
  if (balance && BigInt(balance) > 0n) {
    const account = await models.BankAccount.findByPk(res.account.id);
    await account.update({ availableBalance: balance, ledgerBalance: balance });
    const tx = await models.Transaction.create({
      reference: `SB-ADJ-TEST-${Date.now()}-${phoneSuffix}`,
      type: 'ADJUSTMENT',
      status: 'COMPLETED',
      amount: balance,
      currency: 'NGN',
      recipientAccountId: account.id,
      narration: 'Test funding',
    });
    await models.LedgerEntry.create({
      transactionId: tx.id,
      accountId: account.id,
      direction: 'CREDIT',
      amount: balance,
      currency: 'NGN',
      balanceAfter: balance,
      description: 'Test funding',
    });
  }
  return { ...res, phone };
}

async function getToken(user) {
  const login = await authService.login({ email: user.email, password: PASSWORD }, {});
  return login.accessToken;
}

beforeAll(async () => {
  await models.sequelize.sync({ force: true });
});

afterAll(async () => {
  await models.sequelize.close();
});

describe('Authentication', () => {
  test('customer registration succeeds', async () => {
    const email = `alice-${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Alice',
        email,
        phone: `080${Date.now() % 100000000}`.slice(0, 11),
        password: PASSWORD,
        confirmPassword: PASSWORD,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.accountNumber).toHaveLength(10);
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.pinHash).toBeUndefined();
    // Registration never creates a PIN; the customer sets it from the dashboard.
    expect(res.body.data.user.hasPin).toBe(false);
  });

  test('transaction PIN is set after registration and is verified', async () => {
    const email = `pinchange-${Date.now()}@test.com`;
    const user = await createUserWithAccount({ email, name: 'Pin Change', phoneSuffix: 9 });
    const token = await getToken(user.user);

    const invalid = await request(app)
      .patch('/api/profile/pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, pin: '12', confirmPin: '12' });
    expect(invalid.status).toBe(422);

    const bad = await request(app)
      .patch('/api/profile/pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass1!', pin: '4321', confirmPin: '4321' });
    expect(bad.status).toBe(422);

    const ok = await request(app)
      .patch('/api/profile/pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, pin: '4321', confirmPin: '4321' });
    expect(ok.status).toBe(200);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.data.user.hasPin).toBe(true);
  });

  test('duplicate email registration fails', async () => {
    const email = `bob-${Date.now()}@test.com`;
    await createUserWithAccount({ email, name: 'Bob', phoneSuffix: 1 });
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Bob2',
      email,
      phone: `080200600${Math.floor(Math.random() * 10)}`,
      password: PASSWORD,
      confirmPassword: PASSWORD,
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('valid login succeeds', async () => {
    const email = `carol-${Date.now()}@test.com`;
    await createUserWithAccount({ email, name: 'Carol', phoneSuffix: 2 });
    const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe(email.toLowerCase());
    expect(res.body.data.account).toBeTruthy();
  });

  test('invalid login fails', async () => {
    const email = `dave-${Date.now()}@test.com`;
    await createUserWithAccount({ email, name: 'Dave', phoneSuffix: 3 });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('unauthenticated users cannot access protected routes', async () => {
    const res = await request(app).get('/api/accounts/me');
    expect(res.status).toBe(401);
  });
});
