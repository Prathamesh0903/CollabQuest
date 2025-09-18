const BattleReplay = require('../models/BattleReplay');

class ReplayService {
  async appendEvent(sessionId, event) {
    const replay = await BattleReplay.findOneAndUpdate(
      { sessionId },
      { $push: { timeline: event } },
      { new: true, upsert: true }
    );
    return replay;
  }

  async getTimeline(sessionId) {
    const replay = await BattleReplay.findOne({ sessionId });
    return replay ? replay.timeline : [];
  }

  async setMetadata(sessionId, metadata) {
    const replay = await BattleReplay.findOneAndUpdate(
      { sessionId },
      { $set: { metadata } },
      { new: true, upsert: true }
    );
    return replay;
  }
}

module.exports = new ReplayService();


