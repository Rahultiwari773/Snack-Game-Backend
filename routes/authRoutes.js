const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendOTPEmail, sendCredentialsEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_neon_snake_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register User (Generates 6-Digit OTP & Sends Verification Email)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (!userExists.isVerified) {
        // User exists but unverified: regenerate OTP and resend
        const otp = generateOTP();
        userExists.verificationOTP = otp;
        userExists.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await userExists.save();

        const devOTP = !process.env.GMAIL_USER ? otp : undefined;
        await sendOTPEmail(userExists.email, userExists.name, otp);
        return res.status(200).json({
          message: 'Account registered previously but unverified. Sent fresh 6-digit OTP to your email.',
          email: userExists.email,
          requiresVerification: true,
          devOTP,
        });
      }
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationOTP: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    if (user) {
      // Send OTP Email
      await sendOTPEmail(user.email, user.name, otp);

      const devOTP = !process.env.GMAIL_USER ? otp : undefined;
      res.status(201).json({
        message: 'Registration successful! Please check your email for the 6-digit verification OTP.',
        email: user.email,
        requiresVerification: true,
        devOTP,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify 6-Digit OTP & Activate Account
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and 6-digit OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. You can login now!' });
    }

    if (user.verificationOTP !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid 6-digit OTP code' });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new OTP.' });
    }

    // Mark as verified & clear OTP
    user.isVerified = true;
    user.verificationOTP = null;
    user.otpExpiresAt = null;
    await user.save();

    // Send confirmation email
    await sendCredentialsEmail(user.email, user.name);

    res.json({
      message: 'Email verified successfully! Welcome to Neon Snake 3D.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        highScore: user.highScore,
        coins: user.coins,
        unlockedThemes: user.unlockedThemes,
        dailyStreak: user.dailyStreak,
        lastDailyClaim: user.lastDailyClaim,
        activeTheme: user.activeTheme,
        isVerified: true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resend OTP Code
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const otp = generateOTP();
    user.verificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const devOTP = !process.env.GMAIL_USER ? otp : undefined;
    await sendOTPEmail(user.email, user.name, otp);

    res.json({ message: 'Fresh 6-digit OTP code sent to your email!', devOTP });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login User (Enforces Verified Check)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified) {
        // Generate new OTP and prompt to verify
        const otp = generateOTP();
        user.verificationOTP = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const devOTP = !process.env.GMAIL_USER ? otp : undefined;
        await sendOTPEmail(user.email, user.name, otp);

        return res.status(403).json({
          message: 'Your email address is not verified yet. We sent a 6-digit OTP to your email!',
          requiresVerification: true,
          email: user.email,
          devOTP,
        });
      }

      res.json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          highScore: user.highScore,
          coins: user.coins,
          unlockedThemes: user.unlockedThemes,
          dailyStreak: user.dailyStreak,
          lastDailyClaim: user.lastDailyClaim,
          activeTheme: user.activeTheme,
          isVerified: true,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Current User Profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        highScore: user.highScore,
        coins: user.coins,
        unlockedThemes: user.unlockedThemes,
        dailyStreak: user.dailyStreak,
        lastDailyClaim: user.lastDailyClaim,
        activeTheme: user.activeTheme,
        isVerified: user.isVerified,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
