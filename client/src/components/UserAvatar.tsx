import React from 'react';
import './UserAvatar.css';

interface UserAvatarProps {
  user: {
    userId: string;
    displayName: string;
    avatar?: string;
    online?: boolean;
    isEditing?: boolean;
    isExecuting?: boolean;
  };
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
  showName?: boolean;
  className?: string;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowing?: boolean;
  canFollow?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
  showStatus = true,
  showName = false,
  className = '',
  onFollow,
  onUnfollow,
  isFollowing = false,
  canFollow = true
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusClass = () => {
    if (user.isExecuting) return 'executing';
    if (user.isEditing) return 'editing';
    if (user.online) return 'online';
    return 'offline';
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'medium';
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canFollow) return;
    
    if (isFollowing) {
      if (onUnfollow) {
        onUnfollow();
      }
    } else {
      if (onFollow) {
        onFollow();
      }
    }
  };

  return (
    <div 
      className={`user-avatar-container ${getSizeClass()} ${className} ${isFollowing ? 'following' : ''}`}
    >
      <div 
        className={`user-avatar ${getStatusClass()} ${canFollow ? 'clickable' : ''}`}
        onClick={handleAvatarClick}
        title={canFollow ? (isFollowing ? `Click to unfollow ${user.displayName}` : `Click to follow ${user.displayName}`) : ''}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.displayName} />
        ) : (
          <span className="avatar-initials">{getInitials(user.displayName)}</span>
        )}
        {showStatus && (
          <div className={`status-indicator ${getStatusClass()}`} />
        )}
        
        {/* Follow indicator overlay */}
        {isFollowing && (
          <div className="following-overlay">
            <span className="following-icon">👁️</span>
          </div>
        )}
      </div>
      
      {showName && (
        <span className="user-name">{user.displayName}</span>
      )}
      
      {/* Follow indicator badge */}
      {isFollowing && (
        <div className="following-badge" title={`Following ${user.displayName}`}>
          👁️
        </div>
      )}
    </div>
  );
};

export default UserAvatar; 