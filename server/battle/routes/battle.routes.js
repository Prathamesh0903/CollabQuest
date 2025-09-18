const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battle.controller');
const { battleValidators } = require('../utils/validators');
const authMiddleware = require('../middleware/auth');
const battleAccessMiddleware = require('../middleware/ensureBattleAccess');

// Create battle
router.post('/create', 
  authMiddleware,
  battleValidators.createBattle,
  battleController.createBattle
);

// Join battle  
router.post('/:sessionId/join',
  authMiddleware,
  battleValidators.joinBattle,
  battleController.joinBattle
);

// Get battle details
router.get('/:sessionId',
  authMiddleware,
  battleAccessMiddleware,
  battleController.getBattle
);

// Leave battle
router.post('/:sessionId/leave',
  authMiddleware,
  battleAccessMiddleware,
  battleController.leaveBattle
);

module.exports = router;


