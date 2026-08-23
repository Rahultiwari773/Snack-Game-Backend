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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Neon Snake Backend API is running' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snake_game_db';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('⚡ Connected to MongoDB successfully!');
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.warn('⚠️ MongoDB connection error:', err.message);
    console.log('Starting Express server in standalone mode...');
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT} (offline mode)`);
    });
  });
