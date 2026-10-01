const test = require('node:test');
const assert = require('node:assert/strict');
const Course = require('../models/Course');
const courseController = require('../controllers/courseController');

const teacherId = '507f1f77bcf86cd799439011';
const otherUserId = '507f1f77bcf86cd799439012';
const courseId = '507f1f77bcf86cd799439013';

// ---------------------------------------------------------------------------
// 1. Course Schema Validation & State Defaults
// ---------------------------------------------------------------------------
test('Course schema enforces required fields', () => {
  const course = new Course({});
  const err = course.validateSync();
  assert.ok(err?.errors?.title, 'title is required');
  assert.ok(err?.errors?.description, 'description is required');
  assert.ok(err?.errors?.category, 'category is required');
  assert.ok(err?.errors?.teacher, 'teacher is required');
  assert.ok(err?.errors?.credits, 'credits is required');
});

test('Course schema defaults status to draft', () => {
  const course = new Course({
    title: 'Node.js Mastery',
    description: 'Learn Node.js',
    category: 'Programming',
    teacher: teacherId,
    credits: 5,
  });
  assert.equal(course.status, 'draft', 'initial status must be draft');
});

test('Course schema enforces credits minimum >= 1', () => {
  const invalidCourse = new Course({
    title: 'Free Course',
    description: 'Learn Node.js',
    category: 'Programming',
    teacher: teacherId,
    credits: 0,
  });
  const err = invalidCourse.validateSync();
  assert.ok(err?.errors?.credits, 'credits below 1 should fail validation');
  assert.match(err.errors.credits.message, /at least 1/i);
});

test('Course schema enforces string max length limits', () => {
  const longCourse = new Course({
    title: 'A'.repeat(151),
    description: 'B'.repeat(5001),
    category: 'C'.repeat(101),
    teacher: teacherId,
    credits: 5,
  });
  const err = longCourse.validateSync();
  assert.ok(err?.errors?.title, 'title > 150 chars fails');
  assert.ok(err?.errors?.description, 'description > 5000 chars fails');
  assert.ok(err?.errors?.category, 'category > 100 chars fails');
});

// ---------------------------------------------------------------------------
// 2. Course Controller Authorization & Lifecycle
// ---------------------------------------------------------------------------
test('createCourse controller creates course draft with authenticated teacher', async () => {
  const req = {
    body: {
      title: 'React Advanced',
      description: 'Deep dive into React',
      category: 'Web Development',
      credits: 10,
    },
    user: { id: teacherId },
  };

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

  const originalCreate = Course.create;
  Course.create = (doc) => Promise.resolve({ ...doc, _id: courseId });

  try {
    await courseController.createCourse(req, res, next);
    assert.equal(statusCode, 201);
    assert.equal(jsonResponse?.success, true);
    assert.equal(jsonResponse?.data.status, 'draft');
    assert.equal(jsonResponse?.data.teacher, teacherId);
  } finally {
    Course.create = originalCreate;
  }
});

test('updateCourse controller rejects non-owner with 403', async () => {
  const req = {
    params: { id: courseId },
    body: { title: 'Updated Title' },
    user: { id: otherUserId }, // Not the owner
  };

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

  const mockCourse = {
    _id: courseId,
    teacher: { toString: () => teacherId },
    title: 'Original Title',
    save: () => Promise.resolve(),
  };

  const originalFindById = Course.findById;
  Course.findById = () => Promise.resolve(mockCourse);

  try {
    await courseController.updateCourse(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(jsonResponse?.success, false);
    assert.match(jsonResponse?.message, /Not authorized to update/i);
  } finally {
    Course.findById = originalFindById;
  }
});

test('publishCourse controller transitions status to published for owner', async () => {
  const req = {
    params: { id: courseId },
    user: { id: teacherId },
  };

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

  const mockCourse = {
    _id: courseId,
    teacher: { toString: () => teacherId },
    status: 'draft',
    save() { return Promise.resolve(this); },
  };

  const originalFindById = Course.findById;
  Course.findById = () => Promise.resolve(mockCourse);

  try {
    await courseController.publishCourse(req, res, next);
    assert.equal(statusCode, 200);
    assert.equal(jsonResponse?.success, true);
    assert.equal(mockCourse.status, 'published');
  } finally {
    Course.findById = originalFindById;
  }
});

test('publishCourse controller rejects non-owner with 403', async () => {
  const req = {
    params: { id: courseId },
    user: { id: otherUserId },
  };

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

  const mockCourse = {
    _id: courseId,
    teacher: { toString: () => teacherId },
    status: 'draft',
    save() { return Promise.resolve(this); },
  };

  const originalFindById = Course.findById;
  Course.findById = () => Promise.resolve(mockCourse);

  try {
    await courseController.publishCourse(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(jsonResponse?.success, false);
    assert.match(jsonResponse?.message, /Not authorized to publish/i);
  } finally {
    Course.findById = originalFindById;
  }
});

test('deleteCourse controller rejects non-owner with 403 and deletes for owner', async () => {
  const mockCourse = {
    _id: courseId,
    teacher: { toString: () => teacherId },
  };

  const originalFindById = Course.findById;
  const originalFindByIdAndDelete = Course.findByIdAndDelete;
  Course.findById = () => Promise.resolve(mockCourse);
  let deletedId = null;
  Course.findByIdAndDelete = (id) => {
    deletedId = id;
    return Promise.resolve(mockCourse);
  };

  try {
    // 1. Non-owner attempt
    const nonOwnerReq = { params: { id: courseId }, user: { id: otherUserId } };
    let statusCode = 0;
    const res1 = {
      status(code) { statusCode = code; return this; },
      json() { return this; },
    };
    await courseController.deleteCourse(nonOwnerReq, res1, () => {});
    assert.equal(statusCode, 403);
    assert.equal(deletedId, null);

    // 2. Owner attempt
    const ownerReq = { params: { id: courseId }, user: { id: teacherId } };
    statusCode = 0;
    const res2 = {
      status(code) { statusCode = code; return this; },
      json() { return this; },
    };
    await courseController.deleteCourse(ownerReq, res2, () => {});
    assert.equal(statusCode, 200);
    assert.equal(deletedId, courseId);
  } finally {
    Course.findById = originalFindById;
    Course.findByIdAndDelete = originalFindByIdAndDelete;
  }
});
