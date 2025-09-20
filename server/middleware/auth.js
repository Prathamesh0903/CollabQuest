const { authenticateToken, authenticateSocket, createOrUpdateUser } = require('../config/supabaseAuth');

// Express authentication middleware
const auth = async (req, res, next) => {
  try {
    await authenticateToken(req, res, next);
    
    // Create or update user in database
    if (req.user) {
      const user = await createOrUpdateUser(req.user);
      req.user = user;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
// Lightweight guest support: attaches guest flag when no token but guest headers present
const guestAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) return optionalAuth(req, res, next);
    // Accept guest with limited privileges if x-guest: true
    const isGuest = String(req.headers['x-guest'] || '').toLowerCase() === 'true';
    if (isGuest) {
      req.user = null;
      req.guest = { name: req.headers['x-guest-name'] || 'Guest' };
      return next();
    }
    return next();
  } catch (e) {
    req.user = null;
    return next();
  }
};

// Optional authentication middleware (gracefully ignores invalid/expired tokens)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[Auth] ${req.method} ${req.path} - Auth header: ${authHeader ? 'present' : 'missing'}`);

    if (!token) {
      console.log(`[Auth] ${req.method} ${req.path} - No token, proceeding as anonymous`);
      req.user = null;
      return next();
    }

    // Verify token directly and swallow errors to allow anonymous access
    const { verifySupabaseToken } = require('../config/supabaseAuth');
    try {
      console.log(`[Auth] ${req.method} ${req.path} - Verifying token...`);
      const normalizedUser = await verifySupabaseToken(token);
      console.log(`[Auth] ${req.method} ${req.path} - Token valid, UID: ${normalizedUser.uid}`);
      
      const dbUser = await createOrUpdateUser(normalizedUser);
      console.log(`[Auth] ${req.method} ${req.path} - User created/updated in DB: ${dbUser._id}`);

      // Keep both normalized info and database user info
      req.user = {
        ...normalizedUser,
        ...(dbUser.toObject ? dbUser.toObject() : dbUser),
        uid: normalizedUser.uid
      };
      console.log(`[Auth] ${req.method} ${req.path} - Authentication successful`);
    } catch (verifyErr) {
      console.warn(`[Auth] ${req.method} ${req.path} - Token verification failed:`, verifyErr.message);
      req.user = null;
    }
    return next();
  } catch (error) {
    console.error(`[Auth] ${req.method} ${req.path} - Optional auth middleware error:`, error);
    req.user = null;
    return next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Team membership authorization middleware
const requireTeamMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const teamId = req.params.teamId || req.body.teamId;
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }

    const Team = require('../models/Team');
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isMember = team.members.some(member => 
      member.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Team membership required' });
    }

    req.team = team;
    next();
  } catch (error) {
    console.error('Team membership check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Team leader authorization middleware
const requireTeamLeader = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const teamId = req.params.teamId || req.body.teamId;
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }

    const Team = require('../models/Team');
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isLeader = team.leaderId.toString() === req.user._id.toString();

    if (!isLeader) {
      return res.status(403).json({ error: 'Team leader access required' });
    }

    req.team = team;
    next();
  } catch (error) {
    console.error('Team leader check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Room participant authorization middleware
const requireRoomParticipant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const roomId = req.params.roomId || req.body.roomId;
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    const Room = require('../models/Room');
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isParticipant = room.participants.some(participant => 
      participant.userId.toString() === req.user._id.toString() && participant.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Room participation required' });
    }

    req.room = room;
    next();
  } catch (error) {
    console.error('Room participant check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Quiz creator authorization middleware
const requireQuizCreator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const quizId = req.params.quizId || req.body.quizId;
    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID required' });
    }

    const Quiz = require('../models/Quiz');
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const isCreator = quiz.createdBy.toString() === req.user._id.toString();

    if (!isCreator) {
      return res.status(403).json({ error: 'Quiz creator access required' });
    }

    req.quiz = quiz;
    next();
  } catch (error) {
    console.error('Quiz creator check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Socket.io authentication middleware
const socketAuth = async (socket, next) => {
  try {
    await authenticateSocket(socket, next);
    
    if (socket.user) {
      try {
        const user = await createOrUpdateUser(socket.user);
        socket.user = user;
        console.log(`Socket authenticated for user: ${user.displayName} (${user._id})`);
      } catch (error) {
        console.error('Error creating/updating user in socket auth:', error);
        // In development mode, allow connection with limited functionality
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Allowing connection with limited functionality');
          socket.user = {
            uid: socket.user.uid || 'dev-user-' + Math.random().toString(36).substr(2, 9),
            email: socket.user.email || 'dev@example.com',
            displayName: socket.user.displayName || 'Development User',
            picture: socket.user.picture || null,
            _id: 'dev-' + Math.random().toString(36).substr(2, 9)
          };
        } else {
          return next(new Error('Failed to create/update user'));
        }
      }
    }
    next();
  } catch (error) {
    console.error('Socket auth middleware error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = {
  auth,
  optionalAuth,
  guestAuth,
  requireRole,
  requireTeamMember,
  requireTeamLeader,
  requireRoomParticipant,
  requireQuizCreator,
  socketAuth,
  authenticateSocket
}; 