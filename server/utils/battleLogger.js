const Room = require('../models/Room');
const Submission = require('../models/Submission');
const roomStateManager = require('./roomStateManager');

// Comprehensive logging functions for battle state debugging
const logRoomState = async (roomId, context = '') => {
  try {
    console.log(`\n=== ROOM STATE LOG [${context}] ===`);
    console.log(`Room ID: ${roomId}`);
    
    // Log database room state
    const dbRoom = await Room.findById(roomId).populate('participants.userId', 'displayName email avatar');
    if (dbRoom) {
      console.log('Database Room State:');
      console.log(`  - Status: ${dbRoom.status}`);
      console.log(`  - Mode: ${dbRoom.mode}`);
      console.log(`  - Language: ${dbRoom.language}`);
      console.log(`  - Created By: ${dbRoom.createdBy}`);
      console.log(`  - Room Code: ${dbRoom.roomCode}`);
      console.log(`  - Is Active: ${dbRoom.isActive}`);
      console.log(`  - Participants Count: ${dbRoom.participants.length}`);
      console.log('  - Participants Details:');
      dbRoom.participants.forEach((p, index) => {
        const userId = p.userId && p.userId._id ? p.userId._id : p.userId;
        const userName = p.userId && p.userId.displayName ? p.userId.displayName : 'Anonymous';
        console.log(`    [${index}] ID: ${userId}, Name: ${userName}, Role: ${p.role}, Active: ${p.isActive}, LastSeen: ${p.lastSeen}`);
      });
    } else {
      console.log('Database Room: NOT FOUND');
    }
    
    // Log in-memory room state
    const memoryState = await roomStateManager.getRoomState(roomId);
    if (memoryState) {
      console.log('In-Memory Room State:');
      console.log(`  - Mode: ${memoryState.mode}`);
      console.log(`  - Language: ${memoryState.language}`);
      console.log(`  - Is Active: ${memoryState.isActive}`);
      console.log(`  - Users Count: ${memoryState.users ? memoryState.users.size : 0}`);
      console.log(`  - Users: ${memoryState.users ? Array.from(memoryState.users) : '[]'}`);
      
      if (memoryState.battle) {
        console.log('  - Battle State:');
        console.log(`    - Problem ID: ${memoryState.battle.problemId}`);
        console.log(`    - Difficulty: ${memoryState.battle.difficulty}`);
        console.log(`    - Started: ${memoryState.battle.started}`);
        console.log(`    - Ended: ${memoryState.battle.ended}`);
        console.log(`    - Started At: ${memoryState.battle.startedAt}`);
        console.log(`    - Ended At: ${memoryState.battle.endedAt}`);
        console.log(`    - Duration: ${memoryState.battle.durationMinutes} minutes`);
        console.log(`    - Host: ${memoryState.battle.host}`);
        console.log(`    - Submissions Count: ${Object.keys(memoryState.battle.submissions || {}).length}`);
        console.log('    - Submissions Details:');
        Object.entries(memoryState.battle.submissions || {}).forEach(([userId, submission]) => {
          console.log(`      [${userId}] Passed: ${submission.passed}/${submission.total}, Score: ${submission.compositeScore}, Time: ${submission.totalTimeMs}ms`);
        });
      } else {
        console.log('  - Battle State: NOT FOUND');
      }
    } else {
      console.log('In-Memory Room State: NOT FOUND');
    }
    
    console.log('=== END ROOM STATE LOG ===\n');
  } catch (error) {
    console.error('Error logging room state:', error);
  }
};

const logSubmissionState = async (roomId, context = '') => {
  try {
    console.log(`\n=== SUBMISSION STATE LOG [${context}] ===`);
    console.log(`Room ID: ${roomId}`);
    
    // Log all submissions for this room
    const submissions = await Submission.find({ sessionId: roomId }).populate('user', 'displayName email').populate('problem', 'title slug');
    console.log(`Total Submissions Found: ${submissions.length}`);
    
    submissions.forEach((submission, index) => {
      console.log(`Submission [${index}]:`);
      console.log(`  - ID: ${submission._id}`);
      console.log(`  - User: ${submission.user ? (submission.user.displayName || submission.user.email || 'Anonymous') : 'Anonymous'}`);
      console.log(`  - User ID: ${submission.user || 'Anonymous'}`);
      console.log(`  - Problem: ${submission.problem ? submission.problem.title : 'Unknown'}`);
      console.log(`  - Language: ${submission.language}`);
      console.log(`  - Status: ${submission.status}`);
      console.log(`  - Score: ${submission.score}`);
      console.log(`  - Execution Time: ${submission.executionTime}ms`);
      console.log(`  - Test Cases: ${submission.passedTestCases}/${submission.totalTestCases}`);
      console.log(`  - Is Practice: ${submission.isPractice}`);
      console.log(`  - Created At: ${submission.createdAt}`);
      console.log(`  - Code Length: ${submission.code ? submission.code.length : 0} chars`);
      
      if (submission.testResults && submission.testResults.length > 0) {
        console.log(`  - Test Results: ${submission.testResults.filter(t => t.isPassed).length}/${submission.testResults.length} passed`);
      }
    });
    
    console.log('=== END SUBMISSION STATE LOG ===\n');
  } catch (error) {
    console.error('Error logging submission state:', error);
  }
};

const validateBattleResultData = async (roomId) => {
  try {
    console.log(`\n=== BATTLE RESULT VALIDATION [${roomId}] ===`);
    
    const state = await roomStateManager.getRoomState(roomId);
    if (!state || !state.battle) {
      console.log('❌ VALIDATION FAILED: No battle state found');
      return false;
    }
    
    const battle = state.battle;
    const submissions = battle.submissions || {};
    
    // Check if battle has ended
    if (!battle.ended) {
      console.log('❌ VALIDATION FAILED: Battle has not ended yet');
      return false;
    }
    
    // Check if we have submissions
    const submissionCount = Object.keys(submissions).length;
    if (submissionCount === 0) {
      console.log('❌ VALIDATION FAILED: No submissions found in battle state');
      return false;
    }
    
    console.log(`✅ Found ${submissionCount} submissions in battle state`);
    
    // Check database submissions
    const dbSubmissions = await Submission.find({ sessionId: roomId });
    console.log(`✅ Found ${dbSubmissions.length} submissions in database`);
    
    // Validate each submission has required data
    let validationPassed = true;
    Object.entries(submissions).forEach(([userId, submission]) => {
      if (!submission.compositeScore && submission.compositeScore !== 0) {
        console.log(`❌ VALIDATION FAILED: User ${userId} missing compositeScore`);
        validationPassed = false;
      }
      if (!submission.passed && submission.passed !== 0) {
        console.log(`❌ VALIDATION FAILED: User ${userId} missing passed count`);
        validationPassed = false;
      }
      if (!submission.total && submission.total !== 0) {
        console.log(`❌ VALIDATION FAILED: User ${userId} missing total count`);
        validationPassed = false;
      }
    });
    
    if (validationPassed) {
      console.log('✅ All submissions have required data for result calculation');
    }
    
    console.log('=== END BATTLE RESULT VALIDATION ===\n');
    return validationPassed;
  } catch (error) {
    console.error('Error validating battle result data:', error);
    return false;
  }
};

module.exports = {
  logRoomState,
  logSubmissionState,
  validateBattleResultData
};
