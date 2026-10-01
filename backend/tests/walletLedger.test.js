const test = require('node:test');
const assert = require('node:assert/strict');
const Wallet = require('../models/Wallet');
const walletController = require('../controllers/walletController');

const userId = '507f1f77bcf86cd799439011';

// ---------------------------------------------------------------------------
// 1. Wallet Schema Defaults & Validation
// ---------------------------------------------------------------------------
test('Wallet schema loads and requires user reference', () => {
  assert.ok(Wallet, 'Wallet export is truthy');
  assert.ok(Wallet.schema, 'Wallet has a Mongoose schema');

  const wallet = new Wallet({});
  const err = wallet.validateSync();
  assert.ok(err?.errors?.user, 'user is a required field');
});

test('Wallet schema provisions default 10 credits balance', () => {
  const wallet = new Wallet({ user: userId });
  assert.equal(wallet.balance, 10, 'initial balance must default to 10 credits');
});

test('Wallet schema prevents negative balance with min validator', () => {
  const wallet = new Wallet({ user: userId, balance: -5 });
  const err = wallet.validateSync();
  assert.ok(err?.errors?.balance, 'negative balance should fail validation');
  assert.match(err.errors.balance.message, /cannot be negative/i);
});

test('Wallet schema allows zero balance', () => {
  const wallet = new Wallet({ user: userId, balance: 0 });
  const err = wallet.validateSync();
  assert.equal(err?.errors?.balance, undefined, 'zero balance is valid');
});

// ---------------------------------------------------------------------------
// 2. Transaction Subdocument Schema Validation
// ---------------------------------------------------------------------------
test('Wallet transactions require amount, type enum, and description', () => {
  const wallet = new Wallet({
    user: userId,
    transactions: [{}],
  });
  const err = wallet.validateSync();
  assert.ok(err?.errors?.['transactions.0.amount'], 'transaction amount is required');
  assert.ok(err?.errors?.['transactions.0.type'], 'transaction type is required');
  assert.ok(err?.errors?.['transactions.0.description'], 'transaction description is required');
});

test('Wallet transaction type only allows "credit" and "debit"', () => {
  const invalidWallet = new Wallet({
    user: userId,
    transactions: [{ amount: 5, type: 'invalid_type', description: 'test' }],
  });
  const err = invalidWallet.validateSync();
  assert.ok(err?.errors?.['transactions.0.type'], 'invalid transaction type should fail enum validator');

  const creditWallet = new Wallet({
    user: userId,
    transactions: [{ amount: 5, type: 'credit', description: 'initial' }],
  });
  assert.equal(creditWallet.validateSync()?.errors?.['transactions.0.type'], undefined);

  const debitWallet = new Wallet({
    user: userId,
    transactions: [{ amount: 5, type: 'debit', description: 'purchase' }],
  });
  assert.equal(debitWallet.validateSync()?.errors?.['transactions.0.type'], undefined);
});

// ---------------------------------------------------------------------------
// 3. getWallet Controller & Transaction Sorting
// ---------------------------------------------------------------------------
test('getWallet controller returns 404 when wallet is not found', async () => {
  const req = { user: { id: userId } };
  let statusCode = 0;
  let jsonResponse = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    },
  };
  let errorPassed = null;
  const next = (err) => { errorPassed = err; };

  const originalFindOne = Wallet.findOne;
  Wallet.findOne = () => Promise.resolve(null);

  try {
    await walletController.getWallet(req, res, next);
    assert.equal(statusCode, 404);
    assert.equal(jsonResponse?.success, false);
    assert.equal(jsonResponse?.message, 'Wallet not found');
    assert.equal(errorPassed, null);
  } finally {
    Wallet.findOne = originalFindOne;
  }
});

test('getWallet controller returns wallet with transactions sorted descending by date', async () => {
  const date1 = new Date('2026-01-01T10:00:00Z');
  const date2 = new Date('2026-01-02T10:00:00Z');
  const date3 = new Date('2026-01-03T10:00:00Z');

  const mockWallet = {
    user: userId,
    balance: 20,
    transactions: [
      { amount: 5, type: 'credit', description: 'Oldest', date: date1 },
      { amount: 15, type: 'credit', description: 'Newest', date: date3 },
      { amount: 10, type: 'debit', description: 'Middle', date: date2 },
    ],
  };

  const req = { user: { id: userId } };
  let statusCode = 0;
  let jsonResponse = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    },
  };
  const next = () => {};

  const originalFindOne = Wallet.findOne;
  Wallet.findOne = () => Promise.resolve(mockWallet);

  try {
    await walletController.getWallet(req, res, next);
    assert.equal(statusCode, 200);
    assert.equal(jsonResponse?.success, true);
    assert.equal(jsonResponse?.data.transactions[0].description, 'Newest');
    assert.equal(jsonResponse?.data.transactions[1].description, 'Middle');
    assert.equal(jsonResponse?.data.transactions[2].description, 'Oldest');
  } finally {
    Wallet.findOne = originalFindOne;
  }
});
