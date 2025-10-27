import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import DemoInstructions from '../components/DemoInstructions';
import CollaborativeEditor from '../components/CollaborativeEditor';

const DashboardPage: React.FC = () => {
  const [editorState, setEditorState] = useState<{
    sessionId: string;
    language: 'javascript' | 'python';
  } | null>(null);

  const [showDemo, setShowDemo] = useState(false);

  const handleLeaveSession = () => {
    setEditorState(null);
  };

  const handleSessionSuccess = (sessionId: string, language: 'javascript' | 'python') => {
    setEditorState({ sessionId, language });
  };

  const handleShowDemo = () => {
    setShowDemo(true);
  };

  const handleCloseDemo = () => {
    setShowDemo(false);
  };

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

  if (showDemo) {
    return (
      <div className="app">
        <DemoInstructions onClose={handleCloseDemo} />
      </div>
    );
  }

  return (
    <div className="app">
      <Dashboard 
        onSessionSuccess={handleSessionSuccess} 
        onStartDemo={handleShowDemo} 
      />
    </div>
  );
};

export default DashboardPage;



