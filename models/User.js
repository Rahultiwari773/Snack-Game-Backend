const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    highScore: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 100,
    },
    unlockedThemes: {
      type: [String],
      default: ['cyberpunk', 'neon'],
    },
    dailyStreak: {
      type: Number,
      default: 0,
    },
    lastDailyClaim: {
      type: Date,
      default: null,
    },
    activeTheme: {
      type: String,
      default: 'cyberpunk',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
