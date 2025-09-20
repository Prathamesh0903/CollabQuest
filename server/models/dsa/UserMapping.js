const mongoose = require('mongoose');

const userMappingSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  dsaUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DSAUser',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes for performance
userMappingSchema.index({ firebaseUid: 1, dsaUserId: 1 });
userMappingSchema.index({ email: 1 });

// Enhanced static method to find or create mapping with better error handling
userMappingSchema.statics.findOrCreateMapping = async function(firebaseUser, dsaUser) {
  try {
    // Validate input parameters
    if (!firebaseUser || !firebaseUser.uid) {
      throw new Error('Invalid firebaseUser: missing uid');
    }
    if (!dsaUser || !dsaUser._id) {
      throw new Error('Invalid dsaUser: missing _id');
    }

    // Try to find existing mapping
    let mapping = await this.findOne({ firebaseUid: firebaseUser.uid });
    
    if (mapping) {
      // Update last accessed time and ensure it's active
      mapping.lastAccessed = new Date();
      mapping.isActive = true;
      await mapping.save();
      return mapping;
    }
    
    // Create new mapping with validation
    mapping = new this({
      firebaseUid: firebaseUser.uid,
      dsaUserId: dsaUser._id,
      email: firebaseUser.email || dsaUser.email,
      displayName: firebaseUser.displayName || firebaseUser.name || dsaUser.username || 'User'
    });
    
    await mapping.save();
    return mapping;
  } catch (error) {
    console.error('Error creating user mapping:', {
      error: error.message,
      firebaseUid: firebaseUser?.uid,
      dsaUserId: dsaUser?._id,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// New method to create user mapping with retry logic
userMappingSchema.statics.createUserMappingWithRetry = async function(supabaseUser, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if mapping already exists
      let mapping = await this.findOne({ firebaseUid: supabaseUser.uid });
      if (mapping) {
        mapping.lastAccessed = new Date();
        mapping.isActive = true;
        await mapping.save();
        return mapping;
      }

      // Generate unique username
      const baseUsername = supabaseUser.displayName || supabaseUser.email?.split('@')[0] || 'user';
      const username = await this.generateUniqueUsername(baseUsername);

      // Create DSA user first
      const DSAUser = require('./DSAUser');
      const dsaUser = new DSAUser({
        username: username,
        email: supabaseUser.email,
        hashed_password: `supabase_${supabaseUser.uid}_${Date.now()}`
      });
      await dsaUser.save();

      // Create mapping
      mapping = new this({
        firebaseUid: supabaseUser.uid,
        dsaUserId: dsaUser._id,
        email: supabaseUser.email,
        displayName: supabaseUser.displayName || supabaseUser.email?.split('@')[0] || 'User'
      });
      await mapping.save();

      return mapping;
    } catch (error) {
      console.error(`User mapping creation attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to create user mapping after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Helper method to generate unique username
userMappingSchema.statics.generateUniqueUsername = async function(baseUsername) {
  const DSAUser = require('./DSAUser');
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  let counter = 1;
  
  while (true) {
    const existingUser = await DSAUser.findOne({ username });
    if (!existingUser) {
      return username;
    }
    username = `${baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}${counter}`;
    counter++;
  }
};

// Static method to get DSA user ID from Firebase UID
userMappingSchema.statics.getDsaUserId = async function(firebaseUid) {
  const mapping = await this.findOne({ firebaseUid, isActive: true });
  return mapping ? mapping.dsaUserId : null;
};

// Static method to get Firebase user info from DSA user ID
userMappingSchema.statics.getFirebaseInfo = async function(dsaUserId) {
  const mapping = await this.findOne({ dsaUserId, isActive: true });
  return mapping ? {
    firebaseUid: mapping.firebaseUid,
    email: mapping.email,
    displayName: mapping.displayName
  } : null;
};

module.exports = mongoose.model('UserMapping', userMappingSchema);
