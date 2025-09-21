#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps users set up their environment files from templates
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🔧 CollabQuest Environment Setup');
  console.log('================================\n');

  try {
    // Check if environment files already exist
    const envFiles = [
      '.env',
      'server/.env',
      'client/.env.local'
    ];

    const existingFiles = envFiles.filter(file => fs.existsSync(file));
    
    if (existingFiles.length > 0) {
      console.log('⚠️  The following environment files already exist:');
      existingFiles.forEach(file => console.log(`   - ${file}`));
      
      const overwrite = await question('\nDo you want to overwrite them? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ Setup cancelled.');
        rl.close();
        return;
      }
    }

    // Copy template files
    console.log('\n📋 Copying environment templates...');
    
    // Root .env
    if (fs.existsSync('docs/deployment/env.example')) {
      fs.copyFileSync('docs/deployment/env.example', '.env');
      console.log('✅ Created .env');
    }

    // Server .env
    if (fs.existsSync('server/env.example')) {
      fs.copyFileSync('server/env.example', 'server/.env');
      console.log('✅ Created server/.env');
    }

    // Client .env.local
    if (fs.existsSync('client/.env.example')) {
      fs.copyFileSync('client/.env.example', 'client/.env.local');
      console.log('✅ Created client/.env.local');
    }

    console.log('\n🎉 Environment setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Edit the environment files with your actual values:');
    console.log('   - .env (root level)');
    console.log('   - server/.env (server configuration)');
    console.log('   - client/.env.local (client configuration)');
    console.log('\n2. Required values to update:');
    console.log('   - Supabase URL and keys');
    console.log('   - MongoDB connection string');
    console.log('   - JWT secret');
    console.log('\n3. See docs/deployment/ENVIRONMENT_SETUP.md for detailed instructions');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the setup
setupEnvironment();
