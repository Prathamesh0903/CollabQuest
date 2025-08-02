const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  // Gamification fields
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Team and room relationships
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  currentRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  // Statistics
  stats: {
    quizzesTaken: { type: Number, default: 0 },
    quizzesWon: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now }
  },
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      teamUpdates: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ level: -1, points: -1 });
userSchema.index({ 'stats.totalScore': -1 });

// Methods
userSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  
  // Check for level up
  while (this.experience >= this.experienceToNextLevel) {
    this.level += 1;
    this.points += 10; // Bonus points for leveling up
  }
  
  return this.save();
};

userSchema.methods.addPoints = function(amount) {
  this.points += amount;
  return this.save();
};

userSchema.methods.addBadge = function(badgeName, description) {
  const existingBadge = this.badges.find(badge => badge.name === badgeName);
  if (!existingBadge) {
    this.badges.push({ name: badgeName, description });
  }
  return this.save();
};

userSchema.methods.updateStats = function(quizScore, isWinner = false) {
  this.stats.quizzesTaken += 1;
  if (isWinner) {
    this.stats.quizzesWon += 1;
  }
  this.stats.totalScore += quizScore;
  this.stats.averageScore = this.stats.totalScore / this.stats.quizzesTaken;
  this.stats.lastActiveDate = new Date();
  
  return this.save();
};

// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.totalScore': -1, level: -1 })
    .limit(limit)
    .select('displayName avatar level points stats');
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified('stats.lastActiveDate')) {
    // Update streak logic
    const now = new Date();
    const lastActive = this.stats.lastActiveDate;
    const daysDiff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.stats.streakDays += 1;
    } else if (daysDiff > 1) {
      this.stats.streakDays = 0;
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);