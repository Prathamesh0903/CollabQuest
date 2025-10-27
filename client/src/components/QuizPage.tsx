import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Clock, Target, CheckCircle, XCircle, 
  BookOpen, ArrowRight, Home, Brain, Zap,
  Award, TrendingUp, Star, Eye, EyeOff, HelpCircle
} from 'lucide-react';
import quizService from '../services/quizService';
import DynamicQuizContainer from './quiz/DynamicQuizContainer';
import EnhancedCodingQuestion from './quiz/questions/EnhancedCodingQuestion';
import QuizResults from './quiz/QuizResults';
import './QuizPage.css';

interface QuizCategory {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  color: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
}

interface QuizConfig {
  timeLimit: number;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  enableHints?: boolean;
  showExplanations?: boolean;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching' | 'coding' | 'predict-output';
  question: string;
  options?: Array<{text: string, isCorrect: boolean}>;
  correctAnswer?: string | number | boolean;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  hint?: string;
  codeSnippet?: string;
  language?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

interface UserAnswer {
  questionId: string;
  answer: string | number | boolean;
  timeSpent: number;
  isCorrect: boolean;
  points: number;
}

// JavaScript Fundamentals Quiz Dataset
const javascriptQuestions: Question[] = [
  // ==================== EASY LEVEL QUESTIONS ====================
  
  // Easy MCQs
  {
    id: 'js-easy-1',
    type: 'multiple-choice',
    question: 'What is the correct way to declare a variable in JavaScript?',
    options: [
      { text: 'var myVar = 5;', isCorrect: true },
      { text: 'variable myVar = 5;', isCorrect: false },
      { text: 'v myVar = 5;', isCorrect: false },
      { text: 'declare myVar = 5;', isCorrect: false }
    ],
    explanation: 'The correct way to declare a variable in JavaScript is using \'var\', \'let\', or \'const\' keywords.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['variables', 'declaration', 'syntax']
  },
  
  {
    id: 'js-easy-2',
    type: 'multiple-choice',
    question: 'Which of the following is NOT a JavaScript data type?',
    options: [
      { text: 'string', isCorrect: false },
      { text: 'number', isCorrect: false },
      { text: 'boolean', isCorrect: false },
      { text: 'float', isCorrect: true }
    ],
    explanation: 'JavaScript has \'number\' type which includes both integers and floating-point numbers. There\'s no separate \'float\' type.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['data-types', 'primitives']
  },
  
  {
    id: 'js-easy-3',
    type: 'multiple-choice',
    question: 'What does the \'typeof\' operator return for an array?',
    options: [
      { text: 'array', isCorrect: false },
      { text: 'object', isCorrect: true },
      { text: 'list', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
    explanation: 'In JavaScript, arrays are objects, so typeof returns \'object\' for arrays.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['typeof', 'arrays', 'operators']
  },
  
  {
    id: 'js-easy-4',
    type: 'multiple-choice',
    question: 'Which method is used to add an element to the end of an array?',
    options: [
      { text: 'push()', isCorrect: true },
      { text: 'append()', isCorrect: false },
      { text: 'add()', isCorrect: false },
      { text: 'insert()', isCorrect: false }
    ],
    explanation: 'The push() method adds one or more elements to the end of an array and returns the new length.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['arrays', 'methods', 'push']
  },
  
  {
    id: 'js-easy-5',
    type: 'multiple-choice',
    question: 'What is the result of: 5 + \'5\'?',
    options: [
      { text: '10', isCorrect: false },
      { text: '55', isCorrect: true },
      { text: 'Error', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
    explanation: 'When adding a number and a string, JavaScript converts the number to a string and concatenates them, resulting in \'55\'.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['type-coercion', 'operators', 'concatenation']
  },
  
  // Easy True/False Questions
  {
    id: 'js-easy-6',
    type: 'true-false',
    question: 'JavaScript is a case-sensitive language.',
    options: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false }
    ],
    explanation: 'JavaScript is case-sensitive, meaning \'myVar\' and \'myvar\' are different variables.',
    points: 10,
    timeLimit: 20,
    difficulty: 'easy',
    tags: ['case-sensitivity', 'syntax']
  },
  
  {
    id: 'js-easy-7',
    type: 'true-false',
    question: 'All variables in JavaScript must be declared before use.',
    options: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true }
    ],
    explanation: 'While it\'s a best practice to declare variables, JavaScript allows undeclared variables (they become global).',
    points: 10,
    timeLimit: 20,
    difficulty: 'easy',
    tags: ['variables', 'declaration', 'global-scope']
  },
  
  {
    id: 'js-easy-8',
    type: 'true-false',
    question: 'JavaScript functions can return multiple values.',
    options: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true }
    ],
    explanation: 'JavaScript functions can only return one value, but that value can be an object or array containing multiple values.',
    points: 10,
    timeLimit: 20,
    difficulty: 'easy',
    tags: ['functions', 'return-values']
  },
  
  // Easy Predict Output Questions
  {
    id: 'js-easy-9',
    type: 'predict-output',
    question: 'What will be the output of: console.log(typeof null);',
    codeSnippet: 'console.log(typeof null);',
    options: [
      { text: 'null', isCorrect: false },
      { text: 'object', isCorrect: true },
      { text: 'undefined', isCorrect: false },
      { text: 'Error', isCorrect: false }
    ],
    explanation: 'typeof null returns \'object\' - this is a known quirk in JavaScript.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['typeof', 'null', 'quirks']
  },
  
  {
    id: 'js-easy-10',
    type: 'predict-output',
    question: 'What will be the output of: console.log(2 + 2 * 3);',
    codeSnippet: 'console.log(2 + 2 * 3);',
    options: [
      { text: '12', isCorrect: false },
      { text: '8', isCorrect: true },
      { text: '10', isCorrect: false },
      { text: 'Error', isCorrect: false }
    ],
    explanation: 'Due to operator precedence, multiplication (2 * 3 = 6) happens before addition (2 + 6 = 8).',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['operator-precedence', 'arithmetic']
  },

  {
    id: 'js-easy-11',
    type: 'predict-output',
    question: 'What will be the output of: console.log(5 + "5");',
    codeSnippet: 'console.log(5 + "5");',
    options: [
      { text: '10', isCorrect: false },
      { text: '55', isCorrect: true },
      { text: 'Error', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
    explanation: 'When adding a number and a string, JavaScript converts the number to a string and concatenates them.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['type-coercion', 'concatenation']
  },

  {
    id: 'js-easy-12',
    type: 'predict-output',
    question: 'What will be the output of: console.log([1, 2, 3].length);',
    codeSnippet: 'console.log([1, 2, 3].length);',
    options: [
      { text: '3', isCorrect: true },
      { text: '2', isCorrect: false },
      { text: '4', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
    explanation: 'The length property returns the number of elements in the array.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['arrays', 'length', 'properties']
  },
  
  // ==================== MEDIUM LEVEL QUESTIONS ====================
  
  // Medium MCQs
  {
    id: 'js-medium-1',
    type: 'multiple-choice',
    question: 'What is the difference between \'let\' and \'var\' in JavaScript?',
    options: [
      { text: 'No difference, they work the same way', isCorrect: false },
      { text: 'let has block scope, var has function scope', isCorrect: true },
      { text: 'var is faster than let', isCorrect: false },
      { text: 'let can only be used in loops', isCorrect: false }
    ],
    explanation: 'let has block scope (limited to the block where it\'s declared), while var has function scope.',
    points: 15,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['let', 'var', 'scope', 'hoisting']
  },
  
  {
    id: 'js-medium-2',
    type: 'multiple-choice',
    question: 'What will happen when you try to access a property that doesn\'t exist on an object?',
    options: [
      { text: 'It will throw an error', isCorrect: false },
      { text: 'It will return null', isCorrect: false },
      { text: 'It will return undefined', isCorrect: true },
      { text: 'It will return false', isCorrect: false }
    ],
    explanation: 'Accessing a non-existent property on an object returns undefined, not an error.',
    points: 15,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['objects', 'properties', 'undefined']
  },
  
  {
    id: 'js-medium-3',
    type: 'multiple-choice',
    question: 'Which of the following is NOT a way to create an object in JavaScript?',
    options: [
      { text: 'Object literal: {}', isCorrect: false },
      { text: 'Constructor function: new Object()', isCorrect: false },
      { text: 'Object.create()', isCorrect: false },
      { text: 'object.new()', isCorrect: true }
    ],
    explanation: 'object.new() is not a valid way to create objects in JavaScript.',
    points: 15,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['objects', 'creation', 'constructors']
  },
  
  // Medium Coding Questions
  {
    id: 'js-medium-4',
    type: 'coding',
    question: 'Write a function that takes an array of numbers and returns the sum of all even numbers.',
    codeSnippet: `function sumEvenNumbers(numbers) {
    // Your code here
}`,
    language: 'javascript',
    testCases: [
      { input: '[1, 2, 3, 4, 5, 6]', expectedOutput: '12', description: 'Sum of even numbers: 2 + 4 + 6 = 12' },
      { input: '[1, 3, 5, 7]', expectedOutput: '0', description: 'No even numbers, sum is 0' },
      { input: '[2, 4, 6, 8]', expectedOutput: '20', description: 'All even numbers: 2 + 4 + 6 + 8 = 20' }
    ],
    explanation: 'Use filter() to get even numbers, then reduce() to sum them up.',
    points: 20,
    timeLimit: 120,
    difficulty: 'medium',
    tags: ['functions', 'arrays', 'filter', 'reduce', 'even-numbers']
  },
  
  {
    id: 'js-medium-5',
    type: 'coding',
    question: 'Create a function that removes duplicates from an array and returns a new array.',
    codeSnippet: `function removeDuplicates(arr) {
    // Your code here
}`,
    language: 'javascript',
    testCases: [
      { input: '[1, 2, 2, 3, 4, 4, 5]', expectedOutput: '[1, 2, 3, 4, 5]', description: 'Remove duplicate numbers' },
      { input: '[\'a\', \'b\', \'a\', \'c\', \'b\']', expectedOutput: '[\'a\', \'b\', \'c\']', description: 'Remove duplicate strings' },
      { input: '[1, 1, 1, 1]', expectedOutput: '[1]', description: 'All elements are the same' }
    ],
    explanation: 'Use Set to remove duplicates, or use filter() with indexOf() to keep only first occurrences.',
    points: 20,
    timeLimit: 120,
    difficulty: 'medium',
    tags: ['arrays', 'duplicates', 'set', 'filter']
  },
  
  {
    id: 'js-medium-6',
    type: 'coding',
    question: 'Write a function that checks if a string is a palindrome (reads the same forwards and backwards).',
    codeSnippet: `function isPalindrome(str) {
    // Your code here
}`,
    language: 'javascript',
    testCases: [
      { input: '\'racecar\'', expectedOutput: 'true', description: 'Classic palindrome' },
      { input: '\'hello\'', expectedOutput: 'false', description: 'Not a palindrome' },
      { input: '\'A man a plan a canal Panama\'', expectedOutput: 'true', description: 'Palindrome with spaces and mixed case' }
    ],
    explanation: 'Convert to lowercase, remove non-alphanumeric characters, then compare with reversed string.',
    points: 20,
    timeLimit: 120,
    difficulty: 'medium',
    tags: ['strings', 'palindrome', 'reverse', 'regex']
  },
  
  // Medium True/False Questions
  {
    id: 'js-medium-7',
    type: 'true-false',
    question: 'Arrow functions have their own \'this\' binding.',
    options: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true }
    ],
    explanation: 'Arrow functions don\'t have their own \'this\' binding - they inherit \'this\' from the enclosing scope.',
    points: 15,
    timeLimit: 30,
    difficulty: 'medium',
    tags: ['arrow-functions', 'this-binding', 'scope']
  },
  
  {
    id: 'js-medium-8',
    type: 'true-false',
    question: 'JavaScript supports function overloading.',
    options: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true }
    ],
    explanation: 'JavaScript doesn\'t support function overloading. The last function with the same name will override previous ones.',
    points: 15,
    timeLimit: 30,
    difficulty: 'medium',
    tags: ['functions', 'overloading', 'overriding']
  },
  
  // Medium Predict Output Questions
  {
    id: 'js-medium-9',
    type: 'predict-output',
    question: 'What will be the output of: console.log([1, 2, 3] + [4, 5, 6]);',
    codeSnippet: 'console.log([1, 2, 3] + [4, 5, 6]);',
    options: [
      { text: '[1, 2, 3, 4, 5, 6]', isCorrect: false },
      { text: '1,2,34,5,6', isCorrect: true },
      { text: 'Error', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
    explanation: 'Arrays are converted to strings and concatenated: \'1,2,3\' + \'4,5,6\' = \'1,2,34,5,6\'.',
    points: 15,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['arrays', 'type-coercion', 'concatenation']
  },
  
  {
    id: 'js-medium-10',
    type: 'predict-output',
    question: 'What will be the output of: console.log(0.1 + 0.2 === 0.3);',
    codeSnippet: 'console.log(0.1 + 0.2 === 0.3);',
    options: [
      { text: 'true', isCorrect: false },
      { text: 'false', isCorrect: true },
      { text: 'Error', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
    explanation: 'Due to floating-point precision issues, 0.1 + 0.2 equals approximately 0.30000000000000004, not exactly 0.3.',
    points: 15,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['floating-point', 'precision', 'comparison']
  },

  {
    id: 'js-medium-11',
    type: 'predict-output',
    question: 'What will be the output of: console.log(typeof function() {});',
    codeSnippet: 'console.log(typeof function() {});',
    options: [
      { text: 'function', isCorrect: true },
      { text: 'object', isCorrect: false },
      { text: 'undefined', isCorrect: false },
      { text: 'Error', isCorrect: false }
    ],
    explanation: 'Functions have their own typeof value in JavaScript.',
    points: 15,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['functions', 'typeof']
  },
  
  // ==================== HARD LEVEL QUESTIONS ====================
  
  // Hard MCQs
  {
    id: 'js-hard-1',
    type: 'multiple-choice',
    question: 'What is the output of: (function() { return typeof arguments; })();',
    options: [
      { text: 'arguments', isCorrect: false },
      { text: 'object', isCorrect: true },
      { text: 'array', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
    explanation: 'The arguments object is an array-like object, so typeof returns \'object\'.',
    points: 20,
    timeLimit: 60,
    difficulty: 'hard',
    tags: ['arguments', 'typeof', 'functions', 'array-like']
  },
  
  {
    id: 'js-hard-2',
    type: 'multiple-choice',
    question: 'Which of the following will NOT cause a memory leak in JavaScript?',
    options: [
      { text: 'Creating circular references', isCorrect: false },
      { text: 'Not removing event listeners', isCorrect: false },
      { text: 'Using closures properly', isCorrect: true },
      { text: 'Storing DOM references in global variables', isCorrect: false }
    ],
    explanation: 'Properly used closures don\'t cause memory leaks. The other options are common causes of memory leaks.',
    points: 20,
    timeLimit: 60,
    difficulty: 'hard',
    tags: ['memory-leaks', 'closures', 'event-listeners', 'dom']
  },
  
  {
    id: 'js-hard-3',
    type: 'multiple-choice',
    question: 'What is the difference between \'==\' and \'===\' operators?',
    options: [
      { text: 'No difference, they work the same', isCorrect: false },
      { text: '=== performs type coercion, == doesn\'t', isCorrect: false },
      { text: '== performs type coercion, === doesn\'t', isCorrect: true },
      { text: '=== is faster than ==', isCorrect: false }
    ],
    explanation: '== performs type coercion before comparison, while === performs strict comparison without type coercion.',
    points: 20,
    timeLimit: 60,
    difficulty: 'hard',
    tags: ['operators', 'comparison', 'type-coercion', 'strict-equality']
  },
  
  // Hard Coding Questions
  {
    id: 'js-hard-4',
    type: 'coding',
    question: 'Implement a debounce function that delays the execution of a function until after a specified time has passed since its last invocation.',
    codeSnippet: `function debounce(func, delay) {
    // Your code here
}`,
    language: 'javascript',
    testCases: [
      { input: 'debounce(() => console.log(\'Hello\'), 100)', expectedOutput: 'Function that can be called', description: 'Should return a debounced function' },
      { input: 'Multiple rapid calls should only execute once', expectedOutput: 'Last call executes after delay', description: 'Test debouncing behavior' }
    ],
    explanation: 'Use setTimeout and clearTimeout to implement debouncing. Store the timeout ID and clear it on each new call.',
    points: 25,
    timeLimit: 180,
    difficulty: 'hard',
    tags: ['debounce', 'closures', 'setTimeout', 'clearTimeout', 'performance']
  },
  
  {
    id: 'js-hard-5',
    type: 'coding',
    question: 'Create a function that implements a simple Promise with then, catch, and finally methods.',
    codeSnippet: `class SimplePromise {
    constructor(executor) {
        // Your code here
    }
    
    then(onFulfilled) {
        // Your code here
    }
    
    catch(onRejected) {
        // Your code here
    }
    
    finally(onFinally) {
        // Your code here
    }
}`,
    language: 'javascript',
    testCases: [
      { input: 'new SimplePromise((resolve) => resolve(\'success\'))', expectedOutput: 'Promise that resolves', description: 'Basic promise resolution' },
      { input: 'new SimplePromise((resolve, reject) => reject(\'error\'))', expectedOutput: 'Promise that rejects', description: 'Basic promise rejection' }
    ],
    explanation: 'Implement a basic Promise with state management (pending, fulfilled, rejected) and method chaining.',
    points: 25,
    timeLimit: 180,
    difficulty: 'hard',
    tags: ['promises', 'async', 'classes', 'state-management']
  },
  
  {
    id: 'js-hard-6',
    type: 'coding',
    question: 'Write a function that implements deep cloning of objects, handling circular references.',
    codeSnippet: `function deepClone(obj) {
    // Your code here
}`,
    language: 'javascript',
    testCases: [
      { input: '{ a: 1, b: { c: 2 } }', expectedOutput: 'Deep copy of object', description: 'Basic deep cloning' },
      { input: 'Object with circular reference', expectedOutput: 'Handle circular reference', description: 'Circular reference handling' }
    ],
    explanation: 'Use recursion and a WeakMap to track visited objects to handle circular references.',
    points: 25,
    timeLimit: 180,
    difficulty: 'hard',
    tags: ['deep-clone', 'recursion', 'circular-references', 'weakmap']
  },
  
  // Hard True/False Questions
  {
    id: 'js-hard-7',
    type: 'true-false',
    question: 'In JavaScript, all functions are objects.',
    options: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false }
    ],
    explanation: 'Functions in JavaScript are first-class objects - they can have properties, methods, and be passed around like any other object.',
    points: 20,
    timeLimit: 45,
    difficulty: 'hard',
    tags: ['functions', 'objects', 'first-class', 'properties']
  },
  
  {
    id: 'js-hard-8',
    type: 'true-false',
    question: 'JavaScript\'s prototypal inheritance is the same as classical inheritance.',
    options: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true }
    ],
    explanation: 'JavaScript uses prototypal inheritance, which is different from classical inheritance. Objects inherit directly from other objects.',
    points: 20,
    timeLimit: 45,
    difficulty: 'hard',
    tags: ['inheritance', 'prototypes', 'classical-inheritance', 'prototypal-inheritance']
  },
  
  // Hard Predict Output Questions
  {
    id: 'js-hard-9',
    type: 'predict-output',
    question: 'What will be the output of: console.log([...\'hello\'].map((c, i) => c + i).join(\'\'));',
    codeSnippet: 'console.log([...\'hello\'].map((c, i) => c + i).join(\'\'));',
    options: [
      { text: 'hello', isCorrect: false },
      { text: 'h0e1l2l3o4', isCorrect: true },
      { text: '01234', isCorrect: false },
      { text: 'Error', isCorrect: false }
    ],
    explanation: 'Spread operator converts string to array, map adds index to each character, join concatenates: \'h0e1l2l3o4\'.',
    points: 20,
    timeLimit: 60,
    difficulty: 'hard',
    tags: ['spread-operator', 'map', 'join', 'string-manipulation']
  },
  
  {
    id: 'js-hard-10',
    type: 'predict-output',
    question: 'What will be the output of: console.log((() => { let x = y = 1; })(); console.log(typeof x, typeof y);',
    codeSnippet: 'console.log((() => { let x = y = 1; })(); console.log(typeof x, typeof y);',
    options: [
      { text: 'undefined undefined', isCorrect: false },
      { text: 'undefined number', isCorrect: true },
      { text: 'number number', isCorrect: false },
      { text: 'Error', isCorrect: false }
    ],
    explanation: 'let x = y = 1 creates x in block scope (undefined outside) and y in global scope (number).',
    points: 20,
    timeLimit: 60,
    difficulty: 'hard',
    tags: ['scope', 'let', 'global-variables', 'assignment']
  },

  {
    id: 'js-hard-11',
    type: 'predict-output',
    question: 'What will be the output of: console.log(!![] + !!{});',
    codeSnippet: 'console.log(!![] + !!{});',
    options: [
      { text: '2', isCorrect: true },
      { text: 'true', isCorrect: false },
      { text: 'false', isCorrect: false },
      { text: 'Error', isCorrect: false }
    ],
    explanation: '!![] and !!{} both convert to true, then true + true = 2 (type coercion).',
    points: 20,
    timeLimit: 60,
    difficulty: 'hard',
    tags: ['type-coercion', 'boolean-conversion', 'arithmetic']
  },

  // ==================== MEDIUM CODING QUESTIONS ====================
  {
    id: 'js-medium-coding-1',
    type: 'coding',
    question: 'Write a function called `findMax` that takes an array of numbers and returns the maximum number. The function should handle edge cases like empty arrays.',
    codeSnippet: 'function findMax(numbers) {\n  // Write your code here\n}',
    language: 'javascript',
    testCases: [
      {
        input: '[1, 5, 3, 9, 2]',
        expectedOutput: '9',
        description: 'Array with positive numbers'
      },
      {
        input: '[-1, -5, -3, -9, -2]',
        expectedOutput: '-1',
        description: 'Array with negative numbers'
      },
      {
        input: '[]',
        expectedOutput: 'undefined',
        description: 'Empty array'
      }
    ],
    explanation: 'The function should iterate through the array and keep track of the maximum value found. For empty arrays, return undefined.',
    points: 25,
    timeLimit: 300,
    difficulty: 'medium',
    tags: ['functions', 'arrays', 'loops', 'edge-cases']
  },

  {
    id: 'js-medium-coding-2',
    type: 'coding',
    question: 'Write a function called `isPalindrome` that checks if a given string is a palindrome (reads the same forwards and backwards). The function should be case-insensitive and ignore spaces.',
    codeSnippet: 'function isPalindrome(str) {\n  // Write your code here\n}',
    language: 'javascript',
    testCases: [
      {
        input: '"racecar"',
        expectedOutput: 'true',
        description: 'Simple palindrome'
      },
      {
        input: '"A man a plan a canal Panama"',
        expectedOutput: 'true',
        description: 'Palindrome with spaces and mixed case'
      },
      {
        input: '"hello"',
        expectedOutput: 'false',
        description: 'Non-palindrome'
      }
    ],
    explanation: 'Convert to lowercase, remove spaces, then compare the string with its reverse.',
    points: 25,
    timeLimit: 300,
    difficulty: 'medium',
    tags: ['strings', 'palindrome', 'string-manipulation', 'case-insensitive']
  },

  // ==================== HARD CODING QUESTIONS ====================
  {
    id: 'js-hard-coding-1',
    type: 'coding',
    question: 'Write a function called `deepClone` that creates a deep copy of a nested object. The function should handle objects, arrays, and primitive values.',
    codeSnippet: 'function deepClone(obj) {\n  // Write your code here\n}',
    language: 'javascript',
    testCases: [
      {
        input: '{ a: 1, b: { c: 2, d: [3, 4] } }',
        expectedOutput: '{ a: 1, b: { c: 2, d: [3, 4] } }',
        description: 'Nested object with array'
      },
      {
        input: '[1, { a: 2 }, [3, 4]]',
        expectedOutput: '[1, { a: 2 }, [3, 4]]',
        description: 'Array with nested objects'
      },
      {
        input: 'null',
        expectedOutput: 'null',
        description: 'Null value'
      }
    ],
    explanation: 'Use recursion to handle nested structures. Check for arrays, objects, and primitive values.',
    points: 30,
    timeLimit: 400,
    difficulty: 'hard',
    tags: ['objects', 'recursion', 'deep-clone', 'nested-structures']
  },

  {
    id: 'js-hard-coding-2',
    type: 'coding',
    question: 'Write a function called `debounce` that limits the rate at which a function can fire. The function should delay the execution of the provided function until after a specified time has passed since its last invocation.',
    codeSnippet: 'function debounce(func, delay) {\n  // Write your code here\n}',
    language: 'javascript',
    testCases: [
      {
        input: 'debounce(() => console.log("Hello"), 100)',
        expectedOutput: 'Function that delays execution',
        description: 'Basic debounce functionality'
      },
      {
        input: 'debounce((x) => x * 2, 50)',
        expectedOutput: 'Function that delays execution with parameters',
        description: 'Debounce with parameters'
      }
    ],
    explanation: 'Use setTimeout and clearTimeout to manage the delay. Store the timeout ID and clear it on each new call.',
    points: 30,
    timeLimit: 400,
    difficulty: 'hard',
    tags: ['functions', 'timers', 'setTimeout', 'clearTimeout', 'higher-order-functions']
  }
];

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [codingAnswer, setCodingAnswer] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get quiz config from location state
  const quizConfig = location.state?.quizConfig as QuizConfig;
  const category = location.state?.category as QuizCategory;
  const quizId = (location.state as any)?.quizId as string | undefined;

  // Filter questions based on difficulty level
  const filterQuestionsByDifficulty = (difficulty: string, questionCount: number, questionsData: Question[] = javascriptQuestions): Question[] => {
    let filteredQuestions: Question[] = [];
    
    switch (difficulty.toLowerCase()) {
      case 'easy':
        // Easy: MCQ, True/False, Predict Output
        const easyQuestions = questionsData.filter(q => 
          q.difficulty === 'easy' && 
          ['multiple-choice', 'true-false', 'predict-output'].includes(q.type)
        );
        filteredQuestions = easyQuestions;
        break;
        
      case 'medium':
        // Medium: Easy types + Coding questions (at least 2 per 5 questions)
        const mediumQuestions = questionsData.filter(q => 
          q.difficulty === 'medium' && 
          ['multiple-choice', 'true-false', 'predict-output', 'coding'].includes(q.type)
        );
        
        // Ensure at least 2 coding questions per 5 questions
        const codingQuestions = mediumQuestions.filter(q => q.type === 'coding');
        const nonCodingQuestions = mediumQuestions.filter(q => q.type !== 'coding');
        
        // Calculate how many coding questions we need
        const requiredCodingQuestions = Math.max(2, Math.ceil(questionCount * 0.4));
        const selectedCodingQuestions = codingQuestions.slice(0, Math.min(requiredCodingQuestions, codingQuestions.length));
        
        // Fill the rest with non-coding questions
        const remainingSlots = questionCount - selectedCodingQuestions.length;
        const selectedNonCodingQuestions = nonCodingQuestions.slice(0, remainingSlots);
        
        filteredQuestions = [...selectedCodingQuestions, ...selectedNonCodingQuestions];
        break;
        
      case 'hard':
        // Hard: Medium types with upgraded difficulty
        const hardQuestions = questionsData.filter(q => 
          q.difficulty === 'hard' && 
          ['multiple-choice', 'true-false', 'predict-output', 'coding'].includes(q.type)
        );
        
        // Ensure at least 2 coding questions per 5 questions
        const hardCodingQuestions = hardQuestions.filter(q => q.type === 'coding');
        const hardNonCodingQuestions = hardQuestions.filter(q => q.type !== 'coding');
        
        // Calculate how many coding questions we need
        const requiredHardCodingQuestions = Math.max(2, Math.ceil(questionCount * 0.4));
        const selectedHardCodingQuestions = hardCodingQuestions.slice(0, Math.min(requiredHardCodingQuestions, hardCodingQuestions.length));
        
        // Fill the rest with non-coding questions
        const remainingHardSlots = questionCount - selectedHardCodingQuestions.length;
        const selectedHardNonCodingQuestions = hardNonCodingQuestions.slice(0, remainingHardSlots);
        
        filteredQuestions = [...selectedHardCodingQuestions, ...selectedHardNonCodingQuestions];
        break;
        
      default:
        filteredQuestions = questionsData;
    }
    
    // Shuffle and limit to requested count
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, questionCount);
  };

  // Load selected subject quiz dataset
  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use quizService to get the quiz data
      const response = await quizService.getQuizById(quizId || 'javascript-fundamentals-quiz');
      
      if (!response.success || !response.quiz) {
        setError('Failed to load quiz data');
        return;
      }
      
      // Filter questions based on difficulty and question count
      const filteredQuestions = filterQuestionsByDifficulty(quizConfig.difficulty, quizConfig.questionCount, response.quiz.questions);
      
      if (filteredQuestions.length === 0) {
        setError('No questions available for the selected difficulty level');
        return;
      }
      
      setQuestions(filteredQuestions);
      setTotalQuestions(filteredQuestions.length);
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quizConfig || !category) {
      navigate('/advanced-quiz');
      return;
    }
    
    // Load the quiz when component mounts
    loadQuiz();
  }, [quizConfig, category, quizId, navigate]);

  useEffect(() => {
    if (questions.length > 0) {
      setTimeLeft(quizConfig.timeLimit * 60);
      setQuestionStartTime(Date.now());
      
      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleQuizComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [questions, quizConfig]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setShowHint(false);
    
    // Restore previous answer if it exists and hasn't been submitted
    const currentQ = questions[currentQuestion];
    if (currentQ) {
      const existingAnswer = userAnswers.find(ua => ua.questionId === currentQ.id);
      if (existingAnswer && submittedAnswers.has(currentQ.id)) {
        // Answer has been submitted, restore it but make it read-only
        if (currentQ.type === 'coding') {
          setCodingAnswer(existingAnswer.answer as string);
        } else {
          setSelectedAnswer(existingAnswer.answer as number);
        }
      } else if (existingAnswer) {
        // Answer exists but not submitted, restore it
        if (currentQ.type === 'coding') {
          setCodingAnswer(existingAnswer.answer as string);
        } else {
          setSelectedAnswer(existingAnswer.answer as number);
        }
      } else {
        // No existing answer, reset to null/empty
        setSelectedAnswer(null);
        setCodingAnswer('');
      }
    } else {
      setSelectedAnswer(null);
      setCodingAnswer('');
    }
  }, [currentQuestion, questions, userAnswers, submittedAnswers]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    navigate('/advanced-quiz');
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setShowExplanation(false);
      setShowHint(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleNextQuestion = () => {
    if (questions.length === 0) return;

    const currentQ = questions[currentQuestion];
    if (!currentQ) return;

    // Check if answer has already been submitted for this question
    if (submittedAnswers.has(currentQ.id)) {
      // Just move to next question without processing
      if (currentQuestion + 1 < Math.min(quizConfig.questionCount, questions.length)) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleQuizComplete();
      }
      return;
    }

    // Handle different question types
    let isCorrect = false;
    if (currentQ.type === 'coding') {
      // For coding questions, check if there's code written
      isCorrect = codingAnswer.trim().length > 0;
    } else if (selectedAnswer !== null) {
      if (currentQ.type === 'multiple-choice' || currentQ.type === 'predict-output') {
        // For multiple choice and predict-output, check if selected answer index matches correct option
        const correctOptionIndex = currentQ.options?.findIndex(opt => opt.isCorrect);
        isCorrect = selectedAnswer === correctOptionIndex;
      } else if (currentQ.type === 'true-false') {
        // Handle both old format (correctAnswer) and new format (options with isCorrect)
        if (currentQ.correctAnswer !== undefined) {
          isCorrect = selectedAnswer === currentQ.correctAnswer;
        } else if (currentQ.options) {
          const correctOptionIndex = currentQ.options.findIndex(opt => opt.isCorrect);
          isCorrect = selectedAnswer === correctOptionIndex;
        }
      } else {
        // For other types, use the correctAnswer directly
        isCorrect = selectedAnswer === currentQ.correctAnswer;
      }
    }
    // If no answer is provided, isCorrect remains false

    const points = isCorrect ? currentQ.points : 0;
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    const userAnswer: UserAnswer = {
      questionId: currentQ.id,
      answer: currentQ.type === 'coding' ? codingAnswer : (selectedAnswer !== null ? selectedAnswer : -1),
      timeSpent,
      isCorrect,
      points
    };

    // Update user answers (replace if exists, add if new)
    setUserAnswers(prev => {
      const existingIndex = prev.findIndex(ua => ua.questionId === currentQ.id);
      if (existingIndex >= 0) {
        // Replace existing answer
        const newAnswers = [...prev];
        newAnswers[existingIndex] = userAnswer;
        return newAnswers;
      } else {
        // Add new answer
        return [...prev, userAnswer];
      }
    });

    // Mark this answer as submitted
    setSubmittedAnswers(prev => new Set(Array.from(prev).concat(currentQ.id)));

    // Update score only if this is a new submission
    setScore(prev => {
      const existingAnswer = userAnswers.find(ua => ua.questionId === currentQ.id);
      if (existingAnswer) {
        // Replace previous score
        return prev - existingAnswer.points + points;
      } else {
        // Add new score
        return prev + points;
      }
    });

    // Update streak
    if (isCorrect) {
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(prevMax => Math.max(prevMax, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setShowExplanation(true);
    
    setTimeout(() => {
      setShowExplanation(false);
      
      if (currentQuestion + 1 < Math.min(quizConfig.questionCount, questions.length)) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleQuizComplete();
      }
    }, 3000);
  };

  const handleQuizComplete = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Submit quiz attempt to track results
    try {
      // Create answers array in the same order as questions
      const answers = questions.map(question => {
        const userAnswer = userAnswers.find(ua => ua.questionId === question.id);
        if (!userAnswer) return '';
        
        if (question.type === 'multiple-choice') {
          const selectedOption = question.options?.[userAnswer.answer as number];
          return selectedOption?.text || '';
        } else if (question.type === 'true-false') {
          return userAnswer.answer ? 'True' : 'False';
        } else if (question.type === 'coding') {
          return userAnswer.answer as string;
        }
        
        return userAnswer.answer as string;
      });
      
      console.log('Submitting quiz with answers:', answers);
      console.log('User answers:', userAnswers);
      
      const response = await quizService.submitQuizAttempt(quizId || 'javascript-fundamentals-quiz', answers);
      
      if (response.success) {
        console.log('Quiz submitted successfully:', response.stats);
      } else {
        console.error('Failed to submit quiz:', response.error);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
    
    setIsQuizComplete(true);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleShowHint = () => {
    if (!showHint && quizConfig.enableHints) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
    }
  };

  const handleAnswerSelect = (index: number) => {
    const currentQ = questions[currentQuestion];
    if (currentQ && submittedAnswers.has(currentQ.id)) {
      // Don't allow changes to submitted answers
      return;
    }
    setSelectedAnswer(index);
  };

  const handleCodingAnswerChange = (answer: string) => {
    const currentQ = questions[currentQuestion];
    if (currentQ && submittedAnswers.has(currentQ.id)) {
      // Don't allow changes to submitted answers
      return;
    }
    setCodingAnswer(answer);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!quizConfig || !category) {
    return null;
  }

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Preparing {category.title} Quiz...</h2>
            <p>Loading questions from local dataset.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-page">
        <div className="quiz-container">
          <div className="error-state">
            <XCircle className="error-icon" />
            <h2>Error Loading Quiz</h2>
            <p>{error}</p>
            <button onClick={() => loadQuiz()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-page">
        <div className="quiz-container">
          <div className="empty-state">
            <BookOpen className="empty-icon" />
            <h2>No Questions Available</h2>
            <p>No questions found for this quiz.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isQuizComplete) {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const totalPossibleScore = questions.reduce((sum, question) => sum + question.points, 0);
    const timeUsed = quizConfig.timeLimit * 60 - timeLeft;
    
    // Create QuizStats object for the enhanced results
    const quizStats = {
      totalQuestions: totalQuestions,
      correctAnswers: correctAnswers,
      totalPoints: totalPossibleScore,
      earnedPoints: score,
      accuracy: accuracy,
      averageTime: timeUsed / totalQuestions,
      timeRemaining: timeLeft,
      streak: 0,
      maxStreak: maxStreak,
      difficulty: quizConfig.difficulty.toLowerCase(),
      hintsUsed: hintsUsed,
      livesRemaining: 3
    };
    
    return (
      <QuizResults
        quizStats={quizStats}
        timeLimit={quizConfig.timeLimit}
        timeLeft={timeLeft}
        isAdvanced={false}
        userAnswers={userAnswers}
        questions={questions}
        onRetake={() => {
          setIsQuizComplete(false);
          setCurrentQuestion(0);
          setUserAnswers([]);
          setScore(0);
          setStreak(0);
          setMaxStreak(0);
          setHintsUsed(0);
          setTimeLeft(quizConfig.timeLimit * 60);
          setQuestionStartTime(Date.now());
        }}
        onBackToDashboard={() => navigate('/advanced-quiz')}
      />
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="quiz-page">
      {/* Small Header with Timer */}
      <div className="quiz-header-small">
        <button className="exit-quiz-btn" onClick={() => navigate('/advanced-quiz')}>
          <ChevronLeft className="w-4 h-4" />
          Exit Quiz
        </button>
        <h1 className="quiz-title-small">
          {category.title} 
          <span className="progress-counter">
            {currentQuestion + 1}/{Math.min(quizConfig.questionCount, questions.length)}
          </span>
        </h1>
        <div className="timer-display">
          <Clock className="timer-icon" />
          <span className="timer-text">{formatTime(timeLeft)}</span>
        </div>
      </div>


      {/* Main Quiz Content */}
      <div className="quiz-main">
        <div className="question-container">
          {/* Question Header */}
          <div className="question-header">
            <div className="question-meta">
              <span className="question-number">Question {currentQuestion + 1}</span>
              <span className="question-type">{currentQ.type.replace('-', ' ').toUpperCase()}</span>
              <span className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(quizConfig.difficulty) }}>
                {quizConfig.difficulty}
              </span>
            </div>
            <div className="question-points">{currentQ.points} pts</div>
          </div>

          {/* Question Text */}
          <div className="question-text">
            {currentQ.question}
          </div>

          {/* Answer Options */}
          {currentQ.type === 'coding' ? (
            <EnhancedCodingQuestion
              question={currentQ.question}
              codeSnippet={currentQ.codeSnippet}
              language={currentQ.language}
              testCases={currentQ.testCases}
              answer={codingAnswer}
              showExplanation={showExplanation}
              onAnswerChange={handleCodingAnswerChange}
            />
          ) : currentQ.type === 'predict-output' ? (
            <div className="predict-output-container">
              {/* Code Snippet Display */}
              {currentQ.codeSnippet && (
                <div className="code-snippet-display">
                  <div className="code-header">
                    <span>Code:</span>
                  </div>
                  <pre className="code-content">
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                </div>
              )}
              
              {/* Answer Options */}
              <div className="answer-grid">
                {currentQ.options?.map((option, index) => {
                  const isObjectOption = typeof option === 'object' && 'text' in option && 'isCorrect' in option;
                  const optionText = isObjectOption ? option.text : option as string;
                  const isCorrect = isObjectOption ? option.isCorrect : false;
                  
                  return (
                    <button
                      key={index}
                      className={`answer-card ${selectedAnswer === index ? 'selected' : ''} ${
                        showExplanation ? 
                          (isCorrect ? 'correct' : 
                           selectedAnswer === index ? 'incorrect' : '') : ''
                      } ${submittedAnswers.has(currentQ.id) ? 'submitted' : ''}`}
                      onClick={() => !showExplanation && !submittedAnswers.has(currentQ.id) && handleAnswerSelect(index)}
                      disabled={showExplanation || submittedAnswers.has(currentQ.id)}
                    >
                      <div className="answer-content">
                        <div className="answer-letter">{String.fromCharCode(65 + index)}</div>
                        <div className="answer-text">{optionText}</div>
                      </div>
                      {showExplanation && isCorrect && (
                        <CheckCircle className="w-6 h-6 answer-icon correct" />
                      )}
                      {showExplanation && selectedAnswer === index && !isCorrect && (
                        <XCircle className="w-6 h-6 answer-icon incorrect" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="answer-grid">
              {currentQ.options?.map((option, index) => {
                const isObjectOption = typeof option === 'object' && 'text' in option && 'isCorrect' in option;
                const optionText = isObjectOption ? option.text : option as string;
                const isCorrect = isObjectOption ? option.isCorrect : false;
                
                return (
                  <button
                    key={index}
                    className={`answer-card ${selectedAnswer === index ? 'selected' : ''} ${
                      showExplanation ? 
                        (isCorrect ? 'correct' : 
                         selectedAnswer === index ? 'incorrect' : '') : ''
                    } ${submittedAnswers.has(currentQ.id) ? 'submitted' : ''}`}
                    onClick={() => !showExplanation && !submittedAnswers.has(currentQ.id) && handleAnswerSelect(index)}
                    disabled={showExplanation || submittedAnswers.has(currentQ.id)}
                  >
                    <div className="answer-content">
                      <div className="answer-letter">{String.fromCharCode(65 + index)}</div>
                      <div className="answer-text">{optionText}</div>
                    </div>
                    {showExplanation && isCorrect && (
                      <CheckCircle className="w-6 h-6 answer-icon correct" />
                    )}
                    {showExplanation && selectedAnswer === index && !isCorrect && (
                      <XCircle className="w-6 h-6 answer-icon incorrect" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Hint Section */}
          {quizConfig.enableHints && currentQ.hint && showHint && (
            <div className="hint-section">
              <div className="hint-content">
                <Brain className="w-5 h-5" />
                <span>{currentQ.hint}</span>
              </div>
            </div>
          )}

          {/* Explanation */}
          {showExplanation && currentQ.explanation && (
            <div className="explanation-section">
              <div className="explanation-header">
                <Eye className="w-5 h-5" />
                <span>Explanation</span>
              </div>
              <div className="explanation-text">{currentQ.explanation}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {!showExplanation && (
              <>
                {currentQuestion > 0 && (
                  <button className="back-btn" onClick={handlePreviousQuestion}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
                
                {quizConfig.enableHints && currentQ.hint && !showHint && (
                  <button className="hint-btn" onClick={handleShowHint}>
                    <HelpCircle className="w-4 h-4" />
                    Show Hint
                  </button>
                )}
              </>
            )}

            {!showExplanation && (
              <button
                className="next-btn"
                onClick={handleNextQuestion}
                disabled={currentQ.type === 'coding' ? codingAnswer.trim().length === 0 : selectedAnswer === null}
              >
                <span>
                  {currentQuestion + 1 >= Math.min(quizConfig.questionCount, questions.length) 
                    ? 'Submit Quiz' 
                    : 'Next Question'
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;