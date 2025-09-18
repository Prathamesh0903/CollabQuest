const codeExecutionService = require('../utils/codeExecution');
const scoringService = require('../services/scoring.service');
const battleService = require('../services/battle.service');

const battleEvents = (socket, io) => {
  socket.on('battle:submit-code', async (data) => {
    try {
      const { code } = data;
      const sessionId = socket.battleSessionId;
      
      const session = await battleService.getBattleSession(sessionId);
      
      const executionResult = await codeExecutionService.executeJavaScript(
        code, 
        session.settings.problem.testCases
      );
      
      const score = scoringService.calculateScore(
        executionResult,
        session.settings.duration,
        code.length
      );
      
      await battleService.updateSubmission(sessionId, socket.userId, {
        code,
        executionResult: { ...executionResult, score: score.total }
      });
      
      socket.emit('battle:submission-result', {
        executionResult,
        score
      });
      
      const leaderboard = await scoringService.updateLeaderboard(sessionId);
      io.to(sessionId).emit('battle:leaderboard-updated', { leaderboard });
      
    } catch (error) {
      socket.emit('battle:error', { message: error.message });
    }
  });

  socket.on('battle:get-leaderboard', async () => {
    try {
      const sessionId = socket.battleSessionId;
      const leaderboard = await scoringService.updateLeaderboard(sessionId);
      socket.emit('battle:leaderboard-updated', { leaderboard });
    } catch (error) {
      socket.emit('battle:error', { message: error.message });
    }
  });
};

module.exports = battleEvents;


