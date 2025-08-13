import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BattleLanding from './components/Battle/BattleLanding';
import BattlePlay from './components/Battle/BattlePlay';
import About from './components/About';
import CollaborativeEditor from './components/CollaborativeEditor';
import Quiz from './components/Quiz';
import ResultScreen from './components/ResultScreen';
import DemoInstructions from './components/DemoInstructions';
import DSASheet from './components/DSASheet/DSASheet';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

// Session-based editor component
const SessionEditor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <CollaborativeEditor sessionId={sessionId} />;
};

// Quiz component wrapper
const QuizWrapper: React.FC = () => {
  const handleQuizComplete = (score: number, totalQuestions: number) => {
    // Handle quiz completion - could redirect to results page
    console.log(`Quiz completed with score: ${score}/${totalQuestions}`);
  };

  return (
    <Quiz 
      onComplete={handleQuizComplete} 
      onClose={() => window.location.href = '/'} 
    />
  );
};

// Dashboard wrapper with state management
const DashboardWrapper: React.FC = () => {
  const [editorState, setEditorState] = useState<{
    sessionId: string;
    language: 'javascript' | 'python';
  } | null>(null);
  
  const [showDemo, setShowDemo] = useState(false);

  const handleLeaveSession = () => {
    setEditorState(null);
  };

  // Handles session join/create from Dashboard
  const handleSessionSuccess = (sessionId: string, language: 'javascript' | 'python') => {
    setEditorState({ sessionId, language });
  };

  const handleShowDemo = () => {
    setShowDemo(true);
  };

  const handleCloseDemo = () => {
    setShowDemo(false);
  };

  // If editor is active, show it
  if (editorState) {
    return (
      <div className="app">
        <CollaborativeEditor
          sessionId={editorState.sessionId}
          language={editorState.language}
        />
      </div>
    );
  }

  // If demo is active, show it
  if (showDemo) {
    return (
      <div className="app">
        <DemoInstructions onClose={handleCloseDemo} />
      </div>
    );
  }

  // Default: show dashboard
  return (
    <div className="app">
      <Dashboard 
        onSessionSuccess={handleSessionSuccess} 
        onStartDemo={handleShowDemo} 
      />
    </div>
  );
};

// Wrapper with AuthProvider
const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardWrapper />} />
          <Route path="/about" element={<About />} />
          <Route path="/collab/:sessionId" element={<SessionEditor />} />
          <Route path="/quiz" element={<QuizWrapper />} />
          <Route path="/battle" element={<BattleLanding />} />
          <Route path="/battle/play" element={<BattlePlay />} />
          <Route path="/dsa-sheet" element={<DSASheet />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppWithAuth;
