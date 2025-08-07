const User = require('../models/User');
const Room = require('../models/Room');
const Team = require('../models/Team');
const Message = require('../models/Message');
const { calculateScore } = require('./scoring');

// Store active connections
const activeConnections = new Map();

// Store room states for collaborative editing
const roomStates = new Map();

// Store user cursors for collaborative editing
const userCursors = new Map();

// Store user selections for collaborative editing
const userSelections = new Map();

// Store code execution results for broadcasting
const executionResults = new Map();

// In-memory battle timers and states
const battleTimers = {};
const battleStates = {};

// Handle socket connection
const handleSocketConnection = (socket, io) => {
  console.log(`User connected: ${socket.user?.displayName || 'Unknown'}`);
  
  // Store connection only if user is authenticated
  if (socket.user && socket.user._id) {
    try {
      activeConnections.set(socket.user._id.toString(), {
        socketId: socket.id,
        userId: socket.user._id,
        user: socket.user,
        joinedAt: new Date()
      });

      // Join user to their personal room
      socket.join(`user:${socket.user._id}`);
      
      // Update user's online status
      updateUserStatus(socket.user._id, true);
      
      console.log(`Authenticated user ${socket.user.displayName} connected successfully`);
    } catch (error) {
      console.error('Error setting up authenticated user connection:', error);
    }
  } else {
    console.log('Unauthenticated user connected - limited functionality available');
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
      const { roomId, content, type = 'text', metadata = {} } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!content || content.trim().length === 0) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      if (content.length > 2000) {
        socket.emit('error', { message: 'Message too long (max 2000 characters)' });
        return;
      }

      // Verify room access
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if user is a participant
      const isParticipant = room.participants.some(
        p => p.userId.toString() === socket.user._id.toString() && p.isActive
      );
      
      if (!isParticipant && room.type === 'private') {
        socket.emit('error', { message: 'Access denied to private room' });
        return;
      }

      // Create and save message
      const message = new Message({
        roomId,
        sender: {
          userId: socket.user._id,
          displayName: socket.user.displayName || socket.user.email,
          avatar: socket.user.avatar
        },
        content: content.trim(),
        type,
        metadata
      });

      await message.save();
      await message.populate('sender.userId', 'displayName avatar');

      // Update room stats
      room.stats.messagesSent += 1;
      await room.save();

      // Broadcast to room
      socket.to(`room:${roomId}`).emit('new-message', message);
      
      // Send confirmation to sender
      socket.emit('message-sent', message);

      console.log(`Message sent in room ${roomId} by ${socket.user.displayName}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) return;

      socket.to(`room:${roomId}`).emit('user-typing', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        isTyping: true
      });
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  socket.on('typing-stop', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) return;

      socket.to(`room:${roomId}`).emit('user-typing', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        isTyping: false
      });
    } catch (error) {
      console.error('Error handling typing stop:', error);
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

  // Enhanced collaborative editing room joining
  socket.on('join-collab-room', async (data) => {
    try {
      const { roomId, language = 'javascript' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Join socket to collaborative editing room
      socket.join(`collab-room:${roomId}`);
      
      // Initialize room state if it doesn't exist
      if (!roomStates.has(roomId)) {
        roomStates.set(roomId, {
          code: getDefaultCode(language),
          language: language,
          lastModified: new Date(),
          version: 0,
          users: new Set(),
          executionHistory: [],
          lastExecution: null
        });
      }

      const roomState = roomStates.get(roomId);
      roomState.users.add(socket.user._id.toString());

      // Send current room state to the joining user
      socket.emit('room-state-sync', {
        code: roomState.code,
        language: roomState.language,
        version: roomState.version,
        lastModified: roomState.lastModified,
        lastExecution: roomState.lastExecution
      });

      // Get users in the room with detailed info
      const roomSockets = await io.in(`collab-room:${roomId}`).fetchSockets();
      const usersInRoom = roomSockets
        .filter(s => s.user)
        .map(s => ({
          userId: s.user._id.toString(),
          displayName: s.user.displayName || s.user.email || 'Anonymous',
          avatar: s.user.avatar,
          socketId: s.id,
          online: true,
          isEditing: false,
          lastActivity: new Date()
        }));

      // Broadcast updated user list to all users in the room
      io.in(`collab-room:${roomId}`).emit('users-in-room', usersInRoom);

      // Send current cursors to the new user
      const currentCursors = Array.from(userCursors.entries())
        .filter(([userId, cursor]) => cursor.roomId === roomId)
        .map(([userId, cursor]) => ({
          userId,
          position: cursor.position,
          color: cursor.color,
          displayName: cursor.displayName,
          avatar: cursor.avatar,
          timestamp: cursor.timestamp
        }));

      socket.emit('cursors-sync', currentCursors);

      // Send current selections to the new user
      const currentSelections = Array.from(userSelections.entries())
        .filter(([userId, selection]) => selection.roomId === roomId)
        .map(([userId, selection]) => ({
          userId,
          selection: selection.selection,
          color: selection.color,
          displayName: selection.displayName,
          avatar: selection.avatar,
          timestamp: selection.timestamp
        }));

      socket.emit('selections-sync', currentSelections);

      console.log(`User ${socket.user.displayName} joined collaborative room ${roomId}`);
    } catch (error) {
      console.error('Error joining collaborative room:', error);
      socket.emit('error', { message: 'Failed to join collaborative room' });
    }
  });

  // Enhanced collaborative editing code changes with versioning
  socket.on('code-change', async (data) => {
    try {
      const { range, text, roomId, version } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomState = roomStates.get(roomId);
      if (!roomState) {
        socket.emit('error', { message: 'Room state not found' });
        return;
      }

      // Check version to ensure consistency
      if (version !== roomState.version) {
        socket.emit('version-mismatch', {
          currentVersion: roomState.version,
          currentCode: roomState.code
        });
        return;
      }

      // Update room state
      roomState.version += 1;
      roomState.lastModified = new Date();
      roomState.lastModifiedBy = socket.user._id.toString();

      // Broadcast code change to other users in the room
      socket.to(`collab-room:${roomId}`).emit('code-change', {
        range,
        text,
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        version: roomState.version,
        timestamp: new Date()
      });

      console.log(`Code change by user ${socket.user.displayName} in room ${roomId}, version ${roomState.version}`);
    } catch (error) {
      console.error('Error handling code change:', error);
      socket.emit('error', { message: 'Failed to sync code change' });
    }
  });

  // Handle full code sync (for reconnection)
  socket.on('code-sync', async (data) => {
    try {
      const { roomId, code, version } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomState = roomStates.get(roomId);
      if (!roomState) {
        socket.emit('error', { message: 'Room state not found' });
        return;
      }

      // Update room state with new code
      roomState.code = code;
      roomState.version = version + 1;
      roomState.lastModified = new Date();
      roomState.lastModifiedBy = socket.user._id.toString();

      // Broadcast to all users in the room
      io.in(`collab-room:${roomId}`).emit('code-sync', {
        code,
        version: roomState.version,
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      console.log(`Code sync by user ${socket.user.displayName} in room ${roomId}`);
    } catch (error) {
      console.error('Error handling code sync:', error);
      socket.emit('error', { message: 'Failed to sync code' });
    }
  });

  // Enhanced cursor movement with user info and avatar
  socket.on('cursor-move', (data) => {
    try {
      const { position, roomId, color, displayName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();
      
      // Store cursor position
      userCursors.set(userId, {
        position,
        roomId,
        color: color || generateUserColor(userId),
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      // Broadcast cursor position to other users in the room
      socket.to(`collab-room:${roomId}`).emit('cursor-move', {
        position,
        userId,
        color: userCursors.get(userId).color,
        displayName: userCursors.get(userId).displayName,
        avatar: userCursors.get(userId).avatar,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling cursor move:', error);
    }
  });

  // Handle selection changes
  socket.on('selection-change', (data) => {
    try {
      const { selection, roomId, color, displayName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();
      
      // Store selection
      userSelections.set(userId, {
        selection,
        roomId,
        color: color || generateUserColor(userId),
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      // Broadcast selection to other users in the room
      socket.to(`collab-room:${roomId}`).emit('selection-change', {
        selection,
        userId,
        color: userSelections.get(userId).color,
        displayName: userSelections.get(userId).displayName,
        avatar: userSelections.get(userId).avatar,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling selection change:', error);
    }
  });

  // Handle code execution requests
  socket.on('execute-code', async (data) => {
    try {
      const { roomId, language, code, input = '' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomState = roomStates.get(roomId);
      if (!roomState) {
        socket.emit('error', { message: 'Room state not found' });
        return;
      }

      // Notify all users that code is being executed
      io.in(`collab-room:${roomId}`).emit('code-execution-started', {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      try {
        // Execute the code using the code executor
        const { executeCode } = require('./codeExecutor');
        const result = await executeCode(language, code, input);

        // Store execution result
        const executionResult = {
          success: true,
          result,
          executedBy: socket.user._id.toString(),
          displayName: socket.user.displayName,
          avatar: socket.user.avatar,
          timestamp: new Date()
        };

        roomState.lastExecution = executionResult;
        roomState.executionHistory.push(executionResult);

        // Keep only last 10 executions
        if (roomState.executionHistory.length > 10) {
          roomState.executionHistory = roomState.executionHistory.slice(-10);
        }

        // Broadcast execution result to all users in the room
        io.in(`collab-room:${roomId}`).emit('code-execution-completed', executionResult);

        console.log(`Code executed successfully by ${socket.user.displayName} in room ${roomId}`);
      } catch (executionError) {
        // Broadcast execution error to all users in the room
        io.in(`collab-room:${roomId}`).emit('code-execution-error', {
          error: executionError.message,
          executedBy: socket.user._id.toString(),
          displayName: socket.user.displayName,
          avatar: socket.user.avatar,
          timestamp: new Date()
        });

        console.error(`Code execution failed by ${socket.user.displayName} in room ${roomId}:`, executionError.message);
      }
    } catch (error) {
      console.error('Error handling code execution:', error);
      socket.emit('error', { message: 'Failed to execute code' });
    }
  });

  // Handle language changes in collaborative editing
  socket.on('language-change', async (data) => {
    try {
      const { roomId, language, code } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomState = roomStates.get(roomId);
      if (!roomState) {
        socket.emit('error', { message: 'Room state not found' });
        return;
      }

      // Update room state with new language and code
      roomState.language = language;
      roomState.code = code;
      roomState.version += 1;
      roomState.lastModified = new Date();
      roomState.lastModifiedBy = socket.user._id.toString();

      // Broadcast language change to all users in the room
      io.in(`collab-room:${roomId}`).emit('language-change', {
        language,
        code,
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      console.log(`Language changed to ${language} by user ${socket.user.displayName} in room ${roomId}`);
    } catch (error) {
      console.error('Error handling language change:', error);
      socket.emit('error', { message: 'Failed to change language' });
    }
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
      
      // Remove user from room state
      const roomState = roomStates.get(roomId);
      if (roomState) {
        roomState.users.delete(socket.user._id.toString());
        
        // Clean up room state if no users left
        if (roomState.users.size === 0) {
          roomStates.delete(roomId);
          console.log(`Room ${roomId} state cleaned up - no users left`);
        }
      }

      // Remove user cursor and selection
      userCursors.delete(socket.user._id.toString());
      userSelections.delete(socket.user._id.toString());

      // Get updated users in the room
      const roomSockets = await io.in(`collab-room:${roomId}`).fetchSockets();
      const usersInRoom = roomSockets
        .filter(s => s.user)
        .map(s => ({
          userId: s.user._id.toString(),
          displayName: s.user.displayName || s.user.email || 'Anonymous',
          avatar: s.user.avatar,
          socketId: s.id,
          online: true,
          isEditing: false,
          lastActivity: new Date()
        }));

      // Broadcast updated user list to all users in the room
      io.in(`collab-room:${roomId}`).emit('users-in-room', usersInRoom);

      // Notify other users that this user left
      socket.to(`collab-room:${roomId}`).emit('user-left-collab-room', {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar
      });

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

  // Handle editing indicators
  socket.on('editing-start', (data) => {
    const { roomId } = data;
    socket.to(`collab-room:${roomId}`).emit('user-editing', {
      userId: socket.user._id,
      displayName: socket.user.displayName,
      isEditing: true
    });
  });

  socket.on('editing-stop', (data) => {
    const { roomId } = data;
    socket.to(`collab-room:${roomId}`).emit('user-editing', {
      userId: socket.user._id,
      displayName: socket.user.displayName,
      isEditing: false
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
    console.log(`User disconnected: ${socket.user?.displayName || 'Unknown'}`);
    
    if (socket.user && socket.user._id) {
      try {
        // Remove from active connections
        activeConnections.delete(socket.user._id.toString());
        
        // Remove user cursor and selection
        userCursors.delete(socket.user._id.toString());
        userSelections.delete(socket.user._id.toString());
        
        // Update user's online status
        updateUserStatus(socket.user._id, false);
        
        // Notify all rooms that user is offline
        const userRooms = Array.from(socket.rooms).filter(room => room.startsWith('collab-room:'));
        for (const room of userRooms) {
          const roomId = room.replace('collab-room:', '');
          const roomState = roomStates.get(roomId);
          if (roomState) {
            roomState.users.delete(socket.user._id.toString());
          }
        }
        
        console.log(`User ${socket.user.displayName} disconnected successfully`);
      } catch (error) {
        console.error('Error handling user disconnect:', error);
      }
    } else {
      console.log('Unauthenticated user disconnected');
    }
  });

  // Handle reconnection requests
  socket.on('reconnect-request', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Rejoin the collaborative room
      socket.join(`collab-room:${roomId}`);
      
      const roomState = roomStates.get(roomId);
      if (roomState) {
        roomState.users.add(socket.user._id.toString());

        // Send current room state to the reconnecting user
        socket.emit('room-state-sync', {
          code: roomState.code,
          language: roomState.language,
          version: roomState.version,
          lastModified: roomState.lastModified,
          lastExecution: roomState.lastExecution
        });

        // Get updated users in the room
        const roomSockets = await io.in(`collab-room:${roomId}`).fetchSockets();
        const usersInRoom = roomSockets
          .filter(s => s.user)
          .map(s => ({
            userId: s.user._id.toString(),
            displayName: s.user.displayName || s.user.email || 'Anonymous',
            avatar: s.user.avatar,
            socketId: s.id,
            online: true,
            isEditing: false,
            lastActivity: new Date()
          }));

        // Broadcast updated user list to all users in the room
        io.in(`collab-room:${roomId}`).emit('users-in-room', usersInRoom);

        console.log(`User ${socket.user.displayName} reconnected to room ${roomId}`);
      }
    } catch (error) {
      console.error('Error handling reconnection:', error);
      socket.emit('error', { message: 'Failed to reconnect' });
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
    if (!userId) {
      console.warn('Cannot update user status: userId is null or undefined');
      return;
    }
    
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

// Helper function to generate user color
function generateUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// Helper function to get default code for language
function getDefaultCode(language) {
  const defaults = {
    javascript: `// Welcome to collaborative JavaScript coding!
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

// Start coding with your team!`,
    python: `# Welcome to collaborative Python coding!
print("Hello, World!")

def greet(name):
    return f"Hello, {name}!"

# Start coding with your team!`
  };
  
  return defaults[language] || defaults.javascript;
}

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