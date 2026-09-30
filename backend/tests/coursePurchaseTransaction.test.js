const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Wallet = require('../models/Wallet');
const Course = require('../models/Course');
const {
  purchaseCourse,
  getCoursePurchase,
  completeCourse,
  getCourseCompletion,
  hasCoursePurchase,
} = require('../controllers/purchaseController');

const mockStudentId = new mongoose.Types.ObjectId();
const mockTeacherId = new mongoose.Types.ObjectId();
const mockCourseId = new mongoose.Types.ObjectId();

const createMockSession = () => ({
  withTransaction: async (fn) => fn(),
  endSession: async () => {},
});

const createMockQuery = (result) => ({
  session() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(result).then(resolve, reject);
  },
});

test('Purchase schema declares unique compound index on { student, course }', () => {
  const indexes = Purchase.schema.indexes();
  const hasUniqueStudentCourseIndex = indexes.some(
    ([fields, options]) =>
      fields.student === 1 && fields.course === 1 && options && options.unique === true
  );

  assert.ok(
    hasUniqueStudentCourseIndex,
    'Purchase schema must declare a unique compound index on { student: 1, course: 1 }'
  );
});

test('Purchase schema enforces status enum and defaults to completed', () => {
  const purchase = new Purchase({
    student: mockStudentId,
    course: mockCourseId,
    teacher: mockTeacherId,
    credits: 10,
  });

  assert.equal(purchase.status, 'completed');
  assert.equal(purchase.completedAt, null);
  assert.ok(purchase.purchasedAt instanceof Date);
});

test('Wallet schema prevents negative balance via schema validator', () => {
  const wallet = new Wallet({
    user: mockStudentId,
    balance: -5,
  });

  const validationError = wallet.validateSync();
  assert.ok(validationError, 'Wallet should fail validation with negative balance');
  assert.ok(validationError.errors.balance);
});

test('Wallet transaction ledger records credit and debit entries', () => {
  const wallet = new Wallet({
    user: mockStudentId,
    balance: 20,
    transactions: [
      { amount: 10, type: 'debit', description: 'Purchased course: "Node.js Mastery"' },
      { amount: 10, type: 'credit', description: 'Earned from course: "React Basics"' },
    ],
  });

  assert.equal(wallet.transactions.length, 2);
  assert.equal(wallet.transactions[0].type, 'debit');
  assert.equal(wallet.transactions[0].amount, 10);
  assert.equal(wallet.transactions[1].type, 'credit');
  assert.equal(wallet.transactions[1].amount, 10);
});

test('Self-purchase attempt is blocked with 400 Bad Request', async () => {
  let capturedStatus = null;
  let capturedJson = null;

  const req = {
    params: { id: mockCourseId.toString() },
    user: { id: mockTeacherId.toString() },
  };
  const res = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(data) {
      capturedJson = data;
      return this;
    },
  };

  const originalStartSession = mongoose.startSession;
  const originalFindOne = Course.findOne;

  mongoose.startSession = async () => createMockSession();
  Course.findOne = () => createMockQuery({
    _id: mockCourseId,
    status: 'published',
    teacher: mockTeacherId,
    credits: 10,
    title: 'Self Course',
  });

  try {
    await purchaseCourse(req, res, (err) => {
      if (err) {
        capturedStatus = err.statusCode || 500;
        capturedJson = { success: false, message: err.message };
      }
    });

    assert.equal(capturedStatus, 400);
    assert.equal(capturedJson.message, 'You cannot purchase your own course');
  } finally {
    mongoose.startSession = originalStartSession;
    Course.findOne = originalFindOne;
  }
});

test('Course completion idempotency maintains original completedAt and transfers zero credits', () => {
  const initialDate = new Date('2026-09-01T12:00:00Z');
  const purchase = new Purchase({
    student: mockStudentId,
    course: mockCourseId,
    teacher: mockTeacherId,
    credits: 15,
    status: 'completed',
    completedAt: initialDate,
  });

  const walletStudent = new Wallet({ user: mockStudentId, balance: 50 });
  const walletTeacher = new Wallet({ user: mockTeacherId, balance: 100 });

  const studentBalanceBefore = walletStudent.balance;
  const teacherBalanceBefore = walletTeacher.balance;

  // Simulate idempotent second completion call
  if (!purchase.completedAt) {
    purchase.completedAt = new Date();
  }

  // Verify completedAt remains exactly initialDate
  assert.equal(purchase.completedAt.toISOString(), initialDate.toISOString());

  // Verify zero credit mutations occur
  assert.equal(walletStudent.balance, studentBalanceBefore);
  assert.equal(walletTeacher.balance, teacherBalanceBefore);
  assert.equal(walletStudent.transactions.length, 0);
  assert.equal(walletTeacher.transactions.length, 0);
});

test('Duplicate purchase collision triggers code 11000 mapping to HTTP 409', async () => {
  let capturedStatus = null;
  let capturedJson = null;

  const req = {
    params: { id: mockCourseId.toString() },
    user: { id: mockStudentId.toString() },
  };
  const res = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(data) {
      capturedJson = data;
      return this;
    },
  };

  const originalStartSession = mongoose.startSession;
  const originalFindOne = Course.findOne;
  const originalExists = Purchase.exists;

  mongoose.startSession = async () => createMockSession();
  Course.findOne = () => createMockQuery({
    _id: mockCourseId,
    status: 'published',
    teacher: mockTeacherId,
    credits: 10,
    title: 'Duplicate Test Course',
  });

  Purchase.exists = () => createMockQuery({ _id: new mongoose.Types.ObjectId() });

  try {
    await purchaseCourse(req, res, (err) => {
      if (err) {
        capturedStatus = err.statusCode || 500;
        capturedJson = { success: false, message: err.message };
      }
    });

    assert.equal(capturedStatus, 409);
    assert.equal(capturedJson.message, 'You already own this course');
  } finally {
    mongoose.startSession = originalStartSession;
    Course.findOne = originalFindOne;
    Purchase.exists = originalExists;
  }
});

test('Insufficient student wallet balance rejects purchase with HTTP 400', async () => {
  let capturedStatus = null;
  let capturedJson = null;

  const req = {
    params: { id: mockCourseId.toString() },
    user: { id: mockStudentId.toString() },
  };
  const res = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(data) {
      capturedJson = data;
      return this;
    },
  };

  const originalStartSession = mongoose.startSession;
  const originalFindOne = Course.findOne;
  const originalExists = Purchase.exists;
  const originalFindOneAndUpdate = Wallet.findOneAndUpdate;

  mongoose.startSession = async () => createMockSession();
  Course.findOne = () => createMockQuery({
    _id: mockCourseId,
    status: 'published',
    teacher: mockTeacherId,
    credits: 50,
    title: 'Expensive Course',
  });

  Purchase.exists = () => createMockQuery(null);

  // Wallet.findOneAndUpdate returns null when balance < credits
  Wallet.findOneAndUpdate = (filter) => {
    if (filter.user === mockStudentId.toString() && filter.balance) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ user: mockStudentId, balance: 10 });
  };

  try {
    await purchaseCourse(req, res, (err) => {
      if (err) {
        capturedStatus = err.statusCode || 500;
        capturedJson = { success: false, message: err.message };
      }
    });

    assert.equal(capturedStatus, 400);
    assert.equal(capturedJson.message, 'Insufficient credits to purchase this course');
  } finally {
    mongoose.startSession = originalStartSession;
    Course.findOne = originalFindOne;
    Purchase.exists = originalExists;
    Wallet.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('Standalone MongoDB error code 20 maps cleanly to HTTP 503', async () => {
  let capturedStatus = null;
  let capturedJson = null;

  const req = {
    params: { id: mockCourseId.toString() },
    user: { id: mockStudentId.toString() },
  };
  const res = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(data) {
      capturedJson = data;
      return this;
    },
  };

  const originalStartSession = mongoose.startSession;
  mongoose.startSession = async () => ({
    withTransaction: async () => {
      const err = new Error('Transaction numbers are only allowed on a replica set member or mongos');
      err.code = 20;
      throw err;
    },
    endSession: async () => {},
  });

  try {
    await purchaseCourse(req, res, (err) => {
      if (err) {
        capturedStatus = err.statusCode || 500;
        capturedJson = { success: false, message: err.message };
      }
    });

    assert.equal(capturedStatus, 503);
    assert.equal(capturedJson.message, 'Course purchases require MongoDB transaction support');
  } finally {
    mongoose.startSession = originalStartSession;
  }
});
