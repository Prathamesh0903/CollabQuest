const { testRedisFallback } = require('./test-redis-fallback');

// Run the Redis fallback test
console.log('🚀 Starting Redis fallback test...');
testRedisFallback().then((result) => {
  if (result.success) {
    console.log('✅ Redis fallback test completed successfully');
  } else {
    console.log('❌ Redis fallback test failed');
    console.log('Error:', result.error);
  }
  process.exit(0);
}).catch((error) => {
  console.error('❌ Redis fallback test failed:', error);
  process.exit(1);
});
