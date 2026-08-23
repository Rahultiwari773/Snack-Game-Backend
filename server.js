const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
  res.json({ status: 'OK', message: 'Neon Snake Backend API is running' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snake_game_db';

let isDbConnected = false;

// Middleware to check database connection status
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/user')) {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database connection offline. Please configure a valid cloud MONGODB_URI (e.g. MongoDB Atlas) in Render Environment Variables.',
      });
    }
  }
  next();
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    isDbConnected = true;
    console.log('⚡ Connected to MongoDB successfully!');
  })
  .catch((err) => {
    isDbConnected = false;
    console.warn('⚠️ MongoDB connection error:', err.message);
    console.log('Starting Express server in standalone mode...');
  });

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

