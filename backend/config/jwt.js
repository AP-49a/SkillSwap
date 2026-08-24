const jwt = require('jsonwebtoken');

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
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecretjwtkey12345!@#', {
    expiresIn: '30d',
  });

  res.cookie('token', token, getCookieOptions(req));

  return token;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey12345!@#');
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
