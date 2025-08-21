const mongoose = require('mongoose');
require('mongoose-paginate-v2');

// Schema for individual code files
const codeFileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'ruby', 'html', 'css', 'json', 'markdown'],
    required: true
  },
  content: {
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
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Schema for code execution history
const executionHistorySchema = new mongoose.Schema({
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  input: {
    type: String,
    default: ''
  },
  output: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: null
  },
  executionTime: {
    type: Number, // in milliseconds
    default: 0
  },
  memoryUsage: {
    type: Number, // in MB
    default: 0
  },
  success: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for user activity tracking
const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['join', 'leave', 'edit', 'execute', 'save', 'create_file', 'delete_file'],
    required: true
  },
  fileName: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Main collaborative session schema
const collaborativeSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
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
  
  // Session creator and ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Session type and mode
  type: {
    type: String,
    enum: ['collaborative', 'battle', 'presentation', 'tutorial', 'workshop'],
    default: 'collaborative'
  },
  mode: {
    type: String,
    enum: ['real-time', 'version-control', 'read-only'],
    default: 'real-time'
  },
  
  // Session settings
  settings: {
    maxCollaborators: {
      type: Number,
      default: 20,
      min: 1,
      max: 100
    },
    allowCodeExecution: {
      type: Boolean,
      default: true
    },
    allowFileCreation: {
      type: Boolean,
      default: true
    },
    allowFileDeletion: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    autoSaveInterval: {
      type: Number,
      default: 30, // seconds
      min: 5,
      max: 300
    }
  },
  
  // Session state
  status: {
    type: String,
    enum: ['active', 'paused', 'ended', 'archived'],
    default: 'active'
  },
  
  // Code content and files
  files: [codeFileSchema],
  currentFile: {
    type: String,
    default: 'main.js'
  },
  defaultLanguage: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'ruby'],
    default: 'javascript'
  },
  
  // Collaborators and participants
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer', 'guest'],
      default: 'editor'
    },
    permissions: {
      canEdit: { type: Boolean, default: true },
      canExecute: { type: Boolean, default: true },
      canCreateFiles: { type: Boolean, default: true },
      canDeleteFiles: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    cursorPosition: {
      line: { type: Number, default: 1 },
      column: { type: Number, default: 1 }
    },
    currentFile: {
      type: String,
      default: null
    }
  }],
  
  // Session metadata
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  
  // Execution and activity tracking
  executionHistory: [executionHistorySchema],
  userActivity: [userActivitySchema],
  
  // Session statistics
  stats: {
    totalEdits: { type: Number, default: 0 },
    totalExecutions: { type: Number, default: 0 },
    totalCollaborators: { type: Number, default: 0 },
    sessionDuration: { type: Number, default: 0 }, // in minutes
    averageSessionTime: { type: Number, default: 0 }, // in minutes
    filesCreated: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 }
  },
  
  // Room association (if created from a room)
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  
  // Team association (if team session)
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  
  // Session scheduling
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
  
  // Session visibility and access
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Session access control
  accessCode: {
    type: String,
    trim: true,
    default: null
  },
  accessCodeExpiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
collaborativeSessionSchema.index({ createdBy: 1, status: 1 });
collaborativeSessionSchema.index({ 'collaborators.userId': 1 });
collaborativeSessionSchema.index({ status: 1, isPublic: 1 });
collaborativeSessionSchema.index({ tags: 1 });
collaborativeSessionSchema.index({ category: 1, difficulty: 1 });
collaborativeSessionSchema.index({ roomId: 1 });
collaborativeSessionSchema.index({ teamId: 1 });
collaborativeSessionSchema.index({ createdAt: -1 });
collaborativeSessionSchema.index({ 'schedule.startTime': 1 });

// Virtual for current collaborator count
collaborativeSessionSchema.virtual('currentCollaboratorCount').get(function() {
  return this.collaborators.filter(c => c.isOnline).length;
});

// Virtual for session duration
collaborativeSessionSchema.virtual('duration').get(function() {
  if (!this.createdAt) return 0;
  const endTime = this.updatedAt || new Date();
  return Math.floor((endTime - this.createdAt) / (1000 * 60));
});

// Methods
collaborativeSessionSchema.methods.addCollaborator = function(userId, role = 'editor', permissions = {}) {
  const existingCollaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    existingCollaborator.isOnline = true;
    existingCollaborator.lastActive = new Date();
    return this.save();
  }
  
  if (this.collaborators.length >= this.settings.maxCollaborators) {
    throw new Error('Session has reached maximum collaborator limit');
  }
  
  this.collaborators.push({
    userId,
    role,
    permissions: {
      canEdit: permissions.canEdit !== undefined ? permissions.canEdit : true,
      canExecute: permissions.canExecute !== undefined ? permissions.canExecute : true,
      canCreateFiles: permissions.canCreateFiles !== undefined ? permissions.canCreateFiles : true,
      canDeleteFiles: permissions.canDeleteFiles !== undefined ? permissions.canDeleteFiles : false,
      canInvite: permissions.canInvite !== undefined ? permissions.canInvite : false
    },
    joinedAt: new Date(),
    lastActive: new Date(),
    isOnline: true
  });
  
  this.stats.totalCollaborators = this.collaborators.length;
  return this.save();
};

collaborativeSessionSchema.methods.removeCollaborator = function(userId) {
  const collaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString()
  );
  
  if (collaborator) {
    collaborator.isOnline = false;
    collaborator.lastActive = new Date();
    this.stats.totalCollaborators = this.collaborators.filter(c => c.isOnline).length;
  }
  
  return this.save();
};

collaborativeSessionSchema.methods.updateCollaboratorRole = function(userId, newRole) {
  const collaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString()
  );
  
  if (collaborator) {
    collaborator.role = newRole;
  }
  
  return this.save();
};

collaborativeSessionSchema.methods.addFile = function(fileName, language, content, createdBy) {
  const filePath = fileName.includes('/') ? fileName : `/${fileName}`;
  
  const newFile = {
    fileName,
    filePath,
    language,
    content: content || getDefaultCode(language),
    version: 0,
    lastModified: new Date(),
    lastModifiedBy: createdBy,
    isActive: true
  };
  
  this.files.push(newFile);
  this.stats.filesCreated += 1;
  
  if (!this.currentFile) {
    this.currentFile = fileName;
  }
  
  return this.save();
};

collaborativeSessionSchema.methods.updateFile = function(fileName, content, modifiedBy) {
  const file = this.files.find(f => f.fileName === fileName && f.isActive);
  
  if (file) {
    file.content = content;
    file.version += 1;
    file.lastModified = new Date();
    file.lastModifiedBy = modifiedBy;
    this.stats.totalEdits += 1;
  }
  
  return this.save();
};

collaborativeSessionSchema.methods.deleteFile = function(fileName) {
  const file = this.files.find(f => f.fileName === fileName && f.isActive);
  
  if (file) {
    file.isActive = false;
  }
  
  return this.save();
};

collaborativeSessionSchema.methods.addExecutionRecord = function(executionData) {
  this.executionHistory.push(executionData);
  
  if (executionData.success) {
    this.stats.successfulExecutions += 1;
  } else {
    this.stats.failedExecutions += 1;
  }
  
  this.stats.totalExecutions += 1;
  
  // Keep only last 50 executions
  if (this.executionHistory.length > 50) {
    this.executionHistory = this.executionHistory.slice(-50);
  }
  
  return this.save();
};

collaborativeSessionSchema.methods.addActivityRecord = function(userId, action, fileName = null, metadata = {}) {
  this.userActivity.push({
    userId,
    action,
    fileName,
    metadata,
    timestamp: new Date()
  });
  
  // Keep only last 100 activities
  if (this.userActivity.length > 100) {
    this.userActivity = this.userActivity.slice(-100);
  }
  
  return this.save();
};

// Static methods
collaborativeSessionSchema.statics.generateSessionId = async function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sessionId;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    sessionId = '';
    for (let i = 0; i < 8; i++) {
      sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
    
    const existingSession = await this.findOne({ sessionId });
    if (!existingSession) {
      return sessionId;
    }
  } while (attempts < maxAttempts);

  throw new Error('Unable to generate unique session ID');
};

collaborativeSessionSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ 
    sessionId: sessionId.toUpperCase(),
    status: { $ne: 'archived' }
  }).populate('createdBy', 'displayName avatar');
};

collaborativeSessionSchema.statics.findByCollaborator = function(userId) {
  return this.find({
    'collaborators.userId': userId,
    status: { $ne: 'archived' }
  }).populate('createdBy', 'displayName avatar');
};

collaborativeSessionSchema.statics.findPublicSessions = function() {
  return this.find({
    isPublic: true,
    status: 'active',
    isArchived: false
  }).populate('createdBy', 'displayName avatar');
};

// Helper function for default code
const getDefaultCode = (language) => {
  const defaults = {
    javascript: 'console.log("Hello, World!");',
    python: 'print("Hello, World!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
    csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
    typescript: 'console.log("Hello, World!");',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
    rust: 'fn main() {\n    println!("Hello, World!");\n}',
    php: '<?php\necho "Hello, World!";\n?>',
    ruby: 'puts "Hello, World!"'
  };
  
  return defaults[language] || defaults.javascript;
};

// Pre-save middleware
collaborativeSessionSchema.pre('save', function(next) {
  // Update collaborator count
  this.stats.totalCollaborators = this.collaborators.filter(c => c.isOnline).length;
  
  // Update session duration
  if (this.createdAt) {
    const endTime = this.updatedAt || new Date();
    this.stats.sessionDuration = Math.floor((endTime - this.createdAt) / (1000 * 60));
  }
  
  next();
});

// Add pagination plugin
collaborativeSessionSchema.plugin(require('mongoose-paginate-v2'));

module.exports = mongoose.model('CollaborativeSession', collaborativeSessionSchema);
