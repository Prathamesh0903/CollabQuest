const mongoose = require('mongoose');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const dsaUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => emailRegex.test(v),
      message: 'Invalid email format'
    },
    index: true
  },
  hashed_password: {
    type: String,
    required: true,
    minlength: 20
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtuals for explicit IDs required by spec
dsaUserSchema.virtual('user_id').get(function() { return this._id; });

// Index compound for frequent lookups
dsaUserSchema.index({ username: 1, email: 1 });

module.exports = mongoose.model('DSAUser', dsaUserSchema);


