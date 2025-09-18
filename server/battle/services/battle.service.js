const BattleSession = require('../models/BattleSession');
const BattleParticipant = require('../models/BattleParticipant');
const { generateSessionId } = require('../utils/generators');

class BattleService {
  async createBattle(hostId, battleData) {
    const sessionId = generateSessionId();
    
    const session = new BattleSession({
      sessionId,
      name: battleData.name,
      host: hostId,
      maxParticipants: battleData.maxParticipants || 4,
      settings: battleData.settings
    });

    await session.save();

    // Add host as first participant
    await this.joinBattle(sessionId, hostId, battleData.hostUsername, true);
    
    return session;
  }

  async joinBattle(sessionId, userId, username, isHost = false) {
    const session = await BattleSession.findOne({ sessionId });
    if (!session || !session.canJoin()) {
      throw new Error('Cannot join this battle');
    }

    const participant = new BattleParticipant({
      sessionId,
      userId,
      username,
      isHost
    });

    await participant.save();
    return participant;
  }

  async toggleReady(sessionId, userId) {
    const participant = await BattleParticipant.findOne({ sessionId, userId });
    if (!participant) throw new Error('Participant not found');
    
    participant.isReady = !participant.isReady;
    await participant.save();
    
    return participant;
  }

  async startBattle(sessionId, hostId) {
    const session = await BattleSession.findOne({ sessionId, host: hostId });
    if (!session || !session.canStart()) {
      throw new Error('Cannot start battle');
    }

    session.state = 'countdown';
    session.startedAt = new Date();
    await session.save();

    return session;
  }

  async getParticipants(sessionId) {
    return BattleParticipant.find({ sessionId, leftAt: null });
  }

  async getBattleSession(sessionId) {
    const session = await BattleSession.findOne({ sessionId });
    if (!session) throw new Error('Battle session not found');
    return session;
  }

  async updateSubmission(sessionId, userId, submission) {
    const participant = await BattleParticipant.findOne({ sessionId, userId });
    if (!participant) throw new Error('Participant not found');
    
    participant.finalSubmission = {
      code: submission.code,
      submittedAt: new Date(),
      executionResult: submission.executionResult
    };
    await participant.save();
    return participant;
  }

  async leaveRoom(sessionId, userId) {
    const participant = await BattleParticipant.findOne({ sessionId, userId });
    if (!participant) return null;
    if (!participant.leftAt) {
      participant.leftAt = new Date();
      participant.isConnected = false;
      await participant.save();
    }

    const session = await BattleSession.findOne({ sessionId });
    if (session && Array.isArray(session.participants)) {
      session.participants = session.participants.filter(id => id !== userId);
      await session.save();
    }
    return participant;
  }

  async leaveBattle(sessionId, userId) {
    return this.leaveRoom(sessionId, userId);
  }
}

module.exports = new BattleService();


