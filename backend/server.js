const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables from the backend directory regardless of where this file is launched from.
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to Database
connectDB();

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const { verifyToken } = require('./config/jwt');

app.set('trust proxy', 1);

const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const onlineUsers = new Map();
app.locals.io = io;

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers?.cookie || '';
    const tokenFromCookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('token='));
    const token = socket.handshake.auth?.token || (tokenFromCookie ? tokenFromCookie.split('=')[1] : null);
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = { id: user._id.toString(), username: user.username, avatar: user.profile?.avatar || '/uploads/default-avatar.png' };
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  onlineUsers.set(userId, { socketId: socket.id, lastSeen: new Date() });
  socket.broadcast.emit('user_online', { userId, online: true });
  socket.emit('user_online_status', { userId, online: true });

  socket.on('join_conversation', (conversationId) => {
    if (!conversationId) return;
    socket.join(conversationId);
  });

  socket.on('leave_conversation', (conversationId) => {
    if (!conversationId) return;
    socket.leave(conversationId);
  });

  socket.on('send_message', async ({ conversationId, content }) => {
    try {
      if (!conversationId || !content || !content.trim()) {
        socket.emit('message_error', { message: 'Message cannot be empty' });
        return;
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('message_error', { message: 'Conversation not found' });
        return;
      }

      const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);
      if (!isParticipant) {
        socket.emit('message_error', { message: 'Unauthorized conversation' });
        return;
      }

      const receiverId = conversation.participants.find((participant) => participant.toString() !== userId);
      const message = await Message.create({
        conversationId,
        senderId: userId,
        receiverId,
        content: content.trim().slice(0, 2000),
        read: false,
      });

      conversation.lastMessage = message.content;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populated = await Message.findById(message._id)
        .populate('senderId', 'username profile.avatar')
        .populate('receiverId', 'username profile.avatar');

      io.to(conversationId).emit('receive_message', { conversationId, message: populated });
      socket.emit('message_sent', { conversationId, message: populated });
    } catch (error) {
      socket.emit('message_error', { message: 'Failed to send message. Please try again.' });
    }
  });

  socket.on('message_read', async ({ conversationId, messageIds = [] }) => {
    try {
      if (!conversationId) return;
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: userId,
          read: false,
        },
        { $set: { read: true, readAt: new Date() } }
      );

      io.to(conversationId).emit('message_read_ack', { userId, conversationId, messageIds });
    } catch (error) {
      socket.emit('message_error', { message: 'Could not update read status' });
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    socket.broadcast.emit('user_offline', { userId, online: false, lastSeen: new Date() });
  });
});

// Security Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
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
        imgSrc: ["'self'", "data:", "blob:"],
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
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Serve upload files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Prefer the React build while keeping the legacy frontend available as a fallback.
const reactDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(reactDist));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Handle 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.originalUrl}` });
});

// Serve frontend 404 for all other unmatched routes (SPA fallback)
app.use((req, res) => {
  const reactEntry = path.join(reactDist, 'index.html');
  if (fs.existsSync(reactEntry)) {
    return res.sendFile(reactEntry);
  }
  res.status(404).sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
});

// Global Error Handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`\n❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
