import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CodeEditor } from '../components/CodeEditor';
import { Timer } from '../components/Timer';
import { TestResults } from '../components/TestResults';
import { useBattleSocket } from '../hooks/useBattleSocket';
import { useBattleContext } from '../context/BattleProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const BattleRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useBattleContext();
  const { submitCode } = useBattleSocket();
  
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize code with function template or cached value
    const cached = sessionId ? localStorage.getItem(`battle-code-${sessionId}`) : null;
    if (cached) {
      setCode(cached);
      return;
    }
    if (state.currentBattle?.settings.problem?.functionSignature) {
      setCode(state.currentBattle.settings.problem.functionSignature);
    }
  }, [state.currentBattle, sessionId]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (sessionId) {
      localStorage.setItem(`battle-code-${sessionId}`, newCode);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      submitCode(code);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    if (code.trim()) {
      handleSubmitCode();
    }
  };

  return (
    <ErrorBoundary>
      <LoadingOverlay show={state.isLoading} />
      <div className="battle-room">
      <div className="battle-header">
        <div className="battle-info">
          <h1>{state.currentBattle?.settings.problem?.title}</h1>
          <Timer 
            duration={state.currentBattle?.settings.duration || 300}
            onTimeUp={handleTimeUp}
            isActive={state.currentBattle?.state === 'active'}
          />
        </div>
        
        <button 
          onClick={handleSubmitCode}
          disabled={isSubmitting || !code.trim()}
          className="submit-btn"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Code'}
        </button>
      </div>

      <div className="battle-content">
        <div className="problem-panel">
          <div className="problem-description">
            <p>{state.currentBattle?.settings.problem?.description}</p>
            
            <div className="examples">
              <h4>Examples:</h4>
              {(state.currentBattle?.settings.problem?.examples || []).map((example, index) => (
                <div key={index} className="example">
                  <div>Input: {example.input}</div>
                  <div>Output: {example.output}</div>
                </div>
              ))}
            </div>
          </div>

          {state.submissionResult && (
            <TestResults 
              executionResult={state.submissionResult.executionResult as any}
              score={state.submissionResult.score as any}
            />
          )}
        </div>

        <div className="code-panel">
          <CodeEditor
            initialCode={code}
            onChange={handleCodeChange}
            onSubmit={handleSubmitCode}
            language="javascript"
          />
        </div>

        <div className="leaderboard-panel">
          <h3>Leaderboard</h3>
          <div className="leaderboard">
            {state.leaderboard.map((entry) => (
              <div key={entry.userId} className="leaderboard-entry">
                <span className="rank">#{entry.rank}</span>
                <span className="username">{entry.username}</span>
                <span className="score">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      {state.error && (
        <div className="empty" style={{ marginTop: 12 }}>Error: {state.error}</div>
      )}
    </ErrorBoundary>
  );
};


