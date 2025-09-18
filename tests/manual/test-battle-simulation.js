const axios = require('axios');
const mongoose = require('mongoose');

// Configuration
const BASE_URL = 'http://localhost:5000/api/battle';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-platform';

// Test data
const testUsers = [
  { id: '507f1f77bcf86cd799439011', name: 'Alice' },
  { id: '507f1f77bcf86cd799439012', name: 'Bob' },
  { id: '507f1f77bcf86cd799439013', name: 'Charlie' }
];

const testSolutions = {
  'two-sum': {
    perfect: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    partial: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
    wrong: `function twoSum(nums, target) {
  return [0, 1];
}`
  }
};

class BattleSimulator {
  constructor() {
    this.roomId = null;
    this.roomCode = null;
    this.battleState = null;
    this.submissions = [];
    this.results = null;
  }

  async connectDB() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async createBattle() {
    console.log('\n=== STEP 1: Creating Battle ===');
    try {
      const response = await axios.post(`${BASE_URL}/create`, {
        difficulty: 'Easy',
        questionSelection: 'selected',
        selectedProblem: 'two-sum',
        battleTime: 5 // 5 minutes for testing
      });

      this.roomId = response.data.roomId;
      this.roomCode = response.data.roomCode;
      this.battleState = response.data.state;

      console.log(`✅ Battle created successfully`);
      console.log(`   Room ID: ${this.roomId}`);
      console.log(`   Room Code: ${this.roomCode}`);
      console.log(`   Problem: ${response.data.problem.title}`);
      console.log(`   Duration: ${response.data.problem.difficulty}`);

      return response.data;
    } catch (error) {
      console.error('❌ Battle creation failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async joinBattle(userId, userName) {
    console.log(`\n=== STEP 2: ${userName} joining battle ===`);
    try {
      const response = await axios.post(`${BASE_URL}/join`, {
        roomCode: this.roomCode
      }, {
        headers: {
          'x-user-id': userId
        }
      });

      console.log(`✅ ${userName} joined successfully`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Room ID: ${response.data.roomId}`);

      return response.data;
    } catch (error) {
      console.error(`❌ ${userName} join failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getLobby() {
    console.log('\n=== STEP 3: Getting lobby state ===');
    try {
      const response = await axios.get(`${BASE_URL}/${this.roomId}/lobby`);
      
      console.log(`✅ Lobby retrieved successfully`);
      console.log(`   Participants: ${response.data.participants.length}`);
      console.log(`   Battle started: ${response.data.battle.started}`);
      console.log(`   Battle ended: ${response.data.battle.ended}`);
      
      response.data.participants.forEach((p, index) => {
        console.log(`   [${index}] ${p.name} (${p.id}) - Role: ${p.role}, Ready: ${p.ready}`);
      });

      return response.data;
    } catch (error) {
      console.error('❌ Lobby retrieval failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async startBattle() {
    console.log('\n=== STEP 4: Starting battle ===');
    try {
      const response = await axios.post(`${BASE_URL}/${this.roomId}/start`);
      
      console.log(`✅ Battle started successfully`);
      console.log(`   Started at: ${response.data.startedAt}`);
      console.log(`   Duration: ${response.data.durationMinutes} minutes`);

      return response.data;
    } catch (error) {
      console.error('❌ Battle start failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async submitSolution(userId, userName, solutionType) {
    console.log(`\n=== STEP 5: ${userName} submitting ${solutionType} solution ===`);
    try {
      const code = testSolutions['two-sum'][solutionType];
      const response = await axios.post(`${BASE_URL}/${this.roomId}/submit`, {
        code: code
      }, {
        headers: {
          'x-user-id': userId
        }
      });

      const submission = {
        userId,
        userName,
        solutionType,
        ...response.data
      };

      this.submissions.push(submission);

      console.log(`✅ ${userName} submitted successfully`);
      console.log(`   Passed: ${response.data.passed}/${response.data.total}`);
      console.log(`   Score: ${response.data.score}`);
      console.log(`   Time: ${response.data.timeMs}ms`);
      console.log(`   Submission ID: ${response.data.submissionId}`);

      return response.data;
    } catch (error) {
      console.error(`❌ ${userName} submission failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async testCode(userId, userName, solutionType) {
    console.log(`\n=== STEP 6: ${userName} testing ${solutionType} solution ===`);
    try {
      const code = testSolutions['two-sum'][solutionType];
      const response = await axios.post(`${BASE_URL}/${this.roomId}/test`, {
        code: code
      }, {
        headers: {
          'x-user-id': userId
        }
      });

      console.log(`✅ ${userName} test completed`);
      console.log(`   Passed: ${response.data.passed}/${response.data.total}`);
      console.log(`   Results: ${response.data.results.map(r => r.isPassed ? '✅' : '❌').join(' ')}`);

      return response.data;
    } catch (error) {
      console.error(`❌ ${userName} test failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getResults() {
    console.log('\n=== STEP 7: Getting battle results ===');
    try {
      const response = await axios.get(`${BASE_URL}/${this.roomId}/results`);
      
      this.results = response.data;

      console.log(`✅ Results retrieved successfully`);
      console.log(`   Battle ended: ${response.data.battleInfo.ended}`);
      console.log(`   Results count: ${response.data.results.length}`);
      
      response.data.results.forEach((result, index) => {
        console.log(`   [${index}] ${result.name} - Score: ${result.score}, Rank: ${result.rank}, Winner: ${result.isWinner}`);
      });

      return response.data;
    } catch (error) {
      console.error('❌ Results retrieval failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async endBattleManually() {
    console.log('\n=== STEP 8: Manually ending battle ===');
    try {
      const response = await axios.post(`${BASE_URL}/${this.roomId}/end`);
      
      console.log(`✅ Battle ended manually`);
      console.log(`   Ended at: ${response.data.endedAt}`);

      return response.data;
    } catch (error) {
      console.error('❌ Manual battle end failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async verifyDatabaseState() {
    console.log('\n=== STEP 9: Verifying database state ===');
    try {
      const Room = require('./server/models/Room');
      const Submission = require('./server/models/Submission');

      // Check room in database
      const room = await Room.findById(this.roomId).populate('participants.userId', 'displayName email');
      console.log(`✅ Room found in database:`);
      console.log(`   Status: ${room?.status}`);
      console.log(`   Mode: ${room?.mode}`);
      console.log(`   Participants: ${room?.participants?.length || 0}`);

      // Check submissions in database
      const submissions = await Submission.find({ sessionId: this.roomId });
      console.log(`✅ Submissions found in database: ${submissions.length}`);
      
      submissions.forEach((sub, index) => {
        console.log(`   [${index}] User: ${sub.user}, Score: ${sub.score}, Status: ${sub.status}`);
      });

      return { room, submissions };
    } catch (error) {
      console.error('❌ Database verification failed:', error.message);
      throw error;
    }
  }

  async runFullSimulation() {
    try {
      console.log('🚀 Starting Battle Simulation Test');
      console.log('=====================================');

      await this.connectDB();

      // Step 1: Create battle
      await this.createBattle();

      // Step 2: Join participants
      await this.joinBattle(testUsers[0].id, testUsers[0].name);
      await this.joinBattle(testUsers[1].id, testUsers[1].name);
      await this.joinBattle(testUsers[2].id, testUsers[2].name);

      // Step 3: Check lobby
      await this.getLobby();

      // Step 4: Start battle
      await this.startBattle();

      // Step 5: Test solutions first
      await this.testCode(testUsers[0].id, testUsers[0].name, 'perfect');
      await this.testCode(testUsers[1].id, testUsers[1].name, 'partial');
      await this.testCode(testUsers[2].id, testUsers[2].name, 'wrong');

      // Step 6: Submit solutions
      await this.submitSolution(testUsers[0].id, testUsers[0].name, 'perfect');
      await this.submitSolution(testUsers[1].id, testUsers[1].name, 'partial');
      await this.submitSolution(testUsers[2].id, testUsers[2].name, 'wrong');

      // Step 7: Check results (should trigger auto-end if all perfect)
      await this.getResults();

      // Step 8: If battle not ended, end manually
      if (!this.results?.battleInfo?.ended) {
        await this.endBattleManually();
        await this.getResults();
      }

      // Step 9: Verify database state
      await this.verifyDatabaseState();

      console.log('\n🎉 Battle Simulation Completed Successfully!');
      this.printSummary();

    } catch (error) {
      console.error('\n💥 Battle Simulation Failed:', error.message);
      throw error;
    } finally {
      await this.disconnectDB();
    }
  }

  printSummary() {
    console.log('\n📊 SIMULATION SUMMARY');
    console.log('====================');
    console.log(`Room ID: ${this.roomId}`);
    console.log(`Room Code: ${this.roomCode}`);
    console.log(`Total Submissions: ${this.submissions.length}`);
    console.log(`Battle Ended: ${this.results?.battleInfo?.ended || false}`);
    
    if (this.results?.results) {
      console.log('\n🏆 Final Results:');
      this.results.results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name} - Score: ${result.score} (${result.passed}/${result.total})`);
      });
    }

    console.log('\n📝 Submission Details:');
    this.submissions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.userName} (${sub.solutionType}) - Score: ${sub.score}, Passed: ${sub.passed}/${sub.total}`);
    });
  }
}

// Run the simulation
async function runSimulation() {
  const simulator = new BattleSimulator();
  await simulator.runFullSimulation();
}

// Export for use in other files
module.exports = { BattleSimulator, runSimulation };

// Run if called directly
if (require.main === module) {
  runSimulation().catch(console.error);
}
