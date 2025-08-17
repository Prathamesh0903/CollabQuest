# Merged Quiz System

This is a comprehensive quiz system that combines both regular and advanced quiz functionality into a single component while maintaining separate styling and features.

## Features

### Regular Quiz Mode
- Simple multiple choice questions
- Timer countdown
- Basic score tracking
- Category selection
- Clean, modern UI

### Advanced Quiz Mode
- Multiple question types:
  - Multiple choice
  - True/False
  - Fill in the blank
  - Matching
  - Coding questions
- Power-ups system:
  - Skip question
  - Time freeze
  - 50/50 (eliminate wrong options)
  - Hints
- Lives system (3 lives)
- Streak tracking
- Advanced scoring with points
- Real-time feedback
- Enhanced UI with additional features

## Usage

### Basic Usage
```tsx
import Quiz from './components/Quiz';

// Regular quiz
<Quiz onComplete={(score, total) => console.log(`Score: ${score}/${total}`)} />

// Advanced quiz
<Quiz 
  isAdvanced={true}
  onComplete={(score, total) => console.log(`Score: ${score}/${total}`)}
  onClose={() => console.log('Quiz closed')}
/>
```

### Demo Component
```tsx
import QuizDemo from './components/QuizDemo';

// Shows a selection screen for both modes
<QuizDemo />
```

## Props

### QuizProps
- `onComplete?: (score: number, totalQuestions: number) => void` - Callback when quiz is completed
- `onClose?: () => void` - Callback when quiz is closed/exited
- `isAdvanced?: boolean` - Enable advanced quiz mode (default: false)

## Question Types (Advanced Mode)

### Multiple Choice
Standard multiple choice questions with 4 options.

### True/False
Simple true or false questions.

### Fill in the Blank
Text input questions where users type their answer.

### Matching
Match items from one column to another.

### Coding
Code editor with syntax highlighting and test cases.

## Power-ups (Advanced Mode)

### Skip Question
Skip the current question and move to the next one.

### Time Freeze
Freeze the timer for 10 seconds.

### 50/50
Eliminate two wrong options (placeholder implementation).

### Hint
Get a hint for the current question.

## Styling

The component uses separate CSS classes for regular and advanced features:

### Regular Quiz Classes
- `.quiz-container` - Main container
- `.category-card` - Quiz category cards
- `.question-card` - Question display
- `.option-button` - Answer options

### Advanced Quiz Classes
- `.power-ups-container` - Power-ups display
- `.lives-container` - Lives indicator
- `.streak-container` - Streak counter
- `.true-false-grid` - True/False layout
- `.fill-blank-container` - Fill in blank layout
- `.matching-container` - Matching layout
- `.coding-container` - Code editor layout

## File Structure

```
client/src/components/
├── Quiz.tsx              # Main merged quiz component
├── Quiz.css              # Combined styles for both modes
├── QuizDemo.tsx          # Demo component
└── QUIZ_README.md        # This documentation
```

## Implementation Details

### State Management
The component uses React hooks to manage:
- Quiz state (active, paused, completed)
- Current question index
- Score and statistics
- Power-ups and lives (advanced mode)
- User answers and streaks (advanced mode)

### Question Rendering
The `renderQuestion()` function dynamically renders different question types based on the `isAdvanced` prop and question type.

### Timer System
Both modes use a countdown timer, but advanced mode includes pause functionality for power-ups.

### Responsive Design
The component is fully responsive with mobile-first design principles.

## Customization

### Adding New Question Types
1. Add the question type to the `Question` interface
2. Add a case in the `renderQuestion()` function
3. Add corresponding CSS styles
4. Update the `checkAnswer()` function

### Modifying Power-ups
1. Update the `powerUps` state object
2. Add logic in the `handlePowerUp()` function
3. Update the power-ups display in the UI

### Styling Changes
All styles are in `Quiz.css` and use CSS custom properties for easy theming.

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- Framer Motion for animations

## Performance Considerations

- Questions are loaded statically (can be moved to API calls)
- Animations are optimized with Framer Motion
- Responsive images and lazy loading for better performance

## Future Enhancements

- Backend integration for dynamic questions
- User authentication and progress tracking
- Leaderboards and social features
- More question types (drag & drop, image questions)
- Accessibility improvements
- Offline support with service workers
