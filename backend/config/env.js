const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded from the backend root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const requiredVars = ['JWT_SECRET', 'MONGO_URI'];

function validateEnv() {
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName] || !process.env[varName].trim()) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const message = `[FATAL] Missing required environment variables: ${missing.join(', ')}. Please configure them in backend/.env before starting the server.`;
    console.error(message);
    throw new Error(message);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    console.warn(`[WARN] JWT_SECRET is relatively short (${process.env.JWT_SECRET.length} chars). Consider using a cryptographically strong secret of 32+ chars.`);
  }
}

// Run validation immediately upon importing config
validateEnv();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGO_URI,
  enableCustomDns: process.env.ENABLE_CUSTOM_DNS === 'true',
  frontendOrigins: (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

module.exports = config;
