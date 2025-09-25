#!/usr/bin/env node

/**
 * OAuth Configuration Verification Script
 * This script helps verify that your OAuth configuration is correct for Vercel deployment
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 OAuth Configuration Verification Script');
console.log('==========================================\n');

// Check if we're in the client directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the client directory');
  process.exit(1);
}

// Check environment variables
console.log('📋 Checking Environment Variables:');
console.log('----------------------------------');

const envVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_API_URL',
  'REACT_APP_SOCKET_URL'
];

let missingVars = [];
envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 50)}...`);
  } else {
    console.log(`❌ ${varName}: Not set`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  console.log('   Make sure to set these in your Vercel dashboard');
}

// Check Supabase URL format
console.log('\n🔗 Checking Supabase Configuration:');
console.log('-----------------------------------');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
if (supabaseUrl) {
  if (supabaseUrl.includes('qrxjhmpudchgisaxfdtn')) {
    console.log('✅ Supabase URL contains correct project ID');
  } else {
    console.log('❌ Supabase URL may have incorrect project ID');
  }
  
  if (supabaseUrl.startsWith('https://')) {
    console.log('✅ Supabase URL uses HTTPS');
  } else {
    console.log('❌ Supabase URL should use HTTPS');
  }
} else {
  console.log('❌ REACT_APP_SUPABASE_URL not set');
}

// Check if vercel.json exists and is valid
console.log('\n📄 Checking Vercel Configuration:');
console.log('---------------------------------');

if (fs.existsSync('vercel.json')) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('✅ vercel.json exists and is valid JSON');
    
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
      console.log('✅ Rewrites configuration found');
    } else {
      console.log('⚠️  No rewrites configuration found');
    }
  } catch (error) {
    console.log('❌ vercel.json exists but is invalid JSON');
  }
} else {
  console.log('❌ vercel.json not found');
}

// Check build directory
console.log('\n🏗️  Checking Build Configuration:');
console.log('----------------------------------');

if (fs.existsSync('build')) {
  console.log('✅ Build directory exists');
  
  if (fs.existsSync('build/index.html')) {
    console.log('✅ index.html found in build directory');
  } else {
    console.log('❌ index.html not found in build directory');
  }
} else {
  console.log('⚠️  Build directory not found - run "npm run build" first');
}

// Summary
console.log('\n📊 Summary:');
console.log('===========');

if (missingVars.length === 0) {
  console.log('✅ All environment variables are set');
} else {
  console.log(`❌ ${missingVars.length} environment variables missing`);
}

console.log('\n🎯 Next Steps:');
console.log('1. Update Supabase redirect URLs to include your Vercel domain');
console.log('2. Update Google Cloud Console with your Vercel domain');
console.log('3. Set environment variables in Vercel dashboard');
console.log('4. Redeploy your application');
console.log('5. Test the OAuth flow in production');

console.log('\n📚 For detailed instructions, see: docs/deployment/VERCEL_OAUTH_FIX.md');
