const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  // Team members
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'leader'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Team leader
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Team settings
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 20,
      min: 2,
      max: 100
    }
  },
  // Team statistics
  stats: {
    totalMembers: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  },
  // Team achievements
  achievements: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Team status
  isActive: {
    type: Boolean,
    default: true
  },
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ 'stats.totalPoints': -1 });
teamSchema.index({ tags: 1 });
teamSchema.index({ isActive: 1, isPublic: 1 });

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for average member level
teamSchema.virtual('averageMemberLevel').get(function() {
  if (this.members.length === 0) return 0;
  // This would need to be populated with User data
  return 0;
});

// Methods
teamSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }
  
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Team has reached maximum member limit');
  }
  
  this.members.push({
    userId,
    role,
    joinedAt: new Date()
  });
  
  this.stats.totalMembers = this.members.length;
  return this.save();
};

teamSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this team');
  }
  
  // Prevent removing the leader
  if (this.members[memberIndex].role === 'leader') {
    throw new Error('Cannot remove team leader');
  }
  
  this.members.splice(memberIndex, 1);
  this.stats.totalMembers = this.members.length;
  return this.save();
};

teamSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member of this team');
  }
  
  member.role = newRole;
  return this.save();
};

teamSchema.methods.addPoints = function(amount) {
  this.stats.totalPoints += amount;
  return this.save();
};

teamSchema.methods.addAchievement = function(name, description) {
  const existingAchievement = this.achievements.find(achievement => 
    achievement.name === name
  );
  
  if (!existingAchievement) {
    this.achievements.push({ name, description });
  }
  
  return this.save();
};

// Static methods
teamSchema.statics.findByMember = function(userId) {
  return this.find({
    'members.userId': userId,
    isActive: true
  });
};

teamSchema.statics.getTopTeams = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.totalPoints': -1 })
    .limit(limit)
    .populate('leaderId', 'displayName avatar')
    .select('name avatar stats leaderId');
};

// Pre-save middleware
teamSchema.pre('save', function(next) {
  // Update member count
  this.stats.totalMembers = this.members.length;
  next();
});

module.exports = mongoose.model('Team', teamSchema); 