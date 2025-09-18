const mongoose = require('mongoose');

const BattleSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true },
  name: { type: String, required: true, maxlength: 50 },
  host: { type: String, required: true },
  maxParticipants: { type: Number, default: 4, min: 2, max: 8 },
  // Minimal participants array to support canJoin/canStart helpers
  participants: { type: [String], default: [] },
  state: {
    type: String,
    enum: ['waiting', 'lobby', 'countdown', 'active', 'ended'],
    default: 'waiting'
  },
  settings: {
    countdown: { type: Number, default: 10, min: 5, max: 15 },
    duration: { type: Number, default: 300, min: 60, max: 600 },
    problem: {
      id: String,
      title: String,
      description: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      functionSignature: String,
      examples: [{ input: String, output: String }],
      testCases: [{ input: String, expected: String, hidden: Boolean }]
    }
  },
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date
});

BattleSessionSchema.methods.canJoin = function() {
  return this.state === 'waiting' && this.participants.length < this.maxParticipants;
};

BattleSessionSchema.methods.canStart = function() {
  return this.state === 'lobby' && this.participants.length >= 2;
};

module.exports = mongoose.model('BattleSession', BattleSessionSchema);


