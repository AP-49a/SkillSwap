const jwt = require('jsonwebtoken');
const config = require('./env');

const getCookieOptions = (req = {}) => {
  const origin = (req.headers && req.headers.origin) || '';
  const isHttps = req.secure || origin.startsWith('https://') || req.headers?.['x-forwarded-proto'] === 'https';
  const isLocalhost = /localhost|127\.0\.0\.1/.test(origin) || !origin;

  return {
    httpOnly: true,
    secure: isHttps && !isLocalhost,
    sameSite: isHttps && !isLocalhost ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

const generateToken = (res, userId, req = {}) => {
  const token = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '30d',
  });

  res.cookie('token', token, getCookieOptions(req));

  return token;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
