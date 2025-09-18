const mongoose = require('mongoose');
const DSAUser = require('../models/dsa/DSAUser');
const DSACategory = require('../models/dsa/Category');
const DSAProblem = require('../models/dsa/DSAProblem');
const DSASubmission = require('../models/dsa/DSASubmission');

async function seedDSA(uri) {
  const closeAfter = !mongoose.connection.readyState;
  if (uri && closeAfter) {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  try {
    console.log('Seeding DSA collections...');

    // Clear collections
    await Promise.all([
      DSASubmission.deleteMany({}),
      DSAProblem.deleteMany({}),
      DSACategory.deleteMany({}),
      DSAUser.deleteMany({})
    ]);

    // Users
    const users = await DSAUser.insertMany([
      { username: 'alice', email: 'alice@example.com', hashed_password: 'hash_alice_example_1234567890', created_at: new Date() },
      { username: 'bob', email: 'bob@example.com', hashed_password: 'hash_bob_example_1234567890', created_at: new Date() }
    ]);

    // Categories
    const categories = await DSACategory.insertMany([
      { name: 'Arrays', slug: 'arrays', description: 'Array related problems' },
      { name: 'Strings', slug: 'strings', description: 'String manipulation problems' }
    ]);

    // Problems
    const twoSum = await DSAProblem.create({
      title: 'Two Sum',
      description: 'Return indices of two numbers that add up to target.',
      difficulty: 'Easy',
      category: categories[0]._id,
      tags: ['hash-table', 'array'],
      testCases: [
        { input: '2 7 11 15\n9', expectedOutput: '0 1' },
        { input: '3 2 4\n6', expectedOutput: '1 2' }
      ],
      solution: 'Use a hash map to store seen numbers and indices.',
      isActive: true
    });

    const validAnagram = await DSAProblem.create({
      title: 'Valid Anagram',
      description: 'Check if two strings are anagrams.',
      difficulty: 'Easy',
      category: categories[1]._id,
      tags: ['string', 'hash-table'],
      testCases: [
        { input: 'anagram\nnagaram', expectedOutput: 'true' },
        { input: 'rat\ncar', expectedOutput: 'false' }
      ],
      solution: 'Count character frequencies and compare.',
      isActive: true
    });

    // Submissions
    await DSASubmission.insertMany([
      {
        user_id: users[0]._id,
        problem_id: twoSum._id,
        code: 'function twoSum(nums, target) { /* ... */ }',
        language: 'javascript',
        status: 'accepted',
        score: 100,
        executionTime: 12,
        memoryUsage: 16
      },
      {
        user_id: users[1]._id,
        problem_id: validAnagram._id,
        code: 'def isAnagram(s, t): # ...',
        language: 'python',
        status: 'wrong_answer',
        score: 0,
        executionTime: 8,
        memoryUsage: 12
      }
    ]);

    console.log('DSA seeding complete.');
  } catch (err) {
    console.error('DSA seed error:', err);
    throw err;
  } finally {
    if (closeAfter) {
      await mongoose.connection.close();
    }
  }
}

if (require.main === module) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabquest';
  seedDSA(uri).then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seedDSA };


