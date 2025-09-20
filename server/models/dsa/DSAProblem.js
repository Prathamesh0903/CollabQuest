const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  description: { type: String, default: '' }
});

const dsaProblemSchema = new mongoose.Schema({
  problemNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'DSACategory', required: true },
  tags: [{ type: String, trim: true }],
  acceptanceRate: { type: Number, default: 0, min: 0, max: 100 },
  testCases: { type: [testCaseSchema], default: [] },
  starterCode: {
    python: { type: String, default: '' },
    javascript: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' }
  },
  functionName: {
    python: { type: String, default: '' },
    javascript: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' }
  },
  solution: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

dsaProblemSchema.virtual('problem_id').get(function() { return this._id; });

// Indexes
dsaProblemSchema.index({ title: 1 }, { unique: true });
dsaProblemSchema.index({ tags: 1 });

module.exports = mongoose.model('DSAProblem', dsaProblemSchema);


