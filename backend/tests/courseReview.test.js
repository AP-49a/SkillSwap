const test = require('node:test');
const assert = require('node:assert/strict');
const CourseReview = require('../models/CourseReview');
const Course = require('../models/Course');

const courseId  = '507f1f77bcf86cd799439011';
const studentId = '507f1f77bcf86cd799439012';
const teacherId = '507f1f77bcf86cd799439013';

// ---------------------------------------------------------------------------
// 1. Schema loads
// ---------------------------------------------------------------------------
test('CourseReview model loads without error', () => {
  assert.ok(CourseReview, 'CourseReview export is truthy');
  assert.ok(CourseReview.schema, 'CourseReview has a Mongoose schema');
});

// ---------------------------------------------------------------------------
// 2–3. Rating range validation
// ---------------------------------------------------------------------------
test('Rating validation accepts integers 1 through 5', () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    const review = new CourseReview({ student: studentId, course: courseId, teacher: teacherId, rating, comment: 'ok' });
    const err = review.validateSync();
    assert.equal(err?.errors?.rating, undefined, `rating ${rating} should be valid`);
  }
});

test('Rating validation rejects values below 1', () => {
  const review = new CourseReview({ student: studentId, course: courseId, teacher: teacherId, rating: 0, comment: 'ok' });
  const err = review.validateSync();
  assert.ok(err?.errors?.rating, 'rating 0 should fail validation');
});

test('Rating validation rejects values above 5', () => {
  const review = new CourseReview({ student: studentId, course: courseId, teacher: teacherId, rating: 6, comment: 'ok' });
  const err = review.validateSync();
  assert.ok(err?.errors?.rating, 'rating 6 should fail validation');
});

test('Rating validation rejects non-integer (e.g. 3.5)', () => {
  const review = new CourseReview({ student: studentId, course: courseId, teacher: teacherId, rating: 3.5, comment: 'ok' });
  const err = review.validateSync();
  assert.ok(err?.errors?.rating, 'rating 3.5 should fail the integer validator');
});

// ---------------------------------------------------------------------------
// 5. Required fields
// ---------------------------------------------------------------------------
test('CourseReview enforces required fields', () => {
  const err = new CourseReview({}).validateSync();
  assert.ok(err?.errors?.student,  'student is required');
  assert.ok(err?.errors?.course,   'course is required');
  assert.ok(err?.errors?.teacher,  'teacher is required');
  assert.ok(err?.errors?.rating,   'rating is required');
  assert.ok(err?.errors?.comment,  'comment is required');
});

// ---------------------------------------------------------------------------
// 6. Unique compound index is declared on the schema
// ---------------------------------------------------------------------------
test('CourseReview schema declares a unique compound index on {student, course}', () => {
  const indexes = CourseReview.schema.indexes();
  const hasIndex = indexes.some(([fields, opts]) =>
    fields.student === 1 && fields.course === 1 && opts.unique === true
  );
  assert.ok(hasIndex, '{student:1, course:1} unique index must be declared');
});

// ---------------------------------------------------------------------------
// 7. Course aggregate field defaults
// ---------------------------------------------------------------------------
test('Course schema exposes averageRating defaulting to 0', () => {
  const course = new Course({
    title: 'Test',
    description: 'Desc',
    category: 'Tech',
    teacher: teacherId,
    credits: 5,
  });
  assert.equal(course.averageRating, 0, 'averageRating default is 0');
});

test('Course schema exposes reviewsCount defaulting to 0', () => {
  const course = new Course({
    title: 'Test',
    description: 'Desc',
    category: 'Tech',
    teacher: teacherId,
    credits: 5,
  });
  assert.equal(course.reviewsCount, 0, 'reviewsCount default is 0');
});
