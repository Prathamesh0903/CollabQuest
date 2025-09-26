const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    // UTC timestamps for scheduling
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    // Problems can reference existing DSA problems or quizzes by id and type
    problems: [
      {
        problemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        problemType: {
          type: String,
          enum: ['dsa', 'quiz', 'custom'],
          required: true,
        },
        points: { type: Number, default: 100, min: 0 },
      },
    ],
    visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
    maxParticipants: { type: Number, default: 0 }, // 0 = unlimited
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    // Caching aggregate scores for quick leaderboard reads
    leaderboardLastComputedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

contestSchema.index({ startTime: -1 });
contestSchema.index({ endTime: -1 });
contestSchema.index({ isArchived: 1, visibility: 1, startTime: -1 });

contestSchema.methods.isLive = function () {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
};

contestSchema.methods.hasEnded = function () {
  const now = new Date();
  return now > this.endTime;
};

module.exports = mongoose.model('Contest', contestSchema);


