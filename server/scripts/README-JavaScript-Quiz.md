# JavaScript Fundamentals Quiz Dataset

This document describes the JavaScript Fundamentals Quiz dataset that has been created for the CollabQuest platform.

## Overview

The JavaScript Fundamentals Quiz contains 30 comprehensive questions covering JavaScript fundamentals from basic syntax to advanced concepts. The questions are categorized into three difficulty levels:

- **Easy (10 questions)**: Basic JavaScript concepts, syntax, and simple operations
- **Medium (10 questions)**: Intermediate concepts including closures, scope, and practical coding problems
- **Hard (10 questions)**: Advanced topics like memory management, complex algorithms, and JavaScript internals

## Question Types

### Easy Level Questions
- **Multiple Choice Questions (MCQs)**: Basic JavaScript syntax, data types, and operators
- **True/False Questions**: Fundamental concepts and language features
- **Predict Output Questions**: Simple code snippets with expected outputs

### Medium Level Questions
- **Multiple Choice Questions (MCQs)**: Intermediate concepts like scope, closures, and object manipulation
- **Coding Questions**: Practical programming problems with test cases
- **True/False Questions**: Advanced language features and behaviors
- **Predict Output Questions**: Complex code snippets with type coercion and operator precedence

### Hard Level Questions
- **Multiple Choice Questions (MCQs)**: Advanced topics like memory management, prototypal inheritance, and JavaScript internals
- **Coding Questions**: Complex algorithms and advanced programming concepts
- **True/False Questions**: Deep understanding of JavaScript mechanics
- **Predict Output Questions**: Tricky code snippets involving advanced concepts

## Topics Covered

### Easy Level Topics
- Variable declaration (var, let, const)
- Data types (string, number, boolean, object, undefined, null)
- Basic operators and type coercion
- Array methods (push, pop, etc.)
- Function basics
- Object properties
- typeof operator
- Case sensitivity
- Operator precedence

### Medium Level Topics
- Scope differences (let vs var)
- Arrow functions and this binding
- Object manipulation and property access
- Array methods (filter, reduce, map)
- String manipulation and palindromes
- Function overloading
- Floating-point precision
- Array concatenation and type coercion
- Closures basics

### Hard Level Topics
- Arguments object and typeof
- Memory leaks and prevention
- Strict equality vs loose equality
- Debounce function implementation
- Promise implementation
- Deep cloning with circular references
- Functions as first-class objects
- Prototypal vs classical inheritance
- Advanced string manipulation
- Scope and global variable creation

## Usage

### Running the Seeding Script

To populate the database with the JavaScript Fundamentals Quiz:

```bash
cd server
node scripts/seed-javascript-quiz.js
```

### Prerequisites

- MongoDB connection configured in `.env` file
- Node.js dependencies installed (`npm install`)

### Database Structure

The quiz is stored in the `quizzes` collection with the following structure:

```javascript
{
  title: "JavaScript Fundamentals Quiz",
  description: "Comprehensive quiz covering JavaScript fundamentals...",
  createdBy: ObjectId, // Demo user ID
  questions: [
    {
      question: "Question text",
      type: "multiple-choice" | "true-false" | "coding",
      options: [...], // For MCQs and True/False
      correctAnswer: "...", // For fill-blank
      explanation: "Detailed explanation",
      points: Number,
      timeLimit: Number, // in seconds
      difficulty: "easy" | "medium" | "hard",
      tags: [...],
      // For coding questions:
      codeSnippet: "function template...",
      language: "javascript",
      testCases: [...]
    }
  ],
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
}
```

## Quiz Features

- **Public Access**: Quiz is available to all users
- **Retakes Allowed**: Users can attempt the quiz multiple times
- **Randomized Questions**: Questions can be shuffled for each attempt
- **Detailed Explanations**: Each question includes educational explanations
- **Progressive Difficulty**: Questions progress from basic to advanced concepts
- **Comprehensive Coverage**: Covers all major JavaScript fundamentals

## Educational Value

This quiz dataset is designed to:

1. **Assess Knowledge**: Test understanding of JavaScript fundamentals
2. **Identify Gaps**: Help learners identify areas needing improvement
3. **Provide Learning**: Explanations teach concepts while testing
4. **Progressive Learning**: Build knowledge from basic to advanced topics
5. **Practical Application**: Include hands-on coding problems

## Customization

The quiz can be easily customized by:

- Modifying question content in the seeding script
- Adding new questions to any difficulty level
- Adjusting point values and time limits
- Adding new tags for better categorization
- Modifying quiz settings for different use cases

## Integration

The quiz integrates with the CollabQuest platform's:

- User authentication system
- Scoring and leaderboard features
- Team collaboration features
- Progress tracking
- Real-time quiz sessions

## Maintenance

To update the quiz:

1. Modify the `javascriptQuizQuestions` array in `seed-javascript-quiz.js`
2. Run the seeding script again
3. The script will update existing questions or add new ones

## Support

For questions or issues with the JavaScript Fundamentals Quiz dataset, please refer to the main CollabQuest documentation or contact the development team.
