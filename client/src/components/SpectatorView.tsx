import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import './SpectatorView.css';

interface Participant {
  userId: string;
  displayName: string;
  avatar?: string;
  language: 'javascript' | 'python' | 'java';
}

interface TestStats {
  total: number;
  passed: number;
  failed: number;
}

interface SpectatorViewProps {
  participants: Participant[];
  codeSnapshots: Record<string, string>;
  typingUsers: string[];
  testStats: TestStats;
}

const DELAY_MS = 30000; // 30 seconds

const SpectatorView: React.FC<SpectatorViewProps> = ({
  participants,
  codeSnapshots,
  typingUsers,
  testStats
}) => {
  // Delayed code state
  const [delayedCode, setDelayedCode] = useState<Record<string, string>>({});
  const codeQueue = useRef<Record<string, string>>({});

  // On codeSnapshots change, queue update after delay
  useEffect(() => {
    Object.entries(codeSnapshots).forEach(([userId, code]) => {
      if (codeQueue.current[userId] !== code) {
        codeQueue.current[userId] = code;
        setTimeout(() => {
          setDelayedCode(prev => ({ ...prev, [userId]: codeQueue.current[userId] }));
        }, DELAY_MS);
      }
    });
  }, [codeSnapshots]);

  return (
    <div className="spectator-view-root">
      <div className="spectator-header">
        <div className="spectator-title">Spectator Mode</div>
        <div className="spectator-test-stats">
          <span className="stat-pass">✔ {testStats.passed}</span>
          <span className="stat-fail">✖ {testStats.failed}</span>
          <span className="stat-total">/ {testStats.total} Test Cases</span>
        </div>
      </div>
      <div className="spectator-split-row">
        {participants.map((p) => (
          <div key={p.userId} className="spectator-participant-col">
            <div className={`spectator-user-header${typingUsers.includes(p.userId) ? ' typing' : ''}`}>
              <img src={p.avatar} alt={p.displayName} className="spectator-avatar" />
              <span className="spectator-username">{p.displayName}</span>
              {typingUsers.includes(p.userId) && <span className="typing-indicator">✏️ Typing</span>}
            </div>
            <Editor
              height="60vh"
              defaultLanguage={p.language}
              value={delayedCode[p.userId] || ''}
              options={{ readOnly: true, fontSize: 15, minimap: { enabled: false } }}
              theme="vs-dark"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpectatorView; 