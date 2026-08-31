const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Disable Mongoose command buffering so queries fail immediately if DB is disconnected,
// instead of timing out after 10,000ms.
mongoose.set('bufferCommands', false);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to check database connection status before hitting any DB-dependent routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/user')) {
    if (mongoose.connection.readyState !== 1) {
      const stateMap = { 0: 'disconnected', 2: 'connecting', 3: 'disconnecting' };
      const dbState = stateMap[mongoose.connection.readyState] || 'offline';
      return res.status(503).json({
        status: 'Database Offline',
        dbState,
        message: 'Database connection is currently offline or connecting. If deployed on Render, please ensure MONGODB_URI (e.g. MongoDB Atlas) is set in Render Environment Variables and IP whitelist allows access (0.0.0.0/0).',
      });
    }
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Welcome to Neon Snake 3D & Saanp Sidi Backend API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
    },
  });
});

// Ignore favicon requests gracefully
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'OK',
    message: 'Neon Snake Backend API is running',
    dbState: states[readyState] || 'unknown',
    dbConnected: readyState === 1,
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snake_game_db';

// MongoDB lifecycle listeners
mongoose.connection.on('connected', () => {
  console.log('⚡ Connected to MongoDB successfully!');
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection disconnected.');
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .catch((err) => {
    console.warn('⚠️ Initial MongoDB connection error:', err.message);
    console.log('Server is running, but database calls will respond with 503 until connection is restored.');
  });

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});


