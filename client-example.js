/**
 * Collaborative Editor Client Example
 * 
 * This example demonstrates how to:
 * 1. Connect to the Socket.IO backend
 * 2. Join collaborative sessions by URL
 * 3. Update Monaco Editor in real-time
 * 4. Handle all collaborative features (cursors, selections, file management)
 */

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:5000',
  JWT_TOKEN: 'your-jwt-token-here', // Replace with actual token
  SESSION_ID: null, // Will be extracted from URL
  USER_INFO: {
    displayName: 'Anonymous User',
    avatar: null
  }
};

// Global variables
let socket = null;
let editor = null;
let currentSession = null;
let currentFile = 'main.js';
let userColor = null;
let isConnected = false;
let collaborators = new Map();
let userCursors = new Map();
let userSelections = new Map();

// DOM elements
const editorContainer = document.getElementById('editor-container');
const statusBar = document.getElementById('status-bar');
const collaboratorsList = document.getElementById('collaborators-list');
const fileTabs = document.getElementById('file-tabs');
const connectionStatus = document.getElementById('connection-status');

/**
 * Initialize the collaborative editor
 */
async function initializeCollaborativeEditor() {
  console.log('🚀 Initializing Collaborative Editor...');
  
  // Extract session ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  CONFIG.SESSION_ID = urlParams.get('session') || urlParams.get('sessionId');
  
  if (!CONFIG.SESSION_ID) {
    showError('No session ID found in URL. Please provide a valid session link.');
    return;
  }
  
  // Initialize Monaco Editor
  await initializeMonacoEditor();
  
  // Connect to Socket.IO backend
  await connectToBackend();
  
  // Join the collaborative session
  await joinSession();
  
  // Set up event listeners
  setupEventListeners();
  
  console.log('✅ Collaborative Editor initialized successfully');
}

/**
 * Initialize Monaco Editor
 */
async function initializeMonacoEditor() {
  return new Promise((resolve) => {
    // Load Monaco Editor
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function () {
      // Create editor instance
      editor = monaco.editor.create(editorContainer, {
        value: '// Welcome to collaborative coding!\nconsole.log("Hello, World!");\n\n// Start coding with your team...',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
        wordWrap: 'on',
        folding: true,
        showFoldingControls: 'always'
      });
      
      // Set up editor event listeners
      setupEditorEvents();
      
      resolve();
    });
  });
}

/**
 * Set up Monaco Editor event listeners
 */
function setupEditorEvents() {
  // Handle content changes
  editor.onDidChangeModelContent((event) => {
    if (!isConnected || !currentSession) return;
    
    // Process each change
    event.changes.forEach(change => {
      const changeData = {
        sessionId: currentSession.sessionId,
        fileName: currentFile,
        range: {
          start: editor.getModel().getOffsetAt(change.range.getStartPosition()),
          end: editor.getModel().getOffsetAt(change.range.getEndPosition())
        },
        text: change.text,
        version: currentSession.version || 0
      };
      
      // Send change to server
      socket.emit('session-code-change', changeData);
    });
  });
  
  // Handle cursor position changes
  editor.onDidChangeCursorPosition((event) => {
    if (!isConnected || !currentSession) return;
    
    const position = editor.getModel().getOffsetAt(event.position);
    const cursorData = {
      sessionId: currentSession.sessionId,
      position: position,
      color: userColor,
      displayName: CONFIG.USER_INFO.displayName
    };
    
    socket.emit('session-cursor-move', cursorData);
  });
  
  // Handle selection changes
  editor.onDidChangeCursorSelection((event) => {
    if (!isConnected || !currentSession) return;
    
    const selection = event.selection;
    const selectionData = {
      sessionId: currentSession.sessionId,
      selection: {
        start: editor.getModel().getOffsetAt(selection.getStartPosition()),
        end: editor.getModel().getOffsetAt(selection.getEndPosition())
      },
      color: userColor,
      displayName: CONFIG.USER_INFO.displayName
    };
    
    socket.emit('session-selection-change', selectionData);
  });
  
  // Handle focus events for typing indicators
  editor.onDidFocusEditorWidget(() => {
    if (isConnected && currentSession) {
      socket.emit('session-editing-start', { sessionId: currentSession.sessionId });
    }
  });
  
  editor.onDidBlurEditorWidget(() => {
    if (isConnected && currentSession) {
      socket.emit('session-editing-stop', { sessionId: currentSession.sessionId });
    }
  });
}

/**
 * Connect to Socket.IO backend
 */
async function connectToBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to backend...');
    
    // Create socket connection
    socket = io(CONFIG.SERVER_URL, {
      auth: { token: CONFIG.JWT_TOKEN },
      query: { sessionId: CONFIG.SESSION_ID },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to backend');
      isConnected = true;
      updateConnectionStatus('Connected', 'success');
      resolve();
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend');
      isConnected = false;
      updateConnectionStatus('Disconnected', 'error');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      updateConnectionStatus('Connection Error', 'error');
      reject(error);
    });
    
    // Error handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      showError(error.message);
    });
    
    // Version mismatch handling
    socket.on('version-mismatch', (data) => {
      console.warn('⚠️ Version mismatch detected');
      handleVersionMismatch(data);
    });
  });
}

/**
 * Join collaborative session
 */
async function joinSession() {
  return new Promise((resolve, reject) => {
    console.log(`🎯 Joining session: ${CONFIG.SESSION_ID}`);
    
    // Join the session
    socket.emit('join-collaborative-session', {
      sessionId: CONFIG.SESSION_ID,
      accessCode: null // Add access code if required
    });
    
    // Handle session state sync
    socket.once('session-state-sync', (sessionState) => {
      console.log('📄 Received session state:', sessionState);
      currentSession = sessionState;
      
      // Update editor with session content
      updateEditorWithSessionState(sessionState);
      
      // Generate user color
      userColor = generateUserColor(CONFIG.USER_INFO.displayName);
      
      resolve(sessionState);
    });
    
    // Handle join errors
    socket.once('error', (error) => {
      console.error('❌ Failed to join session:', error);
      reject(error);
    });
  });
}

/**
 * Update editor with session state
 */
function updateEditorWithSessionState(sessionState) {
  if (!editor || !sessionState.files) return;
  
  // Find the current file or default to first file
  const file = sessionState.files.find(f => f.fileName === currentFile) || 
               sessionState.files.find(f => f.isActive) || 
               sessionState.files[0];
  
  if (file) {
    currentFile = file.fileName;
    
    // Update editor content
    const model = editor.getModel();
    if (model) {
      model.setValue(file.content);
      
      // Set language based on file extension
      const language = getLanguageFromFileName(file.fileName);
      monaco.editor.setModelLanguage(model, language);
    }
    
    // Update file tabs
    updateFileTabs(sessionState.files);
  }
}

/**
 * Set up Socket.IO event listeners
 */
function setupEventListeners() {
  // Session state events
  socket.on('session-state-sync', handleSessionStateSync);
  socket.on('session-state-recovered', handleSessionStateRecovered);
  
  // Code change events
  socket.on('session-code-change', handleCodeChange);
  
  // Cursor and selection events
  socket.on('session-cursor-move', handleCursorMove);
  socket.on('session-selection-change', handleSelectionChange);
  socket.on('cursors-sync', handleCursorsSync);
  socket.on('selections-sync', handleSelectionsSync);
  
  // File management events
  socket.on('session-file-created', handleFileCreated);
  socket.on('session-file-deleted', handleFileDeleted);
  socket.on('session-file-switched', handleFileSwitched);
  
  // Collaborator events
  socket.on('users-in-session', handleUsersInSession);
  socket.on('user-joined-session', handleUserJoined);
  socket.on('user-left-session', handleUserLeft);
  socket.on('collaborator-update', handleCollaboratorUpdate);
  
  // Typing and editing indicators
  socket.on('user-typing', handleUserTyping);
  socket.on('user-editing', handleUserEditing);
  
  // Code execution events
  socket.on('code-execution-started', handleCodeExecutionStarted);
  socket.on('code-execution-completed', handleCodeExecutionCompleted);
  socket.on('code-execution-error', handleCodeExecutionError);
  
  // Persistence events
  socket.on('session-saved', handleSessionSaved);
  socket.on('session-stats', handleSessionStats);
}

/**
 * Handle session state sync
 */
function handleSessionStateSync(sessionState) {
  console.log('📄 Session state synced:', sessionState);
  currentSession = sessionState;
  updateEditorWithSessionState(sessionState);
}

/**
 * Handle session state recovery
 */
function handleSessionStateRecovered(data) {
  console.log('🔄 Session state recovered from:', data.source);
  showNotification(`Session recovered from ${data.source}`, 'info');
}

/**
 * Handle code changes from other users
 */
function handleCodeChange(change) {
  if (!editor || change.fileName !== currentFile) return;
  
  console.log('✏️ Received code change from:', change.displayName);
  
  const model = editor.getModel();
  if (!model) return;
  
  // Apply the change
  const startPosition = model.getPositionAt(change.range.start);
  const endPosition = model.getPositionAt(change.range.end);
  
  const range = new monaco.Range(
    startPosition.lineNumber,
    startPosition.column,
    endPosition.lineNumber,
    endPosition.column
  );
  
  // Execute the edit
  model.pushEditOperations(
    [],
    [{ range: range, text: change.text }],
    () => null
  );
  
  // Show typing indicator
  showTypingIndicator(change.displayName, change.color);
}

/**
 * Handle cursor movements from other users
 */
function handleCursorMove(cursor) {
  if (!editor || cursor.userId === socket.id) return;
  
  // Store cursor position
  userCursors.set(cursor.userId, cursor);
  
  // Update cursor decorations
  updateCursorDecorations();
}

/**
 * Handle selection changes from other users
 */
function handleSelectionChange(selection) {
  if (!editor || selection.userId === socket.id) return;
  
  // Store selection
  userSelections.set(selection.userId, selection);
  
  // Update selection decorations
  updateSelectionDecorations();
}

/**
 * Handle cursors sync
 */
function handleCursorsSync(cursors) {
  console.log('🖱️ Received cursors sync:', cursors);
  
  // Clear existing cursors
  userCursors.clear();
  
  // Add all cursors
  cursors.forEach(cursor => {
    if (cursor.userId !== socket.id) {
      userCursors.set(cursor.userId, cursor);
    }
  });
  
  updateCursorDecorations();
}

/**
 * Handle selections sync
 */
function handleSelectionsSync(selections) {
  console.log('📝 Received selections sync:', selections);
  
  // Clear existing selections
  userSelections.clear();
  
  // Add all selections
  selections.forEach(selection => {
    if (selection.userId !== socket.id) {
      userSelections.set(selection.userId, selection);
    }
  });
  
  updateSelectionDecorations();
}

/**
 * Update cursor decorations in editor
 */
function updateCursorDecorations() {
  if (!editor) return;
  
  const decorations = Array.from(userCursors.values()).map(cursor => {
    const model = editor.getModel();
    const position = model.getPositionAt(cursor.position);
    
    return {
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
      options: {
        className: 'remote-cursor',
        hoverMessage: { value: cursor.displayName },
        beforeContentClassName: 'remote-cursor-before',
        afterContentClassName: 'remote-cursor-after'
      }
    };
  });
  
  editor.deltaDecorations([], decorations);
}

/**
 * Update selection decorations in editor
 */
function updateSelectionDecorations() {
  if (!editor) return;
  
  const decorations = Array.from(userSelections.values()).map(selection => {
    const model = editor.getModel();
    const startPosition = model.getPositionAt(selection.selection.start);
    const endPosition = model.getPositionAt(selection.selection.end);
    
    return {
      range: new monaco.Range(
        startPosition.lineNumber,
        startPosition.column,
        endPosition.lineNumber,
        endPosition.column
      ),
      options: {
        className: 'remote-selection',
        hoverMessage: { value: `${selection.displayName}'s selection` }
      }
    };
  });
  
  editor.deltaDecorations([], decorations);
}

/**
 * Handle file creation
 */
function handleFileCreated(data) {
  console.log('📄 File created:', data.file.fileName);
  showNotification(`File ${data.file.fileName} created by ${data.displayName}`, 'success');
  
  // Update file tabs
  if (currentSession && currentSession.files) {
    currentSession.files.push(data.file);
    updateFileTabs(currentSession.files);
  }
}

/**
 * Handle file deletion
 */
function handleFileDeleted(data) {
  console.log('🗑️ File deleted:', data.fileName);
  showNotification(`File ${data.fileName} deleted by ${data.displayName}`, 'warning');
  
  // Update file tabs
  if (currentSession && currentSession.files) {
    currentSession.files = currentSession.files.filter(f => f.fileName !== data.fileName);
    updateFileTabs(currentSession.files);
  }
}

/**
 * Handle file switching
 */
function handleFileSwitched(data) {
  console.log('🔄 File switched to:', data.fileName);
  
  if (data.fileName !== currentFile) {
    currentFile = data.fileName;
    
    // Update editor content
    const file = currentSession.files.find(f => f.fileName === data.fileName);
    if (file && editor) {
      const model = editor.getModel();
      model.setValue(file.content);
      
      const language = getLanguageFromFileName(file.fileName);
      monaco.editor.setModelLanguage(model, language);
    }
  }
}

/**
 * Handle users in session
 */
function handleUsersInSession(users) {
  console.log('👥 Users in session:', users);
  
  // Update collaborators list
  collaborators.clear();
  users.forEach(user => {
    collaborators.set(user.userId, user);
  });
  
  updateCollaboratorsList();
}

/**
 * Handle user joined
 */
function handleUserJoined(user) {
  console.log('👋 User joined:', user.displayName);
  showNotification(`${user.displayName} joined the session`, 'info');
  
  // Add to collaborators
  collaborators.set(user.userId, user);
  updateCollaboratorsList();
}

/**
 * Handle user left
 */
function handleUserLeft(user) {
  console.log('👋 User left:', user.displayName);
  showNotification(`${user.displayName} left the session`, 'info');
  
  // Remove from collaborators
  collaborators.delete(user.userId);
  updateCollaboratorsList();
  
  // Remove their cursors and selections
  userCursors.delete(user.userId);
  userSelections.delete(user.userId);
  updateCursorDecorations();
  updateSelectionDecorations();
}

/**
 * Handle collaborator updates
 */
function handleCollaboratorUpdate(update) {
  console.log('👥 Collaborator update:', update);
  
  const user = collaborators.get(update.userId);
  if (user) {
    Object.assign(user, update);
    updateCollaboratorsList();
  }
}

/**
 * Handle user typing
 */
function handleUserTyping(data) {
  if (data.userId === socket.id) return;
  
  showTypingIndicator(data.displayName, userColor);
}

/**
 * Handle user editing
 */
function handleUserEditing(data) {
  if (data.userId === socket.id) return;
  
  const user = collaborators.get(data.userId);
  if (user) {
    user.isEditing = data.isEditing;
    updateCollaboratorsList();
  }
}

/**
 * Handle code execution started
 */
function handleCodeExecutionStarted(data) {
  console.log('⚡ Code execution started by:', data.displayName);
  showNotification(`Code execution started by ${data.displayName}`, 'info');
}

/**
 * Handle code execution completed
 */
function handleCodeExecutionCompleted(result) {
  console.log('✅ Code execution completed:', result);
  showNotification(`Code executed successfully by ${result.displayName}`, 'success');
  
  // You can display the result in a console panel
  displayExecutionResult(result);
}

/**
 * Handle code execution error
 */
function handleCodeExecutionError(error) {
  console.error('❌ Code execution error:', error);
  showNotification(`Code execution failed: ${error.error}`, 'error');
}

/**
 * Handle session saved
 */
function handleSessionSaved(data) {
  console.log('💾 Session saved:', data);
  showNotification(`Session saved (${data.saveCount} saves)`, 'success');
}

/**
 * Handle session stats
 */
function handleSessionStats(stats) {
  console.log('📊 Session stats:', stats);
  updateStatusBar(`Files: ${stats.totalFiles} | Saves: ${stats.saveCount} | Last save: ${formatTime(stats.timeSinceLastSave)}`);
}

/**
 * Update collaborators list in UI
 */
function updateCollaboratorsList() {
  if (!collaboratorsList) return;
  
  collaboratorsList.innerHTML = '';
  
  collaborators.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'collaborator';
    userElement.innerHTML = `
      <div class="collaborator-info">
        <div class="collaborator-avatar" style="background-color: ${generateUserColor(user.displayName)}">
          ${user.displayName.charAt(0).toUpperCase()}
        </div>
        <div class="collaborator-details">
          <div class="collaborator-name">${user.displayName}</div>
          <div class="collaborator-status">
            ${user.isTyping ? 'typing...' : user.isEditing ? 'editing' : 'online'}
          </div>
        </div>
      </div>
    `;
    collaboratorsList.appendChild(userElement);
  });
}

/**
 * Update file tabs
 */
function updateFileTabs(files) {
  if (!fileTabs) return;
  
  fileTabs.innerHTML = '';
  
  files.forEach(file => {
    if (!file.isActive) return;
    
    const tabElement = document.createElement('div');
    tabElement.className = `file-tab ${file.fileName === currentFile ? 'active' : ''}`;
    tabElement.textContent = file.fileName;
    tabElement.onclick = () => switchToFile(file.fileName);
    fileTabs.appendChild(tabElement);
  });
}

/**
 * Switch to a different file
 */
function switchToFile(fileName) {
  if (fileName === currentFile) return;
  
  socket.emit('session-file-switch', {
    sessionId: currentSession.sessionId,
    fileName: fileName
  });
}

/**
 * Update connection status
 */
function updateConnectionStatus(status, type) {
  if (!connectionStatus) return;
  
  connectionStatus.textContent = status;
  connectionStatus.className = `connection-status ${type}`;
}

/**
 * Update status bar
 */
function updateStatusBar(message) {
  if (!statusBar) return;
  statusBar.textContent = message;
}

/**
 * Show typing indicator
 */
function showTypingIndicator(userName, color) {
  // You can implement a typing indicator UI here
  console.log(`${userName} is typing...`);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // You can implement a notification system here
  console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Show error
 */
function showError(message) {
  console.error('❌ Error:', message);
  showNotification(message, 'error');
}

/**
 * Display execution result
 */
function displayExecutionResult(result) {
  // You can implement a console panel to show execution results
  console.log('Execution Result:', result.result);
}

/**
 * Handle version mismatch
 */
function handleVersionMismatch(data) {
  console.warn('⚠️ Version mismatch, requesting full sync');
  
  // Request full code sync
  socket.emit('code-sync', {
    sessionId: currentSession.sessionId,
    code: editor.getValue(),
    version: data.currentVersion
  });
}

/**
 * Generate user color
 */
function generateUserColor(userName) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const index = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

/**
 * Get language from file name
 */
function getLanguageFromFileName(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown'
  };
  return languageMap[extension] || 'plaintext';
}

/**
 * Format time
 */
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Execute code
 */
function executeCode() {
  if (!isConnected || !currentSession) return;
  
  const code = editor.getValue();
  const language = getLanguageFromFileName(currentFile);
  
  socket.emit('execute-code', {
    sessionId: currentSession.sessionId,
    language: language,
    code: code
  });
}

/**
 * Force save session
 */
function forceSaveSession() {
  if (!isConnected || !currentSession) return;
  
  socket.emit('force-save-session', {
    sessionId: currentSession.sessionId
  });
}

/**
 * Get session statistics
 */
function getSessionStats() {
  if (!isConnected || !currentSession) return;
  
  socket.emit('get-session-stats', {
    sessionId: currentSession.sessionId
  });
}

/**
 * Recover session state
 */
function recoverSessionState() {
  if (!isConnected || !currentSession) return;
  
  socket.emit('recover-session-state', {
    sessionId: currentSession.sessionId,
    fileName: currentFile
  });
}

/**
 * Create new file
 */
function createNewFile() {
  if (!isConnected || !currentSession) return;
  
  const fileName = prompt('Enter file name:');
  if (!fileName) return;
  
  socket.emit('session-file-create', {
    sessionId: currentSession.sessionId,
    fileName: fileName,
    language: 'javascript',
    content: '// New file\n'
  });
}

/**
 * Delete current file
 */
function deleteCurrentFile() {
  if (!isConnected || !currentSession || !currentFile) return;
  
  if (confirm(`Are you sure you want to delete ${currentFile}?`)) {
    socket.emit('session-file-delete', {
      sessionId: currentSession.sessionId,
      fileName: currentFile
    });
  }
}

/**
 * Leave session
 */
function leaveSession() {
  if (!isConnected || !currentSession) return;
  
  socket.emit('leave-collaborative-session', {
    sessionId: currentSession.sessionId
  });
  
  // Disconnect socket
  if (socket) {
    socket.disconnect();
  }
  
  // Redirect to home page
  window.location.href = '/';
}

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  leaveSession();
});

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', initializeCollaborativeEditor);

// Export functions for global access
window.collaborativeEditor = {
  executeCode,
  forceSaveSession,
  getSessionStats,
  recoverSessionState,
  createNewFile,
  deleteCurrentFile,
  leaveSession
};
