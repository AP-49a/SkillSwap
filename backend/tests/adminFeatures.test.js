const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Report = require('../models/Report');
const Wallet = require('../models/Wallet');
const AdminLog = require('../models/AdminLog');
const PlatformSettings = require('../models/PlatformSettings');
const { adjustCredits } = require('../controllers/adminController');

test('new users default to active account status and course review status remains explicit', () => {
  const user = new User({ username: 'test-user', email: 'test@example.com', password: 'password123' });
  const course = new Course({ title: 'Course', description: 'Description', category: 'Design', credits: 2, teacher: new mongoose.Types.ObjectId() });
  assert.equal(user.accountStatus, 'active');
  assert.equal(course.status, 'draft');
  course.status = 'pending';
  assert.equal(course.validateSync(), undefined);
});

test('reports require a valid target, category, reporter, and sufficient details', () => {
  const report = new Report({
    reporter: new mongoose.Types.ObjectId(),
    targetType: 'course',
    target: new mongoose.Types.ObjectId(),
    category: 'misleading_information',
    details: 'The course description does not match the material.',
  });
  assert.equal(report.status, 'pending');
  assert.equal(report.validateSync(), undefined);
  const invalid = new Report({});
  assert.ok(invalid.validateSync());
});

test('platform settings preserve the current signup credit default', () => {
  const settings = new PlatformSettings();
  assert.equal(settings.signupCredits, 10);
  settings.signupCredits = 1001;
  assert.ok(settings.validateSync());
});

test('credit adjustments atomically update the wallet and append an audit transaction', async () => {
  const originalFindById = User.findById;
  const originalFindOneAndUpdate = Wallet.findOneAndUpdate;
  const originalAdminLogCreate = AdminLog.create;
  const userId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  let capturedFilter;
  let capturedPipeline;
  const entry = { amount: 25, type: 'credit', previousBalance: 10, newBalance: 35, reason: 'Service recovery', reference: 'admin-test' };
  User.findById = () => ({ select: async () => ({ username: 'member' }) });
  Wallet.findOneAndUpdate = async (filter, pipeline) => { capturedFilter = filter; capturedPipeline = pipeline; return { transactions: [entry] }; };
  AdminLog.create = async () => ({});
  const response = { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };

  try {
    await adjustCredits({ body: { userId: String(userId), amount: 25, reason: 'Service recovery' }, user: { _id: adminId } }, response, (error) => { throw error; });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(capturedFilter, { user: String(userId) });
    assert.equal(capturedPipeline[0].$set.balance.$add[1], 25);
    assert.equal(capturedPipeline[0].$set.transactions.$concatArrays[1][0].previousBalance, '$balance');
    assert.equal(capturedPipeline[0].$set.transactions.$concatArrays[1][0].newBalance.$add[1], 25);

    const debitResponse = { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await adjustCredits({ body: { userId: String(userId), amount: -7, reason: 'Adjustment fix' }, user: { _id: adminId } }, debitResponse, (error) => { throw error; });
    assert.equal(debitResponse.statusCode, 200);
    assert.equal(capturedFilter.balance.$gte, 7);
  } finally {
    User.findById = originalFindById;
    Wallet.findOneAndUpdate = originalFindOneAndUpdate;
    AdminLog.create = originalAdminLogCreate;
  }
});
