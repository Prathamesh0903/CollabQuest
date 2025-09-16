const express = require('express');
const { body, validationResult } = require('express-validator');
const { createOrUpdateUser, getUserByFirebaseUid } = require('../config/firebase');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user with Firebase token
// @access  Public
router.post('/login', [
  body('token').notEmpty().withMessage('Firebase token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;

    // Verify Firebase token
    const { admin } = require('../config/firebase');
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Create or update user in database
    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.display_name,
      picture: decodedToken.picture
    };

    const user = await createOrUpdateUser(userData);

    // Generate JWT token (optional, since we're using Firebase)
    const jwt = require('jsonwebtoken');
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        level: user.level,
        experience: user.experience,
        points: user.points,
        badges: user.badges,
        stats: user.stats,
        preferences: user.preferences
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public (admin required for teacher/admin)
router.post('/register', [
  body('token').notEmpty().withMessage('Firebase token is required'),
  body('displayName').optional().isLength({ min: 2, max: 50 }).withMessage('Display name must be between 2 and 50 characters'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
  body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, displayName, preferences, role } = req.body;

    // Verify Firebase token
    const { admin } = require('../config/firebase');
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user already exists
    const existingUser = await getUserByFirebaseUid(decodedToken.uid);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }

    // Secure role assignment: only admin can create teacher/admin
    let assignedRole = 'student';
    if (role && role !== 'student') {
      // Check if the request is authenticated and user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin can create teacher or admin users' });
      }
      assignedRole = role;
    }

    // Create new user
    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: displayName || decodedToken.name || decodedToken.display_name || 'Anonymous User',
      picture: decodedToken.picture,
      role: assignedRole
    };

    const user = new User({
      ...userData,
      preferences: preferences || {}
    });

    await user.save();

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const jwtToken = jwt.sign(
      { userId: user._id, firebaseUid: user.firebaseUid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        level: user.level,
        experience: user.experience,
        points: user.points,
        badges: user.badges,
        stats: user.stats,
        preferences: user.preferences
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed',
      message: error.message 
    });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        level: user.level,
        experience: user.experience,
        points: user.points,
        badges: user.badges,
        stats: user.stats,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Token verification failed',
      message: error.message 
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const jwtToken = jwt.sign(
      { userId: req.user._id, firebaseUid: req.user.firebaseUid },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: jwtToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Token refresh failed',
      message: error.message 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update user's last login time
    await User.findByIdAndUpdate(req.user._id, {
      lastLoginAt: new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed',
      message: error.message 
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('teamId', 'name avatar')
      .populate('currentRoomId', 'name status')
      .select('-__v');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        level: user.level,
        experience: user.experience,
        points: user.points,
        badges: user.badges,
        teamId: user.teamId,
        currentRoomId: user.currentRoomId,
        stats: user.stats,
        preferences: user.preferences,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch profile',
      message: error.message 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Return normalized user for onboarding gating
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        onboardingCompleted: !!user.onboardingCompleted,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// @route   POST /api/auth/onboarding
// @desc    Persist onboarding data and mark completion
// @access  Private
router.post('/onboarding', [
  auth,
  body('displayName').optional().isLength({ min: 2, max: 50 }).withMessage('Display name must be between 2 and 50 characters'),
  body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { displayName, role, preferences } = req.body;

    const update = { onboardingCompleted: true };
    if (displayName) update.displayName = displayName;
    if (role) update.role = role;
    if (preferences) update.preferences = { ...(req.user.preferences || {}), ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        onboardingCompleted: !!user.onboardingCompleted,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Onboarding save error:', error);
    res.status(500).json({ success: false, error: 'Failed to save onboarding' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('displayName').optional().isLength({ min: 2, max: 50 }).withMessage('Display name must be between 2 and 50 characters'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { displayName, preferences } = req.body;
    const updateData = {};

    if (displayName) updateData.displayName = displayName;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        level: user.level,
        experience: user.experience,
        points: user.points,
        badges: user.badges,
        stats: user.stats,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile',
      message: error.message 
    });
  }
});

module.exports = router; 