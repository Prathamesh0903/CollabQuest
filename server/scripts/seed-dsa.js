/*
  Seed DSA data: categories, problems, and a demo DSAUser
  - Uses server env (MONGODB_URI). Load .env from server directory when run locally.
*/

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const DSACategory = require('../models/dsa/Category');
const DSAProblem = require('../models/dsa/DSAProblem');
const DSAUser = require('../models/dsa/DSAUser');

const toSlug = (str) => String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const baseCategories = [
  { name: 'Arrays', description: 'Array manipulation and traversal' },
  { name: 'Strings', description: 'String processing and parsing' },
  { name: 'Dynamic Programming', description: 'Optimization via overlapping subproblems' },
  { name: 'Hash Table', description: 'Associative arrays and hashing' },
  { name: 'Two Pointers', description: 'Pointer techniques for arrays/strings' },
];

const sampleProblems = async (categoryMap) => [
  {
    problemNumber: 1,
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: 'Easy',
    category: categoryMap['arrays'],
    tags: ['Array', 'Hash Table'],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', description: 'Because nums[0] + nums[1] == 9, we return [0, 1].', isHidden: false },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]', description: 'Because nums[1] + nums[2] == 6, we return [1, 2].', isHidden: false },
      { input: '[3,3]\n6', expectedOutput: '[0,1]', description: 'Because nums[0] + nums[1] == 6, we return [0, 1].', isHidden: false },
      { input: '[1,2,3,4,5]\n8', expectedOutput: '[2,4]', description: 'Hidden test case 1.', isHidden: true },
      { input: '[0,1,2,3,4]\n4', expectedOutput: '[0,4]', description: 'Hidden test case 2.', isHidden: true },
    ],
    starterCode: {
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
    
};`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        
    }
}`,
      cpp: `#include <vector>
#include <iostream>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        
    }
};`
    },
    functionName: {
      python: 'twoSum',
      javascript: 'twoSum',
      java: 'twoSum',
      cpp: 'twoSum'
    },
    solution: 'Use a hash map to find complements in O(n).',
  },
  {
    problemNumber: 2,
    title: 'Valid Anagram',
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    difficulty: 'Easy',
    category: categoryMap['strings'],
    tags: ['String', 'Hash Table', 'Sorting'],
    testCases: [
      { input: '"anagram"\n"nagaram"', expectedOutput: 'true', description: 'Both strings contain the same characters with the same frequency.' },
      { input: '"rat"\n"car"', expectedOutput: 'false', description: 'The strings contain different characters.' },
      { input: '"listen"\n"silent"', expectedOutput: 'true', description: 'Both strings are anagrams of each other.' },
    ],
    starterCode: {
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Your code here
        pass`,
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    // Your code here
    
};`,
      java: `import java.util.*;

class Solution {
    public boolean isAnagram(String s, String t) {
        // Your code here
        
    }
}`,
      cpp: `#include <string>
#include <iostream>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        // Your code here
        
    }
};`
    },
    functionName: {
      python: 'isAnagram',
      javascript: 'isAnagram',
      java: 'isAnagram',
      cpp: 'isAnagram'
    },
    solution: 'Count characters or sort both strings and compare.',
  },
  {
    problemNumber: 3,
    title: 'Maximum Subarray',
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    difficulty: 'Medium',
    category: categoryMap['arrays'],
    tags: ['Array', 'Dynamic Programming'],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', description: 'The subarray [4,-1,2,1] has the largest sum 6.', isHidden: false },
      { input: '[1]', expectedOutput: '1', description: 'The subarray [1] has the largest sum 1.', isHidden: false },
      { input: '[5,4,-1,7,8]', expectedOutput: '23', description: 'The subarray [5,4,-1,7,8] has the largest sum 23.', isHidden: false },
      { input: '[-1]', expectedOutput: '-1', description: 'Single negative element.', isHidden: true },
      { input: '[1,2,3,4,5]', expectedOutput: '15', description: 'All positive elements.', isHidden: true },
      { input: '[-5,-4,-3,-2,-1]', expectedOutput: '-1', description: 'All negative elements.', isHidden: true },
    ],
    starterCode: {
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        # Your code here
        pass`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    // Your code here
    
};`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your code here
        
    }
}`,
      cpp: `#include <vector>
#include <iostream>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your code here
        
    }
};`
    },
    functionName: {
      python: 'maxSubArray',
      javascript: 'maxSubArray',
      java: 'maxSubArray',
      cpp: 'maxSubArray'
    },
    solution: "Kadane's algorithm in O(n).",
  },
  {
    problemNumber: 4,
    title: 'Best Time to Buy and Sell Stock',
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    difficulty: 'Easy',
    category: categoryMap['arrays'],
    tags: ['Array', 'Dynamic Programming'],
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5', description: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: '[7,6,4,3,1]', expectedOutput: '0', description: 'In this case, no transactions are done and the max profit = 0.' },
      { input: '[1,2,3,4,5]', expectedOutput: '4', description: 'Buy on day 1 (price = 1) and sell on day 5 (price = 5), profit = 5-1 = 4.' },
    ],
    starterCode: {
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # Your code here
        pass`,
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    // Your code here
    
};`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        // Your code here
        
    }
}`,
      cpp: `#include <vector>
#include <iostream>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Your code here
        
    }
};`
    },
    functionName: {
      python: 'maxProfit',
      javascript: 'maxProfit',
      java: 'maxProfit',
      cpp: 'maxProfit'
    },
    solution: 'Track minimum price and maximum profit.',
  },
  {
    problemNumber: 5,
    title: 'Contains Duplicate',
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
    difficulty: 'Easy',
    category: categoryMap['hash-table'],
    tags: ['Array', 'Hash Table', 'Sorting'],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true', description: '1 appears twice in the array.' },
      { input: '[1,2,3,4]', expectedOutput: 'false', description: 'All elements are distinct.' },
      { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true', description: 'Multiple duplicates exist.' },
    ],
    starterCode: {
      python: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # Your code here
        pass`,
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    // Your code here
    
};`,
      java: `import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Your code here
        
    }
}`,
      cpp: `#include <vector>
#include <iostream>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Your code here
        
    }
};`
    },
    functionName: {
      python: 'containsDuplicate',
      javascript: 'containsDuplicate',
      java: 'containsDuplicate',
      cpp: 'containsDuplicate'
    },
    solution: 'Use a hash set to track seen elements.',
  }
];

async function upsertCategories() {
  const results = {};
  for (const cat of baseCategories) {
    const slug = toSlug(cat.name);
    const doc = await DSACategory.findOneAndUpdate(
      { slug },
      { $set: { name: cat.name, slug, description: cat.description } },
      { upsert: true, new: true }
    );
    results[slug] = doc._id;
  }
  return results;
}

async function upsertProblems(categoryMap) {
  const problems = await sampleProblems(categoryMap);
  for (const p of problems) {
    await DSAProblem.findOneAndUpdate(
      { title: p.title },
      { $set: p },
      { upsert: true }
    );
  }
  return problems.length;
}

async function ensureDemoUser() {
  const username = 'dsa_demo_user';
  const email = 'dsa.demo@example.com';
  const hashed_password = 'demo_password_hash_placeholder_please_replace';
  const user = await DSAUser.findOneAndUpdate(
    { username },
    { $setOnInsert: { username, email, hashed_password } },
    { upsert: true, new: true }
  );
  return user;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  try {
    console.log('Upserting categories...');
    const categoryMap = await upsertCategories();
    console.log('Categories ready:', categoryMap);

    console.log('Upserting problems...');
    const count = await upsertProblems(categoryMap);
    console.log(`Problems upserted: ${count}`);

    console.log('Ensuring demo DSAUser...');
    const demoUser = await ensureDemoUser();
    console.log('Demo user id:', demoUser._id.toString());

    console.log('DSA seeding completed.');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();


