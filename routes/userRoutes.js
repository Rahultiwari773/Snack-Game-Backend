const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScoreHistory = require('../models/ScoreHistory');
const { protect } = require('../middleware/authMiddleware');

// Sync Game Data to MongoDB
router.post('/sync-game-data', protect, async (req, res) => {
  try {
    const { highScore, coins, unlockedThemes, activeTheme, dailyStreak, lastDailyClaim } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (typeof highScore === 'number' && highScore > user.highScore) {
      user.highScore = highScore;
    }
    if (typeof coins === 'number') {
      user.coins = coins;
    }
    if (Array.isArray(unlockedThemes)) {
      user.unlockedThemes = Array.from(new Set([...user.unlockedThemes, ...unlockedThemes]));
    }
    if (activeTheme) {
      user.activeTheme = activeTheme;
    }
    if (typeof dailyStreak === 'number') {
      user.dailyStreak = dailyStreak;
    }
    if (lastDailyClaim) {
      user.lastDailyClaim = lastDailyClaim;
    }

    await user.save();

    res.json({
      message: 'Game data synced successfully',
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record Game Score History
router.post('/record-score', protect, async (req, res) => {
  try {
    const { score, gameMode, difficulty, theme } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const history = await ScoreHistory.create({
      user: user._id,
      playerName: user.name,
      score,
      gameMode: gameMode || 'snake',
      difficulty: difficulty || 'medium',
      theme: theme || 'cyberpunk',
    });

    if (score > user.highScore) {
      user.highScore = score;
      await user.save();
    }

    res.status(201).json({ message: 'Score recorded', history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Global MongoDB Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({})
      .select('name highScore activeTheme createdAt')
      .sort({ highScore: -1 })
      .limit(25);

    const leaderboard = topUsers.map((u, idx) => ({
      id: u._id.toString(),
      name: u.name,
      score: u.highScore,
      date: u.createdAt ? u.createdAt.toISOString().split('T')[0] : '2026-08-02',
      theme: u.activeTheme || 'cyberpunk',
      difficulty: 'medium',
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
