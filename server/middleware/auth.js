const { authenticateToken, authenticateSocket, createOrUpdateUser, getUserByFirebaseUid } = require('../config/firebase');

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

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await authenticateToken(req, res, next);
      if (req.user) {
        const user = await createOrUpdateUser(req.user);
        req.user = user;
      }
    } else {
      req.user = null;
      next();
    }
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
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
      const user = await createOrUpdateUser(socket.user);
      socket.user = user;
    }
  } catch (error) {
    console.error('Socket auth middleware error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireTeamMember,
  requireTeamLeader,
  requireRoomParticipant,
  requireQuizCreator,
  socketAuth,
  authenticateSocket
}; 