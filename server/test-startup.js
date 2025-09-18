#!/usr/bin/env node

// Simple startup test to identify issues
require('dotenv').config();

console.log('🔍 Backend Startup Diagnostic Test');
console.log('=====================================');

// Test 1: Environment Variables
console.log('\n1. Environment Variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');

// Test 2: Dependencies
console.log('\n2. Dependencies:');
try {
  require('express');
  console.log('   ✅ Express');
} catch (e) {
  console.log('   ❌ Express:', e.message);
}

try {
  require('mongoose');
  console.log('   ✅ Mongoose');
} catch (e) {
  console.log('   ❌ Mongoose:', e.message);
}

try {
  require('socket.io');
  console.log('   ✅ Socket.IO');
} catch (e) {
  console.log('   ❌ Socket.IO:', e.message);
}

// Test 3: MongoDB Connection (without actually connecting)
console.log('\n3. MongoDB URI Format:');
if (process.env.MONGODB_URI) {
  if (process.env.MONGODB_URI.includes('localhost')) {
    console.log('   ⚠️  Using localhost - make sure MongoDB is running');
  } else if (process.env.MONGODB_URI.includes('mongodb.net')) {
    console.log('   ✅ Using MongoDB Atlas');
  } else {
    console.log('   ⚠️  Custom MongoDB URI');
  }
} else {
  console.log('   ❌ No MongoDB URI set');
}

// Test 4: Firebase Configuration
console.log('\n4. Firebase Configuration:');
if (process.env.FIREBASE_PROJECT_ID === 'your-firebase-project-id') {
  console.log('   ⚠️  Using placeholder Firebase credentials');
} else if (process.env.FIREBASE_PROJECT_ID) {
  console.log('   ✅ Firebase project ID set');
} else {
  console.log('   ❌ No Firebase project ID');
}

console.log('\n=====================================');
console.log('🎯 Diagnostic Complete!');
console.log('\nNext steps:');
console.log('1. Fix any ❌ issues above');
console.log('2. If MongoDB is localhost, start MongoDB service');
console.log('3. Update Firebase credentials if using placeholders');
console.log('4. Try running: npm start');

