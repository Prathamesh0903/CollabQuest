import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import ToastContainer, { useToast } from './ToastContainer';
import Terminal, { TerminalOutput } from './Terminal';
import UserSidebar, { UserInfo as SidebarUserInfo } from './UserSidebar';
import Chat from './Chat';
import LanguageSwitcher from './LanguageSwitcher';
import './CollaborativeEditor.css';
import Confetti from 'react-confetti';
import Countdown from 'react-countdown';

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

// Enhanced user info type
interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  socketId: string;
  online: boolean;
}

// Chat message type
interface ChatMessage {
  userId: string;
  displayName: string;
  avatar?: string;
  message: string;
  timestamp: string;
}

// Cursor info type
interface CursorInfo {
  position: any;
  userId: string;
  color: string;
  displayName: string;
  timestamp: Date;
}

// Room state type
interface RoomState {
  code: string;
  language: string;
  version: number;
  lastModified: Date;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  roomId,
  language: initialLanguage = 'javascript',
  initialCode = ''
}) => {
  const { currentUser } = useAuth();
  const [language, setLanguage] = useState<'javascript' | 'python'>(initialLanguage);
  const [code, setCode] = useState(initialCode);
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [activeUsers, setActiveUsers] = useState<UserInfo[]>([]);
  const [sidebarUsers, setSidebarUsers] = useState<SidebarUserInfo[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const socketRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  const [remoteCursors, setRemoteCursors] = useState<{ [userId: string]: CursorInfo }>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput | null>(null);
  const [outputLoading, setOutputLoading] = useState<boolean>(false);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');

  // Gamification state (mocked)
  const [showConfetti] = useState(false);

  // Timer state for demo
  const [timerKey, setTimerKey] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  // Handler to start a 10-second timer
  const startTimer = () => {
    setTimerKey(prev => prev + 1); // Reset timer
    setShowTimer(true);
  };

  // Helper function to show user activity
  const showUserActivity = (userName: string, action: string) => {
    showInfo('User Activity', `${userName} ${action}`, 3000);
  };

  // Initialize socket connection with reconnection logic
  const initializeSocket = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      
      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io('http://localhost:5000', {
        query: { roomId },
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        showSuccess('Connection', 'Connected to collaboration server', 3000);
        
        // Join the collaboration room
        socketRef.current.emit('join-collab-room', {
          roomId,
          userInfo: {
            userId: currentUser.uid,
            displayName: currentUser.displayName || 'Anonymous',
            avatar: currentUser.photoURL
          }
        });
      });

      socketRef.current.on('disconnect', (reason: string) => {
        console.log('Disconnected from server:', reason);
        setConnectionStatus('disconnected');
        showError('Connection', 'Disconnected from server', 5000);
      });

      socketRef.current.on('reconnect_attempt', (attemptNumber: number) => {
        console.log(`Reconnection attempt ${attemptNumber}`);
        setConnectionStatus('reconnecting');
        showInfo('Connection', `Reconnecting... (${attemptNumber}/${maxReconnectAttempts})`, 3000);
      });

      socketRef.current.on('reconnect_failed', () => {
        console.log('Reconnection failed');
        setConnectionStatus('disconnected');
        showError('Connection', 'Failed to reconnect to server', 5000);
      });

      // Room-specific event handlers
      socketRef.current.on('room-joined', (data: { users: UserInfo[], roomState: RoomState }) => {
        console.log('Joined room successfully:', data);
        setActiveUsers(data.users);
        setSidebarUsers(data.users.map(user => ({
          ...user,
          status: user.online ? 'online' : 'offline',
          lastSeen: new Date()
        })));
        
        if (data.roomState && data.roomState.code) {
          setCode(data.roomState.code);
          setLanguage(data.roomState.language as 'javascript' | 'python');
        }
        
        showSuccess('Room', `Joined room ${roomId}`, 3000);
      });

      socketRef.current.on('user-joined', (user: UserInfo) => {
        console.log('User joined:', user);
        setActiveUsers(prev => [...prev.filter(u => u.userId !== user.userId), user]);
        setSidebarUsers(prev => [...prev.filter(u => u.userId !== user.userId), {
          ...user,
          status: 'online',
          lastSeen: new Date()
        }]);
        showUserActivity(user.displayName, 'joined the room');
      });

      socketRef.current.on('user-left', (userId: string) => {
        console.log('User left:', userId);
        const leftUser = activeUsers.find(u => u.userId === userId);
        setActiveUsers(prev => prev.filter(u => u.userId !== userId));
        setSidebarUsers(prev => prev.filter(u => u.userId !== userId));
        if (leftUser) {
          showUserActivity(leftUser.displayName, 'left the room');
        }
      });

      // Code collaboration handlers
      socketRef.current.on('code-change', (data: { code: string, change: EditorChange, userId: string }) => {
        if (data.userId !== currentUser.uid && editorRef.current) {
          setCode(data.code);
          // Apply the change to the editor
          const model = editorRef.current.getModel();
          if (model) {
            model.setValue(data.code);
          }
        }
      });

      socketRef.current.on('cursor-position', (data: CursorInfo) => {
        if (data.userId !== currentUser.uid) {
          setRemoteCursors(prev => ({
            ...prev,
            [data.userId]: data
          }));
        }
      });

      // Chat handlers
      socketRef.current.on('chat-message', (message: ChatMessage) => {
        setChatMessages(prev => [...prev, message]);
        if (message.userId !== currentUser.uid) {
          showInfo('Chat', `${message.displayName}: ${message.message}`, 3000);
        }
      });

      // Code execution handlers
      socketRef.current.on('code-output', (output: TerminalOutput) => {
        setTerminalOutput(output);
        setOutputLoading(false);
        setShowTerminal(true);
      });

      socketRef.current.on('code-error', (error: string) => {
        setTerminalOutput({
          stderr: error,
          error: error
        });
        setOutputLoading(false);
        setShowTerminal(true);
        showError('Execution', 'Code execution failed', 5000);
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
      setConnectionStatus('disconnected');
      showError('Connection', 'Failed to initialize connection', 5000);
    }
  }, [currentUser, roomId, activeUsers, showSuccess, showError, showInfo]);

  // Initialize socket on component mount
  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initializeSocket]);

  // Handle editor mounting
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Set up change listener
    editor.onDidChangeModelContent((e: any) => {
      const newCode = editor.getValue();
      setCode(newCode);
      
      // Emit code changes to other users
      if (socketRef.current && connectionStatus === 'connected') {
        const changes = e.changes.map((change: any) => ({
          range: change.range,
          text: change.text
        }));
        
        socketRef.current.emit('code-change', {
          roomId,
          code: newCode,
          changes,
          userId: currentUser?.uid
        });
      }
    });

    // Set up cursor position listener
    editor.onDidChangeCursorPosition((e: any) => {
      if (socketRef.current && connectionStatus === 'connected') {
        const cursorInfo: CursorInfo = {
          position: e.position,
          userId: currentUser?.uid || '',
          color: generateUserColor(currentUser?.uid || ''),
          displayName: currentUser?.displayName || 'Anonymous',
          timestamp: new Date()
        };
        
        socketRef.current.emit('cursor-position', {
          roomId,
          ...cursorInfo
        });
      }
    });

    // Add keyboard shortcuts
    const monaco = (window as any).monaco;
    if (monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        handleRunCode();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Save functionality (could emit to server)
        showSuccess('Save', 'Code saved successfully', 2000);
      });
    }
  };

  // Generate user color based on user ID
  const generateUserColor = (userId: string): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Handle code execution
  const handleRunCode = useCallback(async () => {
    if (!code.trim()) {
      showError('Execution', 'No code to execute', 3000);
      return;
    }

    setOutputLoading(true);
    setShowTerminal(true);
    
    if (socketRef.current && connectionStatus === 'connected') {
      socketRef.current.emit('execute-code', {
        roomId,
        code,
        language,
        input: customInput,
        userId: currentUser?.uid
      });
    } else {
      // Fallback for offline execution
      try {
        const response = await fetch('http://localhost:5000/api/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            language,
            input: customInput
          })
        });
        
        const result = await response.json();
        setTerminalOutput(result);
        setOutputLoading(false);
      } catch (error) {
        console.error('Code execution error:', error);
        setTerminalOutput({
          stderr: 'Error: Could not execute code. Please check your connection.',
          error: 'Connection error'
        });
        setOutputLoading(false);
        showError('Execution', 'Failed to execute code', 5000);
      }
    }
  }, [code, language, customInput, connectionStatus, currentUser, roomId, showError]);

  // Handle terminal clear
  const handleClearTerminal = () => {
    setTerminalOutput(null);
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: 'javascript' | 'python') => {
    setLanguage(newLanguage);
    
    // Update code template
    const defaultCode = getDefaultCode(newLanguage);
    if (!code.trim() || code === getDefaultCode(language)) {
      setCode(defaultCode);
      if (editorRef.current) {
        editorRef.current.setValue(defaultCode);
      }
    }
    
    // Emit language change to other users
    if (socketRef.current && connectionStatus === 'connected') {
      socketRef.current.emit('language-change', {
        roomId,
        language: newLanguage,
        userId: currentUser?.uid
      });
    }
    
    showSuccess('Language', `Switched to ${newLanguage}`, 2000);
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'vs-dark' ? 'vs-light' : 'vs-dark');
  };

  // Get default code for language
  const getDefaultCode = (lang: 'javascript' | 'python' = language) => {
    const templates = {
      javascript: `// Welcome to the Collaborative JavaScript Editor!
// Start coding together in real-time

console.log("Hello, World!");

// Example function
function greet(name) {
    return \`Hello, \${name}! Welcome to collaborative coding.\`;
}

console.log(greet("Developer"));`,
      python: `# Welcome to the Collaborative Python Editor!
# Start coding together in real-time

print("Hello, World!")

# Example function
def greet(name):
    return f"Hello, {name}! Welcome to collaborative coding."

print(greet("Developer"))`
    };
    
    return templates[lang];
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to run code
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleRunCode();
      }
      
      // Ctrl+S or Cmd+S to save (prevent default browser save)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        showSuccess('Save', 'Code saved successfully', 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunCode, showSuccess]);

  // Keyboard shortcut hints component
  const ShortcutHints = () => (
    <div className="shortcut-hints" style={{ fontSize: '11px', color: 'var(--fleet-text-tertiary)' }}>
      <span>Ctrl+Enter: Run</span> • <span>Ctrl+S: Save</span>
    </div>
  );

  return (
    <div className={`collaborative-editor fleet-canvas ${theme === 'vs-dark' ? 'dark-theme' : 'light-theme'}`} data-theme={theme === 'vs-dark' ? 'dark' : 'light'}>
      {showConfetti && <Confetti numberOfPieces={250} recycle={false} />}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Fleet Header Island */}
      <header className="fleet-header fleet-animate-in">
        <div className="header-left">
          <div className={`fleet-status ${connectionStatus}`}>
            <div className="fleet-status-dot"></div>
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
          </div>
          <span className="fleet-text-secondary">Room: {roomId}</span>
        </div>
        
        <div className="header-center">
          <h1 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
            {language.charAt(0).toUpperCase() + language.slice(1)} Collaborative Editor
          </h1>
        </div>
        
        <div className="header-right">
          <button 
            className="fleet-btn" 
            onClick={() => {
              // Notify server we're leaving the room
              if (socketRef.current && connectionStatus === 'connected') {
                socketRef.current.emit('leave-collab-room', { roomId });
              }
              // Navigate back to dashboard
              window.location.href = '/';
            }} 
            title="Back to Dashboard"
          >
            ← Back
          </button>
          <button className="fleet-btn primary" onClick={handleRunCode} disabled={outputLoading} title="Run Code (Ctrl+Enter)">
            {outputLoading ? 'Running...' : '▶ Run'}
          </button>
          <button className="fleet-btn" onClick={() => setShowChatPanel((v) => !v)} title="Toggle Chat">
            💬 Chat
          </button>
          <button className="fleet-btn" onClick={toggleTheme}>
            {theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>
          <div className="fleet-user-avatar">
            {currentUser?.displayName?.charAt(0) || 'U'}
          </div>
          <button className="fleet-btn" onClick={() => setShowSidebar(!showSidebar)} title="Toggle Sidebar">
            👥 {activeUsers.length}
          </button>
        </div>
      </header>

      {/* Fleet Main Content Area */}
      <div className="fleet-main">
        {/* Fleet Sidebar Island */}
        {showSidebar && (
          <aside className="fleet-sidebar fleet-animate-in">
            <div className="fleet-sidebar-header">
              👥 Active Users ({activeUsers.length})
            </div>
            <div className="fleet-sidebar-content">
              <UserSidebar
                users={sidebarUsers}
                currentUserId={currentUser?.uid || ''}
                roomId={roomId}
                isVisible={showSidebar}
                onToggle={() => setShowSidebar(!showSidebar)}
                onUserClick={(user) => {
                  console.log('User clicked:', user);
                }}
              />
            </div>
          </aside>
        )}

        {/* Fleet Editor Island */}
        <main className="fleet-editor-island fleet-scale-animate">
          <div className="fleet-editor-header">
            <div className="fleet-editor-tabs">
              <button className="fleet-tab active">
                {language === 'javascript' ? '📄 main.js' : '🐍 main.py'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--fleet-spacing-sm)' }}>
              <LanguageSwitcher
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
                disabled={connectionStatus !== 'connected'}
              />
            </div>
          </div>
          
          <div className="fleet-editor-content">
            <Editor
              height="100%"
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
        </main>
      </div>

      {/* Fleet Footer Island */}
      <footer className="fleet-footer">
        <div className="fleet-footer-left">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="fleet-footer-right">
          <ShortcutHints />
        </div>
      </footer>

      {/* Fleet Terminal Island (when visible) */}
      {showTerminal && (
        <div className="fleet-terminal fleet-animate-in">
          <div className="fleet-terminal-header">
            <span>Terminal Output</span>
            <button className="fleet-btn" onClick={() => setShowTerminal(false)}>
              ✕
            </button>
          </div>
          <div className="fleet-terminal-content">
            <Terminal
              isVisible={showTerminal}
              onClose={() => setShowTerminal(false)}
              output={terminalOutput}
              isLoading={outputLoading}
              customInput={customInput}
              onCustomInputChange={setCustomInput}
              onClear={handleClearTerminal}
            />
          </div>
        </div>
      )}

      {/* Fleet Chat Panel (floating) */}
      {showChatPanel && (
        <div className="fleet-chat fleet-scale-animate">
          <div className="fleet-chat-header">
            <span>💬 Team Chat</span>
            <button className="fleet-btn" onClick={() => setShowChatPanel(false)}>
              ✕
            </button>
          </div>
          <div className="fleet-chat-content">
            <Chat
              roomId={roomId}
              socket={socketRef.current}
              isVisible={showChatPanel}
              onToggle={() => setShowChatPanel(!showChatPanel)}
            />
          </div>
        </div>
      )}

      {/* Timer Demo (temporary) */}
      {showTimer && (
        <div style={{ position: 'fixed', top: '100px', right: '20px', zIndex: 1001 }}>
          <Countdown
            key={timerKey}
            date={Date.now() + 10000}
            onComplete={() => setShowTimer(false)}
          />
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;
