# Quiz System

A comprehensive quiz platform with multiple question types, power-ups, and advanced features for educational content delivery.

## 🚀 Features

### Question Types
- **Multiple Choice**: Standard multiple choice questions with options
- **True/False**: Binary choice questions
- **Fill in the Blank**: Text input questions
- **Coding Questions**: Code-based challenges with execution
- **Matching Questions**: Match items from two columns

### Advanced Features
- **Power-ups System**: Skip questions, time freeze, 50/50, hints
- **Lives System**: 3 lives with penalty for wrong answers
- **Streak Tracking**: Consecutive correct answers
- **Real-time Timer**: Countdown timer with visual feedback
- **Difficulty Levels**: Easy, Medium, Hard categorization
- **Categories**: JavaScript, Python, Data Structures, Algorithms, Web Dev, System Design

### UI/UX Features
- **Glassmorphism Design**: Modern, elegant interface
- **Smooth Animations**: Transitions and hover effects
- **Responsive Layout**: Works on all device sizes
- **Dark Theme**: Consistent with project design
- **Accessibility**: Screen reader and keyboard navigation support

## 📁 Components

### Core Components
- `Quiz.tsx` - Main quiz orchestrator component
- `DynamicQuizContainer.tsx` - Advanced quiz container
- `QuizHeader.tsx` - Header with timer, lives, streak
- `QuizResults.tsx` - Results screen with statistics
- `PowerUps.tsx` - Power-ups interface and management

### Question Components
- `MultipleChoiceQuestion.tsx` - Multiple choice questions
- `TrueFalseQuestion.tsx` - True/false questions
- `FillBlankQuestion.tsx` - Fill in the blank questions
- `CodingQuestion.tsx` - Coding challenges
- `MatchingQuestion.tsx` - Matching questions

### Supporting Components
- `QuizCategoryCard.tsx` - Category selection cards
- `types.ts` - TypeScript interfaces and types

## 🎯 Usage

### Basic Quiz
```tsx
import { Quiz } from './components/quiz';

<Quiz 
  onComplete={(score, total) => console.log(`Score: ${score}/${total}`)}
  onClose={() => console.log('Quiz closed')}
/>
```

### Advanced Quiz with Configuration
```tsx
import { Quiz } from './components/quiz';

<Quiz 
  isAdvanced={true}
  config={{
    timeLimit: 30,
    questionCount: 15,
    difficulty: 'Hard'
  }}
  onComplete={(score, total, stats) => {
    console.log('Final Score:', score);
    console.log('Accuracy:', stats.accuracy);
    console.log('Time Remaining:', stats.timeRemaining);
  }}
/>
```

### Custom Question Types
```tsx
import { MultipleChoiceQuestion, CodingQuestion } from './components/quiz/questions';

// Multiple Choice
<MultipleChoiceQuestion
  question="What is the time complexity of binary search?"
  options={['O(n)', 'O(log n)', 'O(n²)', 'O(1)']}
  correctAnswer={1}
  onAnswer={(answer) => console.log('Selected:', answer)}
/>

// Coding Question
<CodingQuestion
  question="Implement a function to reverse a string"
  language="javascript"
  testCases={[
    { input: '"hello"', expectedOutput: '"olleh"' },
    { input: '"world"', expectedOutput: '"dlrow"' }
  ]}
  onCodeSubmit={(code) => console.log('Code submitted:', code)}
/>
```

## 🔧 Configuration

### Quiz Configuration
```typescript
interface QuizConfig {
  timeLimit: number;        // Time limit in minutes
  questionCount: number;    // Number of questions
  difficulty: 'Easy' | 'Medium' | 'Hard';
  categories?: string[];    // Specific categories
  allowPowerUps?: boolean;  // Enable power-ups
  livesEnabled?: boolean;   // Enable lives system
}
```

### Question Schema
```typescript
interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'coding' | 'matching';
  question: string;
  options?: string[];
  correctAnswer?: string | number | string[] | boolean;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  codeSnippet?: string;
  language?: string;
  testCases?: TestCase[];
}
```

### Power-ups Configuration
```typescript
interface PowerUps {
  skipQuestion: number;    // Number of skip power-ups
  timeFreeze: number;      // Number of time freeze power-ups
  fiftyFifty: number;      // Number of 50/50 power-ups
  hint: number;            // Number of hint power-ups
}
```

## 🎨 Styling

### Design System
- **Colors**:
  - Primary: #6366f1 (Indigo)
  - Success: #10b981 (Emerald)
  - Warning: #f59e0b (Amber)
  - Error: #ef4444 (Red)
  - Background: #1f2937 (Gray-800)
  - Surface: #374151 (Gray-700)

### CSS Architecture
- Each component has its own CSS file
- BEM methodology for class naming
- CSS custom properties for theming
- Responsive design with mobile-first approach

### Animations
- Smooth transitions for state changes
- Loading spinners and progress indicators
- Hover effects and micro-interactions
- Page transitions and modal animations

## 📊 Statistics & Analytics

### Quiz Statistics
```typescript
interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  accuracy: number;           // Percentage of correct answers
  averageTime: number;        // Average time per question
  timeRemaining: number;      // Time left at completion
  streak: number;             // Current streak
  maxStreak: number;          // Maximum streak achieved
  difficulty: string;         // Overall difficulty
  hintsUsed: number;          // Number of hints used
  livesRemaining: number;     // Lives left at completion
}
```

### Performance Metrics
- Question completion time
- Power-up usage patterns
- Difficulty progression
- Category performance
- User engagement metrics

## 🔒 Security

### Input Validation
- All user inputs are validated and sanitized
- XSS prevention for user-generated content
- SQL injection prevention for database queries
- Rate limiting for API endpoints

### Code Execution
- Sandboxed execution environment
- Resource limits (memory, CPU, time)
- Network isolation
- File system restrictions

## 🧪 Testing

### Test Coverage
- Unit tests for all components
- Integration tests for quiz flow
- E2E tests for complete user journey
- Performance tests for large datasets

### Test Files
- `Quiz.test.tsx` - Main quiz component tests
- `PowerUps.test.tsx` - Power-ups functionality tests
- `QuestionTypes.test.tsx` - Question type tests
- `QuizResults.test.tsx` - Results screen tests

### Manual Testing
- `tests/manual/quiz/` - Manual test scripts
- Browser compatibility testing
- Accessibility testing
- Performance testing

## 🚀 Deployment

### Build Configuration
```json
{
  "scripts": {
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### Environment Variables
```bash
REACT_APP_QUIZ_API_URL=https://your-api.com/api/quiz
REACT_APP_QUIZ_TIMEOUT=30000
REACT_APP_QUIZ_DEBUG=false
```

## 📚 API Integration

### Quiz Endpoints
- `GET /api/quiz/categories` - Fetch quiz categories
- `GET /api/quiz/questions` - Fetch questions by category/difficulty
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/results/:id` - Fetch quiz results

### Real-time Features
- WebSocket connection for live updates
- Real-time leaderboards
- Live quiz sessions
- Collaborative quiz modes

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use functional components with hooks
3. Implement proper error boundaries
4. Add comprehensive tests
5. Follow accessibility guidelines

### Code Style
- ESLint configuration for consistency
- Prettier for code formatting
- Conventional commits for version control
- JSDoc comments for documentation

## 📞 Support

### Documentation
- Component API documentation
- Usage examples and tutorials
- Troubleshooting guide
- Performance optimization tips

### Community
- GitHub issues for bug reports
- Discussions for feature requests
- Discord server for community support
- Stack Overflow for technical questions

## 🔮 Future Enhancements

### Planned Features
- **Adaptive Quizzing**: AI-powered difficulty adjustment
- **Gamification**: Badges, achievements, and leaderboards
- **Offline Support**: PWA capabilities
- **Multi-language**: Internationalization support
- **Analytics Dashboard**: Detailed performance insights
- **Quiz Builder**: Visual quiz creation tool
- **Team Quizzes**: Collaborative quiz sessions