#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Battle End Sequence Test');
console.log('=====================================\n');

// Function to run a command and wait for it
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function runBattleTest() {
  try {
    // Check if server is running
    console.log('1️⃣ Checking if server is running...');
    try {
      const axios = require('axios');
      await axios.get('http://localhost:5000/api/battle/problems');
      console.log('✅ Server is already running\n');
    } catch (error) {
      console.log('❌ Server not running. Please start the server first with:');
      console.log('   cd server && npm start');
      console.log('   or');
      console.log('   npm run dev');
      process.exit(1);
    }

    // Run the battle end sequence test
    console.log('2️⃣ Running battle end sequence test...');
    await runCommand('node', ['test-battle-end-sequence.js']);

    console.log('\n🎉 Battle test completed successfully!');

  } catch (error) {
    console.error('\n💥 Battle test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runBattleTest();
