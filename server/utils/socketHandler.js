const User = require('../models/User');
const Room = require('../models/Room');
const Team = require('../models/Team');

// Store active connections
const activeConnections = new Map();

// In-memory battle timers and states
const battleTimers = {};
const battleStates = {};

// Handle socket connection
const handleSocketConnection = (socket, io) => {
  console.log(`User connected: ${socket.user?.displayName || 'Unknown'}`);
  
  // Store connection
  if (socket.user) {
    activeConnections.set(socket.user._id.toString(), {
      socketId: socket.id,
      userId: socket.user._id,
      user: socket.user,
      joinedAt: new Date()
    });
  }

  // Join user to their personal room
  if (socket.user) {
    socket.join(`user:${socket.user._id}`);
    
    // Update user's online status
    updateUserStatus(socket.user._id, true);
  }

  // Handle room joining
  socket.on('join-room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Add user to room participants
      await room.addParticipant(socket.user._id);
      
      // Join socket to room
      socket.join(`room:${roomId}`);
      
      // Notify other participants
      socket.to(`room:${roomId}`).emit('user-joined-room', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        joinedAt: new Date()
      });

      // Send room info to user
      socket.emit('room-joined', {
        roomId,
        participants: room.participants.filter(p => p.isActive),
        currentActivity: room.currentActivity
      });

      console.log(`User ${socket.user.displayName} joined room ${room.name}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle room leaving
  socket.on('leave-room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const room = await Room.findById(roomId);
      if (room) {
        await room.removeParticipant(socket.user._id);
      }
      
      // Leave socket room
      socket.leave(`room:${roomId}`);
      
      // Notify other participants
      socket.to(`room:${roomId}`).emit('user-left-room', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        leftAt: new Date()
      });

      console.log(`User ${socket.user.displayName} left room ${room?.name || roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });

  // Handle chat messages
  socket.on('send-message', async (data) => {
    try {
      const { roomId, message, type = 'text' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const messageData = {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        message,
        type,
        timestamp: new Date()
      };

      // Broadcast to room
      socket.to(`room:${roomId}`).emit('new-message', messageData);
      
      // Update room stats
      const room = await Room.findById(roomId);
      if (room) {
        room.stats.messagesSent += 1;
        await room.save();
      }

      console.log(`Message sent in room ${roomId} by ${socket.user.displayName}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle quiz events
  socket.on('quiz-answer', async (data) => {
    try {
      const { roomId, quizId, questionIndex, answer, timeSpent } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Process quiz answer (implement quiz logic here)
      const answerData = {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        questionIndex,
        answer,
        timeSpent,
        timestamp: new Date()
      };

      // Broadcast to room (without revealing correct answer)
      socket.to(`room:${roomId}`).emit('quiz-answer-submitted', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        questionIndex,
        timeSpent
      });

      console.log(`Quiz answer submitted by ${socket.user.displayName}`);
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // Handle collaborative editing room joining
  socket.on('join-collab-room', async (data) => {
    try {
      const { roomId } = data;
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      // Join socket to collaborative editing room
      socket.join(`collab-room:${roomId}`);
      // Get users in the room
      const roomSockets = await io.in(`collab-room:${roomId}`).fetchSockets();
      const usersInRoom = roomSockets
        .filter(s => s.user)
        .map(s => s.user.displayName || s.user.email || 'Anonymous');
      // Broadcast updated user list to all users in the room
      io.in(`collab-room:${roomId}`).emit('users-in-room', usersInRoom);
      console.log(`User ${socket.user.displayName || socket.user.email} joined collaborative room ${roomId}`);
    } catch (error) {
      console.error('Error joining collaborative room:', error);
      socket.emit('error', { message: 'Failed to join collaborative room' });
    }
  });

  // Handle collaborative editing code changes
  socket.on('code-change', async (data) => {
    try {
      const { range, text, roomId } = data;
      // Broadcast code change to other users in the room using roomId
      socket.to(`collab-room:${roomId}`).emit('code-change', {
        range,
        text,
        userId: socket.id,
        timestamp: new Date()
      });
      console.log(`Code change by user ${socket.id}`);
    } catch (error) {
      console.error('Error handling code change:', error);
      socket.emit('error', { message: 'Failed to sync code change' });
    }
  });

  // Handle collaborative editing cursor movement
  socket.on('cursor-move', (data) => {
    const { position, roomId, userId, color, displayName } = data;
    // Broadcast cursor position to other users in the room
    socket.to(`collab-room:${roomId}`).emit('cursor-move', {
      position,
      userId: userId || socket.id,
      color,
      displayName
    });
  });

  // Handle collaborative editing room leaving
  socket.on('leave-collab-room', async (data) => {
    try {
      const { roomId } = data;
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      // Leave collaborative editing room
      socket.leave(`collab-room:${roomId}`);
      // Get updated users in the room
      const roomSockets = await io.in(`collab-room:${roomId}`).fetchSockets();
      const usersInRoom = roomSockets
        .filter(s => s.user)
        .map(s => s.user.displayName || s.user.email || 'Anonymous');
      // Broadcast updated user list to all users in the room
      io.in(`collab-room:${roomId}`).emit('users-in-room', usersInRoom);
      console.log(`User ${socket.user.displayName} left collaborative room ${roomId}`);
    } catch (error) {
      console.error('Error leaving collaborative room:', error);
      socket.emit('error', { message: 'Failed to leave collaborative room' });
    }
  });

  // Handle team events
  socket.on('join-team', async (data) => {
    try {
      const { teamId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const team = await Team.findById(teamId);
      if (!team) {
        socket.emit('error', { message: 'Team not found' });
        return;
      }

      // Join team room
      socket.join(`team:${teamId}`);
      
      // Notify team members
      socket.to(`team:${teamId}`).emit('user-joined-team', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        joinedAt: new Date()
      });

      console.log(`User ${socket.user.displayName} joined team ${team.name}`);
    } catch (error) {
      console.error('Error joining team:', error);
      socket.emit('error', { message: 'Failed to join team' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { roomId } = data;
    socket.to(`room:${roomId}`).emit('user-typing', {
      userId: socket.user._id,
      displayName: socket.user.displayName,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data) => {
    const { roomId } = data;
    socket.to(`room:${roomId}`).emit('user-typing', {
      userId: socket.user._id,
      displayName: socket.user.displayName,
      isTyping: false
    });
  });

  // Handle user status updates
  socket.on('update-status', async (data) => {
    try {
      const { status, customMessage } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Update user status in database
      await User.findByIdAndUpdate(socket.user._id, {
        'preferences.status': status,
        'preferences.customMessage': customMessage
      });

      // Broadcast status update to relevant rooms
      socket.broadcast.emit('user-status-updated', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        status,
        customMessage
      });

      console.log(`User ${socket.user.displayName} updated status to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      console.log(`User disconnected: ${socket.user?.displayName || 'Unknown'}`);
      
      if (socket.user) {
        // Remove from active connections
        activeConnections.delete(socket.user._id.toString());
        
        // Update user's online status
        await updateUserStatus(socket.user._id, false);
        
        // Notify relevant rooms about user leaving
        socket.broadcast.emit('user-offline', {
          userId: socket.user._id,
          displayName: socket.user.displayName,
          leftAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Start a coding battle
  socket.on('start-battle', (data) => {
    const { roomId, duration = 300 } = data; // duration in seconds
    if (!roomId) return;
    if (battleStates[roomId] && battleStates[roomId].state === 'active') return; // already running
    battleStates[roomId] = { state: 'active', remaining: duration };
    io.in(`room:${roomId}`).emit('start-battle', { roomId, duration });
    // Start timer
    if (battleTimers[roomId]) clearInterval(battleTimers[roomId]);
    battleTimers[roomId] = setInterval(() => {
      if (!battleStates[roomId]) return;
      battleStates[roomId].remaining -= 1;
      io.in(`room:${roomId}`).emit('battle-tick', { roomId, remaining: battleStates[roomId].remaining });
      if (battleStates[roomId].remaining <= 0) {
        clearInterval(battleTimers[roomId]);
        delete battleTimers[roomId];
        battleStates[roomId].state = 'ended';
        // TODO: Calculate result (stubbed as draw)
        io.in(`room:${roomId}`).emit('end-battle', { roomId, result: 'draw' });
      }
    }, 1000);
  });

  // End battle manually
  socket.on('end-battle', (data) => {
    const { roomId, result = 'draw' } = data;
    if (!roomId) return;
    if (battleTimers[roomId]) clearInterval(battleTimers[roomId]);
    delete battleTimers[roomId];
    battleStates[roomId] = { state: 'ended', remaining: 0 };
    io.in(`room:${roomId}`).emit('end-battle', { roomId, result });
  });

  // Get current battle state (for late joiners)
  socket.on('get-battle-state', (data) => {
    const { roomId } = data;
    if (!roomId) return;
    const state = battleStates[roomId] || { state: 'waiting', remaining: 0 };
    socket.emit('battle-state', { roomId, ...state });
  });
};

// Update user online status
const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeenAt: isOnline ? new Date() : new Date()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Get active connections
const getActiveConnections = () => {
  return Array.from(activeConnections.values());
};

// Get user's active connection
const getUserConnection = (userId) => {
  return activeConnections.get(userId.toString());
};

// Send notification to user
const sendNotification = (userId, notification) => {
  const connection = getUserConnection(userId);
  if (connection) {
    // This would need access to the io instance
    // For now, we'll return the connection info
    return connection;
  }
  return null;
};

// Broadcast to team
const broadcastToTeam = (teamId, event, data) => {
  // This would need access to the io instance
  // Implementation would be: io.to(`team:${teamId}`).emit(event, data);
  console.log(`Broadcasting to team ${teamId}:`, event, data);
};

// Broadcast to room
const broadcastToRoom = (roomId, event, data) => {
  // This would need access to the io instance
  // Implementation would be: io.to(`room:${roomId}`).emit(event, data);
  console.log(`Broadcasting to room ${roomId}:`, event, data);
};

module.exports = {
  handleSocketConnection,
  getActiveConnections,
  getUserConnection,
  sendNotification,
  broadcastToTeam,
  broadcastToRoom,
  updateUserStatus
}; 