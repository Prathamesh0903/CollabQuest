import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import './CollaborativeEditor.css';

interface EditorChange {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
}

interface CollaborativeEditorProps {
  roomId: string;
  language?: 'javascript' | 'python';
  initialCode?: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  roomId,
  language = 'javascript',
  initialCode = ''
}) => {
  const { currentUser } = useAuth();
  const [code, setCode] = useState(initialCode);
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const socketRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const [remoteCursors, setRemoteCursors] = useState<{ [userId: string]: any }>({});
  // Battle timer and state
  const [battleState, setBattleState] = useState<'waiting' | 'active' | 'ended'>('waiting');
  const [battleTime, setBattleTime] = useState<number>(0);
  const [battleResult, setBattleResult] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Initialize socket connection with authentication
    const initializeSocket = async () => {
      try {
        const token = await currentUser.getIdToken();
        socketRef.current = io('http://localhost:5000', {
          query: { roomId },
          auth: {
            token
          }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          setIsConnected(true);
          socket.emit('join-collab-room', { roomId });
          // Sync battle state on join
          socket.emit('get-battle-state', { roomId });
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socket.on('code-change', (change: EditorChange & { roomId?: string }) => {
          // Apply remote changes to editor
          if (editorRef.current) {
            const model = editorRef.current.getModel();
            const range = new (window as any).monaco.Range(
              change.range.startLineNumber,
              change.range.startColumn,
              change.range.endLineNumber,
              change.range.endColumn
            );
            model.applyEdits([{ range, text: change.text }]);
            // Update local code state
            setCode(model.getValue());
          }
        });

        socket.on('users-in-room', (users: string[]) => {
          setActiveUsers(users);
        });

        // Listen for remote cursor-move events
        socket.on('cursor-move', (data: { position: any, userId: string, color?: string, displayName?: string }) => {
          if (editorRef.current && data.userId !== socket.id) {
            // Add or update decoration for remote cursor
            setRemoteCursors((prev) => ({ ...prev, [data.userId]: data }));
          }
        });

        // Battle events
        socket.on('start-battle', (data: { roomId: string, duration: number }) => {
          setBattleState('active');
          setBattleTime(data.duration);
          setBattleResult(null);
        });
        socket.on('battle-tick', (data: { roomId: string, remaining: number }) => {
          setBattleTime(data.remaining);
        });
        socket.on('end-battle', (data: { roomId: string, result: string }) => {
          setBattleState('ended');
          setBattleTime(0);
          setBattleResult(data.result);
        });
        socket.on('battle-state', (data: { roomId: string, state: string, remaining: number }) => {
          setBattleState(data.state as 'waiting' | 'active' | 'ended');
          setBattleTime(data.remaining);
        });
      } catch (error) {
        console.error('Failed to initialize socket connection:', error);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, currentUser]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Set up change listener
    editor.onDidChangeModelContent((event: any) => {
      const changes = event.changes;
      changes.forEach((change: any) => {
        if (socketRef.current) {
          socketRef.current.emit('code-change', {
            range: {
              startLineNumber: change.range.startLineNumber,
              startColumn: change.range.startColumn,
              endLineNumber: change.range.endLineNumber,
              endColumn: change.range.endColumn,
            },
            text: change.text,
            roomId
          });
        }
      });
      // Update local code state
      setCode(editor.getValue());
    });

    // Set up cursor position listener
    editor.onDidChangeCursorPosition((event: any) => {
      if (socketRef.current) {
        const position = event.position;
        socketRef.current.emit('cursor-move', {
          position,
          roomId,
          userId: currentUser?.uid,
          color: '#'+((1<<24)*Math.abs(hashCode(currentUser?.uid||''))%0xffffff).toString(16).padStart(6,'0'),
          displayName: currentUser?.displayName || currentUser?.email || 'Anonymous'
        });
      }
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'vs-dark' ? 'vs-light' : 'vs-dark');
  };

  const getDefaultCode = () => {
    if (language === 'python') {
      return `# Welcome to Python Collaborative Editor
# Start coding with your team!

def hello_world():
    print("Hello, Collaborative World!")
    
# Add your Python code here
`;
    }
    return `// Welcome to JavaScript Collaborative Editor
// Start coding with your team!

function helloWorld() {
    console.log("Hello, Collaborative World!");
}

// Add your JavaScript code here
`;
  };

  // Helper to generate a color from userId
  function hashCode(str: string) {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }

  // Apply remote cursor decorations
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const decorations = Object.values(remoteCursors).map((cursor: any) => ({
      range: new (window as any).monaco.Range(cursor.position.lineNumber, cursor.position.column, cursor.position.lineNumber, cursor.position.column),
      options: {
        className: 'remote-cursor',
        afterContentClassName: 'remote-cursor-label',
        stickiness: 1,
        inlineClassName: '',
        beforeContentClassName: '',
        overviewRuler: {
          color: cursor.color || '#ff00ff',
          position: 2
        }
      }
    }));
    editor.deltaDecorations([], decorations);
  }, [remoteCursors]);

  // Add a Start Battle button for demonstration
  const handleStartBattle = () => {
    if (socketRef.current) {
      socketRef.current.emit('start-battle', { roomId, duration: 300 }); // 5 min
    }
  };

  // Timer display helper
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="collaborative-editor">
      <div className="editor-header">
        <div className="header-left">
          <h2>Collaborative {language.charAt(0).toUpperCase() + language.slice(1)} Editor</h2>
          <div className="room-info">
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            <span className="room-id">Room: {roomId}</span>
          </div>
          {/* Battle Timer and State */}
          <div className="battle-info">
            <span>Battle State: {battleState}</span>
            {battleState === 'active' && <span> | Time Left: {formatTime(battleTime)}</span>}
            {battleState === 'ended' && battleResult && <span> | Result: {battleResult}</span>}
            {battleState !== 'active' && (
              <button className="start-battle-btn" onClick={handleStartBattle}>
                Start Battle
              </button>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="active-users">
            <span>👥 {activeUsers.length} active users</span>
          </div>
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'vs-dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <UserProfile />
        </div>
      </div>
      
      <div className="editor-container">
        <Editor
          height="70vh"
          defaultLanguage={language}
          defaultValue={code || getDefaultCode()}
          theme={theme}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            contextmenu: true,
            mouseWheelZoom: true,
            quickSuggestions: true,
            renderWhitespace: 'selection',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            lineNumbers: 'on',
            glyphMargin: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'mouseover',
            disableLayerHinting: true,
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 17,
              horizontalScrollbarSize: 17,
              arrowSize: 30
            }
          }}
        />
      </div>
      
      <div className="editor-footer">
        <div className="language-info">
          <span>Language: {language.charAt(0).toUpperCase() + language.slice(1)}</span>
        </div>
        <div className="editor-stats">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor; 