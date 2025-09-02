import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BattleLanding from './components/Battle/BattleLanding';
import BattlePlay from './components/Battle/BattlePlay';
import BattleJoin from './components/Battle/BattleJoin';
import About from './components/About';
import CollaborativeEditor from './components/CollaborativeEditor';
import Quiz from './components/Quiz';
import QuizPage from './components/QuizPage';

import ResultScreen from './components/ResultScreen';
import DemoInstructions from './components/DemoInstructions';
import DSASheet from './components/DSASheet/DSASheet';
import DSAProblemPage from './components/DSASheet/DSAProblemPage';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import './App.css';

// Session-based editor component
const SessionEditor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <CollaborativeEditor sessionId={sessionId} />;
};



// Advanced Quiz component wrapper
const AdvancedQuizWrapper: React.FC = () => {
  const handleAdvancedQuizComplete = (score: number, totalQuestions: number) => {
    console.log(`Advanced quiz completed with score: ${score}/${totalQuestions}`);
  };

  return (
    <Quiz 
      isAdvanced={true}
      onComplete={handleAdvancedQuizComplete} 
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

// Route guards
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? children : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Navigate to="/" replace /> : children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>
      
      } />

        <Route path="/" element={<PrivateRoute><DashboardWrapper /></PrivateRoute>} />
        <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
        <Route path="/collab/:sessionId" element={<PrivateRoute><SessionEditor /></PrivateRoute>} />

        <Route path="/advanced-quiz" element={<PrivateRoute><AdvancedQuizWrapper /></PrivateRoute>} />
        <Route path="/quiz" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
        <Route path="/battle" element={<PrivateRoute><BattleLanding /></PrivateRoute>} />
        <Route path="/battle/play" element={<PrivateRoute><BattlePlay /></PrivateRoute>} />
        <Route path="/battle/join/:roomCode" element={<PrivateRoute><BattleJoin /></PrivateRoute>} />
        <Route path="/battle/join" element={<PrivateRoute><BattleJoin /></PrivateRoute>} />
        <Route path="/dsa-sheet" element={<PrivateRoute><DSASheet /></PrivateRoute>} />
        <Route path="/dsa-sheet/problem/:id" element={<PrivateRoute><DSAProblemPage /></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
