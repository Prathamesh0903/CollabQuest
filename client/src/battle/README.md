# Battle System

A real-time competitive coding platform where users can engage in head-to-head programming battles with live collaboration and scoring.

## 🚀 Features

### Core Battle Features
- **Real-time Battles**: Live head-to-head coding competitions
- **Multiple Battle Modes**: Quick battles, tournaments, and custom matches
- **Live Scoring**: Real-time score updates and leaderboards
- **Battle Lobby**: Pre-battle setup and user matching
- **Battle History**: Track past battles and performance

### Collaboration Features
- **Live Code Sharing**: Real-time code synchronization
- **Cursor Tracking**: See opponent's cursor position
- **Follow Mode**: Follow your opponent's coding process
- **Chat Integration**: In-battle communication
- **Screen Sharing**: Optional screen sharing for mentoring

### Battle Mechanics
- **Time Limits**: Configurable battle durations
- **Problem Selection**: Random or custom problem selection
- **Difficulty Matching**: Automatic difficulty adjustment
- **Power-ups**: Special abilities during battles
- **Penalty System**: Time penalties for wrong submissions

## 📁 Components

### Main Components
- `BattleLobby.tsx` - Battle setup and user matching interface
- `BattleRoom.tsx` - Main battle interface
- `BattleTimer.tsx` - Battle countdown and time management
- `BattleScoreboard.tsx` - Live score display
- `BattleChat.tsx` - In-battle communication

### Battle Management
- `BattleController.tsx` - Battle state management
- `BattleService.tsx` - Battle API integration
- `BattleStore.tsx` - Battle state store (Redux/Zustand)
- `BattleSocket.tsx` - WebSocket connection management

### Supporting Components
- `BattleHistory.tsx` - Past battle results
- `BattleSettings.tsx` - Battle configuration
- `BattleInvite.tsx` - Battle invitation system
- `BattleSpectator.tsx` - Spectator mode interface

## 🎯 Usage

### Starting a Battle
```tsx
import { BattleLobby } from './battle/pages';

<BattleLobby
  onBattleStart={(battleConfig) => {
    console.log('Starting battle with config:', battleConfig);
  }}
  onInviteUser={(userId) => {
    console.log('Inviting user:', userId);
  }}
/>
```

### Battle Room
```tsx
import { BattleRoom } from './battle/pages';

<BattleRoom
  battleId="battle-123"
  userId="user-456"
  onBattleEnd={(result) => {
    console.log('Battle ended:', result);
  }}
  onCodeSubmit={(code) => {
    console.log('Code submitted:', code);
  }}
/>
```

### Battle State Management
```tsx
import { useBattle } from './battle/hooks';

const { 
  battle, 
  participants, 
  currentProblem, 
  timeRemaining,
  submitCode,
  sendMessage 
} = useBattle('battle-123');
```

## 🔧 Configuration

### Battle Configuration
```typescript
interface BattleConfig {
  id: string;
  mode: 'quick' | 'tournament' | 'custom';
  duration: number;           // Battle duration in minutes
  problemCount: number;       // Number of problems
  difficulty: 'easy' | 'medium' | 'hard';
  participants: BattleParticipant[];
  settings: BattleSettings;
}
```

### Battle Settings
```typescript
interface BattleSettings {
  allowHints: boolean;
  allowChat: boolean;
  allowSpectators: boolean;
  powerUpsEnabled: boolean;
  timePenalty: number;        // Penalty in seconds for wrong answers
  maxParticipants: number;
  autoStart: boolean;
}
```

### Battle Participant
```typescript
interface BattleParticipant {
  userId: string;
  username: string;
  avatar?: string;
  isReady: boolean;
  score: number;
  problemsSolved: number;
  currentProblem?: string;
  lastSubmission?: Date;
}
```

## 🎨 UI/UX Features

### Battle Interface
- **Split Screen**: Side-by-side code editors
- **Live Updates**: Real-time score and progress updates
- **Visual Indicators**: Battle status, time remaining, participant status
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Consistent with project design system

### Battle Animations
- **Countdown Animation**: Pre-battle countdown
- **Score Updates**: Animated score changes
- **Problem Transitions**: Smooth problem switching
- **Victory/Defeat**: End-battle animations
- **Power-up Effects**: Visual power-up activations

## 📊 Scoring System

### Scoring Algorithm
```typescript
interface BattleScore {
  totalScore: number;
  problemsSolved: number;
  totalTime: number;
  accuracy: number;
  bonusPoints: number;
  penalties: number;
  rank: number;
}
```

### Scoring Factors
- **Problem Difficulty**: Higher points for harder problems
- **Completion Time**: Faster solutions earn bonus points
- **Accuracy**: Correct solutions only
- **Power-ups**: Strategic power-up usage
- **Penalties**: Time penalties for wrong submissions

## 🔒 Security & Fairness

### Anti-Cheating Measures
- **Code Validation**: Server-side code execution
- **Time Tracking**: Accurate time measurement
- **Submission Validation**: Prevent multiple submissions
- **IP Monitoring**: Detect suspicious activity
- **Session Management**: Secure battle sessions

### Fair Play
- **Random Problem Selection**: Unbiased problem assignment
- **Equal Resources**: Same execution environment
- **Transparent Scoring**: Clear scoring criteria
- **Appeal System**: Dispute resolution process

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: Battle flow testing
- **E2E Tests**: Complete battle scenarios
- **Performance Tests**: Load testing for concurrent battles
- **Security Tests**: Anti-cheating validation

### Test Files
- `BattleLobby.test.tsx` - Lobby functionality tests
- `BattleRoom.test.tsx` - Battle room tests
- `BattleSocket.test.tsx` - WebSocket connection tests
- `BattleScoring.test.tsx` - Scoring algorithm tests

### Manual Testing
- `tests/manual/battle/` - Manual battle test scripts
- Multi-user battle testing
- Network disconnection scenarios
- Performance under load

## 🚀 Deployment

### Environment Configuration
```bash
REACT_APP_BATTLE_API_URL=https://your-api.com/api/battle
REACT_APP_BATTLE_SOCKET_URL=wss://your-socket.com/battle
REACT_APP_BATTLE_TIMEOUT=300000
REACT_APP_BATTLE_MAX_PARTICIPANTS=10
```

### Performance Optimization
- **Code Splitting**: Lazy load battle components
- **WebSocket Optimization**: Efficient real-time communication
- **Caching**: Battle history and user data caching
- **CDN**: Static asset delivery optimization

## 📚 API Integration

### Battle Endpoints
- `GET /api/battle/lobby` - Fetch available battles
- `POST /api/battle/create` - Create new battle
- `GET /api/battle/:id` - Fetch battle details
- `POST /api/battle/:id/join` - Join battle
- `POST /api/battle/:id/submit` - Submit solution
- `GET /api/battle/:id/results` - Fetch battle results

### WebSocket Events
- `battle:join` - Join battle room
- `battle:leave` - Leave battle room
- `battle:start` - Battle started
- `battle:end` - Battle ended
- `battle:code-update` - Code synchronization
- `battle:score-update` - Score updates
- `battle:message` - Chat messages

## 🤝 Contributing

### Development Guidelines
1. Follow battle system architecture
2. Implement proper error handling
3. Add comprehensive tests
4. Ensure fair play mechanisms
5. Optimize for performance

### Code Review Checklist
- [ ] Security measures implemented
- [ ] Fair play mechanisms in place
- [ ] Performance optimized
- [ ] Tests added
- [ ] Documentation updated

## 📞 Support

### Troubleshooting
- **Connection Issues**: Check WebSocket connectivity
- **Battle Not Starting**: Verify participant readiness
- **Score Discrepancies**: Check submission timestamps
- **Performance Issues**: Monitor resource usage

### Common Issues
1. **Battle Timeout**: Network connectivity problems
2. **Score Sync Issues**: WebSocket connection drops
3. **Code Execution Errors**: Server-side validation failures
4. **UI Lag**: Large code submissions or network latency

## 🔮 Future Enhancements

### Planned Features
- **Tournament Mode**: Multi-round competitions
- **Team Battles**: Team vs team competitions
- **Custom Rules**: User-defined battle rules
- **AI Opponents**: Practice against AI
- **Battle Replays**: Watch past battles
- **Spectator Mode**: Watch ongoing battles
- **Mobile App**: Native mobile battle experience
- **Battle Analytics**: Detailed performance metrics
