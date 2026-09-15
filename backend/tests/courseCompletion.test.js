const test = require('node:test');
const assert = require('node:assert/strict');
const Purchase = require('../models/Purchase');

const courseId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';

test('Purchase completion starts unset and stores a completion timestamp', () => {
  const purchase = new Purchase({
    student: userId,
    course: courseId,
    teacher: '507f1f77bcf86cd799439013',
    credits: 5,
  });

  assert.equal(purchase.completedAt, null);
  purchase.completedAt = new Date();
  assert.ok(purchase.completedAt instanceof Date);
});

test('Purchase completion state does not change purchase credit fields', () => {
  const purchase = new Purchase({
    student: userId,
    course: courseId,
    teacher: '507f1f77bcf86cd799439013',
    credits: 5,
  });
  const creditsBefore = purchase.credits;
  purchase.completedAt = new Date();

  assert.equal(purchase.credits, creditsBefore);
  assert.equal(purchase.status, 'completed');
});
