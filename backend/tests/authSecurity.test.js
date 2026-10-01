const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, verifyToken } = require('../config/jwt');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');
const config = require('../config/env');

const testUserId = '507f1f77bcf86cd799439011';

// ---------------------------------------------------------------------------
// 1. User Model Schema & Validation
// ---------------------------------------------------------------------------
test('User schema requires username, email, and password', () => {
  const user = new User({});
  const err = user.validateSync();
  assert.ok(err?.errors?.username, 'username is required');
  assert.ok(err?.errors?.email, 'email is required');
  assert.ok(err?.errors?.password, 'password is required');
});

test('User schema enforces minimum length for username and password', () => {
  const shortUser = new User({
    username: 'ab',
    email: 'test@example.com',
    password: '123',
  });
  const err = shortUser.validateSync();
  assert.ok(err?.errors?.username, 'username under 3 chars fails validation');
  assert.ok(err?.errors?.password, 'password under 6 chars fails validation');
});

test('User schema validates email format with regex', () => {
  const invalidEmailUser = new User({
    username: 'validuser',
    email: 'not-an-email',
    password: 'password123',
  });
  const err = invalidEmailUser.validateSync();
  assert.ok(err?.errors?.email, 'malformed email should fail validation');
});

test('User schema sets default role to user and provides default avatar', () => {
  const user = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });
  assert.equal(user.role, 'user', 'default role should be user');
  assert.equal(user.profile.avatar, '/uploads/default-avatar.png', 'default avatar set');
});

// ---------------------------------------------------------------------------
// 2. Password Hashing & Verification
// ---------------------------------------------------------------------------
test('User matchPassword compares plaintext with hashed password correctly', async () => {
  const plainPassword = 'SuperSecretPassword123!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  const user = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: hashedPassword,
  });

  const isMatch = await user.matchPassword(plainPassword);
  assert.equal(isMatch, true, 'correct password should match');

  const isWrongMatch = await user.matchPassword('WrongPassword123!');
  assert.equal(isWrongMatch, false, 'incorrect password should not match');
});

// ---------------------------------------------------------------------------
// 3. JWT Generation & Verification
// ---------------------------------------------------------------------------
test('generateToken signs valid JWT and sets httpOnly cookie on response', () => {
  let cookieName = '';
  let cookieVal = '';
  let cookieOpts = {};

  const mockRes = {
    cookie(name, val, opts) {
      cookieName = name;
      cookieVal = val;
      cookieOpts = opts;
    },
  };

  const token = generateToken(mockRes, testUserId, { headers: {} });
  assert.ok(token, 'token must be generated');
  assert.equal(cookieName, 'token', 'cookie name must be token');
  assert.equal(cookieVal, token, 'cookie value must match token');
  assert.equal(cookieOpts.httpOnly, true, 'cookie must be httpOnly');
  assert.equal(cookieOpts.path, '/', 'cookie path must be root');

  const decoded = jwt.verify(token, config.jwtSecret);
  assert.equal(decoded.id, testUserId, 'decoded token payload contains user id');
});

test('verifyToken returns decoded payload for valid token and null for invalid token', () => {
  const validToken = jwt.sign({ id: testUserId }, config.jwtSecret, { expiresIn: '1h' });
  const decoded = verifyToken(validToken);
  assert.equal(decoded?.id, testUserId, 'verifyToken decodes valid token');

  const invalidTokenResult = verifyToken('invalid.jwt.token');
  assert.equal(invalidTokenResult, null, 'verifyToken returns null on invalid token');
});

// ---------------------------------------------------------------------------
// 4. Protect & Authorize Middleware
// ---------------------------------------------------------------------------
test('protect middleware returns 401 if no token provided in cookies or header', async () => {
  const req = { cookies: {}, headers: {} };
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
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);
  assert.equal(statusCode, 401, 'status should be 401');
  assert.equal(jsonResponse?.success, false);
  assert.equal(nextCalled, false, 'next() should not be called');
});

test('protect middleware returns 401 for invalid token signature', async () => {
  const req = { cookies: { token: 'invalid-token-value' }, headers: {} };
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
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);
  assert.equal(statusCode, 401);
  assert.equal(jsonResponse?.success, false);
  assert.equal(nextCalled, false);
});

test('protect middleware returns 401 if token valid but user no longer in database', async () => {
  const validToken = jwt.sign({ id: testUserId }, config.jwtSecret, { expiresIn: '1h' });
  const req = { cookies: { token: validToken }, headers: {} };
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
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  // Stub User.findById
  const originalFindById = User.findById;
  User.findById = () => ({
    select: () => Promise.resolve(null),
  });

  try {
    await protect(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(jsonResponse?.message, 'User no longer exists');
    assert.equal(nextCalled, false);
  } finally {
    User.findById = originalFindById;
  }
});

test('protect middleware sets req.user and calls next() when token and user are valid', async () => {
  const validToken = jwt.sign({ id: testUserId }, config.jwtSecret, { expiresIn: '1h' });
  const req = {
    headers: { authorization: `Bearer ${validToken}` },
    cookies: {},
  };
  let statusCode = 0;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const mockUser = { _id: testUserId, username: 'testuser', role: 'user' };
  const originalFindById = User.findById;
  User.findById = (id) => ({
    select: () => Promise.resolve(id === testUserId ? mockUser : null),
  });

  try {
    await protect(req, res, next);
    assert.equal(nextCalled, true, 'next() should be called');
    assert.equal(req.user, mockUser, 'req.user should be populated');
  } finally {
    User.findById = originalFindById;
  }
});

test('authorize middleware allows permitted roles and blocks forbidden roles', () => {
  const adminMiddleware = authorize('admin');

  // User with 'user' role
  const userReq = { user: { role: 'user' } };
  let statusCode = 0;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  let nextCalled = false;
  adminMiddleware(userReq, res, () => { nextCalled = true; });
  assert.equal(statusCode, 403, 'user role should be blocked from admin route');
  assert.equal(nextCalled, false);

  // User with 'admin' role
  statusCode = 0;
  nextCalled = false;
  const adminReq = { user: { role: 'admin' } };
  adminMiddleware(adminReq, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true, 'admin role should pass authorization');
});

// ---------------------------------------------------------------------------
// 5. Rate Limiter Configuration
// ---------------------------------------------------------------------------
test('authLimiter and apiLimiter are configured as middleware functions', () => {
  assert.equal(typeof authLimiter, 'function', 'authLimiter is an express middleware function');
  assert.equal(typeof apiLimiter, 'function', 'apiLimiter is an express middleware function');
});
