import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import './SpectatorView.css';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  ready: boolean;
  joinedAt?: string;
  lastSeen?: string;
  elapsedSeconds?: number;
}

interface UserCursor {
  userId: string;
  displayName: string;
  avatar?: string;
  position: {
    lineNumber: number;
    column: number;
  };
  color: string;
}

interface UserSelection {
  userId: string;
  displayName: string;
  avatar?: string;
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  color: string;
}

interface TestResult {
  userId: string;
  displayName: string;
  passed: number;
  total: number;
  score: number;
  timeMs: number;
  lastUpdated: Date;
}

interface SpectatorViewProps {
  roomId: string;
  participants: Participant[];
  battleInfo?: {
    started: boolean;
    ended: boolean;
    durationMinutes?: number;
    problemId?: string;
    difficulty?: string;
    startedAt?: string;
    endedAt?: string;
  };
}

const SpectatorView: React.FC<SpectatorViewProps> = ({
  roomId,
  participants,
  battleInfo
}) => {
  const { currentUser } = useAuth();
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [participantCode, setParticipantCode] = useState<Record<string, string>>({});
  const [participantCursors, setParticipantCursors] = useState<Record<string, UserCursor>>({});
  const [participantSelections, setParticipantSelections] = useState<Record<string, UserSelection>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const editorRefs = useRef<Record<string, any>>({});

  // Socket connection for spectator mode
  const { socket, userCursors, userSelections } = useSocket({
    roomId,
    mode: 'battle',
    onCodeChange: (data: any) => {
      console.log('Code change received:', data);
      if (data.userId && data.code !== undefined) {
        setParticipantCode(prev => ({
          ...prev,
          [data.userId]: data.code
        }));
      }
    },
    onCursorMove: (cursor: UserCursor) => {
      console.log('Cursor move received:', cursor);
      setParticipantCursors(prev => ({
        ...prev,
        [cursor.userId]: cursor
      }));
    },
    onSelectionChange: (selection: UserSelection) => {
      console.log('Selection change received:', selection);
      setParticipantSelections(prev => ({
        ...prev,
        [selection.userId]: selection
      }));
    },
    onParticipantActivity: (data: any) => {
      console.log('Participant activity received:', data);
      if (data.activity === 'test-run' && data.details) {
        setTestResults(prev => ({
          ...prev,
          [data.userId]: {
            userId: data.userId,
            displayName: data.displayName,
            passed: data.details.passed || 0,
            total: data.details.total || 0,
            score: data.details.score || 0,
            timeMs: data.details.timeMs || 0,
            lastUpdated: new Date()
          }
        }));
      }
    },
    onParticipantUpdate: (data: any) => {
      console.log('Participant update received:', data);
      if (data.score !== undefined) {
        setTestResults(prev => ({
          ...prev,
          [data.userId]: {
            ...prev[data.userId],
            userId: data.userId,
            displayName: data.displayName || prev[data.userId]?.displayName || 'Anonymous',
            score: data.score,
            passed: data.passed || 0,
            total: data.total || 0,
            lastUpdated: new Date()
          }
        }));
      }
    }
  });

  // Join as spectator
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join-room', { roomId, mode: 'battle', role: 'spectator' });
      setIsConnected(true);
    }
  }, [socket, roomId]);

  // Request initial code from all participants
  useEffect(() => {
    if (socket && participants.length > 0) {
      participants.forEach(participant => {
        socket.emit('request-code-sync', { roomId, targetUserId: participant.id });
      });
    }
  }, [socket, roomId, participants]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any, participantId: string) => {
    editorRefs.current[participantId] = editor;
    
    // Configure editor for spectator mode
    editor.updateOptions({
      readOnly: true,
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3
    });

    // Add cursor decorations for this participant
    const cursor = participantCursors[participantId];
    if (cursor) {
      editor.deltaDecorations([], [
        {
          range: {
            startLineNumber: cursor.position.lineNumber,
            startColumn: cursor.position.column,
            endLineNumber: cursor.position.lineNumber,
            endColumn: cursor.position.column
          },
          options: {
            className: 'spectator-cursor',
            stickiness: 1,
            after: {
              content: ` ${cursor.displayName}`,
              inlineClassName: 'spectator-cursor-label',
              inlineClassNameAffectsLetterSpacing: true
            }
          }
        }
      ]);
    }

    // Add selection decorations for this participant
    const selection = participantSelections[participantId];
    if (selection) {
      editor.deltaDecorations([], [
        {
          range: selection.selection,
          options: {
            className: 'spectator-selection',
            stickiness: 1
          }
        }
      ]);
    }
  }, [participantCursors, participantSelections]);

  // Update decorations when cursors or selections change
  useEffect(() => {
    Object.entries(editorRefs.current).forEach(([participantId, editor]) => {
      if (!editor) return;

      const decorations: any[] = [];
      
      // Add cursor decoration
      const cursor = participantCursors[participantId];
      if (cursor) {
        decorations.push({
          range: {
            startLineNumber: cursor.position.lineNumber,
            startColumn: cursor.position.column,
            endLineNumber: cursor.position.lineNumber,
            endColumn: cursor.position.column
          },
          options: {
            className: 'spectator-cursor',
            stickiness: 1,
            after: {
              content: ` ${cursor.displayName}`,
              inlineClassName: 'spectator-cursor-label',
              inlineClassNameAffectsLetterSpacing: true
            }
          }
        });
      }

      // Add selection decoration
      const selection = participantSelections[participantId];
      if (selection) {
        decorations.push({
          range: selection.selection,
          options: {
            className: 'spectator-selection',
            stickiness: 1
          }
        });
      }

      editor.deltaDecorations([], decorations);
    });
  }, [participantCursors, participantSelections]);

  // Grid layout calculation
  const getGridLayout = () => {
    const count = participants.length;
    if (count <= 2) return { cols: count, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    return { cols: 3, rows: Math.ceil(count / 3) };
  };

  const { cols, rows } = getGridLayout();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTestResultColor = (passed: number, total: number) => {
    if (total === 0) return '#666';
    const ratio = passed / total;
    if (ratio === 1) return '#4caf50';
    if (ratio >= 0.5) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="spectator-view-root">
      <div className="spectator-header">
        <div className="spectator-title">
          <span className="spectator-icon">👁️</span>
          Spectator Mode
          {!isConnected && <span className="connection-status disconnected">Disconnected</span>}
          {isConnected && <span className="connection-status connected">Connected</span>}
        </div>
        <div className="spectator-controls">
          <div className="participant-selector">
            <label>Focus on:</label>
            <select 
              value={selectedParticipant || ''} 
              onChange={(e) => setSelectedParticipant(e.target.value || null)}
            >
              <option value="">All Participants</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {battleInfo && (
            <div className="battle-status">
              {battleInfo.started && !battleInfo.ended && (
                <span className="status-indicator active">⚔️ Battle Active</span>
              )}
              {battleInfo.ended && (
                <span className="status-indicator ended">🏁 Battle Ended</span>
              )}
              {!battleInfo.started && (
                <span className="status-indicator waiting">⏳ Waiting to Start</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div 
        className="spectator-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {participants.map((participant) => {
          const isFocused = selectedParticipant === null || selectedParticipant === participant.id;
          const testResult = testResults[participant.id];
          const isTyping = typingUsers.has(participant.id);
          
          return (
            <div 
              key={participant.id} 
              className={`spectator-participant-card ${!isFocused ? 'dimmed' : ''}`}
            >
              <div className="participant-header">
                <div className="participant-info">
                  <div className="participant-avatar">
                    {participant.avatar ? (
                      <img src={participant.avatar} alt={participant.name} />
                    ) : (
                      <span className="avatar-placeholder">{participant.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="participant-details">
                    <div className="participant-name">
                      {participant.name}
                      {participant.role === 'host' && <span className="host-badge">👑</span>}
                    </div>
                    <div className="participant-status">
                      {isTyping && <span className="typing-indicator">✏️ Typing</span>}
                      {participant.ready && <span className="ready-indicator">✅ Ready</span>}
                    </div>
                  </div>
                </div>
                
                {testResult && (
                  <div className="test-results">
                    <div 
                      className="test-score"
                      style={{ color: getTestResultColor(testResult.passed, testResult.total) }}
                    >
                      {testResult.passed}/{testResult.total}
                    </div>
                    <div className="test-details">
                      <span>Score: {testResult.score}</span>
                      <span>Time: {testResult.timeMs}ms</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="editor-container">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={participantCode[participant.id] || '// Waiting for code...'}
                  onMount={(editor) => handleEditorDidMount(editor, participant.id)}
                  options={{
                    readOnly: true,
                    fontSize: 12,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 2,
                    renderWhitespace: 'selection',
                    cursorBlinking: 'solid',
                    cursorStyle: 'line'
                  }}
                  theme="vs-dark"
                />
              </div>

              <div className="participant-footer">
                <div className="activity-indicators">
                  {participantCursors[participant.id] && (
                    <span className="cursor-indicator">📍 Active</span>
                  )}
                  {participantSelections[participant.id] && (
                    <span className="selection-indicator">🎯 Selecting</span>
                  )}
                </div>
                <div className="join-time">
                  {participant.elapsedSeconds && (
                    <span>Joined {formatTime(participant.elapsedSeconds)} ago</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="spectator-footer">
        <div className="footer-stats">
          <span>Participants: {participants.length}</span>
          <span>Active: {participants.filter(p => p.isActive).length}</span>
          <span>Ready: {participants.filter(p => p.ready).length}</span>
        </div>
        <div className="footer-info">
          <span>👁️ Spectator Mode - View Only Access</span>
        </div>
      </div>
    </div>
  );
};

export default SpectatorView; 