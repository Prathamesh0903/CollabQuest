# Dynamic Quiz Question Container

A modular JavaScript implementation for creating interactive quiz systems with multiple question types. This implementation provides a flexible, reusable component that can render different question types and handle user interactions.

## Features

### Supported Question Types

1. **Multiple Choice Questions (MCQ)**
   - Single selection from multiple options
   - Radio button-style interface
   - Lettered options (A, B, C, D...)

2. **Multiple Select Questions (MSQ)**
   - Multiple selections allowed
   - Checkbox-style interface
   - Perfect for "select all that apply" questions

3. **Coding Challenges**
   - Code editor with syntax highlighting
   - Support for test cases display
   - Configurable programming language
   - Resizable textarea for code input

4. **True/False Questions**
   - Simple true or false selection
   - Large, easy-to-click buttons
   - Clear visual feedback

5. **Fill in the Blank**
   - Text input for short answers
   - Real-time validation
   - Placeholder text support

### Key Features

- **Modular Design**: Easy to integrate into existing projects
- **Responsive UI**: Works on desktop and mobile devices
- **Event-Driven**: Customizable callbacks for user interactions
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Customizable**: Configurable options and themes
- **No Dependencies**: Pure JavaScript implementation

## Quick Start

### 1. Include the Script

```html
<script src="quiz-container.js"></script>
```

### 2. Create a Container

```html
<div id="quizContainer"></div>
```

### 3. Define Questions

```javascript
const questions = [
    {
        id: 1,
        type: 'multiple-choice',
        question: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 1
    },
    {
        id: 2,
        type: 'multiple-select',
        question: 'Which of the following are programming languages?',
        options: ['JavaScript', 'Python', 'HTML', 'CSS', 'Java'],
        correctAnswer: [0, 1, 4]
    },
    {
        id: 3,
        type: 'coding',
        question: 'Write a function to add two numbers.',
        codeSnippet: 'function add(a, b) {\n  // Your code here\n}',
        language: 'javascript',
        testCases: [
            { input: 'add(2, 3)', expectedOutput: '5', description: 'Basic addition' }
        ]
    },
    {
        id: 4,
        type: 'true-false',
        question: 'JavaScript is a compiled language.',
        correctAnswer: false
    },
    {
        id: 5,
        type: 'fill-blank',
        question: 'The _____ is the main function in C programming.',
        correctAnswer: 'main'
    }
];
```

### 4. Initialize the Quiz

```javascript
const container = document.getElementById('quizContainer');
const quiz = new QuizContainer(container, questions, {
    showNavigation: true,
    autoAdvance: false,
    onAnswerSubmit: (data) => {
        console.log('Answer submitted:', data);
    },
    onQuestionChange: (index) => {
        console.log('Question changed to:', index + 1);
    }
});
```

## API Reference

### Constructor

```javascript
new QuizContainer(container, questions, options)
```

#### Parameters

- `container` (HTMLElement): The DOM element where the quiz will be rendered
- `questions` (Array): Array of question objects
- `options` (Object): Configuration options

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showNavigation` | Boolean | `true` | Show Previous/Next buttons |
| `showSubmitButton` | Boolean | `true` | Show Submit Answer button |
| `autoAdvance` | Boolean | `false` | Automatically advance to next question after submit |
| `onAnswerSubmit` | Function | `null` | Callback when answer is submitted |
| `onQuestionChange` | Function | `null` | Callback when question changes |
| `theme` | String | `'default'` | Theme for styling (future feature) |

### Methods

#### `render()`
Re-renders the current question.

#### `previousQuestion()`
Navigate to the previous question.

#### `nextQuestion()`
Navigate to the next question.

#### `goToQuestion(index)`
Navigate to a specific question by index.

#### `submitAnswer()`
Submit the current answer and trigger callbacks.

#### `getCurrentAnswer()`
Get the answer for the current question.

#### `getAllAnswers()`
Get all user answers as an object.

#### `setQuestions(questions)`
Replace the current questions with new ones.

### Events

#### `onAnswerSubmit` Callback

Called when a user submits an answer:

```javascript
onAnswerSubmit: (data) => {
    // data = {
    //     questionId: 1,
    //     questionType: 'multiple-choice',
    //     answer: 2,
    //     questionIndex: 0
    // }
}
```

#### `onQuestionChange` Callback

Called when the question changes:

```javascript
onQuestionChange: (index) => {
    // index = 0-based question index
}
```

## Question Object Structure

### Multiple Choice

```javascript
{
    id: 1,
    type: 'multiple-choice',
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1  // Index of correct option
}
```

### Multiple Select

```javascript
{
    id: 2,
    type: 'multiple-select',
    question: 'Select all even numbers:',
    options: ['2', '3', '4', '5', '6'],
    correctAnswer: [0, 2, 4]  // Array of correct option indices
}
```

### Coding Challenge

```javascript
{
    id: 3,
    type: 'coding',
    question: 'Write a function to reverse a string.',
    codeSnippet: 'function reverse(str) {\n  // Your code here\n}',
    language: 'javascript',
    testCases: [
        {
            input: '"hello"',
            expectedOutput: '"olleh"',
            description: 'Basic string reversal'
        }
    ]
}
```

### True/False

```javascript
{
    id: 4,
    type: 'true-false',
    question: 'The Earth is flat.',
    correctAnswer: false
}
```

### Fill in the Blank

```javascript
{
    id: 5,
    type: 'fill-blank',
    question: 'The capital of Japan is _____',
    correctAnswer: 'Tokyo'
}
```

## Styling

The component includes default CSS styles that are automatically injected. You can customize the appearance by overriding the CSS classes:

### Main Classes

- `.quiz-question-container` - Main container
- `.quiz-question-header` - Header with question number and type
- `.quiz-question-text` - Question text
- `.quiz-question-content` - Content area for answers
- `.quiz-question-actions` - Action buttons area

### Question Type Classes

- `.quiz-options-grid` - Multiple choice options container
- `.quiz-option-button` - Individual option button
- `.quiz-checkbox-options` - Multiple select options container
- `.quiz-checkbox-option` - Individual checkbox option
- `.quiz-true-false-grid` - True/False buttons container
- `.quiz-true-false-button` - Individual True/False button
- `.quiz-fill-blank-container` - Fill in the blank container
- `.quiz-fill-blank-input` - Text input for fill in the blank
- `.quiz-coding-container` - Coding challenge container
- `.quiz-code-editor` - Code editor textarea

### Button Classes

- `.quiz-btn` - Base button class
- `.quiz-btn-primary` - Primary action button
- `.quiz-btn-secondary` - Secondary action button

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';

function QuizComponent({ questions }) {
    const containerRef = useRef(null);
    const quizRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && questions.length > 0) {
            quizRef.current = new QuizContainer(containerRef.current, questions, {
                onAnswerSubmit: (data) => {
                    console.log('Answer submitted:', data);
                }
            });
        }
    }, [questions]);

    return <div ref={containerRef} />;
}
```

### Vue.js Integration

```vue
<template>
    <div ref="quizContainer"></div>
</template>

<script>
export default {
    props: ['questions'],
    mounted() {
        if (this.questions.length > 0) {
            this.quiz = new QuizContainer(this.$refs.quizContainer, this.questions, {
                onAnswerSubmit: this.handleAnswerSubmit
            });
        }
    },
    methods: {
        handleAnswerSubmit(data) {
            this.$emit('answer-submitted', data);
        }
    }
}
</script>
```

### Angular Integration

```typescript
import { Component, Input, ElementRef, OnInit } from '@angular/core';

declare const QuizContainer: any;

@Component({
    selector: 'app-quiz',
    template: '<div #quizContainer></div>'
})
export class QuizComponent implements OnInit {
    @Input() questions: any[] = [];
    @Input() onAnswerSubmit: (data: any) => void;

    constructor(private elementRef: ElementRef) {}

    ngOnInit() {
        if (this.questions.length > 0) {
            new QuizContainer(this.elementRef.nativeElement, this.questions, {
                onAnswerSubmit: this.onAnswerSubmit
            });
        }
    }
}
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This implementation is provided as-is for educational and development purposes. Feel free to modify and use in your projects.

## Contributing

To extend this implementation:

1. Add new question types by extending the `renderQuestionContent()` method
2. Add new event handlers in `attachEventListeners()`
3. Update the CSS for new question types
4. Add validation for new question structures

## Examples

See the following files for complete examples:

- `dynamic-quiz-container.html` - Standalone demo with all question types
- `quiz-usage-example.html` - Interactive demo with controls
- `quiz-container.js` - The main implementation file
