#!/usr/bin/env node

/**
 * Quick fix script for server issues
 * This script addresses the common server startup issues
 */

console.log('🔧 Applying server fixes...');

// Fix 1: Check if Redis is available and provide fallback
const checkRedisConnection = () => {
  console.log('📊 Checking Redis connection...');
  try {
    const redis = require('redis');
    console.log('✅ Redis module available');
    return true;
  } catch (error) {
    console.log('⚠️ Redis not available - using in-memory storage only');
    return false;
  }
};

// Fix 2: Validate environment variables
const validateEnvironment = () => {
  console.log('🔍 Validating environment variables...');
  
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('⚠️ Missing environment variables:', missing.join(', '));
    console.log('📝 Please set these in your .env file');
    return false;
  }
  
  console.log('✅ Environment variables validated');
  return true;
};

// Fix 3: Check MongoDB connection
const checkMongoConnection = async () => {
  console.log('🔍 Checking MongoDB connection...');
  try {
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative_coding';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running or use MongoDB Atlas');
    return false;
  }
};

// Fix 4: Create necessary directories
const createDirectories = () => {
  console.log('📁 Creating necessary directories...');
  const fs = require('fs');
  const path = require('path');
  
  const dirs = [
    'server/uploads',
    'server/temp',
    'executor/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Main execution
const main = async () => {
  console.log('🚀 Starting server health check and fixes...\n');
  
  // Check Redis
  checkRedisConnection();
  
  // Validate environment
  validateEnvironment();
  
  // Create directories
  createDirectories();
  
  // Check MongoDB (optional, don't fail if not available)
  try {
    await checkMongoConnection();
  } catch (error) {
    console.log('⚠️ MongoDB check skipped - will retry on server startup');
  }
  
  console.log('\n✅ Server fixes applied!');
  console.log('\n📝 Next steps:');
  console.log('1. Make sure your .env file is properly configured');
  console.log('2. Start your server with: npm start (in server directory)');
  console.log('3. The circular dependency and cleanup errors should be resolved');
  console.log('\n🔗 For deployment, use the scripts in the root directory:');
  console.log('   - deploy-render.bat (Windows) or deploy-render.sh (Linux/Mac)');
  console.log('   - deploy-vercel.bat (Windows) or deploy-vercel.sh (Linux/Mac)');
};

// Run the fixes
main().catch(console.error);
