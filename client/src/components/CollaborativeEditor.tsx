import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import ToastContainer, { useToast } from './ToastContainer';
import Terminal, { TerminalOutput } from './Terminal';
import LanguageSwitcher from './LanguageSwitcher';
import VSCodeSidebar from './VSCodeSidebar';
import UserAvatar from './UserAvatar';
import ConcurrentExecutionHandler from './ConcurrentExecutionHandler';
import './CollaborativeEditor.css';

// Extend HTMLInputElement interface for webkitdirectory
declare global {
  interface HTMLInputElement {
    webkitdirectory: boolean;
  }
}

// Extend React's InputHTMLAttributes
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: boolean;
  }
}

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
  sessionId?: string;
  language?: 'javascript' | 'python' | 'java' | 'cpp' | 'csharp' | 'typescript' | 'go' | 'rust' | 'php' | 'ruby';
  initialCode?: string;
}

// Enhanced user info type
interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  isTyping?: boolean;
  isEditing?: boolean;
  lastSeen?: Date;
}

interface CursorInfo {
  position: { lineNumber: number; column: number };
  color: string;
  displayName: string;
  avatar?: string;
}

interface SelectionInfo {
  range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
  color: string;
  displayName: string;
  avatar?: string;
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  size?: number;
  children?: FileItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface SessionState {
  code: string;
  language: string;
  version: number;
  lastExecution?: any;
  files: FileItem[];
  currentFile?: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  sessionId,
  language: initialLanguage = 'javascript',
  initialCode = ''
}) => {
  const { currentUser } = useAuth();
  const [language, setLanguage] = useState<'javascript' | 'python' | 'java' | 'cpp' | 'csharp' | 'typescript' | 'go' | 'rust' | 'php' | 'ruby'>(initialLanguage);
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
  const [shareableLink, setShareableLink] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileLanguage, setNewFileLanguage] = useState<string>('javascript');
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showLocalFolderModal, setShowLocalFolderModal] = useState<boolean>(false);
  const [localFolderPath, setLocalFolderPath] = useState<string>('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  // Generate or use session ID
  const currentSessionId = sessionId || generateSessionId();

  // Generate a unique session ID
  function generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate shareable link
  useEffect(() => {
    const link = `${window.location.origin}/collab/${currentSessionId}`;
    setShareableLink(link);
  }, [currentSessionId]);

  // Load files for the session
  useEffect(() => {
    if (currentSessionId && currentUser) {
      loadFiles();
    }
  }, [currentSessionId, currentUser]);

  // Load files from backend
  const loadFiles = async () => {
    try {
      // const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}`, {
        headers: {
          // 'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        
        // If no files exist, create a default file
        if (data.files.length === 0) {
          await createDefaultFile();
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  // Create default file for the session
  const createDefaultFile = async () => {
    try {
      // const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: `main.${getFileExtension(language)}`,
          language: language
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles([data.file]);
        setCurrentFile(data.file.path);
        setCode(getDefaultCode(language));
      }
    } catch (error) {
      console.error('Failed to create default file:', error);
    }
  };

  // Get file extension from language
  const getFileExtension = (lang: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      php: 'php',
      ruby: 'rb'
    };
    return extensions[lang] || 'js';
  };

  // Get default code for language
  const getDefaultCode = (lang: string): string => {
    const defaults: { [key: string]: string } = {
      javascript: `// Welcome to collaborative JavaScript coding!
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

// Start coding with your team!`,
      python: `# Welcome to collaborative Python coding!
print("Hello, World!")

def greet(name):
    return f"Hello, {name}!"

# Start coding with your team!`,
      java: `// Welcome to collaborative Java coding!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
      cpp: `// Welcome to collaborative C++ coding!
#include <iostream>
#include <string>

using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
      csharp: `// Welcome to collaborative C# coding!
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
      typescript: `// Welcome to collaborative TypeScript coding!
interface Greeting {
    name: string;
    message: string;
}

function greet(name: string): Greeting {
    return {
        name,
        message: \`Hello, \${name}!\`
    };
}

console.log(greet("World"));
`,
      go: `// Welcome to collaborative Go coding!
package main

import "fmt"

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    fmt.Println(greet("World"))
}`,
      rust: `// Welcome to collaborative Rust coding!
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("{}", greet("World"));
}`,
      php: `<?php
// Welcome to collaborative PHP coding!
function greet($name) {
    return "Hello, " . $name . "!";
}

echo greet("World");
?>`,
      ruby: `# Welcome to collaborative Ruby coding!
def greet(name)
  "Hello, #{name}!"
end

puts greet("World")`
    };
    
    return defaults[lang] || defaults.javascript;
  };

  // Create new file
  const createNewFile = async () => {
    if (!newFileName.trim()) {
      showError('Error', 'File name is required');
      return;
    }
    
    // Validate file name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(newFileName)) {
      showError('Error', 'File name contains invalid characters');
      return;
    }
    
    // Add file extension if not provided
    let fileName = newFileName;
    if (!fileName.includes('.')) {
      const extension = getFileExtension(newFileLanguage);
      fileName = `${fileName}.${extension}`;
    }
    
    try {
      // const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName,
          language: newFileLanguage
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setShowNewFileModal(false);
        setNewFileName('');
        showSuccess('Success', `File "${fileName}" created successfully`);
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Failed to create file');
      }
    } catch (error) {
      console.error('Error creating file:', error);
      showError('Error', 'Failed to create file');
    }
  };

  // Create new folder
  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      showError('Error', 'Folder name is required');
      return;
    }
    
    // Validate folder name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(newFolderName)) {
      showError('Error', 'Folder name contains invalid characters');
      return;
    }
    
    try {
      // const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          folderName: newFolderName
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setShowNewFolderModal(false);
        setNewFolderName('');
        showSuccess('Success', `Folder "${newFolderName}" created successfully`);
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      showError('Error', 'Failed to create folder');
    }
  };

  // Open file
  const openFile = async (file: FileItem) => {
    if (file.type === 'folder') return;
    
    try {
      // const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}/file/${file.path}`, {
        headers: {
          // 'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentFile(file.path);
        setCode(data.content);
        setLanguage((file.language || 'javascript') as any);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      showError('Error', 'Failed to open file');
    }
  };

  // Save current file
  const saveCurrentFile = async () => {
    if (!currentFile) return;
    
    try {
      // const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}/file/${currentFile}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: code
        })
      });
      
      if (response.ok) {
        showSuccess('File Saved', 'File saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      showError('Error', 'Failed to save file');
    }
  };

  // Copy shareable link to clipboard
  const copyShareableLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      showSuccess('Link Copied', 'Shareable link copied to clipboard!');
    } catch (error) {
      showError('Copy Failed', 'Failed to copy link to clipboard');
    }
  };

  // Initialize socket connection with reconnection logic
  const initializeSocket = useCallback(async () => {
    // Helper function to show user activity
    const showUserActivity = (userName: string, action: string) => {
      showInfo('User Activity', `${userName} ${action}`, 3000);
    };
    if (!currentUser) return;

    try {
      // const token = await currentUser.getIdToken();
      
      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io('http://localhost:5001', {
        query: { sessionId: currentSessionId },
        // In dev, socket auth is optional on server side. Provide token if available.
        auth: { token: (await currentUser?.getIdToken?.()) || '' },
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
        
        // Join the collaborative session
        socket.emit('join-collab-room', { roomId: currentSessionId, language });
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
        
        // Rejoin the session after reconnection
        socket.emit('reconnect-request', { roomId: currentSessionId });
      });

      socket.on('reconnect_failed', () => {
        console.log('Failed to reconnect after', maxReconnectAttempts, 'attempts');
        setConnectionStatus('disconnected');
      });

      // Session state synchronization
      socket.on('session-state-sync', (state: SessionState) => {
        console.log('Received session state sync:', state);
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

      // Users in session updates
      socket.on('users-in-room', (users: UserInfo[]) => {
        console.log('Users in session updated:', users);
        setActiveUsers(users);
      });

      // Cursor synchronization
      socket.on('cursors-sync', (cursors: any[]) => {
        console.log('Received cursors sync:', cursors);
        const cursorsMap: { [userId: string]: CursorInfo } = {};
        cursors.forEach(cursor => {
          if (cursor.userId && cursor.userId !== currentUser?.uid) {
            cursorsMap[cursor.userId] = {
              position: cursor.position,
              color: cursor.color,
              displayName: cursor.displayName,
              avatar: cursor.avatar
            };
          }
        });
        setRemoteCursors(cursorsMap);
      });

      // Cursor change events
      socket.on('cursor-change', (change: any) => {
        console.log('Received cursor change:', change);
        
        if (change.userId && change.userId !== currentUser?.uid) {
          setRemoteCursors(prev => ({
            ...prev,
            [change.userId]: {
              position: change.position,
              color: change.color,
              displayName: change.displayName,
              avatar: change.avatar
            }
          }));
        }
      });

      // Selection synchronization
      socket.on('selections-sync', (selections: any[]) => {
        console.log('Received selections sync:', selections);
        const selectionsMap: { [userId: string]: SelectionInfo } = {};
        selections.forEach(selection => {
          if (selection.userId && selection.userId !== currentUser?.uid) {
            selectionsMap[selection.userId] = {
              range: selection.range,
              color: selection.color,
              displayName: selection.displayName,
              avatar: selection.avatar
            };
          }
        });
        setRemoteSelections(selectionsMap);
      });

      // Selection change events
      socket.on('selection-change', (change: any) => {
        console.log('Received selection change:', change);
        
        if (change.userId && change.userId !== currentUser?.uid) {
          setRemoteSelections(prev => ({
            ...prev,
            [change.userId]: {
              range: change.range,
              color: change.color,
              displayName: change.displayName,
              avatar: change.avatar
            }
          }));
        }
      });

      // Concurrent execution events (handled by ConcurrentExecutionHandler)
      socket.on('execution-queued', (data: { userId: string; displayName: string; avatar?: string; executionId: string; position: number; timestamp: Date }) => {
        if (data.userId !== currentUser?.uid) {
          showInfo('Code Execution', `${data.displayName} queued code execution (position ${data.position})`);
        }
      });

      socket.on('execution-started', (data: { executionId: string; userId: string; displayName: string; avatar?: string; language: string; timestamp: Date }) => {
        if (data.userId !== currentUser?.uid) {
          setIsExecuting(true);
          showInfo('Code Execution', `${data.displayName} started executing ${data.language} code`);
        }
      });

      socket.on('execution-completed', (data: { executionId: string; userId: string; displayName: string; avatar?: string; result: any; executionTime: number; timestamp: Date }) => {
        setIsExecuting(false);
        if (data.userId !== currentUser?.uid) {
          setTerminalOutput({
            stdout: data.result.stdout || '',
            stderr: data.result.stderr || '',
            compile_output: data.result.compile_output || '',
            status: data.result.status || 'success',
            executionTime: data.executionTime
          });
          setShowTerminal(true);
          showSuccess('Code Executed', `${data.displayName} completed execution in ${(data.executionTime / 1000).toFixed(2)}s`);
        }
        setExecutionHistory(prev => [...prev.slice(-9), {
          success: true,
          result: data.result,
          executedBy: data.userId,
          displayName: data.displayName,
          avatar: data.avatar,
          timestamp: data.timestamp
        }]);
      });

      socket.on('execution-failed', (data: { executionId: string; userId: string; displayName: string; avatar?: string; error: string; executionTime: number; timestamp: Date }) => {
        setIsExecuting(false);
        if (data.userId !== currentUser?.uid) {
          setTerminalOutput({
            error: data.error
          });
          setShowTerminal(true);
          showError('Code Execution Failed', `${data.displayName}: ${data.error}`);
        }
        setExecutionHistory(prev => [...prev.slice(-9), {
          success: false,
          error: data.error,
          executedBy: data.userId,
          displayName: data.displayName,
          avatar: data.avatar,
          timestamp: data.timestamp
        }]);
      });

      // Legacy code execution events (for backward compatibility)
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

      // User left session
      socket.on('user-left-collab-room', (userData: { userId: string; displayName: string; avatar?: string }) => {
        console.log('User left session:', userData);
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
        showUserActivity(userData.displayName, 'left the session');
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
  }, [currentUser, currentSessionId, language, showSuccess, showError, showInfo]);

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
        socketRef.current.emit('editing-start', { roomId: currentSessionId });
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
              sessionId: currentSessionId,
              version: 0
            });
          }
        });
        
        setCode(currentCode);
      }, 100); // Debounce changes by 100ms
      
      // Clear editing indicator after 2 seconds of inactivity
      editingTimeout = setTimeout(() => {
        if (socketRef.current && connectionStatus === 'connected') {
          socketRef.current.emit('editing-stop', { roomId: currentSessionId });
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
            roomId: currentSessionId,
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
          roomId: currentSessionId,
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
          roomId: currentSessionId,
          language,
          code,
          input: customInput
        });
      }

      // Also execute locally for immediate feedback
      const response = await fetch(`http://localhost:5001/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Optional auth: 'Authorization': `Bearer ${await currentUser?.getIdToken()}`
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
        const terminalOutput = {
          stdout: result.data?.stdout || result.stdout || '',
          stderr: result.data?.stderr || result.stderr || '',
          compile_output: result.data?.compile_output || result.compile_output || '',
          status: result.status || 'success',
          executionTime: result.execution?.duration_ms || result.executionTime
        };
        
        console.log('Setting terminal output:', terminalOutput);
        setTerminalOutput(terminalOutput);
        setShowTerminal(true);
      } else {
        const errorOutput = {
          error: (result.error && (result.error.message || result.error)) || 'Execution failed'
        };
        
        console.log('Setting error output:', errorOutput);
        setTerminalOutput(errorOutput);
        setShowTerminal(true);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      
      // Provide helpful error messages
      let errorMessage = (error as Error).message;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5001';
      } else if (errorMessage.includes('Unexpected token')) {
        errorMessage = 'Server returned invalid response. This usually means the server is not running or there\'s a configuration issue.';
      }
      
      const errorOutput = {
        error: `Failed to execute code: ${errorMessage}`
      };
      
      console.log('Setting error output:', errorOutput);
      setTerminalOutput(errorOutput);
      setShowTerminal(true);
    } finally {
      setOutputLoading(false);
      setIsExecuting(false);
    }
  }, [code, customInput, currentUser, language, currentSessionId, socketRef, connectionStatus]);

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
            roomId: currentSessionId,
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

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'folder') {
      // Navigate into folder
      const folderPath = file.path.split('/').slice(0, -1).join('/');
      if (folderPath) {
        setCurrentFile(folderPath);
      } else {
        setCurrentFile(file.name);
      }
      showInfo('Folder Selected', `Navigated to ${file.name}`);
    } else {
      openFile(file);
    }
  };

  const handleNewFileClick = () => {
    setShowNewFileModal(true);
    setNewFileName('');
    setNewFileLanguage(language);
  };

  const handleNewFolderClick = () => {
    setShowNewFolderModal(true);
    setNewFolderName('');
  };

  const handleOpenLocalFolder = () => {
    setShowLocalFolderModal(true);
    setLocalFolderPath('');
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // For folder selection, show the folder name
      // For individual files, show the file names
      const fileNames = Array.from(files).map(file => 
        file.webkitRelativePath || file.name
      ).join(', ');
      
      setLocalFolderPath(fileNames);
      
      // Process the selected files/folders
      processSelectedFiles(files);
    }
  };

  const processSelectedFiles = async (files: FileList) => {
    try {
      // const token = await currentUser?.getIdToken();
      
      // Create FormData to send files
      const formData = new FormData();
      formData.append('sessionId', currentSessionId);
      
      // Add all files to FormData
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        formData.append('files', file, file.webkitRelativePath || file.name);
      }
      
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}/import-files`, {
        method: 'POST',
        headers: {
          // 'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setShowLocalFolderModal(false);
        setLocalFolderPath('');
        showSuccess('Files Imported', 'Local files imported successfully!');
      } else {
        const errorData = await response.json();
        showError('Import Failed', errorData.error || 'Failed to import files');
      }
    } catch (error) {
      console.error('Failed to import files:', error);
      showError('Error', 'Failed to import files');
    }
  };

  const handleNewFileModalClose = () => {
    setShowNewFileModal(false);
  };

  const handleNewFolderModalClose = () => {
    setShowNewFolderModal(false);
  };

  const handleLocalFolderModalClose = () => {
    setShowLocalFolderModal(false);
  };

  const handleNewFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFileName(e.target.value);
  };

  const handleNewFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFolderName(e.target.value);
  };

  const handleLocalFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFolderPath(e.target.value);
  };

  const handleNewFileLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewFileLanguage(e.target.value);
  };

  const handleSaveNewFile = () => {
    createNewFile();
  };

  const handleSaveNewFolder = () => {
    createNewFolder();
  };

  const handleOpenLocalFolderSubmit = async () => {
    if (!localFolderPath.trim()) return;
    
    try {
      // const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5001/api/files/session/${currentSessionId}/import-local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          localPath: localFolderPath
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setShowLocalFolderModal(false);
        setLocalFolderPath('');
        showSuccess('Folder Imported', 'Local folder imported successfully!');
      } else {
        const errorData = await response.json();
        showError('Import Failed', errorData.error || 'Failed to import local folder');
      }
    } catch (error) {
      console.error('Failed to import local folder:', error);
      showError('Error', 'Failed to import local folder');
    }
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
        selection.range.startLineNumber,
        selection.range.startColumn,
        selection.range.endLineNumber,
        selection.range.endColumn
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

  // Handle cursor position changes
  const handleCursorPositionChanged = (event: any) => {
    if (socketRef.current && connectionStatus === 'connected') {
      const position = event.position;
      socketRef.current.emit('cursor-change', {
        position,
        roomId: currentSessionId,
        color: generateUserColor(currentUser?.uid || ''),
        displayName: currentUser?.displayName || currentUser?.email || 'Anonymous'
      });
    }
  };

  // Handle selection changes
  const handleSelectionChanged = (event: any) => {
    if (socketRef.current && connectionStatus === 'connected') {
      const selection = event.selection;
      socketRef.current.emit('selection-change', {
        selection,
        roomId: currentSessionId,
        color: generateUserColor(currentUser?.uid || ''),
        displayName: currentUser?.displayName || currentUser?.email || 'Anonymous'
      });
    }
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveCurrentFile();
      }
      
      // Ctrl+Enter or Cmd+Enter to run code
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleRunCode();
      }
      
      // Ctrl+` or Cmd+` to toggle terminal
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        setShowTerminal(!showTerminal);
      }
      
      // Ctrl+B or Cmd+B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setShowSidebar(!showSidebar);
      }
      
      // Escape to close terminal
      if (event.key === 'Escape' && showTerminal) {
        setShowTerminal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showTerminal, showSidebar, handleRunCode]);

  return (
    <div className={`collaborative-editor vscode-layout ${theme === 'vs-dark' ? 'dark-theme' : 'light-theme'}`}>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Professional VS Code Style Header */}
      <div className="vscode-header">
        <div className="header-section">
          <div className="header-left">
            <button  
              className="back-btn" 
              onClick={() => {
                // Notify server we're leaving the session
                if (socketRef.current && connectionStatus === 'connected') {
                  socketRef.current.emit('leave-collab-room', { roomId: currentSessionId });
                }
                // Navigate back to dashboard
                window.location.href = '/';
              }} 
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Dashboard
            </button>
            <div className="file-info">
              <span className="file-name">{currentFile}</span>
              <span className="file-path">Session: {currentSessionId}</span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="connection-status">
              <span className={`connection-indicator ${connectionStatus}`}>
                <span className="connection-dot"></span>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
              </span>
            </div>
            
            <div className="collaborators-info">
              <span className="collaborators-count">{activeUsers.length} collaborator{activeUsers.length !== 1 ? 's' : ''}</span>
              <div className="collaborators-list">
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
                  <span className="more-collaborators">+{activeUsers.length - 3}</span>
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
            <button 
              className={`header-btn ${showSidebar ? 'active' : ''}`}
              onClick={() => setShowSidebar(!showSidebar)}
              title={`${showSidebar ? 'Hide' : 'Show'} Sidebar (Ctrl+B)`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              {showSidebar ? 'Hide' : 'Show'} Sidebar
            </button>
            
            <button 
              className="header-btn save-btn" 
              onClick={saveCurrentFile}
              title="Save File (Ctrl+S)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              Save
            </button>
            
            <button 
              className="header-btn share-btn" 
              onClick={copyShareableLink}
              title="Copy Shareable Link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Share
            </button>
            
            <button className="header-btn" onClick={toggleTheme}
              title="Toggle Theme"
            >
              {theme === 'vs-dark' ? '☀️' : '🌙'}
            </button>
            
            <button className="header-btn run-btn" onClick={handleRunCode} disabled={outputLoading} title="Run Code (Ctrl+Enter)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              {outputLoading ? 'Running...' : 'Run'}
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
          files={files}
          onNewFileClick={handleNewFileClick}
          onNewFolderClick={handleNewFolderClick}
          onOpenLocalFolder={handleOpenLocalFolder}
        />
        
        {/* VS Code Style Editor Area */}
        <div className={`vscode-editor-container ${showSidebar ? 'with-sidebar' : ''}`}>
          <Editor
            height="100%"
            defaultLanguage={language}
            defaultValue={code || getDefaultCode(language)}
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 17l6-6-6-6"/>
              <path d="M12 19h8"/>
            </svg>
            Terminal
          </button>
          <span className="shortcuts-hint">
            Ctrl+Enter: Run • Ctrl+`: Terminal • Ctrl+B: Sidebar • Esc: Close
          </span>
        </div>
      </div>

      {/* VS Code Style Terminal */}
      <Terminal
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
        output={terminalOutput}
        isLoading={outputLoading}
        customInput={customInput}
        onCustomInputChange={setCustomInput}
        onClear={handleClearTerminal}
      />

      {/* New File Modal */}
      <div className={`modal-overlay ${showNewFileModal ? 'active' : ''}`}>
        <div className="modal-content">
          <h2>New File</h2>
          <input
            type="text"
            placeholder="File name (e.g., main.js)"
            value={newFileName}
            onChange={handleNewFileInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveNewFile();
              }
            }}
          />
          <select value={newFileLanguage} onChange={handleNewFileLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="typescript">TypeScript</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
          </select>
          <button onClick={handleSaveNewFile}>Create File</button>
          <button onClick={handleNewFileModalClose}>Cancel</button>
        </div>
      </div>

      {/* New Folder Modal */}
      <div className={`modal-overlay ${showNewFolderModal ? 'active' : ''}`}>
        <div className="modal-content">
          <h2>New Folder</h2>
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={handleNewFolderInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveNewFolder();
              }
            }}
          />
          <button onClick={handleSaveNewFolder}>Create Folder</button>
          <button onClick={handleNewFolderModalClose}>Cancel</button>
        </div>
      </div>

      {/* Local Folder Modal */}
      <div className={`modal-overlay ${showLocalFolderModal ? 'active' : ''}`}>
        <div className="modal-content">
          <h2>Open Local Folder</h2>
          <p style={{ marginBottom: '16px', color: 'var(--vscode-text-light)', fontSize: '14px' }}>
            Select a folder or files to import into this session.
          </p>
          
          <div className="file-picker-container">
            <label htmlFor="folder-picker" className="file-picker-label">
              <div className="file-picker-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>📁 Select a folder (includes all files)</span>
              </div>
            </label>
            <input
              id="folder-picker"
              type="file"
              webkitdirectory={true}
              multiple
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            <div className="file-picker-options">
              <label htmlFor="single-file-picker" className="file-picker-option">
                <input
                  id="single-file-picker"
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <span>📄 Select individual files</span>
              </label>
            </div>
          </div>
          
          {localFolderPath && (
            <div className="selected-path">
              <strong>Selected:</strong> {localFolderPath}
            </div>
          )}
          
          <div className="modal-actions">
            <button onClick={handleLocalFolderModalClose}>Cancel</button>
          </div>
        </div>
      </div>

      {/* Concurrent Execution Handler */}
      <ConcurrentExecutionHandler
        socket={socketRef.current}
        roomId={currentSessionId}
        currentUserId={currentUser?.uid || ''}
        onExecutionStatusChange={(status) => {
          console.log('Execution status changed:', status);
        }}
        onExecutionHistoryUpdate={(history) => {
          console.log('Execution history updated:', history);
        }}
      />

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;