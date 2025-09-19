const mongoose = require('mongoose');

const dsaProgressSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    index: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DSAProblem',
    required: true,
    index: true
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Track submission attempts
  submissionCount: {
    type: Number,
    default: 0
  },
  firstAttemptAt: {
    type: Date,
    default: null
  },
  lastAttemptAt: {
    type: Date,
    default: null
  },
  // Track best submission
  bestSubmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DSASubmission',
    default: null
  },
  // Track notes/feedback from user
  notes: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DSACategory',
    required: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Compound index for efficient queries
dsaProgressSchema.index({ firebaseUid: 1, problemId: 1 }, { unique: true });
dsaProgressSchema.index({ firebaseUid: 1, isCompleted: 1 });
dsaProgressSchema.index({ firebaseUid: 1, difficulty: 1 });
dsaProgressSchema.index({ firebaseUid: 1, category: 1 });

// Static method to get or create progress for a user-problem pair
dsaProgressSchema.statics.getOrCreateProgress = async function(firebaseUid, problemId, problemData) {
  try {
    let progress = await this.findOne({ firebaseUid, problemId });
    
    if (!progress) {
      progress = new this({
        firebaseUid,
        problemId,
        difficulty: problemData.difficulty,
        category: problemData.category
      });
      await progress.save();
    }
    
    return progress;
  } catch (error) {
    console.error('Error getting/creating progress:', error);
    throw error;
  }
};

// Static method to update completion status
dsaProgressSchema.statics.updateCompletion = async function(firebaseUid, problemId, isCompleted, notes = '') {
  try {
    let progress = await this.findOne({ firebaseUid, problemId });
    
    // If progress doesn't exist, create it
    if (!progress) {
      // We need to get the problem data to create the progress record
      const DSAProblem = require('./DSAProblem');
      const problem = await DSAProblem.findById(problemId).select('difficulty category');
      
      if (!problem) {
        throw new Error('Problem not found');
      }
      
      progress = new this({
        firebaseUid,
        problemId,
        difficulty: problem.difficulty,
        category: problem.category,
        isCompleted,
        notes
      });
    } else {
      progress.isCompleted = isCompleted;
      if (notes) progress.notes = notes;
    }
    
    if (isCompleted && !progress.completedAt) {
      progress.completedAt = new Date();
    } else if (!isCompleted) {
      progress.completedAt = null;
    }
    
    await progress.save();
    return progress;
  } catch (error) {
    console.error('Error updating completion:', error);
    throw error;
  }
};

// Static method to get user's overall progress statistics
dsaProgressSchema.statics.getUserStats = async function(firebaseUid) {
  try {
    const stats = await this.aggregate([
      { $match: { firebaseUid } },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          completedProblems: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          easyCompleted: { $sum: { $cond: [{ $and: ['$isCompleted', { $eq: ['$difficulty', 'Easy'] }] }, 1, 0] } },
          mediumCompleted: { $sum: { $cond: [{ $and: ['$isCompleted', { $eq: ['$difficulty', 'Medium'] }] }, 1, 0] } },
          hardCompleted: { $sum: { $cond: [{ $and: ['$isCompleted', { $eq: ['$difficulty', 'Hard'] }] }, 1, 0] } },
          totalAttempts: { $sum: '$submissionCount' }
        }
      }
    ]);
    
    return stats[0] || {
      totalProblems: 0,
      completedProblems: 0,
      easyCompleted: 0,
      mediumCompleted: 0,
      hardCompleted: 0,
      totalAttempts: 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

// Static method to get progress by category
dsaProgressSchema.statics.getProgressByCategory = async function(firebaseUid) {
  try {
    const progress = await this.aggregate([
      { $match: { firebaseUid } },
      {
        $lookup: {
          from: 'dsacategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$categoryInfo.name' },
          totalProblems: { $sum: 1 },
          completedProblems: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          completionRate: { $avg: { $cond: ['$isCompleted', 1, 0] } }
        }
      },
      { $sort: { categoryName: 1 } }
    ]);
    
    return progress;
  } catch (error) {
    console.error('Error getting progress by category:', error);
    throw error;
  }
};

// Instance method to update submission tracking
dsaProgressSchema.methods.updateSubmissionTracking = async function(submissionId) {
  this.submissionCount += 1;
  this.lastAttemptAt = new Date();
  
  if (!this.firstAttemptAt) {
    this.firstAttemptAt = new Date();
  }
  
  // Update best submission if this is the first accepted submission
  if (!this.bestSubmission) {
    const DSASubmission = require('./DSASubmission');
    const submission = await DSASubmission.findById(submissionId);
    if (submission && submission.status === 'accepted') {
      this.bestSubmission = submissionId;
    }
  }
  
  await this.save();
};

module.exports = mongoose.model('DSAProgress', dsaProgressSchema);
