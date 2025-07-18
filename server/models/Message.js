const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Room association for message isolation
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  // Sender information
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: null
    }
  },
  // Message content
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  // Message type for different kinds of messages
  type: {
    type: String,
    enum: ['text', 'system', 'code', 'file', 'reaction'],
    default: 'text'
  },
  // Message metadata
  metadata: {
    language: String, // for code messages
    fileName: String, // for file messages
    fileSize: Number, // for file messages
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      emoji: String,
      displayName: String
    }]
  },
  // Message status
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ 'sender.userId': 1, timestamp: -1 });
messageSchema.index({ type: 1, roomId: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
});

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Static method to get messages for a room
messageSchema.statics.getRoomMessages = function(roomId, limit = 50, skip = 0) {
  return this.find({ 
    roomId, 
    isDeleted: false 
  })
  .sort({ timestamp: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender.userId', 'displayName avatar')
  .lean();
};

// Static method to get recent messages for a room
messageSchema.statics.getRecentMessages = function(roomId, hours = 24) {
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  return this.find({ 
    roomId, 
    isDeleted: false,
    timestamp: { $gte: cutoffTime }
  })
  .sort({ timestamp: -1 })
  .populate('sender.userId', 'displayName avatar')
  .lean();
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji, displayName) {
  const existingReaction = this.metadata.reactions.find(
    r => r.userId.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (existingReaction) {
    // Remove reaction if already exists
    this.metadata.reactions = this.metadata.reactions.filter(
      r => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );
  } else {
    // Add new reaction
    this.metadata.reactions.push({
      userId,
      emoji,
      displayName
    });
  }
  
  return this.save();
};

// Instance method to edit message
messageSchema.methods.editMessage = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Instance method to delete message (soft delete)
messageSchema.methods.deleteMessage = function() {
  this.isDeleted = true;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema); 