const test = require('node:test');
const assert = require('node:assert/strict');
const errorHandler = require('../middleware/error');

// Helper to create mock response object
const createMockRes = () => {
  const res = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

// ---------------------------------------------------------------------------
// 1. Mongoose Error Mapping
// ---------------------------------------------------------------------------
test('errorHandler handles Mongoose CastError with 404', () => {
  const err = new Error('Cast to ObjectId failed');
  err.name = 'CastError';
  err.value = 'invalid_id_123';

  const res = createMockRes();
  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.message, 'Resource not found with id of invalid_id_123');
});

test('errorHandler handles Mongoose ValidationError with 400 and joins messages', () => {
  const err = new Error('Validation failed');
  err.name = 'ValidationError';
  err.errors = {
    title: { message: 'Title is required' },
    credits: { message: 'Credits must be at least 1' },
  };

  const res = createMockRes();
  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.message, 'Title is required, Credits must be at least 1');
});

test('errorHandler handles Mongoose duplicate key error 11000 with 400', () => {
  const err = new Error('Duplicate key');
  err.code = 11000;
  err.keyValue = { email: 'test@example.com' };

  const res = createMockRes();
  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.success, false);
  assert.match(res.body?.message, /Duplicate value entered for 'email'/);
});

// ---------------------------------------------------------------------------
// 2. Multer Upload Error Mapping
// ---------------------------------------------------------------------------
test('errorHandler handles Multer LIMIT_FILE_SIZE with 413 Payload Too Large', () => {
  const err = new Error('File too large');
  err.name = 'MulterError';
  err.code = 'LIMIT_FILE_SIZE';

  const res = createMockRes();
  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 413);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.message, 'File size exceeds the allowed limit.');
});

test('errorHandler handles general Multer errors with 400', () => {
  const err = new Error('Unexpected field');
  err.name = 'MulterError';

  const res = createMockRes();
  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.success, false);
  assert.match(res.body?.message, /File upload error/);
});

// ---------------------------------------------------------------------------
// 3. JWT Error Mapping
// ---------------------------------------------------------------------------
test('errorHandler handles JsonWebTokenError and TokenExpiredError with 401', () => {
  const jwtErr = new Error('invalid token');
  jwtErr.name = 'JsonWebTokenError';

  let res = createMockRes();
  errorHandler(jwtErr, {}, res, () => {});
  assert.equal(res.statusCode, 401);
  assert.equal(res.body?.message, 'Invalid or expired authentication token');

  const expErr = new Error('jwt expired');
  expErr.name = 'TokenExpiredError';

  res = createMockRes();
  errorHandler(expErr, {}, res, () => {});
  assert.equal(res.statusCode, 401);
  assert.equal(res.body?.message, 'Invalid or expired authentication token');
});

// ---------------------------------------------------------------------------
// 4. Production Sanitization
// ---------------------------------------------------------------------------
test('errorHandler sanitizes 500 error messages in production environment', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const internalErr = new Error('Sensitive DB connection stack trace string');
    const res = createMockRes();
    errorHandler(internalErr, {}, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body?.success, false);
    assert.equal(res.body?.message, 'Internal Server Error');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});
