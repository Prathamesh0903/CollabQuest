import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import ToastContainer, { useToast } from './ToastContainer';
import Terminal, { TerminalOutput } from './Terminal';
import LanguageSwitcher from './LanguageSwitcher';
import VSCodeSidebar from './VSCodeSidebar';
import UserAvatar from './UserAvatar';
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

// Enhanced user info type
interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  socketId: string;
  online: boolean;
}

// Cursor info type
interface CursorInfo {
  position: any;
  userId: string;
  color: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
}

// Selection info type
interface SelectionInfo {
  selection: any;
  userId: string;
  color: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
}

// Room state type
interface RoomState {
  code: string;
  language: string;
  version: number;
  lastModified: Date;
  lastExecution?: any;
}

// GamifiedHeader props type




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
  
  const socketRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  const [remoteCursors, setRemoteCursors] = useState<{ [userId: string]: CursorInfo }>({});
  const [remoteSelections, setRemoteSelections] = useState<{ [userId: string]: SelectionInfo }>({});
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput | null>(null);
  const [outputLoading, setOutputLoading] = useState<boolean>(false);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [currentFile, setCurrentFile] = useState<string>('main.js');
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  // Initialize socket connection with reconnection logic
  const initializeSocket = useCallback(async () => {
    // Helper function to show user activity
    const showUserActivity = (userName: string, action: string) => {
      showInfo('User Activity', `${userName} ${action}`, 3000);
    };
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

      // Selection synchronization
      socket.on('selections-sync', (selections: SelectionInfo[]) => {
        console.log('Received selections sync:', selections);
        const selectionsMap: { [userId: string]: SelectionInfo } = {};
        selections.forEach(selection => {
          if (selection.userId !== currentUser?.uid) {
            selectionsMap[selection.userId] = selection;
          }
        });
        setRemoteSelections(selectionsMap);
      });

      socket.on('selection-change', (selectionData: SelectionInfo) => {
        if (selectionData.userId !== currentUser?.uid) {
          setRemoteSelections(prev => ({
            ...prev,
            [selectionData.userId]: selectionData
          }));
        }
      });

      // Code execution events
      socket.on('code-execution-started', (data: { userId: string; displayName: string; avatar?: string; timestamp: Date }) => {
        if (data.userId !== currentUser?.uid) {
          setIsExecuting(true);
          showInfo('Code Execution', `${data.displayName} is running code...`);
        }
      });

      socket.on('code-execution-completed', (data: { success: boolean; result: any; executedBy: string; displayName: string; avatar?: string; timestamp: Date }) => {
        setIsExecuting(false);
        if (data.executedBy !== currentUser?.uid) {
          setTerminalOutput({
            stdout: data.result.stdout || '',
            stderr: data.result.stderr || '',
            compile_output: data.result.compile_output || '',
            status: data.result.status || 'success',
            executionTime: data.result.executionTime
          });
          setShowTerminal(true);
          showSuccess('Code Executed', `${data.displayName} ran the code successfully`);
        }
        setExecutionHistory(prev => [...prev.slice(-9), data]);
      });

      socket.on('code-execution-error', (data: { error: string; executedBy: string; displayName: string; avatar?: string; timestamp: Date }) => {
        setIsExecuting(false);
        if (data.executedBy !== currentUser?.uid) {
          setTerminalOutput({
            error: data.error
          });
          setShowTerminal(true);
          showError('Code Execution Failed', `${data.displayName}: ${data.error}`);
        }
      });

      // User left room
      socket.on('user-left-collab-room', (userData: { userId: string; displayName: string; avatar?: string }) => {
        console.log('User left room:', userData);
        setActiveUsers(prev => prev.filter(user => user.userId !== userData.userId));
        setRemoteCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[userData.userId];
          return newCursors;
        });
        setRemoteSelections(prev => {
          const newSelections = { ...prev };
          delete newSelections[userData.userId];
          return newSelections;
        });
        showUserActivity(userData.displayName, 'left the room');
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
  }, [currentUser, roomId, language, showSuccess, showError, showInfo]);

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
      if (socketRef.current && connectionStatus === 'connected') {
        const selection = event.selection;
        socketRef.current.emit('selection-change', {
          selection,
          roomId,
          color: generateUserColor(currentUser?.uid || ''),
          displayName: currentUser?.displayName || currentUser?.email || 'Anonymous'
        });
      }
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

  

  

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) return;

    setOutputLoading(true);
    setShowTerminal(true);
    setIsExecuting(true);

    try {
      // Use socket to broadcast code execution to all collaborators
      if (socketRef.current && connectionStatus === 'connected') {
        socketRef.current.emit('execute-code', {
          roomId,
          language,
          code,
          input: customInput
        });
      }

      // Also execute locally for immediate feedback
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
      setIsExecuting(false);
    }
  }, [code, customInput, currentUser, language, roomId, socketRef, connectionStatus]);

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

  // Apply remote cursor and selection decorations
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    
    // Create cursor decorations
    const cursorDecorations = Object.values(remoteCursors).map((cursor: CursorInfo) => ({
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

    // Create selection decorations
    const selectionDecorations = Object.values(remoteSelections).map((selection: SelectionInfo) => ({
      range: new (window as any).monaco.Range(
        selection.selection.startLineNumber,
        selection.selection.startColumn,
        selection.selection.endLineNumber,
        selection.selection.endColumn
      ),
      options: {
        className: 'remote-selection',
        stickiness: 1,
        overviewRuler: {
          color: selection.color || '#ff00ff',
          position: 1
        }
      }
    }));

    // Apply all decorations
    const allDecorations = [...cursorDecorations, ...selectionDecorations];
    editor.deltaDecorations([], allDecorations);
  }, [remoteCursors, remoteSelections]);

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

  // File selection handler
  const handleFileSelect = (file: any) => {
    setCurrentFile(file.id);
    if (file.name.endsWith('.js')) {
      setLanguage('javascript');
    } else if (file.name.endsWith('.py')) {
      setLanguage('python');
    }
    showInfo('File Selected', `Switched to ${file.name}`);
  };

  // Shortcuts are now displayed in the status bar

  return (
    <div className={`collaborative-editor vscode-layout ${theme === 'vs-dark' ? 'dark-theme' : 'light-theme'}`}>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* VS Code Style Header */}
      <div className="vscode-header">
        <div className="header-section">
          <div className="header-left">
            <button 
              className="back-btn" 
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
              ← Dashboard
            </button>
            <div className="file-info">
              <span className="file-name">{currentFile}</span>
              <span className="file-path">Room: {roomId}</span>
            </div>
          </div>
          <div className="header-center">
            <span className={`connection-indicator ${connectionStatus}`}>
              <span className="connection-dot"></span>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
            </span>
            <div className="users-indicator">
              <span className="users-count">{activeUsers.length} collaborator{activeUsers.length !== 1 ? 's' : ''}</span>
              <div className="users-list">
                {activeUsers.slice(0, 3).map(user => (
                  <UserAvatar
                    key={user.userId}
                    user={user}
                    size="small"
                    showStatus={true}
                    showName={false}
                    className="header-user-avatar"
                  />
                ))}
                {activeUsers.length > 3 && (
                  <span className="more-users">+{activeUsers.length - 3}</span>
                )}
              </div>
            </div>
            {isExecuting && (
              <div className="execution-status executing">
                <span className="execution-icon">⚡</span>
                <span>Executing...</span>
              </div>
            )}
          </div>
          <div className="header-right">
            <button className="header-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'vs-dark' ? '☀️' : '🌙'}
            </button>
            <button className="header-btn run-btn" onClick={handleRunCode} disabled={outputLoading} title="Run Code (Ctrl+Enter)">
              ▶️ {outputLoading ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>
      </div>

      {/* VS Code Layout with Sidebar */}
      <div className="vscode-main-area">
        <VSCodeSidebar
          isVisible={showSidebar}
          onToggle={() => setShowSidebar(!showSidebar)}
          currentFile={currentFile}
          onFileSelect={handleFileSelect}
        />
        
        {/* VS Code Style Editor Area */}
        <div className={`vscode-editor-container ${showSidebar ? 'with-sidebar' : ''}`}>
          <Editor
            height="100%"
            defaultLanguage={language}
            defaultValue={code || getDefaultCode()}
            theme={theme}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
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
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14
              }
            }}
          />
        </div>
      </div>

      {/* VS Code Style Status Bar */}
      <div className="vscode-status-bar">
        <div className="status-left">
          <LanguageSwitcher
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
            disabled={connectionStatus !== 'connected'}
          />
          <span className="status-item">
            Lines: {code.split('\n').length}
          </span>
          <span className="status-item">
            Characters: {code.length}
          </span>
          {executionHistory.length > 0 && (
            <span className="status-item">
              Last run: {new Date(executionHistory[executionHistory.length - 1]?.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="status-right">
          <button 
            className={`status-btn ${showTerminal ? 'active' : ''}`}
            onClick={() => setShowTerminal(!showTerminal)}
            title="Toggle Terminal (Ctrl+`)"
          >
            Terminal
          </button>
          <span className="shortcuts-hint">
            Ctrl+Enter: Run • Ctrl+`: Terminal • Esc: Close
          </span>
        </div>
      </div>

      {/* Terminal */}
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
  );
};

export default CollaborativeEditor;