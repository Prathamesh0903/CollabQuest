const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  input: String,
  expectedOutput: String,
  actualOutput: String,
  isPassed: {
    type: Boolean,
    required: true
  },
  executionTime: Number, // milliseconds
  memoryUsed: Number, // MB
  errorMessage: String
});

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'ruby'],
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'system_error'],
    default: 'pending'
  },
  testResults: [testResultSchema],
  executionTime: {
    type: Number,
    default: 0 // milliseconds
  },
  memoryUsed: {
    type: Number,
    default: 0 // MB
  },
  score: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  passedTestCases: {
    type: Number,
    default: 0
  },
  errorMessage: String,
  compilationError: String,
  runtimeError: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  isPractice: {
    type: Boolean,
    default: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  },
  sessionId: String, // For collaborative sessions
  feedback: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  notes: String // User's notes about the solution
}, {
  timestamps: true
});

// Indexes for better query performance
submissionSchema.index({ user: 1, problem: 1 });
submissionSchema.index({ problem: 1, status: 1 });
submissionSchema.index({ user: 1, submittedAt: -1 });
submissionSchema.index({ status: 1, submittedAt: -1 });
submissionSchema.index({ language: 1, submittedAt: -1 });

// Virtual for success rate
submissionSchema.virtual('successRate').get(function() {
  if (this.totalTestCases === 0) return 0;
  return Math.round((this.passedTestCases / this.totalTestCases) * 100);
});

// Method to update test results
submissionSchema.methods.updateTestResults = function(results) {
  this.testResults = results;
  this.totalTestCases = results.length;
  this.passedTestCases = results.filter(r => r.isPassed).length;
  this.score = this.passedTestCases > 0 ? (this.passedTestCases / this.totalTestCases) * 100 : 0;
  
  // Determine status based on results
  if (this.passedTestCases === this.totalTestCases) {
    this.status = 'accepted';
  } else if (this.passedTestCases > 0) {
    this.status = 'wrong_answer';
  } else {
    this.status = 'wrong_answer';
  }
  
  this.completedAt = new Date();
  return this.save();
};

// Method to update execution metrics
submissionSchema.methods.updateExecutionMetrics = function(executionTime, memoryUsed) {
  this.executionTime = executionTime;
  this.memoryUsed = memoryUsed;
  return this.save();
};

// Static method to get user's submissions for a problem
submissionSchema.statics.getUserSubmissions = function(userId, problemId, limit = 10) {
  return this.find({ user: userId, problem: problemId })
    .select('language status executionTime memoryUsed score submittedAt')
    .sort({ submittedAt: -1 })
    .limit(limit);
};

// Static method to get best submission for a user-problem pair
submissionSchema.statics.getBestSubmission = function(userId, problemId) {
  return this.findOne({ 
    user: userId, 
    problem: problemId, 
    status: 'accepted' 
  })
  .sort({ executionTime: 1, memoryUsed: 1 })
  .select('language executionTime memoryUsed submittedAt');
};

// Static method to get submission statistics
submissionSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        acceptedSubmissions: { 
          $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } 
        },
        averageExecutionTime: { $avg: '$executionTime' },
        averageMemoryUsed: { $avg: '$memoryUsed' },
        languagesUsed: { $addToSet: '$language' }
      }
    }
  ]);
};

// Static method to get problem statistics
submissionSchema.statics.getProblemStats = function(problemId) {
  return this.aggregate([
    { $match: { problem: mongoose.Types.ObjectId(problemId) } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        acceptedSubmissions: { 
          $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } 
        },
        averageExecutionTime: { $avg: '$executionTime' },
        averageMemoryUsed: { $avg: '$memoryUsed' },
        languageDistribution: { $addToSet: '$language' }
      }
    }
  ]);
};

module.exports = mongoose.model('Submission', submissionSchema);
