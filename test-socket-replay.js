const { testSocketEventReplay } = require('./socket-event-replay');

// Test the socket event replay
console.log('🚀 Starting socket event replay test...');
testSocketEventReplay().then((result) => {
  if (result.success) {
    console.log('✅ Socket event replay test completed successfully');
  } else {
    console.log('❌ Socket event replay test failed');
    console.log('Error:', result.error);
  }
  process.exit(0);
}).catch((error) => {
  console.error('❌ Socket event replay test failed:', error);
  process.exit(1);
});
