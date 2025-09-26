const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const roomRoutes = require('./routes/rooms');
const quizRoutes = require('./routes/quizzes');
const advancedQuizRoutes = require('./routes/quizzes-advanced');
const leaderboardRoutes = require('./routes/leaderboards');
const contestRoutes = require('./routes/contests');
const messageRoutes = require('./routes/messages');
const fileRoutes = require('./routes/files');
const collaborativeSessionRoutes = require('./routes/collaborativeSessions');
const codeExecutionRoutes = require('./routes/execute');
const codeExecutionPluginRoutes = require('./routes/execute-plugins');
const dsaRoutes = require('./routes/dsa');
const battleRoutes = require('./routes/battles');
const discussRoutes = require('./routes/discuss');

const { socketAuth } = require('./middleware/auth');
const { handleSocketConnection } = require('./utils/socketHandler');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { performanceMiddleware, healthCheck } = require('./middleware/performance');
const { databaseOptimizer } = require('./utils/databaseOptimization');

const app = express();
const server = createServer(app);

// CORS configuration
const allowedOrigins = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [])
  .map((o) => o.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push(
    "http://localhost:3000",
    "https://collab-quest.vercel.app",
    // Add your current frontend URL here
   // Replace with actual URL
  );
}

const corsOptions = {
  origin: function(origin, callback) {
    // For development - allow all origins (remove in production)
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Socket.io setup (disabled in test to avoid port usage)
let io = null;
if (process.env.NODE_ENV !== 'test') {
  io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      methods: ["GET", "POST"],
      credentials: true
    }
  });
}

// Make io available to routes via app
if (io) {
  app.set('io', io);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);
app.use(morgan('combined'));
app.use(performanceMiddleware); // Add performance monitoring
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/advanced-quizzes', advancedQuizRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/collaborative-sessions', collaborativeSessionRoutes);
app.use('/api/execute', codeExecutionRoutes);
app.use('/api/execute/plugin', codeExecutionPluginRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/discuss', discussRoutes);
// quick health for discuss router attachment
app.get('/api/discuss/ping', (req, res) => res.json({ ok: true }));

// Test utilities (only in development)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  const testUtilsRoutes = require('./routes/_test-utils');
  app.use('/api/test', testUtilsRoutes);
}

// Enhanced health check endpoint
app.get('/api/health', asyncHandler(healthCheck));

// Socket.io middleware
if (io) {
  io.use(socketAuth);
  io.on('connection', (socket) => {
    handleSocketConnection(socket, io);
    // Weekly contest room join/leave
    socket.on('contest:join', (contestId) => {
      if (!contestId) return;
      socket.join(`contest:${contestId}`);
    });
    socket.on('contest:leave', (contestId) => {
      if (!contestId) return;
      socket.leave(`contest:${contestId}`);
    });
  });

  // Discuss namespace allowing anonymous connections
  const discussNamespace = io.of('/discuss');
  discussNamespace.on('connection', (socket) => {
    const { threadId } = socket.handshake.query || {};
    if (threadId) {
      socket.join(`thread:${threadId}`);
    }
    socket.on('discuss:join', (tid) => {
      if (!tid) return;
      socket.join(`thread:${tid}`);
    });
    socket.on('discuss:leave', (tid) => {
      if (!tid) return;
      socket.leave(`thread:${tid}`);
    });
  });
}

// Enhanced error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection (skip in test; tolerate missing DB in development)
if (process.env.NODE_ENV !== 'test' && process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      
      // Create database indexes for optimization
      await databaseOptimizer.createIndexes();
      
      // Initialize room state manager after database connection
      const roomStateManager = require('./utils/roomStateManager');
      await roomStateManager.initialize();
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('Continuing without MongoDB in development mode. Some features may be disabled.');
        
        // Initialize room state manager even without database
        const roomStateManager = require('./utils/roomStateManager');
        roomStateManager.initialize().catch(console.error);
      }
    });
} else if (process.env.NODE_ENV !== 'test') {
  console.warn('MONGODB_URI not set. Running without database. Some features may be disabled.');
  
  // Initialize room state manager even without database
  const roomStateManager = require('./utils/roomStateManager');
  roomStateManager.initialize().catch(console.error);
}

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 

// Export app for testing with supertest
module.exports = app;