const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const Room = require('../models/Room');
const Leaderboard = require('../models/Leaderboard');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const roomStateManager = require('../utils/roomStateManager');
const { calculateScore } = require('../utils/scoring');
const vm = require('vm');
                                                        
const router = express.Router();

// Helpers for input validation and participant checks
const isValidHexId = (s) => typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s);                                      
const sanitizeRoomCode = (code) => (typeof code === 'string' ? code.toUpperCase().trim().slice(0, 8) : '');
const sanitizeDifficulty = (d) => ({ Easy: 'Easy', Medium: 'Medium', Hard: 'Hard' }[d] || 'Easy');
const resolveUserId = (req) => {
  if (req.user && req.user._id) return req.user._id.toString();
  const headerId = req.headers['x-user-id'];
  if (isValidHexId(headerId)) return String(headerId);
  
  // For anonymous users without a header, we need to track them differently
  // Since we can't maintain session state across requests, we'll use a different approach
  return null;
};
async function assertParticipant(roomId, userId) {
  if (!isValidHexId(roomId)) return false;
  
  // For anonymous users without a persistent ID, we need a different approach
  // Since the test endpoint uses optionalAuth, we'll allow anonymous access
  // but require them to provide some form of identification
  
  // If no userId provided, this is a completely anonymous request
  if (!userId) {
    // For now, allow anonymous access to test endpoint
    // In production, you might want to require at least a session token
    return true;
  }
  
  // Check database participants
  const room = await Room.findById(roomId).select('participants');
  if (!room) return false;
  
  // Check if user is in database participants
  const isInDb = room.participants.some(p => p.isActive && p.userId.toString() === userId);
  if (isInDb) return true;
  
  // Check in-memory state for anonymous users
  const state = roomStateManager.getRoomState(roomId);
  if (state && state.users && state.users.has(userId.toString())) {
    return true;
  }
  
  return false;
}
async function assertHost(roomId, userId) {
  if (!isValidHexId(roomId) || !isValidHexId(userId)) return false;
  const room = await Room.findById(roomId).select('participants createdBy');
  if (!room) return false;
  if (room.createdBy && room.createdBy.toString() === userId) return true;
  return room.participants.some(p => p.userId.toString() === userId && p.role === 'host');
}

// Battle problems registry aligned with client ids
// We keep concise, structured test cases for reliable automated evaluation
const battleProblems = {
  'two-sum': {
    title: 'Two Sum',
    difficulty: 'Easy',
    functionName: 'twoSum',
    language: 'javascript',
    tests: [
      { args: [[2,7,11,15], 9], expected: [0,1] },
      { args: [[3,2,4], 6], expected: [1,2] },
      { args: [[3,3], 6], expected: [0,1] }
    ]
  },
  'valid-parentheses': {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    functionName: 'isValid',
    language: 'javascript',
    tests: [
      { args: ['()'], expected: true },
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false }
    ]
  },
  'product-except-self': {
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    functionName: 'productExceptSelf',
    language: 'javascript',
    tests: [
      { args: [[1,2,3,4]], expected: [24,12,8,6] },
      { args: [[-1,1,0,-3,3]], expected: [0,0,9,0,0] }
    ]
  },
  'longest-consecutive-sequence': {
    title: 'Longest Consecutive Sequence',
    difficulty: 'Hard',
    functionName: 'longestConsecutive',
    language: 'javascript',
    tests: [
      { args: [[100,4,200,1,3,2]], expected: 4 },
      { args: [[0,3,7,2,5,8,4,6,0,1]], expected: 9 }
    ]
  }
};

// Guardrails
const MAX_CODE_SIZE_BYTES = 50 * 1024; // 50KB
const MAX_ARG_STRING_LEN = 5 * 1024; // 5KB per arg after JSON.stringify
const MAX_RESULT_STRING_LEN = 10 * 1024; // 10KB per result field

function deepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (_) {
    return a === b;
  }
}

function runJavaScriptFunction(code, functionName, args, timeoutMs = 2000) {
  // Create a minimal sandbox; do not expose process, require, global, Buffer, etc.
  const sandbox = Object.create(null);
  sandbox.console = { log: () => {} };
  sandbox.__ARGS__ = args;

  const context = vm.createContext(sandbox, { name: 'battle-sandbox' });

  // Shadow dangerous identifiers inside the script and run in strict mode
  const prelude = `'use strict';\nconst require=undefined, process=undefined, global=undefined, module=undefined, exports=undefined, Buffer=undefined, setImmediate=undefined, setInterval=undefined, setTimeout=undefined;\n`;
  const wrapped = `${prelude}${code}\n;(${functionName})(...__ARGS__)`;

  const script = new vm.Script(wrapped, { timeout: timeoutMs });
  const result = script.runInContext(context, { timeout: timeoutMs });
  return result;
}

async function ensureBattleProblemDocument(problemId, creatorUserId = null) {
  const bp = battleProblems[problemId];
  if (!bp) return null;
  const slug = `battle-${problemId}`;
  let doc = await Problem.findOne({ slug });
  if (doc) return doc;
  doc = new Problem({
    title: bp.title,
    slug,
    description: `${bp.title} (Battle)
Solve the problem as described in the battle prompt.`,
    difficulty: bp.difficulty,
    category: 'Arrays',
    problemStatement: 'Refer to the battle UI for full statement.',
    examples: [],
    constraints: 'See battle UI',
    starterCode: { javascript: '' },
    solution: {},
    testCases: bp.tests.map(t => ({ input: JSON.stringify(t.args), expectedOutput: JSON.stringify(t.expected), isHidden: true })),
    createdBy: creatorUserId || null
  });
  await doc.save();
  return doc;
}

// List available battle problems (optionally filter by difficulty)
router.get('/problems', auth, async (req, res) => {
  const { difficulty } = req.query;
  const list = Object.entries(battleProblems)
    .filter(([_, p]) => !difficulty || p.difficulty === difficulty)
    .map(([id, p]) => ({ id, title: p.title, difficulty: p.difficulty }));
  res.json({ success: true, problems: list });
});

// Create a battle room and return roomCode and selected problem
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const { difficulty = 'Easy', questionSelection = 'random', selectedProblem, battleTime = 10 } = req.body || {};
    const safeDifficulty = sanitizeDifficulty(difficulty);
    let problemId = selectedProblem;
    const candidates = Object.entries(battleProblems).filter(([_, p]) => p.difficulty === safeDifficulty);
    if (!problemId) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      problemId = pick ? pick[0] : Object.keys(battleProblems)[0];
    }
    const problem = battleProblems[problemId];
    if (!problem) return res.status(400).json({ success: false, error: 'Invalid problem selection' });

    // Identify creator (allow anonymous)
    let creatorId = req.user?._id;
    if (!creatorId) {
      creatorId = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).slice(0, 24);
    }

    const { room, state } = await roomStateManager.createRoom({
      name: `Battle: ${problem.title}`,
      description: `Battle room for ${problem.title} (${difficulty})`,
      language: 'javascript',
      mode: 'battle',
      createdBy: creatorId,
      isTemporary: true
    });

    // Attach battle meta to state (in-memory)
    await roomStateManager.updateRoomState(room._id.toString(), {
      mode: 'battle',
      battle: {
        problemId,
        difficulty: safeDifficulty,
        host: creatorId.toString(),
        durationMinutes: Math.max(1, Math.min(Number(battleTime) || 10, 180)),
        started: false,
        startedAt: null,
        ended: false,
        endedAt: null,
        submissions: {}
      }
    });

    res.status(201).json({
      success: true,
      roomId: room._id,
      roomCode: room.roomCode,
      problem: { id: problemId, title: problem.title, difficulty: problem.difficulty },
      state
    });
  } catch (error) {
    console.error('Battle create error:', error);
    res.status(500).json({ success: false, error: 'Failed to create battle' });
  }
});
// Start a battle: set startedAt and schedule auto end
router.post('/:roomId/start', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const state = roomStateManager.getRoomState(roomId);
    if (!state || !state.battle) return res.status(404).json({ success: false, error: 'Battle state not found' });
    if (state.battle.started && !state.battle.ended) {
      return res.json({ success: true, message: 'Battle already started' });
    }
    const startedAt = new Date();
    const durationMinutes = state.battle.durationMinutes || 10;
    await roomStateManager.updateRoomState(roomId, { battle: { ...state.battle, started: true, startedAt } });
    const durationMs = durationMinutes * 60 * 1000;
    roomStateManager.scheduleBattleEnd(roomId, durationMs);
    res.json({ success: true, startedAt, durationMinutes });
  } catch (error) {
    console.error('Battle start error:', error);
    res.status(500).json({ success: false, error: 'Failed to start battle' });
  }
});


// Join a battle by room code
router.post('/join', optionalAuth, async (req, res) => {
  try {
    const { roomCode } = req.body || {};
    const safeCode = sanitizeRoomCode(roomCode);
    if (!safeCode) return res.status(400).json({ success: false, error: 'roomCode is required' });
    // For unauthenticated users, create a lightweight temp user context
    let userId = resolveUserId(req) || req.user?._id;
    if (!userId) {
      // Fallback: allow anonymous join by generating a temporary ObjectId-like string
      userId = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).slice(0, 24);
    }
    const { room, state } = await roomStateManager.joinRoomByCode(safeCode, userId);
    res.json({ success: true, roomId: room._id, roomCode: room.roomCode, state });
  } catch (error) {
    console.error('Battle join error:', error);
    res.status(404).json({ success: false, error: error.message || 'Failed to join battle' });
  }
});

// Run code against all test cases (JavaScript only for now)
router.post('/:roomId/test', optionalAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!isValidHexId(roomId)) return res.status(400).json({ success: false, error: 'Invalid roomId' });
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
    if (Buffer.byteLength(code, 'utf8') > MAX_CODE_SIZE_BYTES) {
      return res.status(413).json({ success: false, error: 'Code too large' });
    }

    // For anonymous users, we'll allow access to test endpoint
    // For authenticated users, check participant membership
    const userId = resolveUserId(req);
    if (userId && !(await assertParticipant(roomId, userId))) {
      return res.status(403).json({ success: false, error: 'Not a participant of this room' });
    }

    const state = roomStateManager.getRoomState(roomId);
    if (!state || !state.battle) return res.status(404).json({ success: false, error: 'Battle state not found' });

    const problemId = state.battle.problemId;
    const meta = battleProblems[problemId];
    if (!meta) return res.status(400).json({ success: false, error: 'Unknown battle problem' });

    const results = [];
    let passed = 0;
    for (const tc of meta.tests) {
      let actual;
      let error = null;
      let timeMs = 0;
      // Validate input size
      try {
        for (const arg of tc.args) {
          const size = Buffer.byteLength(JSON.stringify(arg).slice(0, MAX_ARG_STRING_LEN + 1), 'utf8');
          if (size > MAX_ARG_STRING_LEN) {
            throw new Error('Input too large');
          }
        }
      } catch (e) {
        error = 'Invalid or oversized input';
      }
      try {
        if (!error) {
          const start = Date.now();
          actual = runJavaScriptFunction(code, meta.functionName, tc.args, 1500);
          timeMs = Date.now() - start;
        }
      } catch (e) {
        error = e.message || String(e);
      }
      // Truncate large outputs before comparison/logging
      const safeActual = typeof actual === 'string' && actual.length > MAX_RESULT_STRING_LEN
        ? actual.slice(0, MAX_RESULT_STRING_LEN) + '...'
        : actual;
      const isPassed = error ? false : deepEqual(safeActual, tc.expected);
      if (isPassed) passed += 1;
      results.push({ args: tc.args, expected: tc.expected, actual: safeActual, isPassed, error, timeMs });
    }

    res.json({ success: true, total: meta.tests.length, passed, results });
  } catch (error) {
    console.error('Battle test error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to run tests' });
  }
});

// Submit code: evaluates, stores a Submission, and updates leaderboard
router.post('/:roomId/submit', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!isValidHexId(roomId)) return res.status(400).json({ success: false, error: 'Invalid roomId' });
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
    if (Buffer.byteLength(code, 'utf8') > MAX_CODE_SIZE_BYTES) {
      return res.status(413).json({ success: false, error: 'Code too large' });
    }

    // Ensure the authenticated user is a participant
    const userId = req.user && req.user._id ? req.user._id.toString() : null;
    if (!userId || !(await assertParticipant(roomId, userId))) {
      return res.status(403).json({ success: false, error: 'Not a participant of this room' });
    }

    const state = roomStateManager.getRoomState(roomId);
    if (!state || !state.battle) return res.status(404).json({ success: false, error: 'Battle state not found' });
    const problemId = state.battle.problemId;
    const meta = battleProblems[problemId];
    if (!meta) return res.status(400).json({ success: false, error: 'Unknown battle problem' });

    // Evaluate with guardrails and timing
    const results = [];
    let passed = 0;
    let totalTimeMs = 0;
    for (const tc of meta.tests) {
      let actual;
      let error = null;
      let timeMs = 0;
      // Validate input size
      try {
        for (const arg of tc.args) {
          const size = Buffer.byteLength(JSON.stringify(arg).slice(0, MAX_ARG_STRING_LEN + 1), 'utf8');
          if (size > MAX_ARG_STRING_LEN) {
            throw new Error('Input too large');
          }
        }
      } catch (e) {
        error = 'Invalid or oversized input';
      }
      try {
        if (!error) {
          const start = Date.now();
          actual = runJavaScriptFunction(code, meta.functionName, tc.args, 1500);
          timeMs = Date.now() - start;
          totalTimeMs += timeMs;
        }
      } catch (e) {
        error = e.message || String(e);
      }
      const safeActual = typeof actual === 'string' && actual.length > MAX_RESULT_STRING_LEN
        ? actual.slice(0, MAX_RESULT_STRING_LEN) + '...'
        : actual;
      const isPassed = error ? false : deepEqual(safeActual, tc.expected);
      if (isPassed) passed += 1;
      results.push({ args: tc.args, expected: tc.expected, actual: safeActual, isPassed, error, timeMs });
    }

    // Persist Problem (if needed) and Submission
    const problemDoc = await ensureBattleProblemDocument(problemId, req.user._id);

    const submission = new Submission({
      user: req.user._id,
      problem: problemDoc ? problemDoc._id : null,
      language: 'javascript',
      code,
      status: passed === meta.tests.length ? 'accepted' : (passed > 0 ? 'wrong_answer' : 'wrong_answer'),
      sessionId: roomId,
      isPractice: false
    });
    // Convert results to Submission.testResults shape
    submission.testResults = results.map((r) => ({
      testCaseId: problemDoc ? (problemDoc._id) : undefined,
      input: JSON.stringify(r.args),
      expectedOutput: JSON.stringify(r.expected),
      actualOutput: r.error ? String(r.error) : JSON.stringify(r.actual),
      isPassed: r.isPassed,
      executionTime: r.timeMs || 0,
      memoryUsed: 0,
      errorMessage: r.error || null
    }));
    submission.totalTestCases = meta.tests.length;
    submission.passedTestCases = passed;
    // Composite score: correctness base + speed bonus + brevity bonus + first-correct bonus
    const correctnessPct = Math.round((passed / meta.tests.length) * 100);
    const stateSubmissions = (state && state.battle && state.battle.submissions) || {};
    const existingSummaries = Object.values(stateSubmissions);
    const anyPerfect = existingSummaries.some(s => s && s.passed === meta.tests.length);
    const isFirstCorrect = !anyPerfect && passed === meta.tests.length;
    const minCodeLength = existingSummaries.length > 0
      ? Math.min(...existingSummaries.map(s => (s && typeof s.codeLength === 'number') ? s.codeLength : Infinity), code.length)
      : code.length;
    let brevityBonus = 0;
    if (minCodeLength > 0) {
      const ratio = code.length / minCodeLength;
      if (ratio <= 1.1) brevityBonus = 10;
      else if (ratio <= 1.3) brevityBonus = 5;
    }
    const speedBonus = Math.max(0, 20 - Math.floor(totalTimeMs / 100));
    const firstBonus = isFirstCorrect ? 10 : 0;
    const compositeScore = Math.min(100, correctnessPct + speedBonus + brevityBonus + firstBonus);
    submission.executionTime = totalTimeMs;
    submission.score = compositeScore;
    await submission.save();

    // Update leaderboard (category: 'battle')
    let leaderboard = await Leaderboard.findOne({ category: 'battle' });
    if (!leaderboard) {
      leaderboard = new Leaderboard({ category: 'battle', entries: [] });
    }
    const existingEntryIndex = leaderboard.entries.findIndex(e => e.userId.toString() === req.user._id.toString());
    if (existingEntryIndex !== -1) {
      if (submission.score > leaderboard.entries[existingEntryIndex].score) {
        leaderboard.entries[existingEntryIndex].score = submission.score;
        leaderboard.entries[existingEntryIndex].details = { problemId };
        leaderboard.entries[existingEntryIndex].updatedAt = new Date();
      }
    } else {
      leaderboard.entries.push({ userId: req.user._id, score: submission.score, details: { problemId }, submittedAt: new Date() });
    }
    leaderboard.entries.sort((a, b) => b.score - a.score);
    await leaderboard.save();

    // Update in-memory battle state summary for future scoring (min code length, first correct check)
    try {
      const summary = {
        userId: req.user._id.toString(),
        passed,
        total: meta.tests.length,
        codeLength: code.length,
        totalTimeMs,
        compositeScore
      };
      const current = roomStateManager.getRoomState(roomId) || {};
      const currentBattle = (current && current.battle) || {};
      const submissionsMap = currentBattle.submissions || {};
      submissionsMap[req.user._id.toString()] = summary;
      let updatedBattle = { ...currentBattle, submissions: submissionsMap };
      // Auto-end: when all active participants have submitted perfectly OR time elapsed
      try {
        const room = await Room.findById(roomId);
        const activeParticipantIds = (room?.participants || [])
          .filter(p => p.isActive)
          .map(p => p.userId.toString());
        const haveAllSubmitted = activeParticipantIds.every(uid => submissionsMap[uid]);
        const allPerfect = haveAllSubmitted && activeParticipantIds.every(uid => (submissionsMap[uid]?.passed === meta.tests.length));
        const timeUp = updatedBattle.started && updatedBattle.startedAt && updatedBattle.durationMinutes
          ? (Date.now() - new Date(updatedBattle.startedAt).getTime()) >= (updatedBattle.durationMinutes * 60 * 1000)
          : false;
        if (!updatedBattle.ended && (allPerfect || timeUp)) {
          updatedBattle.ended = true;
          updatedBattle.endedAt = new Date();
        }
      } catch (_) { /* noop */ }
      await roomStateManager.updateRoomState(roomId, { battle: updatedBattle });
    } catch (_) { /* noop */ }

    res.json({ success: true, passed, total: meta.tests.length, score: submission.score, timeMs: totalTimeMs, submissionId: submission._id, results });
  } catch (error) {
    console.error('Battle submit error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to submit' });
  }
});

// Get lobby participants for a room (from DB + in-memory state)
router.get('/:roomId/lobby', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!isValidHexId(roomId)) return res.status(400).json({ success: false, error: 'Invalid roomId' });
    const room = await Room.findById(roomId).populate('participants.userId', 'displayName email avatar');
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    const state = roomStateManager.getRoomState(roomId) || {};
    const battleState = state.battle || {};
    const readyMap = battleState.ready || {}; // optional map userId -> boolean
    const now = Date.now();
    const participants = room.participants
      .filter(p => p.isActive)
      .map(p => ({
        id: p.userId._id,
        name: p.userId.displayName || p.userId.email,
        avatar: p.userId.avatar || '👤',
        role: p.role,
        isActive: p.isActive,
        joinedAt: p.joinedAt,
        lastSeen: p.lastSeen,
        elapsedSeconds: p.joinedAt ? Math.floor((now - new Date(p.joinedAt).getTime()) / 1000) : null,
        ready: Boolean(readyMap[p.userId._id.toString()])
      }));

    const response = {
      success: true,
      roomId,
      roomCode: room.roomCode,
      hostId: room.createdBy?.toString?.() || null,
      status: room.status,
      mode: 'battle',
      participants,
      battle: {
        started: Boolean(battleState.started),
        durationMinutes: battleState.durationMinutes || null,
        problemId: battleState.problemId || null,
        difficulty: battleState.difficulty || null,
        numReady: participants.filter(p => p.ready).length,
        total: participants.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Battle lobby error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lobby' });
  }
});

module.exports = router;
// Additional lobby endpoints


