const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  description: String
});

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Dynamic Programming', 'Graphs', 'Math', 'Greedy', 'Backtracking', 'Binary Search', 'Two Pointers', 'Sliding Window', 'Stack', 'Queue', 'Heap', 'Hash Table', 'Sorting', 'Recursion', 'Bit Manipulation', 'Design']
  },
  tags: [{
    type: String,
    trim: true
  }],
  problemStatement: {
    type: String,
    required: true
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: {
    type: String,
    required: true
  },
  followUp: String,
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  },
  solution: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  },
  testCases: [testCaseSchema],
  timeLimit: {
    type: Number,
    default: 1000 // milliseconds
  },
  memoryLimit: {
    type: Number,
    default: 128 // MB
  },
  acceptanceRate: {
    type: Number,
    default: 0
  },
  totalSubmissions: {
    type: Number,
    default: 0
  },
  successfulSubmissions: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
problemSchema.index({ category: 1, difficulty: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ slug: 1 });
problemSchema.index({ isActive: 1 });

// Virtual for acceptance rate calculation
problemSchema.virtual('acceptanceRatePercentage').get(function() {
  if (this.totalSubmissions === 0) return 0;
  return Math.round((this.successfulSubmissions / this.totalSubmissions) * 100);
});

// Method to update submission stats
problemSchema.methods.updateSubmissionStats = function(isSuccessful) {
  this.totalSubmissions += 1;
  if (isSuccessful) {
    this.successfulSubmissions += 1;
  }
  this.acceptanceRate = this.totalSubmissions > 0 
    ? (this.successfulSubmissions / this.totalSubmissions) * 100 
    : 0;
  return this.save();
};

// Static method to get problems by category
problemSchema.statics.getByCategory = function(category, limit = 50) {
  return this.find({ 
    category, 
    isActive: true 
  })
  .select('title slug difficulty tags acceptanceRate totalSubmissions')
  .limit(limit)
  .sort({ createdAt: -1 });
};

// Static method to get problems by difficulty
problemSchema.statics.getByDifficulty = function(difficulty, limit = 50) {
  return this.find({ 
    difficulty, 
    isActive: true 
  })
  .select('title slug category tags acceptanceRate totalSubmissions')
  .limit(limit)
  .sort({ createdAt: -1 });
};

// Static method to search problems
problemSchema.statics.search = function(query, limit = 20) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { category: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .select('title slug difficulty category tags acceptanceRate totalSubmissions')
  .limit(limit)
  .sort({ totalSubmissions: -1 });
};

module.exports = mongoose.model('Problem', problemSchema);
