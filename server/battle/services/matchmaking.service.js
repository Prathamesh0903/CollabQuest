const BattleSession = require('../models/BattleSession');
const BattleParticipant = require('../models/BattleParticipant');

class MatchmakingService {
  async listOpenRooms({ limit = 20 } = {}) {
    return BattleSession.find({ state: 'waiting' })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getRoom(sessionId) {
    return BattleSession.findOne({ sessionId });
  }

  async joinRoom(sessionId, userId, username) {
    const session = await BattleSession.findOne({ sessionId });
    if (!session || !session.canJoin()) {
      throw new Error('Room is not joinable');
    }

    const existing = await BattleParticipant.findOne({ sessionId, userId });
    if (existing) return existing;

    const participant = new BattleParticipant({ sessionId, userId, username });
    await participant.save();
    
    // track count locally on session if needed
    if (Array.isArray(session.participants)) {
      session.participants.push(userId);
      await session.save();
    }

    return participant;
  }
}

module.exports = new MatchmakingService();


