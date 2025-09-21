# DSA Sheet Editor

A comprehensive Data Structures and Algorithms practice platform with progress tracking, collaborative editing, and real-time features.

## 🚀 Features

### Core Functionality
- **Problem Management**: Create, edit, and organize DSA problems
- **Progress Tracking**: Visual progress indicators and completion status
- **Difficulty Levels**: Easy, Medium, Hard categorization
- **Topic Organization**: Problems grouped by data structure/algorithm type
- **Search & Filter**: Find problems by difficulty, topic, or keywords

### Collaborative Features
- **Real-time Editing**: Multiple users can edit simultaneously
- **Live Cursor Tracking**: See where other users are working
- **Follow Mode**: Follow another user's cursor in real-time
- **User Isolation**: Separate workspaces for each user
- **Session Management**: Persistent collaborative sessions

### Code Execution
- **Multi-language Support**: Python, JavaScript, Java, C++
- **Docker Isolation**: Secure code execution in containers
- **Test Case Validation**: Automatic test case execution
- **Performance Metrics**: Execution time and memory usage tracking

## 📁 Components

### Main Components
- `DSAProblemPage.tsx` - Main problem display and editing interface
- `DSAProblemList.tsx` - List view of all problems with filtering
- `DSAProblemForm.tsx` - Form for creating/editing problems
- `ProgressTracker.tsx` - Visual progress tracking component
- `CollaborativeEditor.tsx` - Real-time collaborative code editor

### Supporting Components
- `ProblemCard.tsx` - Individual problem display card
- `DifficultyBadge.tsx` - Visual difficulty indicator
- `TopicFilter.tsx` - Filter problems by topic
- `SearchBar.tsx` - Search functionality
- `CodeEditor.tsx` - Monaco-based code editor

## 🎯 Usage

### Basic Problem Management
```tsx
import { DSAProblemPage } from './components/DSA';

// Navigate to a specific problem
<DSAProblemPage problemId="123" />

// Create a new problem
<DSAProblemForm onCreate={handleCreate} />
```

### Collaborative Editing
```tsx
import { CollaborativeEditor } from './components/DSA';

<CollaborativeEditor
  sessionId="session-123"
  userId="user-456"
  onCodeChange={handleCodeChange}
  onCursorChange={handleCursorChange}
/>
```

### Progress Tracking
```tsx
import { ProgressTracker } from './components/DSA';

<ProgressTracker
  userId="user-123"
  showDetails={true}
  onProgressUpdate={handleProgressUpdate}
/>
```

## 🔧 Configuration

### Environment Variables
```bash
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SOCKET_URL=your-socket-server-url
```

### DSA Problem Schema
```typescript
interface DSAProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  tags: string[];
  testCases: TestCase[];
  constraints: string;
  examples: Example[];
  hints: string[];
  solution: string;
  timeLimit: number;
  spaceLimit: number;
}
```

## 🎨 Styling

The DSA components follow the project's design system:
- **Dark Theme**: Primary theme with dark backgrounds
- **Color Scheme**: 
  - Easy: Green (#53c653)
  - Medium: Orange (#ff9500)
  - Hard: Red (#c65353)
- **Typography**: Clean, readable fonts
- **Animations**: Smooth transitions and hover effects

## 📊 Progress Tracking

### Progress States
- **Not Started**: Gray indicator
- **In Progress**: Yellow indicator  
- **Completed**: Green indicator
- **Skipped**: Red indicator

### Progress Metrics
- Overall completion percentage
- Problems solved by difficulty
- Time spent per problem
- Streak tracking
- Achievement badges

## 🔒 Security

- **Input Validation**: All user inputs are validated
- **Code Execution**: Sandboxed in Docker containers
- **Authentication**: Supabase-based user authentication
- **Authorization**: Role-based access control
- **Data Sanitization**: XSS and injection prevention

## 🧪 Testing

### Test Files
- `DSAProblemPage.test.tsx` - Main component tests
- `CollaborativeEditor.test.tsx` - Real-time editing tests
- `ProgressTracker.test.tsx` - Progress tracking tests

### Manual Testing
- `tests/manual/dsa/` - Manual test scripts
- `tests/manual/collaboration/` - Collaboration feature tests

## 🚀 Deployment

The DSA components are automatically included in the main application build. No additional configuration is required for deployment.

## 📚 API Integration

### Backend Endpoints
- `GET /api/dsa/problems` - Fetch all problems
- `GET /api/dsa/problems/:id` - Fetch specific problem
- `POST /api/dsa/problems` - Create new problem
- `PUT /api/dsa/problems/:id` - Update problem
- `DELETE /api/dsa/problems/:id` - Delete problem

### Socket Events
- `dsa:join` - Join problem session
- `dsa:leave` - Leave problem session
- `dsa:code-change` - Broadcast code changes
- `dsa:cursor-change` - Broadcast cursor position
- `dsa:follow-user` - Follow another user

## 🤝 Contributing

When contributing to DSA components:
1. Follow the existing code style
2. Add tests for new features
3. Update this README if needed
4. Ensure accessibility compliance
5. Test collaborative features thoroughly

## 📞 Support

For issues related to DSA components:
1. Check the component documentation
2. Review the test cases
3. Check the manual test scripts
4. Create an issue with detailed information
