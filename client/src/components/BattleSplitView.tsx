import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import Terminal, { TerminalOutput } from './Terminal';
import Chat from './Chat';
import './CollaborativeEditor.css'; // For Monaco/editor styles
import './BattleSplitView.css';

interface BattleSplitViewProps {
  problemMarkdown: string;
  initialCode: string;
  language: 'javascript' | 'python' | 'java';
  roomId: string;
  socket: any;
  testResults: TerminalOutput | null;
  leaderboard: Array<{ userId: string; displayName: string; score: number; rank: number }>;
  onRunCode: (code: string) => void;
  timerSeconds: number;
  battleOver?: boolean; // Add this prop to control when battle is over
}

const tabList = ['Test Results', 'Leaderboard', 'Chat'] as const;
type Tab = typeof tabList[number];

const BattleSplitView: React.FC<BattleSplitViewProps> = ({
  problemMarkdown,
  initialCode,
  language,
  roomId,
  socket,
  testResults,
  leaderboard,
  onRunCode,
  timerSeconds,
  battleOver = false // Default to false for now
}) => {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<Tab>('Test Results');
  const [customInput, setCustomInput] = useState('');
  const [outputLoading, setOutputLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false); // Don't show terminal by default

  // Timer logic
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timerRed = timerSeconds < 300; // <5 minutes

  // Show terminal only after user clicks Run Code
  const handleRunCode = () => {
    setShowTerminal(true);
    setOutputLoading(true); // Set loading to true when code execution starts
    onRunCode(code);
    // Assuming onRunCode will eventually trigger a state change that sets outputLoading to false
  };

  return (
    <div className="battle-split-view">
      {/* Left: Problem statement */}
      <aside className="battle-left-sidebar">
        <div className="problem-header">Problem</div>
        <div className="problem-markdown">
          <ReactMarkdown>{problemMarkdown}</ReactMarkdown>
        </div>
      </aside>

      {/* Center: Monaco editor */}
      <main className="battle-center-editor">
        <div className="editor-header">
          <span>Editor ({language})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className={`battle-timer${timerRed ? ' timer-red' : ''}`} style={{ position: 'static', marginRight: 8 }}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <button className="run-btn" onClick={handleRunCode} disabled={outputLoading}>
              {outputLoading ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>
        <Editor
          height="calc(100vh - 80px)"
          defaultLanguage={language}
          value={code}
          onChange={v => setCode(v || '')}
          theme="vs-dark"
          options={{ fontSize: 16, minimap: { enabled: false } }}
        />
        {/* Timer moved to editor header */}
      </main>

      {/* Right: Console/Leaderboard/Chat tabs */}
      <aside className="battle-right-sidebar">
        {/* Only show tabs and their content if battle is over */}
        {battleOver ? (
          <>
            <div className="tabs-header">
              {tabList.map(tab => (
                <button
                  key={tab}
                  className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="tab-content">
              {activeTab === 'Test Results' && (
                <>
                  {showTerminal ? (
                    <Terminal
                      isVisible={true}
                      onClose={() => setShowTerminal(false)}
                      output={testResults}
                      isLoading={outputLoading}
                      customInput={customInput}
                      onCustomInputChange={setCustomInput}
                      onClear={() => {}}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                      <button className="run-btn" onClick={() => setShowTerminal(true)}>
                        Open Terminal
                      </button>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'Leaderboard' && (
                <div className="leaderboard-tab">
                  <h3>Leaderboard</h3>
                  <ol>
                    {leaderboard.map(entry => (
                      <li key={entry.userId} className="leaderboard-entry">
                        <span className="rank">#{entry.rank}</span>
                        <span className="name">{entry.displayName}</span>
                        <span className="score">{entry.score} pts</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {activeTab === 'Chat' && (
                <Chat roomId={roomId} socket={socket} isVisible={true} onToggle={() => {}} />
              )}
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
};

export default BattleSplitView; 