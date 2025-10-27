import React from 'react';
import UserAvatar from '../UserAvatar';

interface EditorHeaderProps {
  currentFile: string;
  sessionId: string;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  activeUsers: Array<{ userId: string; displayName: string; isTyping?: boolean; isEditing?: boolean }>;
  isExecuting: boolean;
  showSidebar: boolean;
  theme: 'vs-dark' | 'vs-light';
  onBackToDashboard: () => void;
  onRetryConnection: () => void;
  onToggleSidebar: () => void;
  onSave: () => void;
  onShare: () => void;
  onToggleTheme: () => void;
  onRun: () => void;
  onFollowUser: (userId: string, displayName: string) => void;
  onUnfollowUser: (userId: string, displayName: string) => void;
  followingUserId: string | null;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  currentFile,
  sessionId,
  connectionStatus,
  activeUsers,
  isExecuting,
  showSidebar,
  theme,
  onBackToDashboard,
  onRetryConnection,
  onToggleSidebar,
  onSave,
  onShare,
  onToggleTheme,
  onRun,
  onFollowUser,
  onUnfollowUser,
  followingUserId
}) => {
  return (
    <div className="vscode-header">
      <div className="header-section">
        <div className="header-left">
          <button className="back-btn" onClick={onBackToDashboard}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Dashboard
          </button>
          <div className="file-info">
            <span className="file-name">{currentFile}</span>
            <span className="file-path">Session: {sessionId}</span>
          </div>
        </div>

        <div className="header-center">
          <div className="connection-status">
            <span className={`connection-indicator ${connectionStatus}`}>
              <span className="connection-dot"></span>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'reconnecting' ? 'Reconnecting...' :
               connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
            </span>
            {connectionStatus === 'error' && (
              <button className="retry-btn" onClick={onRetryConnection} title="Retry Connection">🔄</button>
            )}
          </div>

          <div className="collaborators-info">
            <div className="collaborators-header">
              <span className="collaborators-count">{activeUsers.length} collaborator{activeUsers.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="collaborators-list">
              {activeUsers.slice(0, 3).map(user => (
                <UserAvatar
                  key={user.userId}
                  user={user as any}
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
          <button className={`header-btn ${showSidebar ? 'active' : ''}`} onClick={onToggleSidebar} title={`${showSidebar ? 'Hide' : 'Show'} Sidebar (Ctrl+B)`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            {showSidebar ? 'Hide' : 'Show'} Sidebar
          </button>

          <button className="header-btn save-btn" onClick={onSave} title="Save File (Ctrl+S)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            Save
          </button>

          <button className="header-btn share-btn" onClick={onShare} title="Copy Shareable Link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Share
          </button>

          <button className="header-btn" onClick={onToggleTheme} title="Toggle Theme">
            {theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>

          <button className="header-btn run-btn" onClick={onRun} title="Run Code (Ctrl+Enter)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Run
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorHeader;



