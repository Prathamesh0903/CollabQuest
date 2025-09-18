const BattleParticipant = require('../models/BattleParticipant');

class ScoringService {
  calculateScore(executionResult, timeLimit, codeLength) {
    const { testsPassed = 0, totalTests = 0, executionTime = 0 } = executionResult || {};
    
    const safeTotalTests = totalTests || 1;
    const correctnessScore = (testsPassed / safeTotalTests) * 100;
    
    const safeTimeLimit = timeLimit > 0 ? timeLimit : 1;
    const timeBonus = Math.max(0, ((safeTimeLimit - executionTime) / safeTimeLimit) * 50);
    
    const maxCodeLength = 3000;
    const safeCodeLength = Math.max(0, codeLength || 0);
    const efficiencyBonus = Math.max(0, ((maxCodeLength - safeCodeLength) / maxCodeLength) * 25);
    
    const totalScore = Math.round(correctnessScore + timeBonus + efficiencyBonus);
    
    return {
      total: totalScore,
      breakdown: {
        correctness: Math.round(correctnessScore),
        timeBonus: Math.round(timeBonus),
        efficiency: Math.round(efficiencyBonus)
      }
    };
  }

  async updateLeaderboard(sessionId) {
    const participants = await BattleParticipant.find({ sessionId })
      .sort({ 'finalSubmission.executionResult.score': -1 });
    
    return participants.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      username: p.username,
      score: (p.finalSubmission && p.finalSubmission.executionResult && p.finalSubmission.executionResult.score) || 0,
      submissionTime: p.finalSubmission ? p.finalSubmission.submittedAt : undefined,
      testsPassed: (p.finalSubmission && p.finalSubmission.executionResult && p.finalSubmission.executionResult.testsPassed) || 0
    }));
  }
}

module.exports = new ScoringService();


