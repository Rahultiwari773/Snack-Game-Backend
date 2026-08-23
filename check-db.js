const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snake_game_db';
const User = require('./models/User');
const ScoreHistory = require('./models/ScoreHistory');

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    const users = await User.find({}).sort({ createdAt: -1 });
    console.log(`📊 TOTAL USERS IN DATABASE: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users found in database yet.');
    } else {
      console.table(
        users.map((u) => ({
          ID: u._id.toString().slice(-6),
          Name: u.name,
          Email: u.email,
          Verified: u.isVerified ? '✅ YES' : '❌ NO',
          OTP: u.verificationOTP || 'N/A',
          HighScore: u.highScore,
          Coins: u.coins,
          ActiveTheme: u.activeTheme,
          RegisteredAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
        }))
      );
    }

    const scores = await ScoreHistory.find({}).sort({ score: -1 }).limit(10);
    console.log(`\n🏆 TOP 10 HIGH SCORES RECORDED: ${scores.length}\n`);
    if (scores.length > 0) {
      console.table(
        scores.map((s) => ({
          Player: s.playerName,
          Score: s.score,
          Mode: s.gameMode,
          Difficulty: s.difficulty,
          Date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
        }))
      );
    }
  } catch (err) {
    console.error('❌ Error checking database:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    process.exit(0);
  }
}

checkDatabase();
