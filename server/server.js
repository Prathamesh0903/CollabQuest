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
const leaderboardRoutes = require('./routes/leaderboards');
const battleRoutes = require('./routes/battle');
const messageRoutes = require('./routes/messages');
const fileRoutes = require('./routes/files');
const collaborativeSessionRoutes = require('./routes/collaborativeSessions');
const codeExecutionRoutes = require('./routes/codeExecution');
const codeExecutionPluginRoutes = require('./routes/codeExecutionPlugin');
const dsaRoutes = require('./routes/dsa');

const { socketAuth } = require('./middleware/auth');
const { handleSocketConnection } = require('./utils/socketHandler');

const app = express();
const server = createServer(app);

// CORS configuration
const allowedOrigins = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [])
  .map((o) => o.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push(
    "http://localhost:3000",
    "https://collab-quest-lmws4f0eh-prathamesh-pawars-projects-de2689ea.vercel.app"
  );
}

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available to routes via app
app.set('io', io);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/collaborative-sessions', collaborativeSessionRoutes);
app.use('/api/execute', codeExecutionRoutes);
app.use('/api/execute/plugin', codeExecutionPluginRoutes);
app.use('/api/dsa', dsaRoutes);

// Test utilities (only in development)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  const testUtilsRoutes = require('./routes/test-utils');
  app.use('/api/test', testUtilsRoutes);
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const { checkExecutorHealth } = require('./utils/codeExecutor');
  
  try {
    const executorHealth = await checkExecutorHealth();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        executor: executorHealth.local ? 'healthy' : 'unhealthy',
        executorDetails: executorHealth
      }
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        executor: 'error',
        executorDetails: { error: error.message }
      }
    });
  }
});

// Socket.io middleware
io.use(socketAuth);

// Socket.io connection handling
io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection (tolerate missing DB in development)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      
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
} else {
  console.warn('MONGODB_URI not set. Running without database. Some features may be disabled.');
  
  // Initialize room state manager even without database
  const roomStateManager = require('./utils/roomStateManager');
  roomStateManager.initialize().catch(console.error);
}

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 