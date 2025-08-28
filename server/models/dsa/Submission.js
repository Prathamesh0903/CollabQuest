const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DSAUser', required: true, index: true },
  problem_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DSAProblem', required: true, index: true },
  code: { type: String, required: true },
  language: { type: String, required: true, enum: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'] },
  status: { type: String, required: true, enum: ['pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'], default: 'pending', index: true },
  score: { type: Number, default: 0, min: 0, max: 100 },
  executionTime: { type: Number, default: 0 },
  memoryUsage: { type: Number, default: 0 },
  submitted_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: 'updated_at' }
});

submissionSchema.virtual('submission_id').get(function() { return this._id; });

submissionSchema.index({ user_id: 1, problem_id: 1, submitted_at: -1 });

module.exports = mongoose.model('DSASubmission', submissionSchema);


