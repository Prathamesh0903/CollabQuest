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
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    description: `Write a function that reverses a string. The input string is given as an array of characters <code>s</code>. You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }
    ],
    constraints: [
      '1 <= s.length <= 10^5',
      's[i] is a printable ascii character.'
    ],
    templates: {
      javascript: `function reverseString(s) {
  // TODO: implement - modify s in-place
}

// Test
let test = ["h","e","l","l","o"];
reverseString(test);
console.log(test);
`,
      python: `def reverseString(s):
    # TODO: implement - modify s in-place
    pass

# Test
test = ["h","e","l","l","o"]
reverseString(test)
print(test)
`
    }
  },
  {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    description: `Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a palindrome, and <code>false</code> otherwise.`,
    examples: [
      { input: 'x = 121', output: 'true' },
      { input: 'x = -121', output: 'false' },
      { input: 'x = 10', output: 'false' }
    ],
    constraints: [
      '-2^31 <= x <= 2^31 - 1'
    ],
    templates: {
      javascript: `function isPalindrome(x) {
  // TODO: implement
  return false;
}

console.log(isPalindrome(121));
`,
      python: `def isPalindrome(x):
    # TODO: implement
    return False

print(isPalindrome(121))
`
    }
  },
  {
    id: 'roman-to-integer',
    title: 'Roman to Integer',
    difficulty: 'Easy',
    description: `Roman numerals are represented by seven different symbols: I, V, X, L, C, D and M. Given a roman numeral, convert it to an integer.`,
    examples: [
      { input: 's = "III"', output: '3' },
      { input: 's = "LVIII"', output: '58' },
      { input: 's = "MCMXC"', output: '1994' }
    ],
    constraints: [
      '1 <= s.length <= 15',
      's contains only the characters ("I", "V", "X", "L", "C", "D", "M")',
      'It is guaranteed that s is a valid roman numeral in the range [1, 3999]'
    ],
    templates: {
      javascript: `function romanToInt(s) {
  // TODO: implement
  return 0;
}

console.log(romanToInt("MCMXC"));
`,
      python: `def romanToInt(s):
    # TODO: implement
    return 0

print(romanToInt("MCMXC"))
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
    id: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    description: `Given an array of strings <code>strs</code>, group the anagrams together. You can return the answer in any order.`,
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: 'strs = [""]', output: '[[""]]' },
      { input: 'strs = ["a"]', output: '[["a"]]' }
    ],
    constraints: [
      '1 <= strs.length <= 10^4',
      '0 <= strs[i].length <= 100',
      'strs[i] consists of lowercase English letters only.'
    ],
    templates: {
      javascript: `function groupAnagrams(strs) {
  // TODO: implement
  return [];
}

console.log(groupAnagrams(["eat","tea","tan","ate","nat","bat"]));
`,
      python: `def groupAnagrams(strs):
    # TODO: implement
    return []

print(groupAnagrams(["eat","tea","tan","ate","nat","bat"]))
`
    }
  },
  {
    id: 'top-k-frequent',
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    description: `Given an integer array <code>nums</code> and an integer <code>k</code>, return the <code>k</code> most frequent elements. You may return the answer in any order.`,
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' },
      { input: 'nums = [1], k = 1', output: '[1]' }
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      'k is in the range [1, the number of unique elements in the array]',
      'It is guaranteed that the answer is unique.'
    ],
    templates: {
      javascript: `function topKFrequent(nums, k) {
  // TODO: implement
  return [];
}

console.log(topKFrequent([1,1,1,2,2,3], 2));
`,
      python: `def topKFrequent(nums, k):
    # TODO: implement
    return []

print(topKFrequent([1,1,1,2,2,3], 2))
`
    }
  },
  {
    id: 'spiral-matrix',
    title: 'Spiral Matrix',
    difficulty: 'Medium',
    description: `Given an <code>m x n</code> matrix, return all elements of the matrix in spiral order.`,
    examples: [
      { input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[1,2,3,6,9,8,7,4,5]' },
      { input: 'matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]', output: '[1,2,3,4,8,12,11,10,9,5,6,7]' }
    ],
    constraints: [
      'm == matrix.length',
      'n == matrix[i].length',
      '1 <= m, n <= 10',
      '-100 <= matrix[i][j] <= 100'
    ],
    templates: {
      javascript: `function spiralOrder(matrix) {
  // TODO: implement
  return [];
}

console.log(spiralOrder([[1,2,3],[4,5,6],[7,8,9]]));
`,
      python: `def spiralOrder(matrix):
    # TODO: implement
    return []

print(spiralOrder([[1,2,3],[4,5,6],[7,8,9]]))
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
  },
  {
    id: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    difficulty: 'Hard',
    description: `You are given an array of <code>k</code> linked-lists <code>lists</code>, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.`,
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
      { input: 'lists = []', output: '[]' },
      { input: 'lists = [[]]', output: '[]' }
    ],
    constraints: [
      'k == lists.length',
      '0 <= k <= 10^4',
      '0 <= lists[i].length <= 500',
      '-10^4 <= lists[i][j] <= 10^4',
      'lists[i] is sorted in ascending order.'
    ],
    templates: {
      javascript: `function mergeKLists(lists) {
  // TODO: implement
  return null;
}

console.log(mergeKLists([[1,4,5],[1,3,4],[2,6]]));
`,
      python: `def mergeKLists(lists):
    # TODO: implement
    return None

print(mergeKLists([[1,4,5],[1,3,4],[2,6]]))
`
    }
  },
  {
    id: 'sliding-window-maximum',
    title: 'Sliding Window Maximum',
    difficulty: 'Hard',
    description: `You are given an array of integers <code>nums</code>, there is a sliding window of size <code>k</code> which is moving from the very left of the array to the very right. You can only see the <code>k</code> numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.`,
    examples: [
      { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[3,3,5,5,6,7]' },
      { input: 'nums = [1], k = 1', output: '[1]' }
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
      '1 <= k <= nums.length'
    ],
    templates: {
      javascript: `function maxSlidingWindow(nums, k) {
  // TODO: implement
  return [];
}

console.log(maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3));
`,
      python: `def maxSlidingWindow(nums, k):
    # TODO: implement
    return []

print(maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3))
`
    }
  },
  {
    id: 'word-ladder',
    title: 'Word Ladder',
    difficulty: 'Hard',
    description: `A transformation sequence from word <code>beginWord</code> to word <code>endWord</code> using a dictionary <code>wordList</code> is a sequence of words such that: Only one letter can be changed at a time. Each transformed word must exist in the word list. Given two words, <code>beginWord</code> and <code>endWord</code>, and a dictionary <code>wordList</code>, return the length of the shortest transformation sequence from <code>beginWord</code> to <code>endWord</code>, or 0 if no such sequence exists.`,
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5' },
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: '0' }
    ],
    constraints: [
      '1 <= beginWord.length <= 10',
      'endWord.length == beginWord.length',
      '1 <= wordList.length <= 5000',
      'wordList[i].length == beginWord.length',
      'beginWord, endWord, and all words in wordList consist of lowercase English letters only.',
      'All the strings in wordList are unique.'
    ],
    templates: {
      javascript: `function ladderLength(beginWord, endWord, wordList) {
  // TODO: implement
  return 0;
}

console.log(ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"]));
`,
      python: `def ladderLength(beginWord, endWord, wordList):
    # TODO: implement
    return 0

print(ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"]))
`
    }
  }
];

export default problems;


