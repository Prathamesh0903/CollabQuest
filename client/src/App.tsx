import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import About from './components/About';
import CollaborativeEditor from './components/CollaborativeEditor';
import Quiz from './components/Quiz';
import ResultScreen from './components/ResultScreen';
import DemoInstructions from './components/DemoInstructions';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

// Session-based editor component
const SessionEditor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <CollaborativeEditor sessionId={sessionId} />;
};

// Main App component
const App: React.FC = () => {
  const [editorState, setEditorState] = useState<{
    sessionId: string;
    language: 'javascript' | 'python';
  } | null>(null);
  
  const [quizState, setQuizState] = useState<{
    isActive: boolean;
    score: number;
    totalQuestions: number;
  }>({
    isActive: false,
    score: 0,
    totalQuestions: 0
  });
  
  const [showDemo, setShowDemo] = useState(false);

  const handleLeaveSession = () => {
    setEditorState(null);
  };

  // Handles session join/create from Dashboard
  const handleSessionSuccess = (sessionId: string, language: 'javascript' | 'python') => {
    setEditorState({ sessionId, language });
  };

  const handleStartQuiz = () => {
    setQuizState({
      isActive: true,
      score: 0,
      totalQuestions: 0
    });
  };

  const handleShowDemo = () => {
    setShowDemo(true);
  };

  const handleCloseDemo = () => {
    setShowDemo(false);
  };

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    setQuizState({
      isActive: false,
      score,
      totalQuestions
    });
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

  // If quiz is active, show it
  if (quizState.isActive) {
    return (
      <div className="app">
        <Quiz onComplete={handleQuizComplete} />
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

  // If quiz results are available, show them
  if (quizState.score > 0 || quizState.totalQuestions > 0) { // Show if quiz has been attempted
    const result = {
      passed: quizState.score,
      total: quizState.totalQuestions,
      testCaseResults: [], // No test cases for quiz
      accuracyScore: quizState.totalQuestions > 0 ? (quizState.score / quizState.totalQuestions) * 100 : 0,
      speedScore: 0, // No speed score for quiz
      totalScore: quizState.totalQuestions > 0 ? (quizState.score / quizState.totalQuestions) * 100 : 0,
      timeTaken: null // No time taken for quiz
    };

    return (
      <div className="app">
        <ResultScreen
          result={result}
          onClose={() => setQuizState({ isActive: false, score: 0, totalQuestions: 0 })}
        />
      </div>
    );
  }

  // Default: show dashboard
  return (
    <div className="app">
      <Dashboard 
        onSessionSuccess={handleSessionSuccess} 
        onStartQuiz={handleStartQuiz} 
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
          <Route path="/" element={<App />} />
          <Route path="/about" element={<About />} />
          <Route path="/collab/:sessionId" element={<SessionEditor />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppWithAuth;
