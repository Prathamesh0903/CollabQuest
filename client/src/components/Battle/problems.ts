type Difficulty = 'Easy' | 'Medium' | 'Hard';

type Problem = {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string; // can contain basic HTML for lists/formatting
  examples: { input: string; output: string }[];
  constraints: string[];
  templates: { javascript: string; python: string };
};

const problems: Problem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.<br/><br/>You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    templates: {
      javascript: `function twoSum(nums, target) {
  // TODO: implement
  return [-1, -1];
}

// You can test locally
console.log(twoSum([2,7,11,15], 9));
`,
      python: `def twoSum(nums, target):
    # TODO: implement
    return [-1, -1]

print(twoSum([2,7,11,15], 9))
`
    }
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: `Given a string <code>s</code> containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    constraints: [
      '1 <= s.length <= 10^4'
    ],
    templates: {
      javascript: `function isValid(s) {
  // TODO: implement
  return false;
}

console.log(isValid("()[]{}"));
`,
      python: `def isValid(s: str) -> bool:
    # TODO: implement
    return False

print(isValid("()[]{}"))
`
    }
  },
  {
    id: 'product-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    description: `Given an integer array <code>nums</code>, return an array <code>answer</code> such that <code>answer[i]</code> is the product of all the elements of <code>nums</code> except <code>nums[i]</code>. You must write an algorithm that runs in O(n) time and without using the division operation.`,
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' }
    ],
    constraints: [
      '2 <= nums.length <= 10^5',
      '-30 <= nums[i] <= 30'
    ],
    templates: {
      javascript: `function productExceptSelf(nums) {
  // TODO: implement
  return [];
}

console.log(productExceptSelf([1,2,3,4]));
`,
      python: `def productExceptSelf(nums):
    # TODO: implement
    return []

print(productExceptSelf([1,2,3,4]))
`
    }
  },
  {
    id: 'longest-consecutive-sequence',
    title: 'Longest Consecutive Sequence',
    difficulty: 'Hard',
    description: `Given an unsorted array of integers <code>nums</code>, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time.`,
    examples: [
      { input: 'nums = [100,4,200,1,3,2]', output: '4' },
      { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9' }
    ],
    constraints: [
      '0 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    templates: {
      javascript: `function longestConsecutive(nums) {
  // TODO: implement
  return 0;
}

console.log(longestConsecutive([100,4,200,1,3,2]));
`,
      python: `def longestConsecutive(nums):
    # TODO: implement
    return 0

print(longestConsecutive([100,4,200,1,3,2]))
`
    }
  }
];

export default problems;


