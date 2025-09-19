const mongoose = require('mongoose');

const userMappingSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  dsaUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DSAUser',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
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

// Static method to find or create mapping
userMappingSchema.statics.findOrCreateMapping = async function(firebaseUser, dsaUser) {
  try {
    // Try to find existing mapping
    let mapping = await this.findOne({ firebaseUid: firebaseUser.uid });
    
    if (mapping) {
      // Update last accessed time
      mapping.lastAccessed = new Date();
      await mapping.save();
      return mapping;
    }
    
    // Create new mapping
    mapping = new this({
      firebaseUid: firebaseUser.uid,
      dsaUserId: dsaUser._id,
      email: firebaseUser.email || dsaUser.email,
      displayName: firebaseUser.displayName || firebaseUser.name || dsaUser.username
    });
    
    await mapping.save();
    return mapping;
  } catch (error) {
    console.error('Error creating user mapping:', error);
    throw error;
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
