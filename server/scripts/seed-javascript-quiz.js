/*
  Seed JavaScript Fundamentals Quiz Data
  - Creates comprehensive JavaScript quiz questions for easy, medium, and hard levels
  - Uses server env (MONGODB_URI). Load .env from server directory when run locally.
*/

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Helper function to create a demo user for quiz creation
async function getOrCreateDemoUser() {
  const firebaseUid = 'js_quiz_demo_user_firebase_uid';
  const email = 'js.quiz.demo@example.com';
  const displayName = 'JS Quiz Demo User';
  
  let user = await User.findOne({ firebaseUid });
  if (!user) {
    user = new User({
      firebaseUid,
      email,
      displayName,
      role: 'teacher'
    });
    await user.save();
  }
  return user;
}

// JavaScript Fundamentals Quiz Questions
const javascriptQuizQuestions = [
  // ==================== EASY LEVEL QUESTIONS ====================
  
  // Easy MCQs
  {
    question: "What is the correct way to declare a variable in JavaScript?",
    type: "multiple-choice",
    options: [
      { text: "var myVar = 5;", isCorrect: true },
      { text: "variable myVar = 5;", isCorrect: false },
      { text: "v myVar = 5;", isCorrect: false },
      { text: "declare myVar = 5;", isCorrect: false }
    ],
    explanation: "The correct way to declare a variable in JavaScript is using 'var', 'let', or 'const' keywords.",
    points: 10,
    timeLimit: 30,
    difficulty: "easy",
    tags: ["variables", "declaration", "syntax"]
  },
  
  {
    question: "Which of the following is NOT a JavaScript data type?",
    type: "multiple-choice",
    options: [
      { text: "string", isCorrect: false },
      { text: "number", isCorrect: false },
      { text: "boolean", isCorrect: false },
      { text: "float", isCorrect: true }
    ],
    explanation: "JavaScript has 'number' type which includes both integers and floating-point numbers. There's no separate 'float' type.",
    points: 10,
    timeLimit: 30,
    difficulty: "easy",
    tags: ["data-types", "primitives"]
  },
  
  {
    question: "What does the 'typeof' operator return for an array?",
    type: "multiple-choice",
    options: [
      { text: "array", isCorrect: false },
      { text: "object", isCorrect: true },
      { text: "list", isCorrect: false },
      { text: "undefined", isCorrect: false }
    ],
    explanation: "In JavaScript, arrays are objects, so typeof returns 'object' for arrays.",
    points: 10,
    timeLimit: 30,
    difficulty: "easy",
    tags: ["typeof", "arrays", "operators"]
  },
  
  {
    question: "Which method is used to add an element to the end of an array?",
    type: "multiple-choice",
    options: [
      { text: "push()", isCorrect: true },
      { text: "append()", isCorrect: false },
      { text: "add()", isCorrect: false },
      { text: "insert()", isCorrect: false }
    ],
    explanation: "The push() method adds one or more elements to the end of an array and returns the new length.",
    points: 10,
    timeLimit: 30,
    difficulty: "easy",
    tags: ["arrays", "methods", "push"]
  },
  
  {
    question: "What is the result of: 5 + '5'?",
    type: "multiple-choice",
    options: [
      { text: "10", isCorrect: false },
      { text: "55", isCorrect: true },
      { text: "Error", isCorrect: false },
      { text: "undefined", isCorrect: false }
    ],
    explanation: "When adding a number and a string, JavaScript converts the number to a string and concatenates them, resulting in '55'.",
    points: 10,
    timeLimit: 30,
    difficulty: "easy",
    tags: ["type-coercion", "operators", "concatenation"]
  },
  
  // Easy True/False Questions
  {
    question: "JavaScript is a case-sensitive language.",
    type: "true-false",
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false }
    ],
    explanation: "JavaScript is case-sensitive, meaning 'myVar' and 'myvar' are different variables.",
    points: 10,
    timeLimit: 20,
    difficulty: "easy",
    tags: ["case-sensitivity", "syntax"]
  },
  
  {
    question: "All variables in JavaScript must be declared before use.",
    type: "true-false",
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true }
    ],
    explanation: "While it's a best practice to declare variables, JavaScript allows undeclared variables (they become global).",
    points: 10,
    timeLimit: 20,
    difficulty: "easy",
    tags: ["variables", "declaration", "global-scope"]
  },
  
  {
    question: "JavaScript functions can return multiple values.",
    type: "true-false",
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true }
    ],
    explanation: "JavaScript functions can only return one value, but that value can be an object or array containing multiple values.",
    points: 10,
    timeLimit: 20,
    difficulty: "easy",
    tags: ["functions", "return-values"]
  },
  
  // Easy Predict Output Questions
  {
    question: "What will be the output of: console.log(typeof null);",
    type: "multiple-choice",
    options: [
      { text: "null", isCorrect: false },
      { text: "object", isCorrect: true },
      { text: "undefined", isCorrect: false },
      { text: "Error", isCorrect: false }
    ],
    explanation: "typeof null returns 'object' - this is a known quirk in JavaScript.",
    points: 10,
    timeLimit: 30,
    difficulty: "easy",
    tags: ["typeof", "null", "quirks"]
  },
  
  {
    question: "What will be the output of: console.log(2 + 2 * 3);",
    type: "multiple-choice",
    options: [
      { text: "12", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "10", isCorrect: false },
      { text: "Error", isCorrect: false }
    ],
    explanation: "Due to operator precedence, multiplication (2 * 3 = 6) happens before addition (2 + 6 = 8).",
    points: 10,
    timeLimit: 30,
    difficulty: "easy",
    tags: ["operator-precedence", "arithmetic"]
  },
  
  // ==================== MEDIUM LEVEL QUESTIONS ====================
  
  // Medium MCQs
  {
    question: "What is the difference between 'let' and 'var' in JavaScript?",
    type: "multiple-choice",
    options: [
      { text: "No difference, they work the same way", isCorrect: false },
      { text: "let has block scope, var has function scope", isCorrect: true },
      { text: "var is faster than let", isCorrect: false },
      { text: "let can only be used in loops", isCorrect: false }
    ],
    explanation: "let has block scope (limited to the block where it's declared), while var has function scope.",
    points: 15,
    timeLimit: 45,
    difficulty: "medium",
    tags: ["let", "var", "scope", "hoisting"]
  },
  
  {
    question: "What will happen when you try to access a property that doesn't exist on an object?",
    type: "multiple-choice",
    options: [
      { text: "It will throw an error", isCorrect: false },
      { text: "It will return null", isCorrect: false },
      { text: "It will return undefined", isCorrect: true },
      { text: "It will return false", isCorrect: false }
    ],
    explanation: "Accessing a non-existent property on an object returns undefined, not an error.",
    points: 15,
    timeLimit: 45,
    difficulty: "medium",
    tags: ["objects", "properties", "undefined"]
  },
  
  {
    question: "Which of the following is NOT a way to create an object in JavaScript?",
    type: "multiple-choice",
    options: [
      { text: "Object literal: {}", isCorrect: false },
      { text: "Constructor function: new Object()", isCorrect: false },
      { text: "Object.create()", isCorrect: false },
      { text: "object.new()", isCorrect: true }
    ],
    explanation: "object.new() is not a valid way to create objects in JavaScript.",
    points: 15,
    timeLimit: 45,
    difficulty: "medium",
    tags: ["objects", "creation", "constructors"]
  },
  
  // Medium Coding Questions
  {
    question: "Write a function that takes an array of numbers and returns the sum of all even numbers.",
    type: "coding",
    codeSnippet: `function sumEvenNumbers(numbers) {
    // Your code here
}`,
    language: "javascript",
    testCases: [
      { input: "[1, 2, 3, 4, 5, 6]", expectedOutput: "12", description: "Sum of even numbers: 2 + 4 + 6 = 12" },
      { input: "[1, 3, 5, 7]", expectedOutput: "0", description: "No even numbers, sum is 0" },
      { input: "[2, 4, 6, 8]", expectedOutput: "20", description: "All even numbers: 2 + 4 + 6 + 8 = 20" }
    ],
    explanation: "Use filter() to get even numbers, then reduce() to sum them up.",
    points: 20,
    timeLimit: 120,
    difficulty: "medium",
    tags: ["functions", "arrays", "filter", "reduce", "even-numbers"]
  },
  
  {
    question: "Create a function that removes duplicates from an array and returns a new array.",
    type: "coding",
    codeSnippet: `function removeDuplicates(arr) {
    // Your code here
}`,
    language: "javascript",
    testCases: [
      { input: "[1, 2, 2, 3, 4, 4, 5]", expectedOutput: "[1, 2, 3, 4, 5]", description: "Remove duplicate numbers" },
      { input: "['a', 'b', 'a', 'c', 'b']", expectedOutput: "['a', 'b', 'c']", description: "Remove duplicate strings" },
      { input: "[1, 1, 1, 1]", expectedOutput: "[1]", description: "All elements are the same" }
    ],
    explanation: "Use Set to remove duplicates, or use filter() with indexOf() to keep only first occurrences.",
    points: 20,
    timeLimit: 120,
    difficulty: "medium",
    tags: ["arrays", "duplicates", "set", "filter"]
  },
  
  {
    question: "Write a function that checks if a string is a palindrome (reads the same forwards and backwards).",
    type: "coding",
    codeSnippet: `function isPalindrome(str) {
    // Your code here
}`,
    language: "javascript",
    testCases: [
      { input: "'racecar'", expectedOutput: "true", description: "Classic palindrome" },
      { input: "'hello'", expectedOutput: "false", description: "Not a palindrome" },
      { input: "'A man a plan a canal Panama'", expectedOutput: "true", description: "Palindrome with spaces and mixed case" }
    ],
    explanation: "Convert to lowercase, remove non-alphanumeric characters, then compare with reversed string.",
    points: 20,
    timeLimit: 120,
    difficulty: "medium",
    tags: ["strings", "palindrome", "reverse", "regex"]
  },
  
  // Medium True/False Questions
  {
    question: "Arrow functions have their own 'this' binding.",
    type: "true-false",
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true }
    ],
    explanation: "Arrow functions don't have their own 'this' binding - they inherit 'this' from the enclosing scope.",
    points: 15,
    timeLimit: 30,
    difficulty: "medium",
    tags: ["arrow-functions", "this-binding", "scope"]
  },
  
  {
    question: "JavaScript supports function overloading.",
    type: "true-false",
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true }
    ],
    explanation: "JavaScript doesn't support function overloading. The last function with the same name will override previous ones.",
    points: 15,
    timeLimit: 30,
    difficulty: "medium",
    tags: ["functions", "overloading", "overriding"]
  },
  
  // Medium Predict Output Questions
  {
    question: "What will be the output of: console.log([1, 2, 3] + [4, 5, 6]);",
    type: "multiple-choice",
    options: [
      { text: "[1, 2, 3, 4, 5, 6]", isCorrect: false },
      { text: "1,2,34,5,6", isCorrect: true },
      { text: "Error", isCorrect: false },
      { text: "undefined", isCorrect: false }
    ],
    explanation: "Arrays are converted to strings and concatenated: '1,2,3' + '4,5,6' = '1,2,34,5,6'.",
    points: 15,
    timeLimit: 45,
    difficulty: "medium",
    tags: ["arrays", "type-coercion", "concatenation"]
  },
  
  {
    question: "What will be the output of: console.log(0.1 + 0.2 === 0.3);",
    type: "multiple-choice",
    options: [
      { text: "true", isCorrect: false },
      { text: "false", isCorrect: true },
      { text: "Error", isCorrect: false },
      { text: "undefined", isCorrect: false }
    ],
    explanation: "Due to floating-point precision issues, 0.1 + 0.2 equals approximately 0.30000000000000004, not exactly 0.3.",
    points: 15,
    timeLimit: 45,
    difficulty: "medium",
    tags: ["floating-point", "precision", "comparison"]
  },
  
  // ==================== HARD LEVEL QUESTIONS ====================
  
  // Hard MCQs
  {
    question: "What is the output of: (function() { return typeof arguments; })();",
    type: "multiple-choice",
    options: [
      { text: "arguments", isCorrect: false },
      { text: "object", isCorrect: true },
      { text: "array", isCorrect: false },
      { text: "undefined", isCorrect: false }
    ],
    explanation: "The arguments object is an array-like object, so typeof returns 'object'.",
    points: 20,
    timeLimit: 60,
    difficulty: "hard",
    tags: ["arguments", "typeof", "functions", "array-like"]
  },
  
  {
    question: "Which of the following will NOT cause a memory leak in JavaScript?",
    type: "multiple-choice",
    options: [
      { text: "Creating circular references", isCorrect: false },
      { text: "Not removing event listeners", isCorrect: false },
      { text: "Using closures properly", isCorrect: true },
      { text: "Storing DOM references in global variables", isCorrect: false }
    ],
    explanation: "Properly used closures don't cause memory leaks. The other options are common causes of memory leaks.",
    points: 20,
    timeLimit: 60,
    difficulty: "hard",
    tags: ["memory-leaks", "closures", "event-listeners", "dom"]
  },
  
  {
    question: "What is the difference between '==' and '===' operators?",
    type: "multiple-choice",
    options: [
      { text: "No difference, they work the same", isCorrect: false },
      { text: "=== performs type coercion, == doesn't", isCorrect: false },
      { text: "== performs type coercion, === doesn't", isCorrect: true },
      { text: "=== is faster than ==", isCorrect: false }
    ],
    explanation: "== performs type coercion before comparison, while === performs strict comparison without type coercion.",
    points: 20,
    timeLimit: 60,
    difficulty: "hard",
    tags: ["operators", "comparison", "type-coercion", "strict-equality"]
  },
  
  // Hard Coding Questions
  {
    question: "Implement a debounce function that delays the execution of a function until after a specified time has passed since its last invocation.",
    type: "coding",
    codeSnippet: `function debounce(func, delay) {
    // Your code here
}`,
    language: "javascript",
    testCases: [
      { input: "debounce(() => console.log('Hello'), 100)", expectedOutput: "Function that can be called", description: "Should return a debounced function" },
      { input: "Multiple rapid calls should only execute once", expectedOutput: "Last call executes after delay", description: "Test debouncing behavior" }
    ],
    explanation: "Use setTimeout and clearTimeout to implement debouncing. Store the timeout ID and clear it on each new call.",
    points: 25,
    timeLimit: 180,
    difficulty: "hard",
    tags: ["debounce", "closures", "setTimeout", "clearTimeout", "performance"]
  },
  
  {
    question: "Create a function that implements a simple Promise with then, catch, and finally methods.",
    type: "coding",
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
    language: "javascript",
    testCases: [
      { input: "new SimplePromise((resolve) => resolve('success'))", expectedOutput: "Promise that resolves", description: "Basic promise resolution" },
      { input: "new SimplePromise((resolve, reject) => reject('error'))", expectedOutput: "Promise that rejects", description: "Basic promise rejection" }
    ],
    explanation: "Implement a basic Promise with state management (pending, fulfilled, rejected) and method chaining.",
    points: 25,
    timeLimit: 180,
    difficulty: "hard",
    tags: ["promises", "async", "classes", "state-management"]
  },
  
  {
    question: "Write a function that implements deep cloning of objects, handling circular references.",
    type: "coding",
    codeSnippet: `function deepClone(obj) {
    // Your code here
}`,
    language: "javascript",
    testCases: [
      { input: "{ a: 1, b: { c: 2 } }", expectedOutput: "Deep copy of object", description: "Basic deep cloning" },
      { input: "Object with circular reference", expectedOutput: "Handle circular reference", description: "Circular reference handling" }
    ],
    explanation: "Use recursion and a WeakMap to track visited objects to handle circular references.",
    points: 25,
    timeLimit: 180,
    difficulty: "hard",
    tags: ["deep-clone", "recursion", "circular-references", "weakmap"]
  },
  
  // Hard True/False Questions
  {
    question: "In JavaScript, all functions are objects.",
    type: "true-false",
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false }
    ],
    explanation: "Functions in JavaScript are first-class objects - they can have properties, methods, and be passed around like any other object.",
    points: 20,
    timeLimit: 45,
    difficulty: "hard",
    tags: ["functions", "objects", "first-class", "properties"]
  },
  
  {
    question: "JavaScript's prototypal inheritance is the same as classical inheritance.",
    type: "true-false",
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true }
    ],
    explanation: "JavaScript uses prototypal inheritance, which is different from classical inheritance. Objects inherit directly from other objects.",
    points: 20,
    timeLimit: 45,
    difficulty: "hard",
    tags: ["inheritance", "prototypes", "classical-inheritance", "prototypal-inheritance"]
  },
  
  // Hard Predict Output Questions
  {
    question: "What will be the output of: console.log([...'hello'].map((c, i) => c + i).join(''));",
    type: "multiple-choice",
    options: [
      { text: "hello", isCorrect: false },
      { text: "h0e1l2l3o4", isCorrect: true },
      { text: "01234", isCorrect: false },
      { text: "Error", isCorrect: false }
    ],
    explanation: "Spread operator converts string to array, map adds index to each character, join concatenates: 'h0e1l2l3o4'.",
    points: 20,
    timeLimit: 60,
    difficulty: "hard",
    tags: ["spread-operator", "map", "join", "string-manipulation"]
  },
  
  {
    question: "What will be the output of: console.log((() => { let x = y = 1; })(); console.log(typeof x, typeof y);",
    type: "multiple-choice",
    options: [
      { text: "undefined undefined", isCorrect: false },
      { text: "undefined number", isCorrect: true },
      { text: "number number", isCorrect: false },
      { text: "Error", isCorrect: false }
    ],
    explanation: "let x = y = 1 creates x in block scope (undefined outside) and y in global scope (number).",
    points: 20,
    timeLimit: 60,
    difficulty: "hard",
    tags: ["scope", "let", "global-variables", "assignment"]
  }
];

async function createJavaScriptQuiz(user) {
  const quiz = new Quiz({
    title: "JavaScript Fundamentals Quiz",
    description: "Comprehensive quiz covering JavaScript fundamentals from basic syntax to advanced concepts including closures, promises, and memory management.",
    createdBy: user._id,
    questions: javascriptQuizQuestions,
    settings: {
      isPublic: true,
      allowRetakes: true,
      maxAttempts: 5,
      showResults: true,
      showCorrectAnswers: true,
      randomizeQuestions: true,
      timeLimit: 0 // No overall time limit
    },
    category: "JavaScript Fundamentals",
    tags: ["javascript", "fundamentals", "programming", "web-development"],
    difficulty: "intermediate",
    status: "published"
  });

  await quiz.save();
  return quiz;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    console.log('Getting or creating demo user...');
    const user = await getOrCreateDemoUser();
    console.log('Demo user ready:', user.displayName);

    console.log('Creating JavaScript Fundamentals Quiz...');
    const quiz = await createJavaScriptQuiz(user);
    console.log('Quiz created successfully!');
    console.log('Quiz ID:', quiz._id);
    console.log('Total questions:', quiz.questions.length);
    
    // Count questions by difficulty
    const easyCount = quiz.questions.filter(q => q.difficulty === 'easy').length;
    const mediumCount = quiz.questions.filter(q => q.difficulty === 'medium').length;
    const hardCount = quiz.questions.filter(q => q.difficulty === 'hard').length;
    
    console.log('Questions by difficulty:');
    console.log(`- Easy: ${easyCount} questions`);
    console.log(`- Medium: ${mediumCount} questions`);
    console.log(`- Hard: ${hardCount} questions`);

    console.log('JavaScript Quiz seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
