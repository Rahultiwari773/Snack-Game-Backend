const mongoose = require('mongoose');

const scoreHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    gameMode: {
      type: String,
      default: 'snake',
    },
    difficulty: {
      type: String,
      default: 'medium',
    },
    theme: {
      type: String,
      default: 'cyberpunk',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScoreHistory', scoreHistorySchema);
