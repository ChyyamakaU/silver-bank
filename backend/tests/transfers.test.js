'use strict';

const app = require('../src/app');
const request = require('supertest');
const models = require('../src/models');
const authService = require('../src/services/authService');
const { hashPin } = require('../src/utils/password');

const PASSWORD = 'StrongP@ss1';
const PIN = '1234';

async function createUser({ email, name, phoneSuffix = 0, balance = '0' }) {
  const phone = `080400${String(8000 + phoneSuffix).padStart(4, '0')}`;
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
    const b = String(balance);
    await account.update({ availableBalance: b, ledgerBalance: b });
    const tx = await models.Transaction.create({
      reference: `SB-ADJ-T${Date.now()}-${phoneSuffix}`,
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

describe('Transfers', () => {
  test('valid transfer succeeds; sender debited, recipient credited, records created', async () => {
    const sender = await createUser({ email: `s-${Date.now()}@t.com`, name: 'Sender', phoneSuffix: 1, balance: '1000000' });
    const recip = await createUser({ email: `r-${Date.now()}@t.com`, name: 'Recip', phoneSuffix: 2 });
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('Content-Type', 'application/json')
      .send({
        recipientAccountNumber: recip.account.accountNumber,
        amount: '10.00',
        pin: PIN,
        narration: 'Pay',
        idempotencyKey: `k1-${Date.now()}`,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.reference).toMatch(/^SB-TRF-/);
    // Balances
    const sBal = await request(app).get('/api/accounts/me/balance').set('Authorization', `Bearer ${sender.token}`);
    const rBal = await request(app).get('/api/accounts/me/balance').set('Authorization', `Bearer ${recip.token}`);
    expect(sBal.body.data.availableBalance).toBe('999000');
    expect(rBal.body.data.availableBalance).toBe('1000');
    // History
    const sHist = await request(app).get('/api/accounts/me/transactions').set('Authorization', `Bearer ${sender.token}`);
    const rHist = await request(app).get('/api/accounts/me/transactions').set('Authorization', `Bearer ${recip.token}`);
    expect(sHist.body.data.items[0].direction).toBe('DEBIT');
    expect(rHist.body.data.items[0].direction).toBe('CREDIT');
    expect(sHist.body.data.items[0].reference).toBe(rHist.body.data.items[0].reference);
  });

  test('insufficient funds rejected', async () => {
    const sender = await createUser({ email: `s2-${Date.now()}@t.com`, name: 'S2', phoneSuffix: 10, balance: '100' });
    const recip = await createUser({ email: `r2-${Date.now()}@t.com`, name: 'R2', phoneSuffix: 11 });
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '10.00', pin: PIN, idempotencyKey: `k2-${Date.now()}` });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toMatch(/INSUFFICIENT_FUNDS|UNPROCESSABLE/);
  });

  test('zero and negative amounts rejected', async () => {
    const sender = await createUser({ email: `s3-${Date.now()}@t.com`, name: 'S3', phoneSuffix: 20, balance: '500' });
    const recip = await createUser({ email: `r3-${Date.now()}@t.com`, name: 'R3', phoneSuffix: 21 });
    const z = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '0', pin: PIN, idempotencyKey: `k3-${Date.now()}` });
    expect(z.status).toBe(422);
    const neg = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '-10', pin: PIN, idempotencyKey: `k4-${Date.now()}` });
    expect(neg.status).toBe(422);
  });

  test('invalid recipients rejected', async () => {
    const sender = await createUser({ email: `s4-${Date.now()}@t.com`, name: 'S4', phoneSuffix: 30, balance: '500' });
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: '9999999999', amount: '10', pin: PIN, idempotencyKey: `k5-${Date.now()}` });
    expect([404, 422]).toContain(res.status);
  });

  test('self transfer rejected', async () => {
    const sender = await createUser({ email: `s5-${Date.now()}@t.com`, name: 'S5', phoneSuffix: 40, balance: '500' });
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: sender.account.accountNumber, amount: '10', pin: PIN, idempotencyKey: `k6-${Date.now()}` });
    expect(res.status).toBe(422);
  });

  test('duplicate requests do not create duplicate transfers', async () => {
    const sender = await createUser({ email: `s6-${Date.now()}@t.com`, name: 'S6', phoneSuffix: 50, balance: '20000' });
    const recip = await createUser({ email: `r6-${Date.now()}@t.com`, name: 'R6', phoneSuffix: 51 });
    const idem = `dup-${Date.now()}`;
    const t1 = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '5.00', pin: PIN, idempotencyKey: idem });
    const t2 = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '5.00', pin: PIN, idempotencyKey: idem });
    expect(t1.status).toBe(201);
    expect(t2.status).toBe(201);
    expect(t2.body.data.reference).toBe(t1.body.data.reference);
    expect(t2.body.data.idempotentReplay).toBe(true);
    const bal = await request(app).get('/api/accounts/me/balance').set('Authorization', `Bearer ${recip.token}`);
    expect(bal.body.data.availableBalance).toBe('500');
  });

  test('ledger entries balance correctly', async () => {
    const sender = await createUser({ email: `s7-${Date.now()}@t.com`, name: 'S7', phoneSuffix: 60, balance: '150000' });
    const recip = await createUser({ email: `r7-${Date.now()}@t.com`, name: 'R7', phoneSuffix: 61 });
    const tx = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '3.00', pin: PIN, idempotencyKey: `led-${Date.now()}` });
    const ref = tx.body.data.reference;
    const t = await models.Transaction.findOne({ where: { reference: ref } });
    const entries = await models.LedgerEntry.findAll({ where: { transactionId: t.id } });
    expect(entries).toHaveLength(2);
    const deb = entries.find((e) => e.direction === 'DEBIT');
    const cred = entries.find((e) => e.direction === 'CREDIT');
    expect(deb).toBeTruthy();
    expect(cred).toBeTruthy();
    expect(deb.amount).toBe(cred.amount);
  });

  test('transfer requires the correct transaction PIN', async () => {
    const sender = await createUser({ email: `s8-${Date.now()}@t.com`, name: 'S8', phoneSuffix: 70, balance: '100000' });
    const recip = await createUser({ email: `r8-${Date.now()}@t.com`, name: 'R8', phoneSuffix: 71 });

    const wrong = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '5.00', pin: '0000', idempotencyKey: `pin-${Date.now()}` });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toMatch(/INVALID_PIN|UNAUTHORIZED/);

    const missing = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientAccountNumber: recip.account.accountNumber, amount: '5.00', idempotencyKey: `pinm-${Date.now()}` });
    expect(missing.status).toBe(422);

    const bal = await request(app).get('/api/accounts/me/balance').set('Authorization', `Bearer ${sender.token}`);
    expect(bal.body.data.availableBalance).toBe('100000');
  });
});
