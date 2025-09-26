import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
// Removed Battle components; Battle Play now uses DSAProblemPage
import About from './components/About';
import CollaborativeEditor from './components/CollaborativeEditor';
import Quiz from './components/Quiz';
import QuizPage from './components/QuizPage';

import DemoInstructions from './components/DemoInstructions';
import DSASheet from './components/DSASheet/DSASheet';
import LeetCodeProblemPage from './components/DSASheet/LeetCodeProblemPage';
import DSAProblemPage from './components/DSASheet/DSAProblemPage';
import Battle from './components/Battle';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import ContestsPage from './components/contests/ContestsPage';
import AdminContestsPage from './components/contests/AdminContestsPage';
import DiscussList from './components/discuss/DiscussList';
import DiscussDetail from './components/discuss/DiscussDetail';
import DiscussNew from './components/discuss/DiscussNew';
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

// Spectator Mode was removed with Battle feature

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
  return currentUser ? children : <Navigate to="/auth" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Navigate to="/" replace /> : children;
};

// Onboarding guard: fetches minimal user and redirects if onboarding incomplete
const OnboardingRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [checking, setChecking] = React.useState(true);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);

  React.useEffect(() => {
    const check = async () => {
      if (loading) return;
      if (!currentUser) { setNeedsOnboarding(false); setChecking(false); return; }
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/auth/me`);
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setNeedsOnboarding(!data?.user?.onboardingCompleted);
      } catch {
        setNeedsOnboarding(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [currentUser, loading]);

  if (loading || checking) return null;
  if (currentUser && needsOnboarding) return <Navigate to="/onboarding" replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Original homepage - protected route */}
        <Route path="/" element={<PrivateRoute><OnboardingRoute><DashboardWrapper /></OnboardingRoute></PrivateRoute>} />
        
        {/* Auth routes - public routes */}
        <Route path="/auth" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected app routes */}
        <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
        <Route path="/discuss" element={<DiscussList />} />
        <Route path="/discuss/new" element={<DiscussNew />} />
        <Route path="/discuss/:id" element={<DiscussDetail />} />
        <Route path="/collab/:sessionId" element={<PrivateRoute><SessionEditor /></PrivateRoute>} />
        <Route path="/battle" element={<PrivateRoute><Battle /></PrivateRoute>} />
        <Route path="/contests" element={<PrivateRoute><ContestsPage /></PrivateRoute>} />
        <Route path="/admin/contests" element={<PrivateRoute><AdminContestsPage /></PrivateRoute>} />

        <Route path="/advanced-quiz" element={<PrivateRoute><AdvancedQuizWrapper /></PrivateRoute>} />
        <Route path="/quiz" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
        {/* Route Battle Play to DSA editor with host-chosen problem id */}
        <Route path="/battle/play/:id" element={<PrivateRoute><DSAProblemPage /></PrivateRoute>} />
        <Route path="/dsa-sheet" element={<PrivateRoute><DSASheet /></PrivateRoute>} />
        <Route path="/dsa-sheet/problem/:id" element={<PrivateRoute><LeetCodeProblemPage /></PrivateRoute>} />
        {/* Placeholder onboarding route (UI to be implemented next) */}
        <Route path="/onboarding" element={<PrivateRoute><div className="app">Onboarding placeholder</div></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
