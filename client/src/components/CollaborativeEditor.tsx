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

// GamifiedHeader props type
interface GamifiedHeaderProps {
  onDiscuss: () => void;
  unreadCount: number;
  onThemeToggle: () => void;
  theme: string;
  onProfile: () => void;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  activeUsers: UserInfo[];
}

// GamifiedHeader component
const GamifiedHeader: React.FC<GamifiedHeaderProps> = ({ 
  onDiscuss, 
  unreadCount, 
  onThemeToggle, 
  theme, 
  onProfile, 
  connectionStatus,
  activeUsers 
}) => (
  <header className="gamified-header">
    <div className="header-left">
      <div className="connection-status">
        <span className={`status-indicator ${connectionStatus}`}>
          {connectionStatus === 'connected' ? '🟢' : 
           connectionStatus === 'reconnecting' ? '🟡' : '🔴'}
        </span>
        <span className="status-text">
          {connectionStatus === 'connected' ? 'Connected' : 
           connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
        </span>
      </div>
      <div className="active-users-count">
        👥 {activeUsers.length} online
      </div>
    </div>
    <div className="header-right">
      <button className="discuss-btn" onClick={onDiscuss} title="Discuss with your team">
        💬 Discuss
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      <button className="theme-toggle" onClick={onThemeToggle}>
        {theme === 'vs-dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
      <button className="profile-btn" onClick={onProfile} title="Profile">
        <UserProfile />
      </button>
    </div>
  </header>
);

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
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput | null>(null);
  const [outputLoading, setOutputLoading] = useState<boolean>(false);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');

  // Gamification state (mocked)
  const [showConfetti, setShowConfetti] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Timer state for demo
  const [timerKey, setTimerKey] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  // Handler to start a 10-second timer
  const startTimer = () => {
    setTimerKey(prev => prev + 1); // Reset timer
    setShowTimer(true);
  };

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

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
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Connected to server');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        showSuccess('Connected', 'Successfully connected to the server');
        
        // Join the collaborative room
        socket.emit('join-collab-room', { roomId, language });
      });

      socket.on('disconnect', (reason: string) => {
        console.log('Disconnected from server:', reason);
        setConnectionStatus('disconnected');
        
        // Handle reconnection for unexpected disconnections
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectAttemptsRef.current++;
              socket.connect();
            }
          }, 2000);
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Connection error:', error);
        setConnectionStatus('disconnected');
      });

      socket.on('reconnect', (attemptNumber: number) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        showSuccess('Reconnected', `Successfully reconnected after ${attemptNumber} attempts`);
        
        // Rejoin the room after reconnection
        socket.emit('reconnect-request', { roomId });
      });

      socket.on('reconnect_failed', () => {
        console.log('Failed to reconnect after', maxReconnectAttempts, 'attempts');
        setConnectionStatus('disconnected');
      });

      // Room state synchronization
      socket.on('room-state-sync', (state: RoomState) => {
        console.log('Received room state sync:', state);
        setCode(state.code);
        
        // Update editor if mounted
        if (editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            const currentValue = model.getValue();
            if (currentValue !== state.code) {
              model.setValue(state.code);
            }
          }
        }
      });

      // Code change events
      socket.on('code-change', (change: EditorChange & { userId: string; displayName: string; version: number; timestamp: Date }) => {
        console.log('Received code change:', change);
        
        if (editorRef.current && change.userId !== currentUser?.uid) {
          const model = editorRef.current.getModel();
          if (model) {
            const range = new (window as any).monaco.Range(
              change.range.startLineNumber,
              change.range.startColumn,
              change.range.endLineNumber,
              change.range.endColumn
            );
            
            // Apply the change
            model.applyEdits([{ range, text: change.text }]);
            setCode(model.getValue());
            
            // Show who made the change
            showUserActivity(change.displayName, 'edited code');
          }
        }
      });

      // Full code sync events
      socket.on('code-sync', (syncData: { code: string; version: number; userId: string; displayName: string; timestamp: Date }) => {
        console.log('Received code sync:', syncData);
        
        if (editorRef.current && syncData.userId !== currentUser?.uid) {
          const model = editorRef.current.getModel();
          if (model) {
            model.setValue(syncData.code);
            setCode(syncData.code);
            showUserActivity(syncData.displayName, 'synced code');
          }
        }
      });

      // Version mismatch handling
      socket.on('version-mismatch', (data: { currentVersion: number; currentCode: string }) => {
        console.log('Version mismatch detected, syncing...');
        if (editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            model.setValue(data.currentCode);
            setCode(data.currentCode);
          }
        }
      });

      // Language change events
      socket.on('language-change', (data: { language: 'javascript' | 'python'; code: string; userId: string; displayName: string }) => {
        console.log('Received language change:', data);
        
        if (data.userId !== currentUser?.uid) {
          setLanguage(data.language);
          
          if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
              // Change the model's language
              (window as any).monaco.editor.setModelLanguage(model, data.language);
              model.setValue(data.code);
              setCode(data.code);
            }
          }
          
          showUserActivity(data.displayName, `switched to ${data.language}`);
        }
      });

      // Users in room updates
      socket.on('users-in-room', (users: UserInfo[]) => {
        console.log('Users in room updated:', users);
        setActiveUsers(users);
        
        // Update sidebar users with additional properties
        const sidebarUsersData: SidebarUserInfo[] = users.map(user => ({
          ...user,
          isTyping: false,
          isEditing: false,
          color: generateUserColor(user.userId)
        }));
        setSidebarUsers(sidebarUsersData);
      });

      // Cursor synchronization
      socket.on('cursors-sync', (cursors: CursorInfo[]) => {
        console.log('Received cursors sync:', cursors);
        const cursorsMap: { [userId: string]: CursorInfo } = {};
        cursors.forEach(cursor => {
          if (cursor.userId !== currentUser?.uid) {
            cursorsMap[cursor.userId] = cursor;
          }
        });
        setRemoteCursors(cursorsMap);
      });

      socket.on('cursor-move', (cursorData: CursorInfo) => {
        if (cursorData.userId !== currentUser?.uid) {
          setRemoteCursors(prev => ({
            ...prev,
            [cursorData.userId]: cursorData
          }));
        }
      });

      // User left room
      socket.on('user-left-collab-room', (userData: { userId: string; displayName: string }) => {
        console.log('User left room:', userData);
        setActiveUsers(prev => prev.filter(user => user.userId !== userData.userId));
        setRemoteCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[userData.userId];
          return newCursors;
        });
        showUserActivity(userData.displayName, 'left the room');
      });

      // Chat events
      socket.on('new-message', (msg: ChatMessage) => {
        setChatMessages(prev => [...prev, msg]);
      });

      // Typing indicators
      socket.on('user-typing', (data: { userId: string; displayName: string; isTyping: boolean }) => {
        setSidebarUsers(prev => prev.map(user => 
          user.userId === data.userId 
            ? { ...user, isTyping: data.isTyping }
            : user
        ));
      });

      // Editing indicators
      socket.on('user-editing', (data: { userId: string; displayName: string; isEditing: boolean }) => {
        setSidebarUsers(prev => prev.map(user => 
          user.userId === data.userId 
            ? { ...user, isEditing: data.isEditing }
            : user
        ));
      });

      // User status updates
      socket.on('user-status-updated', (data: { userId: string; displayName: string; status: string; customMessage?: string }) => {
        setSidebarUsers(prev => prev.map(user => 
          user.userId === data.userId 
            ? { ...user, status: data.status as any, customMessage: data.customMessage }
            : user
        ));
      });

      // Error handling
      socket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error);
        showError('Connection Error', error.message);
      });

    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [currentUser, roomId, language, showSuccess, showError, showInfo, showUserActivity]);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);



  // Unread chat notification logic
  useEffect(() => {
    if (!showChat && chatMessages.length > 0) {
      setUnreadCount((c) => c + 1);
    }
    if (showChat) {
      setUnreadCount(0);
    }
  }, [chatMessages, showChat]);

  // Helper function to show notifications


  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Set up change listener with debouncing
    let changeTimeout: NodeJS.Timeout;
    let editingTimeout: NodeJS.Timeout;
    
    editor.onDidChangeModelContent((event: any) => {
      clearTimeout(changeTimeout);
      clearTimeout(editingTimeout);
      
      // Set editing indicator
      if (socketRef.current && connectionStatus === 'connected') {
        socketRef.current.emit('editing-start', { roomId });
      }
      
      changeTimeout = setTimeout(() => {
        const changes = event.changes;
        const currentCode = editor.getValue();
        
        changes.forEach((change: any) => {
          if (socketRef.current && connectionStatus === 'connected') {
            socketRef.current.emit('code-change', {
              range: {
                startLineNumber: change.range.startLineNumber,
                startColumn: change.range.startColumn,
                endLineNumber: change.range.endLineNumber,
                endColumn: change.range.endColumn,
              },
              text: change.text,
              roomId,
              version: 0
            });
          }
        });
        
        setCode(currentCode);
      }, 100); // Debounce changes by 100ms
      
      // Clear editing indicator after 2 seconds of inactivity
      editingTimeout = setTimeout(() => {
        if (socketRef.current && connectionStatus === 'connected') {
          socketRef.current.emit('editing-stop', { roomId });
        }
      }, 2000);
    });

    // Set up cursor position listener with throttling
    let cursorTimeout: NodeJS.Timeout;
    editor.onDidChangeCursorPosition((event: any) => {
      clearTimeout(cursorTimeout);
      
      cursorTimeout = setTimeout(() => {
        if (socketRef.current && connectionStatus === 'connected') {
          const position = event.position;
          socketRef.current.emit('cursor-move', {
            position,
            roomId,
            color: generateUserColor(currentUser?.uid || ''),
            displayName: currentUser?.displayName || currentUser?.email || 'Anonymous'
          });
        }
      }, 50); // Throttle cursor updates to 50ms
    });

    // Set up selection change listener
    editor.onDidChangeCursorSelection((event: any) => {
      // You can implement selection sharing here if needed
    });
  };

  // Generate user color based on user ID
  const generateUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const handleSendMessage = () => {
    if (chatInput.trim() && socketRef.current && connectionStatus === 'connected') {
      socketRef.current.emit('send-message', {
        roomId,
        content: chatInput.trim(),
        type: 'text'
      });
      setChatInput('');
      
      // Stop typing indicator
      socketRef.current.emit('typing-stop', { roomId });
    }
  };

  // Handle typing indicators for chat
  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    
    if (socketRef.current && connectionStatus === 'connected') {
      if (e.target.value.trim()) {
        socketRef.current.emit('typing-start', { roomId });
      } else {
        socketRef.current.emit('typing-stop', { roomId });
      }
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;

    setOutputLoading(true);
    setShowTerminal(true);

    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          language,
          code,
          input: customInput
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Handle HTML response (common cause of "Unexpected token '<'" error)
        const text = await response.text();
        console.error('Received HTML instead of JSON:', text.substring(0, 200));
        
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check if the server is running.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please check server logs.');
        } else {
          throw new Error(`Server returned ${response.status} with HTML response. This usually means the server is not running or there's a configuration issue.`);
        }
      }

      const result = await response.json();

      if (result.success) {
        setTerminalOutput({
          stdout: result.result.stdout || '',
          stderr: result.result.stderr || '',
          compile_output: result.result.compile_output || '',
          status: result.result.status || 'success',
          executionTime: result.result.executionTime
        });
      } else {
        setTerminalOutput({
          error: result.error || 'Execution failed'
        });
      }
    } catch (error) {
      console.error('Code execution error:', error);
      
      // Provide helpful error messages
      let errorMessage = (error as Error).message;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5000';
      } else if (errorMessage.includes('Unexpected token')) {
        errorMessage = 'Server returned invalid response. This usually means the server is not running or there\'s a configuration issue.';
      }
      
      setTerminalOutput({
        error: `Failed to execute code: ${errorMessage}`
      });
    } finally {
      setOutputLoading(false);
    }
  };

  const handleClearTerminal = () => {
    setTerminalOutput(null);
  };

  const handleLanguageChange = (newLanguage: 'javascript' | 'python') => {
    if (newLanguage === language) return;
    
    setLanguage(newLanguage);
    
    // Update Monaco Editor language
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        // Change the model's language
        (window as any).monaco.editor.setModelLanguage(model, newLanguage);
        
        // Update code with default for new language
        const newDefaultCode = getDefaultCode(newLanguage);
        model.setValue(newDefaultCode);
        setCode(newDefaultCode);
        
        // Notify other users about language change
        if (socketRef.current && connectionStatus === 'connected') {
          socketRef.current.emit('language-change', {
            roomId,
            language: newLanguage,
            code: newDefaultCode
          });
        }
      }
    }
    
    // Show notification
    showInfo('Language Changed', `Switched to ${newLanguage.charAt(0).toUpperCase() + newLanguage.slice(1)}`);
  };

  // ChatPanel component (inline for now)
  const ChatPanel = () => (
    <div className="chat-panel floating-chat-panel">
      <div className="chat-header">💬 Team Chat
        <button className="chat-close-btn" onClick={() => setShowChat(false)} title="Close">×</button>
      </div>
      <div className="chat-messages">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`chat-message${msg.userId === currentUser?.uid ? ' own' : ''}`}> 
            <div className="chat-avatar">
              {msg.avatar ? (
                <img src={msg.avatar} alt={msg.displayName} />
              ) : (
                <span className="avatar-placeholder">{msg.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="chat-content">
              <div className="chat-user">{msg.displayName}</div>
              <div className="chat-text">{msg.message}</div>
              <div className="chat-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={chatInput}
          onChange={handleChatInputChange}
          onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
        />
        <button className="chat-send-btn" onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );





  const toggleTheme = () => {
    setTheme(prev => prev === 'vs-dark' ? 'vs-light' : 'vs-dark');
  };

  const getDefaultCode = (lang: 'javascript' | 'python' = language) => {
    if (lang === 'python') {
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

  // Apply remote cursor decorations
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const decorations = Object.values(remoteCursors).map((cursor: CursorInfo) => ({
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to run code
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleRunCode();
      }
      
      // Ctrl+` or Cmd+` to toggle terminal
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        setShowTerminal(prev => !prev);
      }
      
      // Escape to close terminal
      if (event.key === 'Escape' && showTerminal) {
        event.preventDefault();
        setShowTerminal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showTerminal, handleRunCode]);

  // Remove handleStartBattle and formatTime

  // Keyboard shortcut hints
  const ShortcutHints = () => (
    <div className="shortcut-hints">
      <span>💡 <b>Shortcuts:</b> Ctrl+Enter = Run Code | Ctrl+` = Toggle Terminal | Esc = Close Terminal</span>
    </div>
  );

  return (
    <div className="collaborative-editor ide-layout gamified-bg">
      {showConfetti && <Confetti numberOfPieces={250} recycle={false} />}
      <GamifiedHeader
        onDiscuss={() => setShowChat((v) => !v)}
        unreadCount={unreadCount}
        onThemeToggle={toggleTheme}
        theme={theme}
        onProfile={() => {}}
        connectionStatus={connectionStatus}
        activeUsers={activeUsers}
      />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <div className="main-content-area">
        <UserSidebar
          users={sidebarUsers}
          currentUserId={currentUser?.uid || ''}
          roomId={roomId}
          isVisible={showSidebar}
          onToggle={() => setShowSidebar(!showSidebar)}
          onUserClick={(user) => {
            console.log('User clicked:', user);
            // You can implement user profile view or direct messaging here
          }}
        />
        <div className={`editor-main ${showSidebar ? 'with-sidebar' : ''}`}>
          <div className="editor-header">
            <div className="header-left">
              <h2>Collaborative {language.charAt(0).toUpperCase() + language.slice(1)} Editor</h2>
              <div className="room-info">
                <span className={`connection-status ${connectionStatus}`}>
                  {connectionStatus === 'connected' ? '🟢 Connected' : 
                   connectionStatus === 'reconnecting' ? '🟡 Reconnecting...' : '🔴 Disconnected'}
                </span>
                <span className="room-id">Room: {roomId}</span>
              </div>
            </div>
            <div className="header-right">
              <button className="run-btn" onClick={handleRunCode} disabled={outputLoading} title="Run Code (Ctrl+Enter)">
                {outputLoading ? 'Running...' : '▶ Run Code'}
              </button>
            </div>
          </div>
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
          <ShortcutHints />
          <Terminal
            isVisible={showTerminal}
            onClose={() => setShowTerminal(false)}
            output={terminalOutput}
            isLoading={outputLoading}
            customInput={customInput}
            onCustomInputChange={setCustomInput}
            onClear={handleClearTerminal}
          />
          <div className="editor-footer">
            <LanguageSwitcher
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
              disabled={connectionStatus !== 'connected'}
            />
            <div className="editor-stats">
              <span>Lines: {code.split('\n').length}</span>
              <span>Characters: {code.length}</span>
            </div>
          </div>
          {showChat && <ChatPanel />}
        </div>
        <Chat
          roomId={roomId}
          socket={socketRef.current}
          isVisible={showChatPanel}
          onToggle={() => setShowChatPanel(!showChatPanel)}
        />
      </div>
      <button onClick={startTimer} style={{marginBottom: 8}}>Start 10s Timer</button>
      {showTimer && (
        <Countdown
          key={timerKey}
          date={Date.now() + 10000}
          onComplete={() => setShowTimer(false)}
        />
      )}
    </div>
  );
};

export default CollaborativeEditor; 