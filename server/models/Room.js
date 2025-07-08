const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Room creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Room type and settings
  type: {
    type: String,
    enum: ['public', 'private', 'team'],
    default: 'public'
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 50,
      min: 2,
      max: 200
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  // Room state
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'ended'],
    default: 'waiting'
  },
  // Current activity
  currentActivity: {
    type: {
      type: String,
      enum: ['quiz', 'discussion', 'presentation', 'break'],
      default: null
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    duration: {
      type: Number, // in minutes
      default: null
    }
  },
  // Participants
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['participant', 'moderator', 'host'],
      default: 'participant'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  // Team association (if team room)
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  // Room statistics
  stats: {
    totalParticipants: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }, // in minutes
    quizzesCompleted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 }
  },
  // Room tags
  tags: [{
    type: String,
    trim: true
  }],
  // Scheduled sessions
  schedule: {
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrence: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: null
    }
  },
  // Room status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
roomSchema.index({ name: 1 });
roomSchema.index({ status: 1, type: 1 });
roomSchema.index({ 'schedule.startTime': 1 });
roomSchema.index({ teamId: 1 });
roomSchema.index({ createdBy: 1 });

// Virtual for current participant count
roomSchema.virtual('currentParticipantCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for room duration
roomSchema.virtual('duration').get(function() {
  if (!this.schedule.startTime) return 0;
  const endTime = this.schedule.endTime || new Date();
  return Math.floor((endTime - this.schedule.startTime) / (1000 * 60));
});

// Methods
roomSchema.methods.addParticipant = function(userId, role = 'participant') {
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.lastSeen = new Date();
    return this.save();
  }
  
  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error('Room has reached maximum participant limit');
  }
  
  this.participants.push({
    userId,
    role,
    joinedAt: new Date(),
    isActive: true,
    lastSeen: new Date()
  });
  
  this.stats.totalParticipants = this.participants.length;
  return this.save();
};

roomSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
    participant.lastSeen = new Date();
    this.stats.totalParticipants = this.participants.filter(p => p.isActive).length;
  }
  
  return this.save();
};

roomSchema.methods.updateParticipantRole = function(userId, newRole) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.role = newRole;
  }
  
  return this.save();
};

roomSchema.methods.startActivity = function(activityType, quizId = null, duration = null) {
  this.currentActivity = {
    type: activityType,
    quizId,
    startedAt: new Date(),
    duration
  };
  
  this.status = 'active';
  return this.save();
};

roomSchema.methods.endActivity = function() {
  this.currentActivity = {
    type: null,
    quizId: null,
    startedAt: null,
    duration: null
  };
  
  this.status = 'waiting';
  return this.save();
};

roomSchema.methods.updateStats = function(quizScore = 0) {
  if (quizScore > 0) {
    this.stats.quizzesCompleted += 1;
    // Update average score
    const totalScore = this.stats.averageScore * (this.stats.quizzesCompleted - 1) + quizScore;
    this.stats.averageScore = totalScore / this.stats.quizzesCompleted;
  }
  
  return this.save();
};

// Static methods
roomSchema.statics.findActiveRooms = function() {
  return this.find({
    status: { $in: ['waiting', 'active'] },
    isActive: true
  }).populate('createdBy', 'displayName avatar');
};

roomSchema.statics.findByTeam = function(teamId) {
  return this.find({
    teamId,
    isActive: true
  }).populate('createdBy', 'displayName avatar');
};

roomSchema.statics.findPublicRooms = function() {
  return this.find({
    type: 'public',
    isActive: true
  }).populate('createdBy', 'displayName avatar');
};

// Pre-save middleware
roomSchema.pre('save', function(next) {
  // Update participant count
  this.stats.totalParticipants = this.participants.filter(p => p.isActive).length;
  next();
});

module.exports = mongoose.model('Room', roomSchema); 