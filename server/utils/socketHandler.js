const User = require('../models/User');
const Room = require('../models/Room');
const Team = require('../models/Team');
const Message = require('../models/Message');
const CollaborativeSession = require('../models/CollaborativeSession');
const { calculateScore } = require('./scoring');
const CodePersistenceManager = require('./codePersistence');
// const { handleInteractiveTerminal } = require('./interactiveTerminal');
// const { handleEnhancedInteractiveTerminal } = require('./enhancedTerminal');
const concurrentExecutionManager = require('./concurrentExecutionManager');
const debugManager = require('./debugManager');
const roomStateManager = require('./roomStateManager');
const persistentStateManager = roomStateManager.persistentStateManager;

// Store active connections
const activeConnections = new Map();

// Store room states for collaborative editing
const roomStates = new Map();

// Store collaborative session states
const sessionStates = new Map();

// Store user cursors for collaborative editing
const userCursors = new Map();

// Store user selections for collaborative editing
const userSelections = new Map();

// Store follow relationships for battle mode
const followRelationships = new Map(); // followerId -> { followingId, roomId, mode }

// Store viewport states for following
const viewportStates = new Map(); // userId -> { scrollTop, scrollLeft, visibleRange }

// Enhanced collaborator tracking with detailed status
const collaboratorStatus = new Map(); // userId -> { sessionId, status, lastActivity, isTyping, isEditing }

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

  // Set up interactive terminal handlers
  // handleInteractiveTerminal(socket, io);
  
  // Set up enhanced interactive terminal handlers
  // handleEnhancedInteractiveTerminal(socket, io);

  // Handle room joining
  socket.on('join-room', async (data) => {
    try {
      const { roomId, mode = 'collaborative', role = 'participant' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Validate role
      if (!['participant', 'spectator'].includes(role)) {
        socket.emit('error', { message: 'Invalid role. Must be participant or spectator' });
        return;
      }

      // Add user to room participants with specified role
      await room.addParticipant(socket.user._id, { role });
      
      // Update room state manager
      try {
        await roomStateManager.joinRoomByCode(room.roomCode, socket.user._id, { role });
      } catch (stateError) {
        console.warn('⚠️ Failed to update room state manager:', stateError.message);
      }
      
      // Join socket to room based on mode and role
      socket.join(`room:${roomId}`);
      if (mode === 'battle') {
        socket.join(`battle:${roomId}`);
        if (role === 'spectator') {
          socket.join(`spectator:${roomId}`);
        }
      }
      
      // Notify other participants
      socket.to(`room:${roomId}`).emit('user-joined-room', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        role: role,
        joinedAt: new Date()
      });

      // Also emit participant-joined for battle rooms
      socket.to(`room:${roomId}`).emit('participant-joined', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        role: role,
        joinedAt: new Date(),
        roomId: roomId
      });

      // Send room info to user
      socket.emit('room-joined', {
        roomId,
        participants: room.participants.filter(p => p.isActive),
        currentActivity: room.currentActivity,
        role: role,
        isSpectator: role === 'spectator'
      });

      console.log(`User ${socket.user.displayName} joined room ${room.name} as ${role}`);
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

      // Also emit participant-left for battle rooms
      socket.to(`room:${roomId}`).emit('participant-left', {
        userId: socket.user._id,
        displayName: socket.user.displayName,
        leftAt: new Date(),
        roomId: roomId
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

  // Handle follow user functionality
  socket.on('follow-user', async (data) => {
    try {
      const { roomId, followedUserId, followerUserId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // For collaborative sessions, we'll use the sessionId as roomId
      // Check if the user is in the collaborative session
      const sessionState = sessionStates.get(roomId);
      if (!sessionState) {
        // Try room state as fallback
        const roomState = roomStates.get(roomId);
        if (!roomState) {
          socket.emit('error', { message: 'Session/Room not found' });
          return;
        }
        
        // Check if both users are in the room
        if (!roomState.users.has(followedUserId) || !roomState.users.has(followerUserId)) {
          socket.emit('error', { message: 'One or both users not found in session' });
          return;
        }
      } else {
        // Check if both users are in the session
        if (!sessionState.users.has(followedUserId) || !sessionState.users.has(followerUserId)) {
          socket.emit('error', { message: 'One or both users not found in session' });
          return;
        }
      }

      // Get user information
      const followedUser = activeConnections.get(followedUserId)?.user;
      const followerUser = activeConnections.get(followerUserId)?.user;

      if (!followedUser || !followerUser) {
        socket.emit('error', { message: 'User information not found' });
        return;
      }

      // Emit follow confirmation to the follower
      socket.emit('user-following', {
        followerId: followerUserId,
        followedId: followedUserId,
        displayName: followedUser.displayName || followedUser.email || 'Anonymous'
      });

      // Notify the followed user that someone is following them
      const followedSocket = io.sockets.sockets.get(Array.from(io.sockets.sockets.keys()).find(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        return socket.user && socket.user._id.toString() === followedUserId;
      }));
      
      if (followedSocket) {
        followedSocket.emit('user-being-followed', {
          followerId: followerUserId,
          followerName: followerUser.displayName || followerUser.email || 'Anonymous',
          timestamp: new Date()
        });
      }

      console.log(`User ${followerUser.displayName} started following ${followedUser.displayName} in session ${roomId}`);
    } catch (error) {
      console.error('Error handling follow user:', error);
      socket.emit('error', { message: 'Failed to follow user' });
    }
  });

  // Handle unfollow user functionality
  socket.on('unfollow-user', async (data) => {
    try {
      const { roomId, followedUserId, followerUserId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // For collaborative sessions, we'll use the sessionId as roomId
      // Check if the user is in the collaborative session
      const sessionState = sessionStates.get(roomId);
      if (!sessionState) {
        // Try room state as fallback
        const roomState = roomStates.get(roomId);
        if (!roomState) {
          socket.emit('error', { message: 'Session/Room not found' });
          return;
        }
      }

      // Get user information
      const followedUser = activeConnections.get(followedUserId)?.user;
      const followerUser = activeConnections.get(followerUserId)?.user;

      if (!followedUser || !followerUser) {
        socket.emit('error', { message: 'User information not found' });
        return;
      }

      // Emit unfollow confirmation to the follower
      socket.emit('user-unfollowed', {
        followerId: followerUserId,
        followedId: followedUserId,
        displayName: followedUser.displayName || followedUser.email || 'Anonymous'
      });

      console.log(`User ${followerUser.displayName} stopped following ${followedUser.displayName} in session ${roomId}`);
    } catch (error) {
      console.error('Error handling unfollow user:', error);
      socket.emit('error', { message: 'Failed to unfollow user' });
    }
  });

  // Handle followed user changes (for real-time following)
  socket.on('followed-user-change', async (data) => {
    try {
      const { roomId, userId, displayName, range, text, version } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Broadcast the change to all users following this user in the same session
      // Try both collaborative session and room contexts
      const sessionState = sessionStates.get(roomId);
      if (sessionState) {
        // Collaborative session context
        socket.to(`collaborative-session:${roomId}`).emit('followed-user-change', {
          userId,
          displayName,
          range,
          text,
          version,
          timestamp: new Date()
        });
      } else {
        // Regular room context
        socket.to(`collab-room:${roomId}`).emit('followed-user-change', {
          userId,
          displayName,
          range,
          text,
          version,
          timestamp: new Date()
        });
      }

      console.log(`Followed user change broadcasted for ${displayName} in session/room ${roomId}`);
    } catch (error) {
      console.error('Error handling followed user change:', error);
      socket.emit('error', { message: 'Failed to broadcast followed user change' });
    }
  });

  // Enhanced collaborative editing room joining
  socket.on('join-collab-room', async (data) => {
    try {
      const { roomId, language = 'javascript', userInfo } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Ensure user has database _id property
      if (!socket.user._id) {
        console.error('User missing _id property:', socket.user);
        socket.emit('error', { message: 'User authentication incomplete. Please refresh and try again.' });
        return;
      }

      // Validate roomId
      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // If client provided userInfo, prefer it for display in development or when missing
      try {
        if (userInfo && typeof userInfo === 'object') {
          const isDev = process.env.NODE_ENV === 'development';
          const isDefaultDevName = socket.user.displayName === 'Development User';
          const shouldOverrideName = !socket.user.displayName || isDev || isDefaultDevName;
          const shouldOverrideAvatar = !socket.user.avatar || isDev || isDefaultDevName;
          if (shouldOverrideName && userInfo.displayName) {
            socket.user.displayName = userInfo.displayName;
          }
          if (shouldOverrideAvatar && userInfo.avatar) {
            socket.user.avatar = userInfo.avatar;
          }
        }
      } catch (e) {
        console.warn('Non-fatal: failed to apply client userInfo override:', e?.message || e);
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
        .filter(s => s.user && s.user._id)
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

      // Emit user joined notification to all users in the room (including the new user)
      const userJoinedData = {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        joinedAt: new Date(),
        totalUsers: usersInRoom.length
      };
      
      // Notify other users that someone joined
      socket.to(`collab-room:${roomId}`).emit('user-joined-room', userJoinedData);
      
      // Send confirmation to the joining user
      socket.emit('user-joined-confirmation', {
        ...userJoinedData,
        message: `Successfully joined room ${roomId}`,
        existingUsers: usersInRoom.filter(u => u.userId !== socket.user._id.toString())
      });

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

      console.log(`User ${socket.user.displayName} (${socket.user._id}) joined collaborative room ${roomId}`);
    } catch (error) {
      console.error('Error joining collaborative room:', error);
      socket.emit('error', { message: 'Failed to join collaborative room: ' + (error.message || 'Unknown error') });
    }
  });

  // Join collaborative session by session ID (for sharable URLs)
  socket.on('join-collaborative-session', async (data) => {
    try {
      const { sessionId, accessCode } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Find the collaborative session
      const session = await CollaborativeSession.findBySessionId(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Check if session is active
      if (session.status !== 'active') {
        socket.emit('error', { message: 'Session is not active' });
        return;
      }

      // Check access code if required
      if (session.accessCode && session.accessCode !== accessCode) {
        socket.emit('error', { message: 'Invalid access code' });
        return;
      }

      // Check if access code is expired
      if (session.accessCodeExpiresAt && new Date() > session.accessCodeExpiresAt) {
        socket.emit('error', { message: 'Access code has expired' });
        return;
      }

      // Join socket to collaborative session room
      socket.join(`collaborative-session:${sessionId}`);
      
             // Initialize session state if it doesn't exist
       if (!sessionStates.has(sessionId)) {
         const defaultFile = session.files.find(f => f.isActive) || session.files[0];
         sessionStates.set(sessionId, {
           sessionId: session.sessionId,
           name: session.name,
           language: session.defaultLanguage,
           files: session.files.filter(f => f.isActive),
           currentFile: defaultFile ? defaultFile.fileName : 'main.js',
           lastModified: new Date(),
           version: 0,
           users: new Set(),
           executionHistory: [],
           lastExecution: null,
           settings: session.settings
         });

         // Initialize code persistence manager for this session
         await CodePersistenceManager.loadSessionState(sessionId);
       }

      const sessionState = sessionStates.get(sessionId);
      sessionState.users.add(socket.user._id.toString());

      // Enhanced collaborator status tracking
      updateCollaboratorStatus(socket.user._id.toString(), sessionId, {
        status: 'active',
        role: 'editor',
        isTyping: false,
        isEditing: false
      });

      // Check if user is already a collaborator, if not add them
      const existingCollaborator = session.collaborators.find(c => 
        c.userId.toString() === socket.user._id.toString()
      );

      if (!existingCollaborator) {
        await session.addCollaborator(socket.user._id, 'editor');
        await session.addActivityRecord(socket.user._id, 'join');
      } else {
        // Update online status
        existingCollaborator.isOnline = true;
        existingCollaborator.lastActive = new Date();
        await session.save();
      }

      // Send current session state to the joining user
      socket.emit('session-state-sync', {
        sessionId: session.sessionId,
        name: session.name,
        language: sessionState.language,
        files: sessionState.files,
        currentFile: sessionState.currentFile,
        version: sessionState.version,
        lastModified: sessionState.lastModified,
        lastExecution: sessionState.lastExecution,
        settings: sessionState.settings
      });

      // Get enhanced collaborator list with detailed status
      const usersInSession = await getSessionCollaborators(sessionId);

      // Broadcast updated user list to all users in the session
      io.in(`collaborative-session:${sessionId}`).emit('users-in-session', usersInSession);
      
      // Emit user joined notification to all users in the session
      const userJoinedData = {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        joinedAt: new Date(),
        totalUsers: usersInSession.length,
        sessionId: sessionId
      };
      
      // Notify other users that someone joined
      socket.to(`collaborative-session:${sessionId}`).emit('user-joined-session', userJoinedData);
      
      // Send confirmation to the joining user
      socket.emit('user-joined-session-confirmation', {
        ...userJoinedData,
        message: `Successfully joined session ${sessionId}`,
        existingUsers: usersInSession.filter(u => u.userId !== socket.user._id.toString())
      });

      // Send current cursors to the new user
      const currentCursors = Array.from(userCursors.entries())
        .filter(([userId, cursor]) => cursor.sessionId === sessionId)
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
        .filter(([userId, selection]) => selection.sessionId === sessionId)
        .map(([userId, selection]) => ({
          userId,
          selection: selection.selection,
          color: selection.color,
          displayName: selection.displayName,
          avatar: selection.avatar,
          timestamp: selection.timestamp
        }));

      socket.emit('selections-sync', currentSelections);

      // Enhanced collaborator join notification
      await broadcastCollaboratorUpdate(sessionId, socket.user._id.toString(), 'join', {
        joinedAt: new Date()
      });

      console.log(`User ${socket.user.displayName} joined collaborative session ${sessionId}`);
    } catch (error) {
      console.error('Error joining collaborative session:', error);
      socket.emit('error', { message: 'Failed to join collaborative session' });
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

  // Collaborative session code changes
  socket.on('session-code-change', async (data) => {
    try {
      const { range, text, sessionId, fileName, version } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const sessionState = sessionStates.get(sessionId);
      if (!sessionState) {
        socket.emit('error', { message: 'Session state not found' });
        return;
      }

      // Check version to ensure consistency
      if (version !== sessionState.version) {
        socket.emit('version-mismatch', {
          currentVersion: sessionState.version,
          currentCode: sessionState.files.find(f => f.fileName === fileName)?.content || ''
        });
        return;
      }

      // Update session state
      sessionState.version += 1;
      sessionState.lastModified = new Date();
      sessionState.lastModifiedBy = socket.user._id.toString();

             // Update file content
       const file = sessionState.files.find(f => f.fileName === fileName);
       if (file) {
         // Apply the change to the file content
         // This is a simplified version - in a real implementation, you'd use operational transformation
         file.content = applyTextChange(file.content, range, text);
         file.version += 1;
         file.lastModified = new Date();
         file.lastModifiedBy = socket.user._id.toString();

         // Update code persistence manager
         CodePersistenceManager.updateFileContent(
           sessionId, 
           fileName, 
           file.content, 
           file.version, 
           socket.user._id
         );
         CodePersistenceManager.markDirty(sessionId, fileName);
       }

       // Update the session in the database (now handled by persistence manager)
       const session = await CollaborativeSession.findBySessionId(sessionId);
       if (session) {
         await session.addActivityRecord(socket.user._id, 'edit', fileName);
       }

      // Broadcast code change to other users in the session
      socket.to(`collaborative-session:${sessionId}`).emit('session-code-change', {
        range,
        text,
        fileName,
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        version: sessionState.version,
        timestamp: new Date()
      });

      console.log(`Code change by user ${socket.user.displayName} in session ${sessionId}, file ${fileName}, version ${sessionState.version}`);
    } catch (error) {
      console.error('Error handling session code change:', error);
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

  // Collaborative session cursor movement
  socket.on('session-cursor-move', (data) => {
    try {
      const { position, sessionId, color, displayName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();
      
      // Store cursor position
      userCursors.set(userId, {
        position,
        sessionId,
        color: color || generateUserColor(userId),
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      // Broadcast cursor position to other users in the session
      socket.to(`collaborative-session:${sessionId}`).emit('session-cursor-move', {
        position,
        userId,
        color: userCursors.get(userId).color,
        displayName: userCursors.get(userId).displayName,
        avatar: userCursors.get(userId).avatar,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling session cursor move:', error);
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

  // Collaborative session selection changes
  socket.on('session-selection-change', (data) => {
    try {
      const { selection, sessionId, color, displayName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();
      
      // Store selection
      userSelections.set(userId, {
        selection,
        sessionId,
        color: color || generateUserColor(userId),
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      // Broadcast selection to other users in the session
      socket.to(`collaborative-session:${sessionId}`).emit('session-selection-change', {
        selection,
        userId,
        color: userSelections.get(userId).color,
        displayName: userSelections.get(userId).displayName,
        avatar: userSelections.get(userId).avatar,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling session selection change:', error);
    }
  });

  // Handle cursor position for battle mode
  socket.on('cursor-position', (data) => {
    try {
      const { position, roomId, mode, color, displayName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();
      
      // Store cursor position
      userCursors.set(userId, {
        position,
        roomId,
        mode,
        color: color || generateUserColor(userId),
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      // Broadcast cursor position to other users in the room
      const roomKey = mode === 'battle' ? `battle:${roomId}` : `room:${roomId}`;
      socket.to(roomKey).emit('cursor-position', {
        position,
        userId,
        color: userCursors.get(userId).color,
        displayName: userCursors.get(userId).displayName,
        avatar: userCursors.get(userId).avatar,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling cursor position:', error);
    }
  });

  // Handle user selection for battle mode
  socket.on('user-selection', (data) => {
    try {
      const { selection, roomId, mode, color, displayName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();
      
      // Store selection
      userSelections.set(userId, {
        selection,
        roomId,
        mode,
        color: color || generateUserColor(userId),
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      // Broadcast selection to other users in the room
      const roomKey = mode === 'battle' ? `battle:${roomId}` : `room:${roomId}`;
      socket.to(roomKey).emit('user-selection', {
        selection,
        userId,
        color: userSelections.get(userId).color,
        displayName: userSelections.get(userId).displayName,
        avatar: userSelections.get(userId).avatar,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling user selection:', error);
    }
  });

  // Handle battle code changes (diff-like events) and broadcast to participants
  socket.on('battle-code-change', (data) => {
    try {
      const { roomId, range, text, version } = data || {};
      if (!roomId) return;
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomKey = `battle:${roomId}`;
      const payload = {
        userId: socket.user._id?.toString?.() || 'anonymous',
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar || '👤',
        range,
        text,
        version: typeof version === 'number' ? version : undefined,
        timestamp: new Date()
      };
      socket.to(roomKey).emit('battle-code-change', payload);
    } catch (error) {
      console.error('Error handling battle-code-change:', error);
      socket.emit('error', { message: 'Failed to handle battle code change' });
    }
  });

  // Handle start following a user
  socket.on('start-following', (data) => {
    try {
      const { followingUserId, roomId, mode = 'battle' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const followerId = socket.user._id.toString();
      
      // Store follow relationship
      followRelationships.set(followerId, {
        followingId: followingUserId,
        roomId,
        mode,
        startedAt: new Date()
      });

      // Notify the followed user
      const roomKey = mode === 'battle' ? `battle:${roomId}` : `room:${roomId}`;
      socket.to(roomKey).emit('user-following', {
        followerId,
        followingId: followingUserId,
        followerName: socket.user.displayName || socket.user.email || 'Anonymous',
        followerAvatar: socket.user.avatar,
        timestamp: new Date()
      });

      // Send confirmation to follower
      socket.emit('follow-started', {
        followingId: followingUserId,
        followingName: 'User', // Will be updated when we get user info
        timestamp: new Date()
      });

      console.log(`User ${socket.user.displayName} started following user ${followingUserId} in ${mode} room ${roomId}`);
    } catch (error) {
      console.error('Error handling start following:', error);
    }
  });

  // Handle stop following a user
  socket.on('stop-following', (data) => {
    try {
      const { roomId, mode = 'battle' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const followerId = socket.user._id.toString();
      const followData = followRelationships.get(followerId);
      
      if (followData) {
        const { followingId } = followData;
        
        // Remove follow relationship
        followRelationships.delete(followerId);
        
        // Notify the followed user
        const roomKey = mode === 'battle' ? `battle:${roomId}` : `room:${roomId}`;
        socket.to(roomKey).emit('user-unfollowed', {
          followerId,
          followingId,
          followerName: socket.user.displayName || socket.user.email || 'Anonymous',
          timestamp: new Date()
        });

        // Send confirmation to follower
        socket.emit('follow-stopped', {
          followingId,
          timestamp: new Date()
        });

        console.log(`User ${socket.user.displayName} stopped following user ${followingId} in ${mode} room ${roomId}`);
      }
    } catch (error) {
      console.error('Error handling stop following:', error);
    }
  });

  // Handle viewport synchronization
  socket.on('viewport-sync', (data) => {
    try {
      const { viewport, roomId, mode = 'battle' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();
      
      // Store viewport state
      viewportStates.set(userId, {
        ...viewport,
        timestamp: new Date()
      });

      // Find all followers of this user
      const followers = Array.from(followRelationships.entries())
        .filter(([, followData]) => followData.followingId === userId && followData.roomId === roomId)
        .map(([followerId]) => followerId);

      // Send viewport update to followers
      if (followers.length > 0) {
        const roomKey = mode === 'battle' ? `battle:${roomId}` : `room:${roomId}`;
        followers.forEach(followerId => {
          socket.to(roomKey).emit('viewport-update', {
            userId,
            viewport,
            timestamp: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Error handling viewport sync:', error);
    }
  });

  // Create new file in collaborative session
  socket.on('session-file-create', async (data) => {
    try {
      const { sessionId, fileName, language, content = '' } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const sessionState = sessionStates.get(sessionId);
      if (!sessionState) {
        socket.emit('error', { message: 'Session state not found' });
        return;
      }

      // Check if file already exists
      const existingFile = sessionState.files.find(f => f.fileName === fileName);
      if (existingFile) {
        socket.emit('error', { message: 'File already exists' });
        return;
      }

      // Create new file in session state
      const newFile = {
        fileName,
        filePath: `/${fileName}`,
        language,
        content,
        version: 0,
        lastModified: new Date(),
        lastModifiedBy: socket.user._id.toString(),
        isActive: true
      };

      sessionState.files.push(newFile);
      sessionState.version += 1;
      sessionState.lastModified = new Date();
      sessionState.lastModifiedBy = socket.user._id.toString();

             // Update the session in the database
       const session = await CollaborativeSession.findBySessionId(sessionId);
       if (session) {
         await session.addFile(fileName, language, content, socket.user._id);
         await session.addActivityRecord(socket.user._id, 'create_file', fileName);
         
         // Update code persistence manager
         CodePersistenceManager.updateFileContent(
           sessionId, 
           fileName, 
           content, 
           0, 
           socket.user._id
         );
         CodePersistenceManager.markDirty(sessionId, fileName);
       }

      // Broadcast file creation to all users in the session
      io.in(`collaborative-session:${sessionId}`).emit('session-file-created', {
        file: newFile,
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        version: sessionState.version,
        timestamp: new Date()
      });

      console.log(`File ${fileName} created by user ${socket.user.displayName} in session ${sessionId}`);
    } catch (error) {
      console.error('Error creating file:', error);
      socket.emit('error', { message: 'Failed to create file' });
    }
  });

  // Delete file in collaborative session
  socket.on('session-file-delete', async (data) => {
    try {
      const { sessionId, fileName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const sessionState = sessionStates.get(sessionId);
      if (!sessionState) {
        socket.emit('error', { message: 'Session state not found' });
        return;
      }

      // Find the file to delete
      const fileIndex = sessionState.files.findIndex(f => f.fileName === fileName);
      if (fileIndex === -1) {
        socket.emit('error', { message: 'File not found' });
        return;
      }

      // Soft delete the file
      sessionState.files[fileIndex].isActive = false;
      sessionState.version += 1;
      sessionState.lastModified = new Date();
      sessionState.lastModifiedBy = socket.user._id.toString();

             // Update the session in the database
       const session = await CollaborativeSession.findBySessionId(sessionId);
       if (session) {
         await session.deleteFile(fileName);
         await session.addActivityRecord(socket.user._id, 'delete_file', fileName);
         
         // Mark session as dirty for persistence manager
         CodePersistenceManager.markDirty(sessionId, fileName);
       }

      // Broadcast file deletion to all users in the session
      io.in(`collaborative-session:${sessionId}`).emit('session-file-deleted', {
        fileName,
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        version: sessionState.version,
        timestamp: new Date()
      });

      console.log(`File ${fileName} deleted by user ${socket.user.displayName} in session ${sessionId}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      socket.emit('error', { message: 'Failed to delete file' });
    }
  });

  // Switch active file in collaborative session
  socket.on('session-file-switch', async (data) => {
    try {
      const { sessionId, fileName } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const sessionState = sessionStates.get(sessionId);
      if (!sessionState) {
        socket.emit('error', { message: 'Session state not found' });
        return;
      }

      // Check if file exists and is active
      const file = sessionState.files.find(f => f.fileName === fileName && f.isActive);
      if (!file) {
        socket.emit('error', { message: 'File not found or inactive' });
        return;
      }

      // Update current file
      sessionState.currentFile = fileName;
      sessionState.lastModified = new Date();
      sessionState.lastModifiedBy = socket.user._id.toString();

      // Broadcast file switch to all users in the session
      io.in(`collaborative-session:${sessionId}`).emit('session-file-switched', {
        fileName,
        file,
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      console.log(`File switched to ${fileName} by user ${socket.user.displayName} in session ${sessionId}`);
    } catch (error) {
      console.error('Error switching file:', error);
      socket.emit('error', { message: 'Failed to switch file' });
    }
  });

  // Handle code execution requests with concurrent execution management
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

      try {
        // Use concurrent execution manager to handle the execution
        const result = await concurrentExecutionManager.requestExecution(
          roomId,
          socket.user._id.toString(),
          socket.user.displayName,
          socket.user.avatar,
          language,
          code,
          input,
          socket,
          io
        );

        // Store execution result in room state for backward compatibility
        const executionResult = {
          success: true,
          result: result.result,
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

        console.log(`Code executed successfully by ${socket.user.displayName} in room ${roomId}`);
      } catch (executionError) {
        console.error(`Code execution failed by ${socket.user.displayName} in room ${roomId}:`, executionError.message);
        socket.emit('error', { message: executionError.message });
      }
    } catch (error) {
      console.error('Error handling code execution:', error);
      socket.emit('error', { message: 'Failed to execute code' });
    }
  });

  // Handle execution status requests
  socket.on('get-execution-status', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const status = concurrentExecutionManager.getRoomExecutionStatus(roomId);
      socket.emit('execution-status', status);
    } catch (error) {
      console.error('Error getting execution status:', error);
      socket.emit('error', { message: 'Failed to get execution status' });
    }
  });

  // Handle execution history requests
  socket.on('get-execution-history', async (data) => {
    try {
      const { roomId, limit = 20 } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const history = concurrentExecutionManager.getRoomExecutionHistory(roomId, limit);
      socket.emit('execution-history', history);
    } catch (error) {
      console.error('Error getting execution history:', error);
      socket.emit('error', { message: 'Failed to get execution history' });
    }
  });

  // Handle execution cancellation
  socket.on('cancel-execution', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      concurrentExecutionManager.cancelUserExecution(socket.user._id.toString(), roomId);
      socket.emit('execution-cancelled');
      
      // Notify other users
      socket.to(`collab-room:${roomId}`).emit('execution-cancelled', {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error cancelling execution:', error);
      socket.emit('error', { message: 'Failed to cancel execution' });
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
      const userLeftData = {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        leftAt: new Date(),
        totalUsers: usersInRoom.length
      };
      
      socket.to(`collab-room:${roomId}`).emit('user-left-collab-room', userLeftData);
      
      // Send confirmation to the leaving user
      socket.emit('user-left-confirmation', {
        ...userLeftData,
        message: `Successfully left room ${roomId}`
      });

      console.log(`User ${socket.user.displayName} left collaborative room ${roomId}`);
    } catch (error) {
      console.error('Error leaving collaborative room:', error);
      socket.emit('error', { message: 'Failed to leave collaborative room' });
    }
  });

  // Leave collaborative session
  socket.on('leave-collaborative-session', async (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Leave collaborative session room
      socket.leave(`collaborative-session:${sessionId}`);
      
      // Remove user from session state
      const sessionState = sessionStates.get(sessionId);
      if (sessionState) {
        sessionState.users.delete(socket.user._id.toString());
        
               // Clean up session state if no users left
       if (sessionState.users.size === 0) {
         sessionStates.delete(sessionId);
         
         // Force final save and cleanup persistence manager
         await CodePersistenceManager.forceSave(sessionId);
         CodePersistenceManager.cleanupSession(sessionId);
         
         console.log(`Session ${sessionId} state cleaned up - no users left`);
       }
      }

      // Enhanced collaborator cleanup
      removeCollaboratorStatus(socket.user._id.toString());
      userCursors.delete(socket.user._id.toString());
      userSelections.delete(socket.user._id.toString());

      // Update session in database
      const session = await CollaborativeSession.findBySessionId(sessionId);
      if (session) {
        await session.addActivityRecord(socket.user._id, 'leave');
      }

      // Get updated enhanced collaborator list
      const usersInSession = await getSessionCollaborators(sessionId);

      // Broadcast updated user list to all users in the session
      io.in(`collaborative-session:${sessionId}`).emit('users-in-session', usersInSession);

      // Enhanced collaborator leave notification
      await broadcastCollaboratorUpdate(sessionId, socket.user._id.toString(), 'leave', {
        leftAt: new Date()
      });
      
      // Emit user left notification to all users in the session
      const userLeftData = {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        leftAt: new Date(),
        totalUsers: usersInSession.length,
        sessionId: sessionId
      };
      
      socket.to(`collaborative-session:${sessionId}`).emit('user-left-session', userLeftData);
      
      // Send confirmation to the leaving user
      socket.emit('user-left-session-confirmation', {
        ...userLeftData,
        message: `Successfully left session ${sessionId}`
      });

      console.log(`User ${socket.user.displayName} left collaborative session ${sessionId}`);
    } catch (error) {
      console.error('Error leaving collaborative session:', error);
      socket.emit('error', { message: 'Failed to leave collaborative session' });
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

  // Enhanced collaborative session typing indicators
  socket.on('session-typing-start', async (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) return;

      // Update collaborator status
      updateCollaboratorStatus(socket.user._id.toString(), sessionId, {
        isTyping: true
      });

      // Broadcast typing status
      await broadcastCollaboratorUpdate(sessionId, socket.user._id.toString(), 'typing', {
        isTyping: true
      });
    } catch (error) {
      console.error('Error handling session typing start:', error);
    }
  });

  socket.on('session-typing-stop', async (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) return;

      // Update collaborator status
      updateCollaboratorStatus(socket.user._id.toString(), sessionId, {
        isTyping: false
      });

      // Broadcast typing status
      await broadcastCollaboratorUpdate(sessionId, socket.user._id.toString(), 'typing', {
        isTyping: false
      });
    } catch (error) {
      console.error('Error handling session typing stop:', error);
    }
  });

  // Enhanced collaborative session editing indicators
  socket.on('session-editing-start', async (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) return;

      // Update collaborator status
      updateCollaboratorStatus(socket.user._id.toString(), sessionId, {
        isEditing: true
      });

      // Broadcast editing status
      await broadcastCollaboratorUpdate(sessionId, socket.user._id.toString(), 'editing', {
        isEditing: true
      });
    } catch (error) {
      console.error('Error handling session editing start:', error);
    }
  });

  socket.on('session-editing-stop', async (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) return;

      // Update collaborator status
      updateCollaboratorStatus(socket.user._id.toString(), sessionId, {
        isEditing: false
      });

      // Broadcast editing status
      await broadcastCollaboratorUpdate(sessionId, socket.user._id.toString(), 'editing', {
        isEditing: false
      });
    } catch (error) {
      console.error('Error handling session editing stop:', error);
    }
  });

     // Get detailed collaborator information
   socket.on('get-collaborators', async (data) => {
     try {
       const { sessionId } = data;
       
       if (!socket.user) {
         socket.emit('error', { message: 'Authentication required' });
         return;
       }

       // Get enhanced collaborator list
       const collaborators = await getSessionCollaborators(sessionId);
       
       // Send detailed collaborator information
       socket.emit('collaborators-info', {
         sessionId,
         collaborators,
         totalCollaborators: collaborators.length,
         timestamp: new Date()
       });

       console.log(`Sent collaborator info to ${socket.user.displayName} for session ${sessionId}`);
     } catch (error) {
       console.error('Error getting collaborators:', error);
       socket.emit('error', { message: 'Failed to get collaborators' });
     }
   });

   // Recover session state after reconnection
   socket.on('recover-session-state', async (data) => {
     try {
       const { sessionId, fileName } = data;
       
       if (!socket.user) {
         socket.emit('error', { message: 'Authentication required' });
         return;
       }

       // Recover session state from persistence manager
       const recoveredState = await CodePersistenceManager.recoverSessionState(sessionId, fileName);
       
       // Send recovered state to client
       socket.emit('session-state-recovered', {
         sessionId,
         source: recoveredState.source,
         files: recoveredState.files,
         lastModified: recoveredState.lastModified,
         timestamp: new Date()
       });

       console.log(`Recovered session state for ${socket.user.displayName} in session ${sessionId} from ${recoveredState.source}`);
     } catch (error) {
       console.error('Error recovering session state:', error);
       socket.emit('error', { message: 'Failed to recover session state' });
     }
   });

   // Force save session state
   socket.on('force-save-session', async (data) => {
     try {
       const { sessionId } = data;
       
       if (!socket.user) {
         socket.emit('error', { message: 'Authentication required' });
         return;
       }

       // Force immediate save
       await CodePersistenceManager.forceSave(sessionId);
       
       // Get save statistics
       const stats = CodePersistenceManager.getSessionStats(sessionId);
       
       socket.emit('session-saved', {
         sessionId,
         saveCount: stats?.saveCount || 0,
         lastSave: stats?.lastSave || new Date(),
         timestamp: new Date()
       });

       console.log(`Force saved session ${sessionId} by ${socket.user.displayName}`);
     } catch (error) {
       console.error('Error force saving session:', error);
       socket.emit('error', { message: 'Failed to save session' });
     }
   });

   // Get session persistence statistics
   socket.on('get-session-stats', async (data) => {
     try {
       const { sessionId } = data;
       
       if (!socket.user) {
         socket.emit('error', { message: 'Authentication required' });
         return;
       }

       const stats = CodePersistenceManager.getSessionStats(sessionId);
       
       if (stats) {
         socket.emit('session-stats', {
           sessionId,
           ...stats,
           timestamp: new Date()
         });
       } else {
         socket.emit('error', { message: 'Session not found or not active' });
       }

       console.log(`Sent session stats to ${socket.user.displayName} for session ${sessionId}`);
     } catch (error) {
       console.error('Error getting session stats:', error);
       socket.emit('error', { message: 'Failed to get session statistics' });
     }
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
        
        // Enhanced collaborator cleanup on disconnect
        removeCollaboratorStatus(socket.user._id.toString());
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
    io.in(`room:${roomId}`).emit('battle-started', { roomId, duration });
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
        io.in(`room:${roomId}`).emit('battle-ended', { roomId, result: 'draw' });
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
    io.in(`room:${roomId}`).emit('battle-ended', { roomId, result });
  });

  // ================= Screen Sharing (WebRTC signaling relay) =================
  // Track active screen sharers per room
  const roomScreenSharers = new Map(); // roomId -> Set<userId>

  // Helper to broadcast current sharers in a room
  const broadcastSharers = (roomId) => {
    const sharers = Array.from(roomScreenSharers.get(roomId) || []);
    io.in(`room:${roomId}`).emit('screenshare-sharers', { roomId, sharers });
  };

  // Announce start of screen sharing
  socket.on('screenshare-start', (data) => {
    const { roomId } = data || {};
    if (!roomId || !socket.user) return;
    if (!roomScreenSharers.has(roomId)) roomScreenSharers.set(roomId, new Set());
    roomScreenSharers.get(roomId).add(socket.user.id);
    io.in(`room:${roomId}`).emit('screenshare-started', {
      roomId,
      userId: socket.user.id,
      displayName: socket.user.displayName,
      avatar: socket.user.avatar
    });
    broadcastSharers(roomId);
  });

  // Announce stop of screen sharing
  socket.on('screenshare-stop', (data) => {
    const { roomId } = data || {};
    if (!roomId || !socket.user) return;
    const set = roomScreenSharers.get(roomId);
    if (set) {
      set.delete(socket.user.id);
      if (set.size === 0) roomScreenSharers.delete(roomId);
    }
    io.in(`room:${roomId}`).emit('screenshare-stopped', {
      roomId,
      userId: socket.user.id
    });
    broadcastSharers(roomId);
  });

  // Relay SDP offer from sharer to all other participants (or a specific target)
  socket.on('screenshare-offer', (data) => {
    const { roomId, targetUserId, sdp } = data || {};
    if (!roomId || !sdp || !socket.user) return;
    if (targetUserId) {
      // Send to specific target
      io.to(targetUserId).emit('screenshare-offer', {
        roomId,
        fromUserId: socket.user.id,
        sdp
      });
    } else {
      // Broadcast to room excluding sender
      socket.to(`room:${roomId}`).emit('screenshare-offer', {
        roomId,
        fromUserId: socket.user.id,
        sdp
      });
    }
  });

  // Relay SDP answer from viewer back to sharer
  socket.on('screenshare-answer', (data) => {
    const { roomId, targetUserId, sdp } = data || {};
    if (!roomId || !targetUserId || !sdp || !socket.user) return;
    io.to(targetUserId).emit('screenshare-answer', {
      roomId,
      fromUserId: socket.user.id,
      sdp
    });
  });

  // Relay ICE candidates between peers
  socket.on('screenshare-ice-candidate', (data) => {
    const { roomId, targetUserId, candidate } = data || {};
    if (!roomId || !targetUserId || !candidate || !socket.user) return;
    io.to(targetUserId).emit('screenshare-ice-candidate', {
      roomId,
      fromUserId: socket.user.id,
      candidate
    });
  });

  // Get current battle state (for late joiners)
  socket.on('get-battle-state', (data) => {
    const { roomId } = data;
    if (!roomId) return;
    const state = battleStates[roomId] || { state: 'waiting', remaining: 0 };
    socket.emit('battle-state', { roomId, ...state });
  });

  // Handle battle ready status
  socket.on('battle-ready', async (data) => {
    try {
      const { roomId, ready } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Update battle state with ready status
      if (!battleStates[roomId]) {
        battleStates[roomId] = { state: 'waiting', remaining: 0, ready: {} };
      }
      
      battleStates[roomId].ready = battleStates[roomId].ready || {};
      battleStates[roomId].ready[socket.user._id.toString()] = ready;

      // Broadcast ready status to all participants
      socket.to(`room:${roomId}`).emit('participant-ready', {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        ready: ready,
        timestamp: new Date()
      });

      console.log(`User ${socket.user.displayName} ready status: ${ready} in battle ${roomId}`);
    } catch (error) {
      console.error('Error handling battle ready:', error);
      socket.emit('error', { message: 'Failed to update ready status' });
    }
  });

  // Handle battle submission
  socket.on('battle-submission', async (data) => {
    try {
      const { roomId, score, passed, total } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Broadcast submission to all participants
      socket.to(`room:${roomId}`).emit('participant-update', {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        score: score,
        passed: passed,
        total: total,
        timestamp: new Date()
      });

      console.log(`User ${socket.user.displayName} submitted solution in battle ${roomId}: ${passed}/${total} tests passed`);
    } catch (error) {
      console.error('Error handling battle submission:', error);
      socket.emit('error', { message: 'Failed to broadcast submission' });
    }
  });

  // Handle code change activity
  socket.on('code-change-activity', async (data) => {
    try {
      const { roomId, changeType, linesChanged } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Broadcast code change activity to all participants
      socket.to(`room:${roomId}`).emit('participant-activity', {
        userId: socket.user._id.toString(),
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        activity: 'code-change',
        timestamp: new Date(),
        details: {
          action: changeType || 'modified code',
          description: `Made significant code changes (${linesChanged || 'unknown'} lines)`,
          linesChanged: linesChanged
        }
      });

      console.log(`User ${socket.user.displayName} made code changes in battle ${roomId}`);
    } catch (error) {
      console.error('Error handling code change activity:', error);
      socket.emit('error', { message: 'Failed to broadcast code change activity' });
    }
  });

  // Handle permission change requests
  socket.on('change-permission', async (data) => {
    try {
      const { roomId, targetUserId, newPermissions } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!roomId || !targetUserId || !newPermissions) {
        socket.emit('error', { message: 'Missing required parameters' });
        return;
      }

      // Import Room model
      const Room = require('../models/Room');
      
      // Check if user is host and has permission to change permissions
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const userParticipant = room.participants.find(p => 
        p.userId.toString() === socket.user._id.toString() && p.isActive
      );

      if (!userParticipant || userParticipant.role !== 'host') {
        socket.emit('error', { message: 'Only hosts can change permissions' });
        return;
      }

      // Check if permission changes are allowed
      if (!room.settings.allowPermissionChanges) {
        socket.emit('error', { message: 'Permission changes are disabled for this room' });
        return;
      }

      // Find target participant
      const targetParticipant = room.participants.find(p => 
        p.userId.toString() === targetUserId && p.isActive
      );

      if (!targetParticipant) {
        socket.emit('error', { message: 'Target participant not found' });
        return;
      }

      // Don't allow changing host permissions
      if (targetParticipant.role === 'host') {
        socket.emit('error', { message: 'Cannot change host permissions' });
        return;
      }

      const oldPermissions = targetParticipant.permissions;
      
      // Update permissions
      await room.updateParticipantPermissions(targetUserId, newPermissions);

      // Broadcast permission change to all room participants
      io.in(`room:${roomId}`).emit('permission-changed', {
        roomId,
        userId: targetUserId,
        displayName: targetParticipant.userId.displayName || 'Unknown',
        oldPermissions,
        newPermissions,
        changedBy: socket.user._id.toString(),
        changedAt: new Date()
      });

      console.log(`User ${socket.user.displayName} changed permissions for user ${targetUserId} in room ${roomId}: ${oldPermissions} -> ${newPermissions}`);
    } catch (error) {
      console.error('Error handling permission change:', error);
      socket.emit('error', { message: 'Failed to change permissions' });
    }
  });

  // Handle default permission change requests
  socket.on('change-default-permissions', async (data) => {
    try {
      const { roomId, newDefaultPermissions } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!roomId || !newDefaultPermissions) {
        socket.emit('error', { message: 'Missing required parameters' });
        return;
      }

      // Import Room model
      const Room = require('../models/Room');
      
      // Check if user is host
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const userParticipant = room.participants.find(p => 
        p.userId.toString() === socket.user._id.toString() && p.isActive
      );

      if (!userParticipant || userParticipant.role !== 'host') {
        socket.emit('error', { message: 'Only hosts can change default permissions' });
        return;
      }

      const oldDefaultPermissions = room.settings.defaultPermissions;
      
      // Update default permissions
      await room.updateDefaultPermissions(newDefaultPermissions);

      // Broadcast default permission change to all room participants
      io.in(`room:${roomId}`).emit('default-permissions-changed', {
        roomId,
        oldDefaultPermissions,
        newDefaultPermissions,
        changedBy: socket.user._id.toString(),
        changedAt: new Date()
      });

      console.log(`User ${socket.user.displayName} changed default permissions for room ${roomId}: ${oldDefaultPermissions} -> ${newDefaultPermissions}`);
    } catch (error) {
      console.error('Error handling default permission change:', error);
      socket.emit('error', { message: 'Failed to change default permissions' });
    }
  });

  // Handle permission settings change requests
  socket.on('change-permission-settings', async (data) => {
    try {
      const { roomId, allowPermissionChanges } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!roomId || typeof allowPermissionChanges !== 'boolean') {
        socket.emit('error', { message: 'Missing required parameters' });
        return;
      }

      // Import Room model
      const Room = require('../models/Room');
      
      // Check if user is host
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const userParticipant = room.participants.find(p => 
        p.userId.toString() === socket.user._id.toString() && p.isActive
      );

      if (!userParticipant || userParticipant.role !== 'host') {
        socket.emit('error', { message: 'Only hosts can change permission settings' });
        return;
      }

      // Update permission settings
      room.settings.allowPermissionChanges = allowPermissionChanges;
      await room.save();

      // Broadcast permission settings change to all room participants
      io.in(`room:${roomId}`).emit('permission-settings-changed', {
        roomId,
        allowPermissionChanges,
        changedBy: socket.user._id.toString(),
        changedAt: new Date()
      });

      console.log(`User ${socket.user.displayName} changed permission settings for room ${roomId}: allowPermissionChanges = ${allowPermissionChanges}`);
    } catch (error) {
      console.error('Error handling permission settings change:', error);
      socket.emit('error', { message: 'Failed to change permission settings' });
    }
  });

  // --- Presence enhancements: typing, idle, connection quality ---
  // User typing indicator
  socket.on('user-typing', (data = {}) => {
    try {
      const { roomId, isTyping = true } = data;
      if (!roomId || !socket.user) return;
      socket.to(`room:${roomId}`).emit('user-typing', {
        roomId,
        userId: socket.user._id?.toString?.() || 'anonymous',
        displayName: socket.user.displayName || 'Anonymous',
        isTyping: Boolean(isTyping),
        timestamp: new Date()
      });
    } catch (e) {
      // noop
    }
  });

  // User idle status
  socket.on('user-idle', (data = {}) => {
    try {
      const { roomId, isIdle = false } = data;
      if (!roomId || !socket.user) return;
      socket.to(`room:${roomId}`).emit('user-idle', {
        roomId,
        userId: socket.user._id?.toString?.() || 'anonymous',
        displayName: socket.user.displayName || 'Anonymous',
        isIdle: Boolean(isIdle),
        timestamp: new Date()
      });
    } catch (e) {
      // noop
    }
  });

  // Connection quality reporting (client computed RTT)
  socket.on('connection-quality', (data = {}) => {
    try {
      const { roomId, rtt = null, quality = 'good' } = data;
      if (!roomId || !socket.user) return;
      socket.to(`room:${roomId}`).emit('connection-quality', {
        roomId,
        userId: socket.user._id?.toString?.() || 'anonymous',
        displayName: socket.user.displayName || 'Anonymous',
        rtt,
        quality,
        timestamp: new Date()
      });
    } catch (e) {
      // noop
    }
  });

  // Handle ping measurement requests
  socket.on('ping-measure', (data = {}) => {
    try {
      const { ts, roomId } = data;
      if (!ts || !socket.user) return;
      
      // Send pong back to the client
      socket.emit(`pong:${ts}`, {
        timestamp: new Date(),
        serverTime: Date.now()
      });
    } catch (e) {
      // noop
    }
  });

  // ===== SPECTATOR MODE EVENTS =====

  // Handle spectator requesting code sync from a specific participant
  socket.on('request-code-sync', async (data) => {
    try {
      const { roomId, targetUserId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Verify the requesting user is a spectator
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const requesterParticipant = room.participants.find(p => 
        p.userId.toString() === socket.user._id.toString()
      );

      if (!requesterParticipant || requesterParticipant.role !== 'spectator') {
        socket.emit('error', { message: 'Only spectators can request code sync' });
        return;
      }

      // Get room state and send code to spectator
      const state = await roomStateManager.getRoomState(roomId);
      if (state && state.code) {
        socket.emit('code-sync-response', {
          roomId,
          targetUserId,
          code: state.code,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling code sync request:', error);
      socket.emit('error', { message: 'Failed to sync code' });
    }
  });

  // Handle spectator requesting all participant data
  socket.on('request-spectator-data', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Verify the requesting user is a spectator
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const requesterParticipant = room.participants.find(p => 
        p.userId.toString() === socket.user._id.toString()
      );

      if (!requesterParticipant || requesterParticipant.role !== 'spectator') {
        socket.emit('error', { message: 'Only spectators can request spectator data' });
        return;
      }

      // Get comprehensive spectator data
      const state = await roomStateManager.getRoomState(roomId);
      if (!state) {
        socket.emit('error', { message: 'Room state not found' });
        return;
      }

      // Collect all participant cursors
      const allCursors = {};
      userCursors.forEach((cursor, userId) => {
        if (cursor.roomId === roomId) {
          allCursors[userId] = {
            userId,
            displayName: cursor.displayName,
            avatar: cursor.avatar,
            position: cursor.position,
            color: cursor.color,
            timestamp: cursor.timestamp
          };
        }
      });

      // Collect all participant selections
      const allSelections = {};
      userSelections.forEach((selection, userId) => {
        if (selection.roomId === roomId) {
          allSelections[userId] = {
            userId,
            displayName: selection.displayName,
            avatar: selection.avatar,
            selection: selection.selection,
            color: selection.color,
            timestamp: selection.timestamp
          };
        }
      });

      // Send comprehensive spectator data
      socket.emit('spectator-data-response', {
        roomId,
        participants: room.participants.filter(p => p.isActive).map(p => ({
          id: p.userId.toString(),
          name: p.userId.displayName || p.userId.email || 'Anonymous',
          avatar: p.userId.avatar || '👤',
          role: p.role,
          isActive: p.isActive,
          ready: p.ready || false,
          joinedAt: p.joinedAt,
          lastSeen: p.lastSeen
        })),
        battleInfo: state.battle ? {
          started: state.battle.started,
          ended: state.battle.ended,
          durationMinutes: state.battle.durationMinutes,
          problemId: state.battle.problemId,
          difficulty: state.battle.difficulty,
          host: state.battle.host,
          startedAt: state.battle.startedAt,
          endedAt: state.battle.endedAt
        } : null,
        participantCode: state.code ? { [roomId]: state.code } : {},
        participantCursors: allCursors,
        participantSelections: allSelections,
        testResults: state.battle?.submissions || {},
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling spectator data request:', error);
      socket.emit('error', { message: 'Failed to get spectator data' });
    }
  });

  // Handle spectator requesting to follow a specific participant
  socket.on('spectator-follow-participant', async (data) => {
    try {
      const { roomId, targetUserId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Verify the requesting user is a spectator
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const requesterParticipant = room.participants.find(p => 
        p.userId.toString() === socket.user._id.toString()
      );

      if (!requesterParticipant || requesterParticipant.role !== 'spectator') {
        socket.emit('error', { message: 'Only spectators can follow participants' });
        return;
      }

      // Verify target user exists and is a participant
      const targetParticipant = room.participants.find(p => 
        p.userId.toString() === targetUserId && p.role === 'participant'
      );

      if (!targetParticipant) {
        socket.emit('error', { message: 'Target participant not found' });
        return;
      }

      // Store follow relationship
      const followerId = socket.user._id.toString();
      followRelationships.set(followerId, {
        followingId: targetUserId,
        roomId,
        mode: 'battle',
        startedAt: new Date()
      });

      // Notify the spectator about successful follow
      socket.emit('spectator-follow-started', {
        roomId,
        targetUserId,
        targetDisplayName: targetParticipant.userId.displayName || targetParticipant.userId.email || 'Anonymous',
        startedAt: new Date()
      });

      // Notify the followed participant (optional)
      socket.to(`user:${targetUserId}`).emit('user-being-followed', {
        followerId,
        followerDisplayName: socket.user.displayName || socket.user.email || 'Anonymous',
        roomId
      });

      console.log(`Spectator ${socket.user.displayName} started following participant ${targetUserId} in room ${roomId}`);

    } catch (error) {
      console.error('Error handling spectator follow request:', error);
      socket.emit('error', { message: 'Failed to follow participant' });
    }
  });

  // Handle spectator stopping follow
  socket.on('spectator-stop-follow', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const followerId = socket.user._id.toString();
      const followRelationship = followRelationships.get(followerId);

      if (followRelationship && followRelationship.roomId === roomId) {
        const { followingId } = followRelationship;
        
        // Remove follow relationship
        followRelationships.delete(followerId);

        // Notify the spectator
        socket.emit('spectator-follow-stopped', {
          roomId,
          followingId,
          stoppedAt: new Date()
        });

        // Notify the previously followed participant
        socket.to(`user:${followingId}`).emit('user-unfollowed', {
          followerId,
          followerDisplayName: socket.user.displayName || socket.user.email || 'Anonymous',
          roomId
        });

        console.log(`Spectator ${socket.user.displayName} stopped following in room ${roomId}`);
      }

    } catch (error) {
      console.error('Error handling spectator stop follow:', error);
      socket.emit('error', { message: 'Failed to stop following' });
    }
  });

  // Enhanced cursor movement that broadcasts to spectators
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

      // Broadcast to all room participants (including spectators)
      socket.to(`room:${roomId}`).emit('cursor-moved', {
        userId,
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        position,
        color: color || generateUserColor(userId),
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling cursor move:', error);
    }
  });

  // Enhanced selection change that broadcasts to spectators
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

      // Broadcast to all room participants (including spectators)
      socket.to(`room:${roomId}`).emit('selection-changed', {
        userId,
        displayName: displayName || socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        selection,
        color: color || generateUserColor(userId),
        timestamp: new Date()
      });

      // Persist selection and last position in room state for recovery
      try {
        const state = roomStates.get(roomId) || {};
        if (!state.viewports) state.viewports = new Map();
        if (!state.lastPositions) state.lastPositions = new Map();
        state.lastPositions.set(userId, { lineNumber: selection.endLineNumber, column: selection.endColumn });
      } catch (_) {}

    } catch (error) {
      console.error('Error handling selection change:', error);
    }
  });

  // Enhanced code change that broadcasts to spectators
  socket.on('code-change', (data) => {
    try {
      const { roomId, code, version, range, text } = data;
      
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id.toString();

      // Broadcast to all room participants (including spectators)
      socket.to(`room:${roomId}`).emit('code-changed', {
        userId,
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        avatar: socket.user.avatar,
        code,
        version,
        range,
        text,
        timestamp: new Date()
      });

      // Append to collabHistory for recovery
      try {
        const state = roomStates.get(roomId);
        if (state) {
          state.collabHistory = state.collabHistory || [];
          state.collabHistory.push({
            type: 'code-change',
            userId,
            version,
            text,
            range,
            at: Date.now()
          });
          if (state.collabHistory.length > 500) {
            state.collabHistory = state.collabHistory.slice(-500);
          }
        }
      } catch (_) {}

    } catch (error) {
      console.error('Error handling code change:', error);
    }
  });

  // ================= Collaborative Debugging =================
  // Breakpoint add/remove
  socket.on('debug-set-breakpoint', (data) => {
    try {
      const { roomId, lineNumber } = data || {};
      if (!roomId || !lineNumber) return;
      if (!socket.user) return;
      const userId = socket.user._id?.toString?.() || socket.user.id;
      const bps = debugManager.setBreakpoint(roomId, userId, lineNumber);
      io.in(`room:${roomId}`).emit('debug-breakpoints', { roomId, breakpoints: bps });
    } catch (e) {
      console.error('debug-set-breakpoint error', e);
    }
  });

  socket.on('debug-remove-breakpoint', (data) => {
    try {
      const { roomId, lineNumber } = data || {};
      if (!roomId || !lineNumber) return;
      if (!socket.user) return;
      const userId = socket.user._id?.toString?.() || socket.user.id;
      const bps = debugManager.removeBreakpoint(roomId, userId, lineNumber);
      io.in(`room:${roomId}`).emit('debug-breakpoints', { roomId, breakpoints: bps });
    } catch (e) {
      console.error('debug-remove-breakpoint error', e);
    }
  });

  // Start/stop/step/continue debugging
  socket.on('debug-start', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;
      const state = debugManager.startDebug(roomId);
      io.in(`room:${roomId}`).emit('debug-state', { roomId, state });
    } catch (e) {
      console.error('debug-start error', e);
    }
  });

  socket.on('debug-stop', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;
      const state = debugManager.stopDebug(roomId);
      io.in(`room:${roomId}`).emit('debug-state', { roomId, state });
    } catch (e) {
      console.error('debug-stop error', e);
    }
  });

  socket.on('debug-step', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;
      const state = debugManager.step(roomId);
      io.in(`room:${roomId}`).emit('debug-state', { roomId, state });
    } catch (e) {
      console.error('debug-step error', e);
    }
  });

  socket.on('debug-continue', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;
      const state = debugManager.continue(roomId);
      io.in(`room:${roomId}`).emit('debug-state', { roomId, state });
    } catch (e) {
      console.error('debug-continue error', e);
    }
  });

  socket.on('debug-update-variables', (data) => {
    try {
      const { roomId, variables } = data || {};
      if (!roomId) return;
      const state = debugManager.updateVariables(roomId, variables || {});
      io.in(`room:${roomId}`).emit('debug-state', { roomId, state });
    } catch (e) {
      console.error('debug-update-variables error', e);
    }
  });

  // ================= Collaborative Diagnostics =================
  // Relay diagnostics updates from any participant to the whole room
  socket.on('diagnostics-update', (data) => {
    try {
      const { roomId, diagnostics, language } = data || {};
      if (!roomId || !Array.isArray(diagnostics)) return;
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const userId = socket.user._id?.toString?.() || socket.user.id;
      io.in(`room:${roomId}`).emit('diagnostics-update', {
        roomId,
        fromUserId: userId,
        displayName: socket.user.displayName || socket.user.email || 'Anonymous',
        language,
        diagnostics,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error relaying diagnostics:', error);
    }
  });

  // ================= Host Force-Follow Mode =================
  const forceFollowRooms = new Map(); // roomId -> hostUserId or null

  socket.on('force-follow-start', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId || !socket.user) return;
      // Only allow if sender is host is enforced at REST level; here we broadcast
      const hostUserId = socket.user._id?.toString?.() || socket.user.id;
      forceFollowRooms.set(roomId, hostUserId);
      io.in(`room:${roomId}`).emit('force-follow', { roomId, enabled: true, hostUserId });
    } catch (e) { console.error('force-follow-start error', e); }
  });

  socket.on('force-follow-stop', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;
      forceFollowRooms.delete(roomId);
      io.in(`room:${roomId}`).emit('force-follow', { roomId, enabled: false });
    } catch (e) { console.error('force-follow-stop error', e); }
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

# Start coding with your team!`,
    java: `// Welcome to collaborative Java coding!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
    cpp: `// Welcome to collaborative C++ coding!
#include <iostream>
#include <string>

using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    csharp: `// Welcome to collaborative C# coding!
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
    typescript: `// Welcome to collaborative TypeScript coding!
interface Greeting {
    name: string;
    message: string;
}

function greet(name: string): Greeting {
    return {
        name,
        message: \`Hello, \${name}!\`
    };
}

console.log(greet("World"));
`,
    go: `// Welcome to collaborative Go coding!
package main

import "fmt"

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    fmt.Println(greet("World"))
}`,
    rust: `// Welcome to collaborative Rust coding!
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("{}", greet("World"));
}`,
    php: `<?php
// Welcome to collaborative PHP coding!
function greet($name) {
    return "Hello, " . $name . "!";
}

echo greet("World");
?>`,
    ruby: `# Welcome to collaborative Ruby coding!
def greet(name)
  "Hello, #{name}!"
end

puts greet("World")`
  };
  
  return defaults[language] || defaults.javascript;
}

// Helper function to apply text changes (simplified operational transformation)
function applyTextChange(content, range, text) {
  try {
    const { start, end } = range;
    
    // Simple text replacement - in a production system, you'd use proper operational transformation
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    return before + text + after;
  } catch (error) {
    console.error('Error applying text change:', error);
    return content;
  }
}

// Enhanced collaborator status management functions
const updateCollaboratorStatus = (userId, sessionId, updates) => {
  const currentStatus = collaboratorStatus.get(userId) || {};
  collaboratorStatus.set(userId, {
    ...currentStatus,
    sessionId,
    lastActivity: new Date(),
    ...updates
  });
};

const getCollaboratorStatus = (userId) => {
  return collaboratorStatus.get(userId) || {};
};

const removeCollaboratorStatus = (userId) => {
  collaboratorStatus.delete(userId);
};

const getSessionCollaborators = async (sessionId) => {
  const sessionSockets = await io.in(`collaborative-session:${sessionId}`).fetchSockets();
  return sessionSockets
    .filter(s => s.user)
    .map(s => {
      const status = getCollaboratorStatus(s.user._id.toString());
      return {
        userId: s.user._id.toString(),
        displayName: s.user.displayName || s.user.email || 'Anonymous',
        avatar: s.user.avatar,
        socketId: s.id,
        online: true,
        isEditing: status.isEditing || false,
        isTyping: status.isTyping || false,
        status: status.status || 'active',
        lastActivity: status.lastActivity || new Date(),
        role: status.role || 'editor'
      };
    });
};

const broadcastCollaboratorUpdate = async (sessionId, userId, updateType, data) => {
  const status = getCollaboratorStatus(userId);
  const user = activeConnections.get(userId)?.user;
  
  if (user) {
    const updateData = {
      userId,
      displayName: user.displayName || user.email || 'Anonymous',
      avatar: user.avatar,
      updateType, // 'join', 'leave', 'status_change', 'typing', 'editing'
      ...data,
      timestamp: new Date()
    };
    
    io.in(`collaborative-session:${sessionId}`).emit('collaborator-update', updateData);
  }
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