// CommonJS require for jose v4
const { createRemoteJWKSet, jwtVerify } = require('jose');

// Build JWKS URL from Supabase project URL if not explicitly provided
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || '';
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/keys` : '');

let jwks;

// Initialize JWKS
const initializeJWKS = () => {
  try {
    if (SUPABASE_JWKS_URL) {
      jwks = createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[SupabaseAuth] Failed to initialize JWKS:', e.message);
  }
};

// Initialize immediately
initializeJWKS();

const normalizeSupabaseUser = (payload) => {
  return {
    uid: payload.sub,
    email: payload.email || null,
    displayName: payload.user_metadata?.full_name || payload.user_metadata?.name || null,
    picture: payload.user_metadata?.avatar_url || null
  };
};

// Verify bearer token from Authorization header, attach req.user (normalized) on success
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    if (!jwks) return res.status(500).json({ error: 'Auth not configured: missing JWKS' });
    const { payload } = await jwtVerify(token, jwks, {});
    req.user = normalizeSupabaseUser(payload);
    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SupabaseAuth] HTTP token verification error:', error && error.message ? error.message : error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Socket.io authentication using the same JWT
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication token required'));
    if (!jwks) return next(new Error('Auth not configured: missing JWKS'));
    const { payload } = await jwtVerify(token, jwks, {});
    socket.user = normalizeSupabaseUser(payload);
    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SupabaseAuth] Socket token verification error:', error && error.message ? error.message : error);
    next(new Error('Authentication failed'));
  }
};

// User helpers (migrated from Firebase config)
const createOrUpdateUser = async (userData) => {
  try {
    const User = require('../models/User');
    let user = await User.findByFirebaseUid(userData.uid);
    if (!user) {
      user = new User({
        firebaseUid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || userData.email || 'User',
        avatar: userData.picture || null,
        lastLoginAt: new Date()
      });
    } else {
      user.displayName = userData.displayName || user.displayName;
      user.avatar = userData.picture || user.avatar;
      user.lastLoginAt = new Date();
    }
    await user.save();
    return user;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

const getUserByFirebaseUid = async (uid) => {
  try {
    const User = require('../models/User');
    return await User.findByFirebaseUid(uid);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting user by auth UID:', error);
    throw error;
  }
};

// Expose a direct verifier for custom flows
const verifySupabaseToken = async (token) => {
  if (!jwks) throw new Error('Auth not configured: missing JWKS');
  const { payload } = await jwtVerify(token, jwks, {});
  return normalizeSupabaseUser(payload);
};

module.exports = {
  authenticateToken,
  authenticateSocket,
  createOrUpdateUser,
  getUserByFirebaseUid,
  verifySupabaseToken
};


