const mongoose = require('mongoose');

const contestParticipantSchema = new mongoose.Schema(
  {
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Per-problem scoring breakdown
    scores: [
      {
        problemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        pointsAwarded: { type: Number, default: 0 },
        submittedAt: { type: Date, default: null },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      },
    ],
    totalScore: { type: Number, default: 0, index: true },
    joinedAt: { type: Date, default: Date.now },
    lastSubmissionAt: { type: Date, default: null },
    // Anti-cheat / validations
    submissionsCount: { type: Number, default: 0 },
    disqualified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contestParticipantSchema.index({ contestId: 1, totalScore: -1 });
contestParticipantSchema.index({ contestId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ContestParticipant', contestParticipantSchema);


