const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank', 'matching', 'coding'],
    default: 'multiple-choice'
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: {
    type: String,
    required: function() {
      return this.type === 'fill-blank';
    }
  },
  explanation: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    default: 10,
    min: 1
  },
  timeLimit: {
    type: Number, // in seconds
    default: 30,
    min: 5,
    max: 300
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Fields for coding questions
  codeSnippet: {
    type: String,
    required: function() {
      return this.type === 'coding';
    }
  },
  language: {
    type: String,
    required: function() {
      return this.type === 'coding';
    },
    enum: ['javascript', 'python', 'java', 'cpp', 'c']
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    description: String,
    isHidden: {
      type: Boolean,
      default: false
    }
  }]
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Quiz creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Quiz content
  questions: [questionSchema],
  // Quiz settings
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowRetakes: {
      type: Boolean,
      default: true
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1
    },
    showResults: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    timeLimit: {
      type: Number, // in minutes, 0 = no limit
      default: 0,
      min: 0
    }
  },
  // Quiz categories and tags
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  // Quiz statistics
  stats: {
    totalAttempts: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }, // in minutes
    completionRate: { type: Number, default: 0 }, // percentage
    createdAt: { type: Date, default: Date.now }
  },
  // Quiz status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  // Team association (if team quiz)
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  // Room association (if room quiz)
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  // Quiz availability
  availability: {
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
quizSchema.index({ title: 1 });
quizSchema.index({ category: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ 'stats.averageScore': -1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ status: 1, 'availability.isActive': 1 });

// Replace incomplete virtuals with proper implementations
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, q) => total + q.points, 0);
});

quizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

quizSchema.virtual('estimatedDuration').get(function() {
  return this.questions.reduce((total, q) => total + q.timeLimit, 0);
});

// Methods
quizSchema.methods.addQuestion = function(questionData) {
  this.questions.push(questionData);
  return this.save();
};

quizSchema.methods.removeQuestion = function(questionIndex) {
  if (questionIndex >= 0 && questionIndex < this.questions.length) {
    this.questions.splice(questionIndex, 1);
  }
  return this.save();
};

quizSchema.methods.updateQuestion = function(questionIndex, questionData) {
  if (questionIndex >= 0 && questionIndex < this.questions.length) {
    this.questions[questionIndex] = { ...this.questions[questionIndex], ...questionData };
  }
  return this.save();
};

quizSchema.methods.publish = function() {
  if (this.questions.length === 0) {
    throw new Error('Cannot publish quiz with no questions');
  }
  this.status = 'published';
  return this.save();
};

quizSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

quizSchema.methods.updateStats = function(score, timeTaken, isCompleted = true) {
  this.stats.totalAttempts += 1;
  
  if (isCompleted) {
    this.stats.totalParticipants += 1;
    
    // Update average score
    const totalScore = this.stats.averageScore * (this.stats.totalParticipants - 1) + score;
    this.stats.averageScore = totalScore / this.stats.totalParticipants;
    
    // Update average time
    const totalTime = this.stats.averageTime * (this.stats.totalParticipants - 1) + timeTaken;
    this.stats.averageTime = totalTime / this.stats.totalParticipants;
    
    // Update completion rate
    this.stats.completionRate = (this.stats.totalParticipants / this.stats.totalAttempts) * 100;
  }
  
  return this.save();
};

quizSchema.methods.getRandomizedQuestions = function() {
  if (!this.settings.randomizeQuestions) {
    return this.questions;
  }
  
  return this.questions
    .map(question => ({ ...question.toObject() }))
    .sort(() => Math.random() - 0.5);
};

// Static methods
quizSchema.statics.findByCategory = function(category) {
  return this.find({
    category,
    status: 'published',
    'availability.isActive': true
  }).populate('createdBy', 'displayName avatar');
};

quizSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({
    difficulty,
    status: 'published',
    'availability.isActive': true
  }).populate('createdBy', 'displayName avatar');
};

quizSchema.statics.getPopularQuizzes = function(limit = 10) {
  return this.find({
    status: 'published',
    'availability.isActive': true
  })
    .sort({ 'stats.totalAttempts': -1 })
    .limit(limit)
    .populate('createdBy', 'displayName avatar');
};

quizSchema.statics.findByTeam = function(teamId) {
  return this.find({
    teamId,
    status: 'published'
  }).populate('createdBy', 'displayName avatar');
};

// Pre-save middleware
quizSchema.pre('save', function(next) {
  // Validate questions
  if (this.questions.length === 0 && this.status === 'published') {
    return next(new Error('Cannot publish quiz with no questions'));
  }
  
  // Validate time limits
  if (this.settings.timeLimit > 0) {
    const totalQuestionTime = this.questions.reduce((total, q) => total + q.timeLimit, 0);
    if (this.settings.timeLimit * 60 < totalQuestionTime) {
      return next(new Error('Quiz time limit cannot be less than total question time limits'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);