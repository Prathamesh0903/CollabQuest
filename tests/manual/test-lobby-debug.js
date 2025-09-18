const { testSpecificRoom } = require('./debug-lobby-endpoint');

// Test the specific roomId
console.log('🚀 Starting lobby endpoint debug test...');
testSpecificRoom().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
