const test = require('node:test');
const assert = require('node:assert/strict');
const Course = require('../models/Course');
const CourseReview = require('../models/CourseReview');
const Booking = require('../models/Booking');
const Skill = require('../models/Skill');
const Purchase = require('../models/Purchase');
const CourseDoubtSession = require('../models/CourseDoubtSession');
const CourseVideo = require('../models/CourseVideo');

const hasIndexMatching = (schema, predicate) => {
  return schema.indexes().some(([fields, options]) => predicate(fields, options || {}));
};

test('Course schema contains required compound and query indexes', () => {
  assert.ok(
    hasIndexMatching(Course.schema, (f) => f.status === 1 && f.createdAt === -1),
    'Course must have { status: 1, createdAt: -1 } index'
  );
  assert.ok(
    hasIndexMatching(Course.schema, (f) => f.status === 1 && f.category === 1 && f.createdAt === -1),
    'Course must have { status: 1, category: 1, createdAt: -1 } index'
  );
  assert.ok(
    hasIndexMatching(Course.schema, (f) => f.teacher === 1 && f.createdAt === -1),
    'Course must have { teacher: 1, createdAt: -1 } index'
  );
});

test('CourseReview schema contains unique compound index and course query index', () => {
  assert.ok(
    hasIndexMatching(CourseReview.schema, (f, opt) => f.student === 1 && f.course === 1 && opt.unique === true),
    'CourseReview must have unique { student: 1, course: 1 } index'
  );
  assert.ok(
    hasIndexMatching(CourseReview.schema, (f) => f.course === 1 && f.createdAt === -1),
    'CourseReview must have { course: 1, createdAt: -1 } index'
  );
});

test('Booking schema contains learner and instructor query indexes', () => {
  assert.ok(
    hasIndexMatching(Booking.schema, (f) => f.learner === 1 && f.status === 1 && f.date === 1),
    'Booking must have { learner: 1, status: 1, date: 1 } index'
  );
  assert.ok(
    hasIndexMatching(Booking.schema, (f) => f.instructor === 1 && f.status === 1 && f.date === 1),
    'Booking must have { instructor: 1, status: 1, date: 1 } index'
  );
});

test('Skill schema contains category rating and creator indexes', () => {
  assert.ok(
    hasIndexMatching(Skill.schema, (f) => f.category === 1 && f.averageRating === -1),
    'Skill must have { category: 1, averageRating: -1 } index'
  );
  assert.ok(
    hasIndexMatching(Skill.schema, (f) => f.creator === 1),
    'Skill must have { creator: 1 } index'
  );
});

test('Purchase, CourseDoubtSession, and CourseVideo schemas contain required performance indexes', () => {
  assert.ok(
    hasIndexMatching(Purchase.schema, (f, opt) => f.student === 1 && f.course === 1 && opt.unique === true),
    'Purchase must have unique { student: 1, course: 1 } index'
  );
  assert.ok(
    hasIndexMatching(CourseDoubtSession.schema, (f) => f.course === 1 && f.student === 1 && f.status === 1),
    'CourseDoubtSession must have { course: 1, student: 1, status: 1 } index'
  );
  assert.ok(
    hasIndexMatching(CourseVideo.schema, (f) => f.course === 1 && f.order === 1 && f.createdAt === 1),
    'CourseVideo must have { course: 1, order: 1, createdAt: 1 } index'
  );
});
