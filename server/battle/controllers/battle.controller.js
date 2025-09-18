const battleService = require('../services/battle.service');
const { validationResult } = require('express-validator');

class BattleController {
  async createBattle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const battle = await battleService.createBattle(req.user.uid, req.body);
      
      res.status(201).json({
        success: true,
        data: battle,
        message: 'Battle created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async joinBattle(req, res) {
    try {
      const { sessionId } = req.params;
      const participant = await battleService.joinBattle(
        sessionId, 
        req.user.uid, 
        req.user.username
      );
      
      res.json({
        success: true,
        data: participant,
        message: 'Joined battle successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getBattle(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await battleService.getBattleSession(sessionId);
      const participants = await battleService.getParticipants(sessionId);
      
      res.json({
        success: true,
        data: { session, participants }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Battle not found'
      });
    }
  }

  async leaveBattle(req, res) {
    try {
      const { sessionId } = req.params;
      await battleService.leaveBattle(sessionId, req.user.uid);
      
      res.json({
        success: true,
        message: 'Left battle successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BattleController();


