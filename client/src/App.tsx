import React, { useState } from 'react';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import RoomSelector from './components/RoomSelector';
import CollaborativeEditor from './components/CollaborativeEditor';
import DemoInstructions from './components/DemoInstructions';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import BattleLobby from './components/Dashboard/BattleLobby';
import BattleRoomPage from './components/BattleRoomPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

interface EditorState {
  roomId: string;
  language: 'javascript' | 'python';
}

// Placeholder for the animation overlay
const GamifiedTransition: React.FC<{ show: boolean }> = ({ show }) => (
  show ? (
    <div className="gamified-transition-overlay">
      <div className="gamified-animation">🎉 Entering the Coding Arena! 🎮</div>
    </div>
  ) : null
);

function App() {
  const { currentUser, loading } = useAuth();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const handleJoinRoom = (roomId: string, language: 'javascript' | 'python') => {
    setEditorState({ roomId, language });
  };

  const handleLeaveRoom = () => {
    setEditorState(null);
  };

  const handleShowDemo = () => {
    setShowDemo(true);
  };

  const handleHideDemo = () => {
    setShowDemo(false);
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  const handleHideQuiz = () => {
    setShowQuiz(false);
  };

  // Handles room join/create from Dashboard
  const handleRoomSuccess = (roomId: string, language: 'javascript' | 'python') => {
    setShowTransition(true);
    setTimeout(() => {
      setShowTransition(false);
      setEditorState({ roomId, language });
    }, 1200); // 1.2s animation
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/battle-lobby" element={<BattleLobby />} />
        <Route path="/battle-room/:roomCode" element={<BattleRoomPage />} />
        <Route
          path="*"
          element={
            editorState ? (
              <div className="editor-wrapper">
                <div className="leave-room">
                  <button onClick={handleLeaveRoom} className="leave-btn">
                    ← Back to Dashboard
                  </button>
                </div>
                <CollaborativeEditor
                  roomId={editorState.roomId}
                  language={editorState.language}
                />
              </div>
            ) : showDemo ? (
              <div className="demo-wrapper">
                <div className="leave-room">
                  <button onClick={handleHideDemo} className="leave-btn">
                    ← Back to Dashboard
                  </button>
                </div>
                <DemoInstructions />
              </div>
            ) : showQuiz ? (
              <Quiz onBack={handleHideQuiz} />
            ) : (
              <Dashboard onRoomSuccess={handleRoomSuccess} onStartQuiz={handleStartQuiz} onStartDemo={handleShowDemo} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
