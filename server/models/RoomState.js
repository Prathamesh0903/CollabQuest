const mongoose = require('mongoose');

const roomStateSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  
  // Core room state
  language: {
    type: String,
    default: 'javascript'
  },
  mode: {
    type: String,
    enum: ['collaborative', 'battle'],
    default: 'collaborative'
  },
  code: {
    type: String,
    default: ''
  },
  version: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // User management
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  cursors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      lineNumber: Number,
      column: Number
    },
    color: String,
    displayName: String
  }],
  
  // Chat messages
  chatMessages: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Room status
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Battle-specific state
  battle: {
    problemId: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard']
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    durationMinutes: Number,
    started: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    ended: {
      type: Boolean,
      default: false
    },
    endedAt: Date,
    submissions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      passed: Number,
      total: Number,
      codeLength: Number,
      totalTimeMs: Number,
      compositeScore: Number,
      submittedAt: {
        type: Date,
        default: Date.now
      }
    }],
    ready: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      ready: Boolean,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Metadata
  metadata: {
    lastSaved: {
      type: Date,
      default: Date.now
    },
    saveCount: {
      type: Number,
      default: 0
    },
    cacheHits: {
      type: Number,
      default: 0
    },
    cacheMisses: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  collection: 'roomstates'
});

// Indexes for performance
roomStateSchema.index({ roomId: 1 }, { unique: true });
roomStateSchema.index({ 'battle.host': 1 });
roomStateSchema.index({ 'battle.started': 1, 'battle.ended': 1 });
roomStateSchema.index({ 'metadata.lastSaved': 1 });
roomStateSchema.index({ isActive: 1 });

// Static methods
roomStateSchema.statics.findByRoomId = function(roomId) {
  return this.findOne({ roomId: roomId });
};

roomStateSchema.statics.findActiveBattleRooms = function() {
  return this.find({ 
    'battle.started': true, 
    'battle.ended': false,
    isActive: true 
  });
};

roomStateSchema.statics.findExpiredRooms = function(expiryHours = 24) {
  const expiryDate = new Date(Date.now() - (expiryHours * 60 * 60 * 1000));
  return this.find({ 
    'metadata.lastSaved': { $lt: expiryDate },
    isActive: true 
  });
};

// Instance methods
roomStateSchema.methods.addUser = function(userId) {
  if (!this.users.includes(userId)) {
    this.users.push(userId);
    this.lastModified = new Date();
    this.metadata.saveCount += 1;
  }
  return this;
};

roomStateSchema.methods.removeUser = function(userId) {
  this.users = this.users.filter(id => !id.equals(userId));
  this.cursors = this.cursors.filter(cursor => !cursor.userId.equals(userId));
  this.lastModified = new Date();
  this.metadata.saveCount += 1;
  return this;
};

roomStateSchema.methods.updateCursor = function(userId, position, color, displayName) {
  const existingCursor = this.cursors.find(cursor => cursor.userId.equals(userId));
  if (existingCursor) {
    existingCursor.position = position;
    existingCursor.color = color;
    existingCursor.displayName = displayName;
  } else {
    this.cursors.push({ userId, position, color, displayName });
  }
  this.lastModified = new Date();
  return this;
};

roomStateSchema.methods.addChatMessage = function(userId, message) {
  this.chatMessages.push({
    userId,
    message,
    timestamp: new Date()
  });
  this.lastModified = new Date();
  this.metadata.saveCount += 1;
  return this;
};

roomStateSchema.methods.updateBattleState = function(battleUpdates) {
  if (!this.battle) {
    this.battle = {};
  }
  Object.assign(this.battle, battleUpdates);
  this.lastModified = new Date();
  this.metadata.saveCount += 1;
  return this;
};

roomStateSchema.methods.addBattleSubmission = function(userId, submissionData) {
  if (!this.battle) {
    this.battle = { submissions: [] };
  }
  if (!this.battle.submissions) {
    this.battle.submissions = [];
  }
  
  // Remove existing submission for this user
  this.battle.submissions = this.battle.submissions.filter(sub => !sub.userId.equals(userId));
  
  // Add new submission
  this.battle.submissions.push({
    userId,
    ...submissionData,
    submittedAt: new Date()
  });
  
  this.lastModified = new Date();
  this.metadata.saveCount += 1;
  return this;
};

roomStateSchema.methods.setUserReady = function(userId, ready) {
  if (!this.battle) {
    this.battle = { ready: [] };
  }
  if (!this.battle.ready) {
    this.battle.ready = [];
  }
  
  // Remove existing ready status for this user
  this.battle.ready = this.battle.ready.filter(r => !r.userId.equals(userId));
  
  // Add new ready status
  this.battle.ready.push({
    userId,
    ready,
    timestamp: new Date()
  });
  
  this.lastModified = new Date();
  return this;
};

roomStateSchema.methods.incrementCacheHit = function() {
  this.metadata.cacheHits += 1;
  return this;
};

roomStateSchema.methods.incrementCacheMiss = function() {
  this.metadata.cacheMisses += 1;
  return this;
};

// Pre-save middleware
roomStateSchema.pre('save', function(next) {
  this.metadata.lastSaved = new Date();
  next();
});

// Transform to match in-memory state format
roomStateSchema.methods.toMemoryState = function() {
  return {
    roomId: this.roomId.toString(),
    language: this.language,
    mode: this.mode,
    code: this.code,
    version: this.version,
    lastModified: this.lastModified,
    lastModifiedBy: this.lastModifiedBy,
    users: new Set(this.users.map(id => id.toString())),
    cursors: new Map(this.cursors.map(cursor => [
      cursor.userId.toString(),
      {
        position: cursor.position,
        color: cursor.color,
        displayName: cursor.displayName
      }
    ])),
    chatMessages: this.chatMessages,
    isActive: this.isActive,
    createdAt: this.createdAt,
    battle: this.battle
  };
};

module.exports = mongoose.model('RoomState', roomStateSchema);
