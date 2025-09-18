const battleService = require('../services/battle.service');

const lobbyEvents = (socket, io) => {
  socket.on('lobby:join', async (data) => {
    try {
      const { sessionId } = data;
      const session = await battleService.getBattleSession(sessionId);
      
      socket.join(sessionId);
      socket.battleSessionId = sessionId;
      
      const participants = await battleService.getParticipants(sessionId);
      socket.emit('lobby:joined', { session, participants });
      
      socket.to(sessionId).emit('lobby:participant-joined', {
        participant: participants.find(p => p.userId === socket.userId)
      });
      
    } catch (error) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  socket.on('lobby:ready-toggle', async () => {
    try {
      const sessionId = socket.battleSessionId;
      const participant = await battleService.toggleReady(sessionId, socket.userId);
      
      io.to(sessionId).emit('lobby:ready-changed', {
        userId: socket.userId,
        isReady: participant.isReady
      });
      
      const participants = await battleService.getParticipants(sessionId);
      const allReady = participants.every(p => p.isReady);
      
      if (allReady && participants.length >= 2) {
        io.to(sessionId).emit('lobby:all-ready');
      }
      
    } catch (error) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  socket.on('lobby:start-battle', async () => {
    try {
      const sessionId = socket.battleSessionId;
      const session = await battleService.startBattle(sessionId, socket.userId);
      
      io.to(sessionId).emit('lobby:countdown-started', {
        countdown: session.settings.countdown
      });
      
      let timeLeft = session.settings.countdown;
      const countdownInterval = setInterval(() => {
        timeLeft--;
        io.to(sessionId).emit('lobby:countdown-tick', { timeLeft });
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          io.to(sessionId).emit('battle:started', { 
            duration: session.settings.duration 
          });
        }
      }, 1000);
      
    } catch (error) {
      socket.emit('lobby:error', { message: error.message });
    }
  });
};

module.exports = lobbyEvents;


