const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Leaderboard type
  type: {
    type: String,
    enum: ['global', 'team', 'category', 'event', 'seasonal'],
    default: 'global'
  },
  // Associated entity (team, category, etc.)
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel',
    default: null
  },
  entityModel: {
    type: String,
    enum: ['Team', 'Quiz', 'Room'],
    default: null
  },
  // Leaderboard settings
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    updateFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'weekly'],
      default: 'realtime'
    },
    maxEntries: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000
    },
    resetFrequency: {
      type: String,
      enum: ['never', 'daily', 'weekly', 'monthly', 'seasonally'],
      default: 'never'
    }
  },
  // Scoring criteria
  scoring: {
    primaryMetric: {
      type: String,
      enum: ['points', 'experience', 'score', 'wins', 'streak'],
      default: 'points'
    },
    secondaryMetric: {
      type: String,
      enum: ['points', 'experience', 'score', 'wins', 'streak'],
      default: 'experience'
    },
    weightPrimary: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    },
    weightSecondary: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1
    }
  },
  // Leaderboard entries
  entries: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rank: {
      type: Number,
      required: true
    },
    primaryScore: {
      type: Number,
      default: 0
    },
    secondaryScore: {
      type: Number,
      default: 0
    },
    weightedScore: {
      type: Number,
      default: 0
    },
    metadata: {
      level: Number,
      badges: Number,
      quizzesTaken: Number,
      averageScore: Number,
      streakDays: Number
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  // Leaderboard statistics
  stats: {
    totalParticipants: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    resetCount: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
  },
  // Time period
  period: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  // Rewards and prizes
  rewards: [{
    rank: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['badge', 'points', 'experience', 'title'],
      required: true
    },
    value: {
      type: String,
      required: true
    },
    description: String
  }],
  // Leaderboard status
  status: {
    type: String,
    enum: ['active', 'paused', 'ended', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
leaderboardSchema.index({ name: 1 });
leaderboardSchema.index({ type: 1, entityId: 1 });
leaderboardSchema.index({ 'settings.isActive': 1, status: 1 });
leaderboardSchema.index({ 'period.endDate': 1 });

// Virtual for current period duration
leaderboardSchema.virtual('periodDuration').get(function() {
  if (!this.period.startDate) return 0;
  const endDate = this.period.endDate || new Date();
  return Math.floor((endDate - this.period.startDate) / (1000 * 60 * 60 * 24)); // days
});

// Methods
leaderboardSchema.methods.addEntry = function(userId, primaryScore, secondaryScore, metadata = {}) {
  const weightedScore = (primaryScore * this.scoring.weightPrimary) + 
                       (secondaryScore * this.scoring.weightSecondary);
  
  const existingEntryIndex = this.entries.findIndex(entry => 
    entry.userId.toString() === userId.toString()
  );
  
  if (existingEntryIndex !== -1) {
    // Update existing entry
    this.entries[existingEntryIndex] = {
      userId,
      primaryScore,
      secondaryScore,
      weightedScore,
      metadata,
      lastUpdated: new Date()
    };
  } else {
    // Add new entry
    this.entries.push({
      userId,
      primaryScore,
      secondaryScore,
      weightedScore,
      metadata,
      lastUpdated: new Date()
    });
  }
  
  // Sort entries by weighted score
  this.entries.sort((a, b) => b.weightedScore - a.weightedScore);
  
  // Update ranks
  this.entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  // Limit entries to maxEntries
  if (this.entries.length > this.settings.maxEntries) {
    this.entries = this.entries.slice(0, this.settings.maxEntries);
  }
  
  this.stats.totalParticipants = this.entries.length;
  this.stats.lastUpdated = new Date();
  
  return this.save();
};

leaderboardSchema.methods.removeEntry = function(userId) {
  this.entries = this.entries.filter(entry => 
    entry.userId.toString() !== userId.toString()
  );
  
  // Update ranks
  this.entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  this.stats.totalParticipants = this.entries.length;
  return this.save();
};

leaderboardSchema.methods.getTopEntries = function(limit = 10) {
  return this.entries
    .slice(0, limit)
    .map(entry => ({
      ...entry.toObject(),
      user: null // Will be populated when needed
    }));
};

leaderboardSchema.methods.getUserRank = function(userId) {
  const entry = this.entries.find(entry => 
    entry.userId.toString() === userId.toString()
  );
  return entry ? entry.rank : null;
};

leaderboardSchema.methods.reset = function() {
  this.entries = [];
  this.stats.totalParticipants = 0;
  this.stats.resetCount += 1;
  this.period.startDate = new Date();
  this.period.endDate = null;
  this.period.isActive = true;
  return this.save();
};

leaderboardSchema.methods.endPeriod = function() {
  this.period.endDate = new Date();
  this.period.isActive = false;
  this.status = 'ended';
  return this.save();
};

// Static methods
leaderboardSchema.statics.findByType = function(type) {
  return this.find({
    type,
    'settings.isActive': true,
    status: 'active'
  }).populate('entityId');
};

leaderboardSchema.statics.findGlobalLeaderboards = function() {
  return this.find({
    type: 'global',
    'settings.isActive': true,
    status: 'active'
  });
};

leaderboardSchema.statics.findByEntity = function(entityId, entityModel) {
  return this.find({
    entityId,
    entityModel,
    'settings.isActive': true,
    status: 'active'
  });
};

// Pre-save middleware
leaderboardSchema.pre('save', function(next) {
  // Validate scoring weights
  if (this.scoring.weightPrimary + this.scoring.weightSecondary !== 1) {
    return next(new Error('Primary and secondary weights must sum to 1'));
  }
  
  // Validate period dates
  if (this.period.endDate && this.period.startDate >= this.period.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Auto-reset based on frequency
  if (this.settings.resetFrequency !== 'never') {
    const now = new Date();
    const lastReset = this.stats.lastUpdated;
    const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
    
    let shouldReset = false;
    switch (this.settings.resetFrequency) {
      case 'daily':
        shouldReset = daysSinceReset >= 1;
        break;
      case 'weekly':
        shouldReset = daysSinceReset >= 7;
        break;
      case 'monthly':
        shouldReset = daysSinceReset >= 30;
        break;
      case 'seasonally':
        shouldReset = daysSinceReset >= 90;
        break;
    }
    
    if (shouldReset) {
      this.reset();
    }
  }
  
  next();
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema); 