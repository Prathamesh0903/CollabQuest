const mongoose = require('mongoose');

const ReplayEventSchema = new mongoose.Schema(
  {
    t: { type: Number, required: true },
    type: { type: String, required: true },
    userId: String,
    username: String,
    payload: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const BattleReplaySchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  name: String,
  host: String,
  startedAt: Date,
  endedAt: Date,
  durationMs: Number,
  metadata: {
    problemId: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    participants: [{ userId: String, username: String, avatar: String }]
  },
  timeline: { type: [ReplayEventSchema], default: [] }
});

BattleReplaySchema.index({ startedAt: -1 });

module.exports = mongoose.model('BattleReplay', BattleReplaySchema);


