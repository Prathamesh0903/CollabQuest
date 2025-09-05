const Problem = require('../models/Problem');

const sampleProblems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    description: 'Find two numbers that add up to a target',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Hash Table'],
    problemStatement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
  
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    constraints: `2 <= nums.length <= 104
-109 <= nums[i] <= 109
-109 <= target <= 109
Only one valid answer exists.`,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        `,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`
    },
    solution: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        
        for i, num in enumerate(nums):
            complement = target - num
            
            if complement in seen:
                return [seen[complement], i]
            
            seen[num] = i
        
        return []`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            
            map.put(nums[i], i);
        }
        
        return new int[0];
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            
            map[nums[i]] = i;
        }
        
        return {};
    }
};`
    },
    testCases: [
      {
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        isHidden: false
      },
      {
        input: '[3,2,4]\n6',
        expectedOutput: '[1,2]',
        isHidden: false
      },
      {
        input: '[3,3]\n6',
        expectedOutput: '[0,1]',
        isHidden: false
      }
    ]
  },
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    description: 'Check if two strings are anagrams',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['String', 'Hash Table', 'Sorting'],
    problemStatement: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      {
        input: 's = "anagram", t = "nagaram"',
        output: 'true',
        explanation: 'Both strings contain the same characters with the same frequency.'
      },
      {
        input: 's = "rat", t = "car"',
        output: 'false',
        explanation: 'The strings contain different characters.'
      }
    ],
    constraints: `1 <= s.length, t.length <= 5 * 104
s and t consist of lowercase English letters.`,
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    
};`,
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        `,
      java: `class Solution {
    public boolean isAnagram(String s, String t) {
        
    }
}`,
      cpp: `class Solution {
public:
    bool isAnagram(string s, string t) {
        
    }
};`
    },
    solution: {
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    if (s.length !== t.length) return false;
    
    const charCount = {};
    
    for (let char of s) {
        charCount[char] = (charCount[char] || 0) + 1;
    }
    
    for (let char of t) {
        if (!charCount[char]) return false;
        charCount[char]--;
    }
    
    return true;
};`,
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        
        char_count = {}
        
        for char in s:
            char_count[char] = char_count.get(char, 0) + 1
        
        for char in t:
            if char not in char_count or char_count[char] == 0:
                return False
            char_count[char] -= 1
        
        return True`,
      java: `class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        
        int[] charCount = new int[26];
        
        for (char c : s.toCharArray()) {
            charCount[c - 'a']++;
        }
        
        for (char c : t.toCharArray()) {
            charCount[c - 'a']--;
            if (charCount[c - 'a'] < 0) return false;
        }
        
        return true;
    }
}`,
      cpp: `class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        
        vector<int> charCount(26, 0);
        
        for (char c : s) {
            charCount[c - 'a']++;
        }
        
        for (char c : t) {
            charCount[c - 'a']--;
            if (charCount[c - 'a'] < 0) return false;
        }
        
        return true;
    }
};`
    },
    testCases: [
      {
        input: '"anagram"\n"nagaram"',
        expectedOutput: 'true',
        isHidden: false
      },
      {
        input: '"rat"\n"car"',
        expectedOutput: 'false',
        isHidden: false
      }
    ]
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    description: 'Find the contiguous subarray with maximum sum',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    problemStatement: `Given an integer array nums, find the subarray with the largest sum, and return its sum.`,
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.'
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.'
      }
    ],
    constraints: `1 <= nums.length <= 105
-104 <= nums[i] <= 104`,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    
};`,
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        
    }
}`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        
    }
};`
    },
    solution: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let maxSum = nums[0];
    let currentSum = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    
    return maxSum;
};`,
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        max_sum = current_sum = nums[0]
        
        for num in nums[1:]:
            current_sum = max(num, current_sum + num)
            max_sum = max(max_sum, current_sum)
        
        return max_sum`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        
        for (int i = 1; i < nums.length; i++) {
            currentSum = Math.max(nums[i], currentSum + nums[i]);
            maxSum = Math.max(maxSum, currentSum);
        }
        
        return maxSum;
    }
}`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        
        for (int i = 1; i < nums.size(); i++) {
            currentSum = max(nums[i], currentSum + nums[i]);
            maxSum = max(maxSum, currentSum);
        }
        
        return maxSum;
    }
};`
    },
    testCases: [
      {
        input: '[-2,1,-3,4,-1,2,1,-5,4]',
        expectedOutput: '6',
        isHidden: false
      },
      {
        input: '[1]',
        expectedOutput: '1',
        isHidden: false
      },
      {
        input: '[5,4,-1,7,8]',
        expectedOutput: '23',
        isHidden: false
      }
    ]
  }
];

const seedProblems = async () => {
  try {
    console.log('Starting DSA problems seeding...');
    
    // Clear existing problems
    await Problem.deleteMany({});
    console.log('Cleared existing problems');
    
    // Insert new problems
    const insertedProblems = await Problem.insertMany(sampleProblems);
    console.log(`Successfully seeded ${insertedProblems.length} problems`);
    
    return insertedProblems;
  } catch (error) {
    console.error('Error seeding problems:', error);
    throw error;
  }
};

const getSampleProblems = () => {
  return sampleProblems;
};

module.exports = {
  seedProblems,
  getSampleProblems
};
