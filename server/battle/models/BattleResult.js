const mongoose = require('mongoose');

const RankingEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    avatar: String,
    rank: { type: Number, required: true },
    score: { type: Number, required: true, default: 0 },
    testsPassed: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    timeMs: { type: Number, default: 0 },
    penalties: { type: Number, default: 0 },
    isWinner: { type: Boolean, default: false }
  },
  { _id: false }
);

const BattleStatisticsSchema = new mongoose.Schema(
  {
    participants: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    medianScore: { type: Number, default: 0 },
    averageTimeMs: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    passedSubmissions: { type: Number, default: 0 },
    problemDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
  },
  { _id: false }
);

const BattleResultSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  name: { type: String },
  host: { type: String },
  finalizedAt: { type: Date, default: Date.now },
  rankings: { type: [RankingEntrySchema], default: [] },
  statistics: { type: BattleStatisticsSchema, default: {} },
  problem: {
    id: String,
    title: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    functionSignature: String
  }
});

BattleResultSchema.index({ finalizedAt: -1 });

module.exports = mongoose.model('BattleResult', BattleResultSchema);


