import React, { useState } from 'react';
import './UserSidebar.css';

export interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  socketId: string;
  online: boolean;
  isTyping?: boolean;
  isEditing?: boolean;
  lastSeen?: Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
  customMessage?: string;
  color?: string;
}

interface UserSidebarProps {
  users: UserInfo[];
  currentUserId: string;
  roomId: string;
  isVisible: boolean;
  onToggle: () => void;
  onUserClick?: (user: UserInfo) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({
  users,
  currentUserId,
  roomId,
  isVisible,
  onToggle,
  onUserClick
}) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate online and offline users
  const onlineUsers = filteredUsers.filter(user => user.online);
  const offlineUsers = filteredUsers.filter(user => !user.online);

  const getStatusIcon = (user: UserInfo) => {
    if (!user.online) return '🔴';
    if (user.isTyping) return '✏️';
    if (user.isEditing) return '💻';
    if (user.status === 'away') return '🟡';
    if (user.status === 'busy') return '🔴';
    return '🟢';
  };

  const getStatusText = (user: UserInfo) => {
    if (!user.online) return 'Offline';
    if (user.isTyping) return 'Typing...';
    if (user.isEditing) return 'Editing code';
    if (user.status === 'away') return 'Away';
    if (user.status === 'busy') return 'Busy';
    return 'Online';
  };

  const getStatusColor = (user: UserInfo) => {
    if (!user.online) return '#f44336';
    if (user.isTyping || user.isEditing) return '#2196f3';
    if (user.status === 'away') return '#ff9800';
    if (user.status === 'busy') return '#f44336';
    return '#4caf50';
  };

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return '';
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleUserClick = (user: UserInfo) => {
    if (onUserClick) {
      onUserClick(user);
    }
    setExpandedUser(expandedUser === user.userId ? null : user.userId);
  };

  const UserItem: React.FC<{ user: UserInfo; isOnline: boolean }> = ({ user, isOnline }) => (
    <div 
      className={`user-item ${isOnline ? 'online' : 'offline'} ${expandedUser === user.userId ? 'expanded' : ''}`}
      onClick={() => handleUserClick(user)}
    >
      <div className="user-avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={user.displayName} />
        ) : (
          <div 
            className="avatar-placeholder"
            style={{ backgroundColor: user.color || '#667eea' }}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(user) }}
        />
      </div>
      
      <div className="user-info">
        <div className="user-name">
          {user.displayName}
          {user.userId === currentUserId && <span className="current-user-badge">You</span>}
        </div>
        <div className="user-status">
          <span className="status-icon">{getStatusIcon(user)}</span>
          <span className="status-text">{getStatusText(user)}</span>
        </div>
        
        {expandedUser === user.userId && (
          <div className="user-details">
            {user.customMessage && (
              <div className="custom-message">
                💬 {user.customMessage}
              </div>
            )}
            {!user.online && user.lastSeen && (
              <div className="last-seen">
                Last seen: {formatLastSeen(user.lastSeen)}
              </div>
            )}
            <div className="user-actions">
              <button className="action-btn" title="Send message">
                💬 Message
              </button>
              <button className="action-btn" title="View profile">
                👤 Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`user-sidebar ${isVisible ? 'visible' : ''}`}>
      <div className="sidebar-header">
        <div className="header-content">
          <h3>👥 Active Users</h3>
          <span className="user-count">{onlineUsers.length} online</span>
        </div>
        <button className="toggle-btn" onClick={onToggle} title="Toggle Sidebar">
          {isVisible ? '◀' : '▶'}
        </button>
      </div>

      <div className="sidebar-content">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="users-section">
          {onlineUsers.length > 0 && (
            <div className="user-group">
              <div className="group-header">
                <span className="group-title">🟢 Online ({onlineUsers.length})</span>
              </div>
              <div className="user-list">
                {onlineUsers.map((user) => (
                  <UserItem key={user.userId} user={user} isOnline={true} />
                ))}
              </div>
            </div>
          )}

          {offlineUsers.length > 0 && (
            <div className="user-group">
              <div className="group-header">
                <span className="group-title">🔴 Offline ({offlineUsers.length})</span>
              </div>
              <div className="user-list">
                {offlineUsers.map((user) => (
                  <UserItem key={user.userId} user={user} isOnline={false} />
                ))}
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="no-users">
              <span className="no-users-icon">👥</span>
              <span className="no-users-text">
                {searchTerm ? 'No users found' : 'No users in this room'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="room-info">
          <span className="room-id">Room: {roomId}</span>
        </div>
      </div>
    </div>
  );
};

export default UserSidebar; 