# Collaborative Code Editor

A real-time collaborative code editor built with React, Monaco Editor, and Socket.io.

## Features

- 🚀 **Real-time Collaboration**: Multiple users can edit code simultaneously
- 💻 **Language Support**: JavaScript and Python with syntax highlighting
- 🌙 **Theme Toggle**: Switch between dark and light themes
- 👥 **User Presence**: See who's currently in the room
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Live Sync**: Changes are synchronized in real-time

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Join a Room**:
   - Enter a room ID (e.g., "ABC123") or generate one randomly
   - Choose your preferred programming language (JavaScript or Python)
   - Click "Join Room"

2. **Start Coding**:
   - The editor will open with default code for your chosen language
   - Start typing to see real-time collaboration
   - Share the room ID with teammates to invite them

3. **Collaborate**:
   - Multiple users can edit simultaneously
   - See who's currently in the room
   - Toggle between dark and light themes
   - View connection status and room information

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Editor**: Monaco Editor (same as VS Code)
- **Real-time**: Socket.io Client
- **Timers**: react-countdown
- **Styling**: CSS3 with modern design patterns

## Project Structure

```
src/
├── components/
│   ├── CollaborativeEditor.tsx    # Main editor component
│   ├── CollaborativeEditor.css    # Editor styles
│   ├── RoomSelector.tsx          # Room selection interface
│   └── RoomSelector.css          # Room selector styles
├── App.tsx                       # Main app component
├── App.css                       # App styles
└── index.tsx                     # Entry point
```

## Features in Detail

### Real-time Collaboration
- WebSocket-based real-time synchronization
- Conflict resolution for simultaneous edits
- User presence indicators
- Connection status monitoring

### Editor Features
- Syntax highlighting for JavaScript and Python
- Auto-completion and IntelliSense
- Error detection and linting
- Code folding and minimap
- Multiple themes (dark/light)

### User Experience
- Modern, responsive design
- Smooth animations and transitions
- Intuitive room management
- Real-time connection status

## Backend Requirements

This frontend requires a backend server with Socket.io support. The backend should handle:

- WebSocket connections
- Room management
- Real-time code synchronization
- User presence tracking

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Environment Variables

Create a `.env` file in the client directory:

```env
REACT_APP_SERVER_URL=http://localhost:5000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Using Timers with react-countdown

This project uses [react-countdown](https://www.npmjs.com/package/react-countdown) for timer functionality (e.g., coding challenges, quiz timers, etc.).

### Installation

Already included in dependencies. If you need to reinstall:
```bash
npm install react-countdown
```

### Basic Usage Example

```tsx
import Countdown from 'react-countdown';

// 10-second countdown
<Countdown date={Date.now() + 10000} onComplete={() => alert('Time is up!')} />
```

You can use this in any component to add a timer.
