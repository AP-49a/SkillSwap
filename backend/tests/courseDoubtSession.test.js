const test = require('node:test');
const assert = require('node:assert/strict');
const CourseDoubtSession = require('../models/CourseDoubtSession');

const courseId = '507f1f77bcf86cd799439011';
const studentId = '507f1f77bcf86cd799439012';
const teacherId = '507f1f77bcf86cd799439013';

// 1. Model loads
test('CourseDoubtSession model loads without error', () => {
  assert.ok(CourseDoubtSession, 'CourseDoubtSession export is truthy');
  assert.ok(CourseDoubtSession.schema, 'CourseDoubtSession has a Mongoose schema');
});

// 2. Required fields
test('CourseDoubtSession enforces required fields', () => {
  const err = new CourseDoubtSession({}).validateSync();
  assert.ok(err?.errors?.course, 'course is required');
  assert.ok(err?.errors?.student, 'student is required');
  assert.ok(err?.errors?.teacher, 'teacher is required');
  assert.ok(err?.errors?.message, 'message is required');
});

// 3. Default status is pending
test('CourseDoubtSession defaults status to pending', () => {
  const session = new CourseDoubtSession({
    course: courseId,
    student: studentId,
    teacher: teacherId,
    message: 'Need clarification on module 2',
  });
  assert.equal(session.status, 'pending');
});

// 4. Default meetingLink is empty
test('CourseDoubtSession defaults meetingLink to empty string', () => {
  const session = new CourseDoubtSession({
    course: courseId,
    student: studentId,
    teacher: teacherId,
    message: 'Need clarification on module 2',
  });
  assert.equal(session.meetingLink, '');
});

// 5. Valid status values
test('CourseDoubtSession accepts all valid statuses', () => {
  const validStatuses = ['pending', 'accepted', 'cancelled', 'completed'];
  for (const status of validStatuses) {
    const session = new CourseDoubtSession({
      course: courseId,
      student: studentId,
      teacher: teacherId,
      message: 'Need help with async await',
      status,
    });
    const err = session.validateSync();
    assert.equal(err?.errors?.status, undefined, `status '${status}' should be valid`);
  }
});

// 6. Invalid status rejected
test('CourseDoubtSession rejects invalid status values', () => {
  const invalidStatuses = ['in_progress', 'rejected', 'open', 'approved'];
  for (const status of invalidStatuses) {
    const session = new CourseDoubtSession({
      course: courseId,
      student: studentId,
      teacher: teacherId,
      message: 'Need help',
      status,
    });
    const err = session.validateSync();
    assert.ok(err?.errors?.status, `status '${status}' should fail enum validation`);
  }
});

// 7. Message length validation
test('CourseDoubtSession rejects message longer than 500 characters', () => {
  const longMessage = 'a'.repeat(501);
  const session = new CourseDoubtSession({
    course: courseId,
    student: studentId,
    teacher: teacherId,
    message: longMessage,
  });
  const err = session.validateSync();
  assert.ok(err?.errors?.message, 'Message longer than 500 characters should fail validation');
});

test('CourseDoubtSession accepts message up to 500 characters', () => {
  const validMessage = 'a'.repeat(500);
  const session = new CourseDoubtSession({
    course: courseId,
    student: studentId,
    teacher: teacherId,
    message: validMessage,
  });
  const err = session.validateSync();
  assert.equal(err?.errors?.message, undefined, 'Message of 500 characters should be valid');
});

// 8. Meeting link field exists and accepts strings
test('CourseDoubtSession stores meetingLink correctly', () => {
  const session = new CourseDoubtSession({
    course: courseId,
    student: studentId,
    teacher: teacherId,
    message: 'Help needed',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  });
  assert.equal(session.meetingLink, 'https://meet.google.com/abc-defg-hij');
});

// 9. Course/student/teacher references exist
test('CourseDoubtSession schema contains correct ref types for course, student, teacher', () => {
  const schema = CourseDoubtSession.schema;
  assert.equal(schema.path('course').options.ref, 'Course');
  assert.equal(schema.path('student').options.ref, 'User');
  assert.equal(schema.path('teacher').options.ref, 'User');
});

// 10. Relevant index exists
test('CourseDoubtSession schema contains indexing for queries', () => {
  const indexes = CourseDoubtSession.schema.indexes();
  const hasCourseStudentStatusIndex = indexes.some(([fields]) =>
    fields.course === 1 && fields.student === 1 && fields.status === 1
  );
  assert.ok(hasCourseStudentStatusIndex, 'Compound index on {course: 1, student: 1, status: 1} must exist');
});

// 11. Wallet/Credit safety - verify model has no credit fields
test('CourseDoubtSession schema does not contain credit or wallet fields', () => {
  const schema = CourseDoubtSession.schema;
  assert.equal(schema.path('credits'), undefined, 'credits field must not exist');
  assert.equal(schema.path('creditCost'), undefined, 'creditCost field must not exist');
  assert.equal(schema.path('wallet'), undefined, 'wallet field must not exist');
  assert.equal(schema.path('xp'), undefined, 'xp field must not exist');
});
