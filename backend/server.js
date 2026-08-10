const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
app.set('trust proxy', 1);

// Security Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

// Setup Helmet with relaxed CSP for inline scripts/styles
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "/uploads/"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Request parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check (before all other routes)
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/skills', require('./routes/skillRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Serve upload files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Handle 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.originalUrl}` });
});

// Serve frontend 404 for all other unmatched routes (SPA fallback)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
});

// Global Error Handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`\n❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
