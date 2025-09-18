const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('../firbase-adminsdk.json');

// Initialize Firebase Admin
let firebaseApp;

try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  if (error.code === 'app/duplicate-app') { 
    firebaseApp = admin.app();
    console.log('Firebase Admin SDK already initialized');
  } else {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

// Auth middleware for Express
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.warn('[Auth] No Authorization bearer token on HTTP request');
      return res.status(401).json({ error: 'Access token required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.display_name,
      picture: decodedToken.picture
    };
    next();
  } catch (error) {
    console.error('[Auth] HTTP token verification error:', error && error.message ? error.message : error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Socket.io authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    // In development mode, allow connections without token for testing
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development mode: Allowing unauthenticated socket connection');
        socket.user = {
          uid: 'dev-user-' + Math.random().toString(36).substr(2, 9),
          email: 'dev@example.com',
          displayName: 'Development User',
          picture: null
        };
        return next();
      }
      console.warn('[Auth] No token provided in socket handshake');
      return next(new Error('Authentication token required'));
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.display_name,
      picture: decodedToken.picture
    };
    next();
  } catch (error) {
    console.error('[Auth] Socket token verification error:', error && error.message ? error.message : error);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Development mode: Allowing connection despite auth error');
      socket.user = {
        uid: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        email: 'dev@example.com',
        displayName: 'Development User',
        picture: null
      };
      return next();
    }
    next(new Error('Authentication failed'));
  }
};

// Create or update user in database
const createOrUpdateUser = async (userData) => {
  try {
    const User = require('../models/User');
    
    let user = await User.findByFirebaseUid(userData.uid);
    
    if (!user) {
      // Create new user
      user = new User({
        firebaseUid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.picture,
        lastLoginAt: new Date()
      });
    } else {
      // Update existing user
      user.displayName = userData.displayName || user.displayName;
      user.avatar = userData.picture || user.avatar;
      user.lastLoginAt = new Date();
    }
    
    await user.save();
    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

// Get user by Firebase UID
const getUserByFirebaseUid = async (uid) => {
  try {
    const User = require('../models/User');
    return await User.findByFirebaseUid(uid);
  } catch (error) {
    console.error('Error getting user by Firebase UID:', error);
    throw error;
  }
};

// Verify custom token (for testing)
const verifyCustomToken = async (customToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(customToken);
    return decodedToken;
  } catch (error) {
    console.error('Custom token verification error:', error);
    throw error;
  }
};

module.exports = {
  admin,
  firebaseApp,
  authenticateToken,
  authenticateSocket,
  createOrUpdateUser,
  getUserByFirebaseUid,
  verifyCustomToken
}; 