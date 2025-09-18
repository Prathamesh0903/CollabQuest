const BattleResult = require('../models/BattleResult');
const scoringService = require('../services/scoring.service');
const battleService = require('../services/battle.service');

const resultsEvents = (socket, io) => {
  socket.on('results:get', async () => {
    try {
      const sessionId = socket.battleSessionId;
      const leaderboard = await scoringService.updateLeaderboard(sessionId);
      const session = await battleService.getBattleSession(sessionId);
      socket.emit('results:data', { leaderboard, session });
    } catch (error) {
      socket.emit('results:error', { message: error.message });
    }
  });

  socket.on('results:finalize', async () => {
    try {
      const sessionId = socket.battleSessionId;
      const session = await battleService.getBattleSession(sessionId);
      const leaderboard = await scoringService.updateLeaderboard(sessionId);
      
      const result = await BattleResult.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          name: session.name,
          host: session.host,
          finalizedAt: new Date(),
          rankings: leaderboard.map(l => ({
            userId: l.userId,
            username: l.username,
            rank: l.rank,
            score: l.score
          })),
          statistics: {
            participants: leaderboard.length,
            durationSeconds: Math.round(((session.endedAt || new Date()) - session.startedAt) / 1000),
            problemDifficulty: session.settings?.problem?.difficulty
          },
          problem: {
            id: session.settings?.problem?.id,
            title: session.settings?.problem?.title,
            difficulty: session.settings?.problem?.difficulty,
            functionSignature: session.settings?.problem?.functionSignature
          }
        },
        { new: true, upsert: true }
      );
      
      io.to(sessionId).emit('results:finalized', { result });
    } catch (error) {
      socket.emit('results:error', { message: error.message });
    }
  });
};

module.exports = resultsEvents;


