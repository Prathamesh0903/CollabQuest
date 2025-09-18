const mongoose = require('mongoose');

const BattleParticipantSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  avatar: String,
  isHost: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: Date,
  finalSubmission: {
    code: String,
    submittedAt: Date,
    executionResult: {
      success: Boolean,
      output: String,
      error: String,
      executionTime: Number,
      testsPassed: Number,
      totalTests: Number
    }
  }
});

BattleParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('BattleParticipant', BattleParticipantSchema);


