const battleService = require('../services/battle.service');
const matchmakingService = require('../services/matchmaking.service');

const roomEvents = (socket, io) => {
  socket.on('room:create', async (data) => {
    try {
      const { name, maxParticipants, settings, hostUsername } = data;
      const session = await battleService.createBattle(socket.userId, {
        name,
        maxParticipants,
        settings,
        hostUsername
      });
      socket.join(session.sessionId);
      socket.battleSessionId = session.sessionId;
      socket.emit('room:created', { sessionId: session.sessionId, session });
    } catch (error) {
      socket.emit('room:error', { message: error.message });
    }
  });

  socket.on('room:join', async (data) => {
    try {
      const { sessionId, username } = data;
      const participant = await matchmakingService.joinRoom(sessionId, socket.userId, username);
      socket.join(sessionId);
      socket.battleSessionId = sessionId;
      socket.emit('room:joined', { sessionId, participant });
      socket.to(sessionId).emit('room:participant-joined', { participant });
    } catch (error) {
      socket.emit('room:error', { message: error.message });
    }
  });

  socket.on('room:list', async () => {
    try {
      const rooms = await matchmakingService.listOpenRooms();
      socket.emit('room:list', { rooms });
    } catch (error) {
      socket.emit('room:error', { message: error.message });
    }
  });

  socket.on('room:leave', async () => {
    try {
      const sessionId = socket.battleSessionId;
      const participant = await battleService.leaveRoom(sessionId, socket.userId);
      socket.leave(sessionId);
      socket.battleSessionId = undefined;
      socket.emit('room:left', { sessionId });
      if (participant) {
        socket.to(sessionId).emit('room:participant-left', { userId: participant.userId });
      }
    } catch (error) {
      socket.emit('room:error', { message: error.message });
    }
  });
};

module.exports = roomEvents;


