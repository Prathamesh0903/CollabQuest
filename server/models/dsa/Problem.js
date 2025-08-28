const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  description: { type: String, default: '' }
});

const dsaProblemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'DSACategory', required: true, index: true },
  tags: [{ type: String, trim: true, index: true }],
  acceptanceRate: { type: Number, default: 0, min: 0, max: 100 },
  testCases: { type: [testCaseSchema], default: [] },
  solution: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

dsaProblemSchema.virtual('problem_id').get(function() { return this._id; });

// Indexes
dsaProblemSchema.index({ title: 1 }, { unique: true });
dsaProblemSchema.index({ tags: 1 });

module.exports = mongoose.model('DSAProblem', dsaProblemSchema);


