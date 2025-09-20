# Quiz Components

This directory contains all the separated quiz components, each in its own file with corresponding CSS.

## Structure

```
quiz/
├── types.ts                           # Shared TypeScript interfaces and types
├── Quiz.tsx                           # Main quiz component
├── QuizCategoryCard.tsx               # Individual quiz category cards
├── QuizHeader.tsx                     # Quiz header with timer, lives, streak
├── PowerUps.tsx                       # Power-ups component (skip, hint, etc.)
├── QuizResults.tsx                    # Results screen component
├── DynamicQuizContainer.tsx           # Advanced quiz container
├── index.ts                           # Export file for all components
├── questions/                         # Question type components
│   ├── index.ts
│   ├── MultipleChoiceQuestion.tsx
│   ├── TrueFalseQuestion.tsx
│   ├── FillBlankQuestion.tsx
│   ├── CodingQuestion.tsx
│   └── MatchingQuestion.tsx
└── README.md                          # This file
```

## Components

### Core Components

- **Quiz.tsx** - Main quiz component that orchestrates all other components
- **QuizCategoryCard.tsx** - Displays individual quiz categories with animations
- **QuizHeader.tsx** - Header with timer, lives, streak counter, and controls
- **PowerUps.tsx** - Power-ups interface (skip question, hints, time freeze, etc.)
- **QuizResults.tsx** - Results screen with statistics and actions
- **DynamicQuizContainer.tsx** - Advanced quiz container for complex quiz modes

### Question Components

- **MultipleChoiceQuestion.tsx** - Multiple choice questions with options
- **TrueFalseQuestion.tsx** - True/False questions
- **FillBlankQuestion.tsx** - Fill in the blank questions
- **CodingQuestion.tsx** - Coding challenges with code editor
- **MatchingQuestion.tsx** - Matching questions

### Types

- **types.ts** - All TypeScript interfaces and types used across components

## Features

### Quiz Categories
- JavaScript Fundamentals
- Python Essentials
- Data Structures
- Algorithms
- Web Development
- System Design

### Question Types
- Multiple Choice
- True/False
- Fill in the Blank
- Coding Challenges
- Matching Questions

### Advanced Features
- Power-ups (Skip Question, Time Freeze, 50/50, Hints)
- Lives system (3 lives)
- Streak counter
- Real-time timer
- Detailed statistics
- Animated transitions
- Responsive design

### Styling
Each component has its own CSS file with:
- Modern glassmorphism design
- Smooth animations and transitions
- Responsive layout
- Dark theme support
- Accessibility features

## Usage

```tsx
import { Quiz } from './components/quiz';

function App() {
  return (
    <Quiz 
      isAdvanced={true}
      onComplete={(score, total) => console.log(`Score: ${score}/${total}`)}
      onClose={() => console.log('Quiz closed')}
    />
  );
}
```

## Benefits of Separation

1. **Maintainability** - Each component is focused and easier to maintain
2. **Reusability** - Components can be reused in different contexts
3. **Testing** - Individual components can be tested in isolation
4. **Performance** - Better code splitting and lazy loading opportunities
5. **Collaboration** - Multiple developers can work on different components
6. **Scalability** - Easy to add new question types or features
