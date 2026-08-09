const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecretjwtkey12345!@#', {
    expiresIn: '30d',
  });

  // Set JWT as HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

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
