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
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
  showStatus = true,
  showName = false,
  className = ''
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

  return (
    <div className={`user-avatar-container ${getSizeClass()} ${className}`}>
      <div className={`user-avatar ${getStatusClass()}`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.displayName} />
        ) : (
          <span className="avatar-initials">{getInitials(user.displayName)}</span>
        )}
        {showStatus && (
          <div className={`status-indicator ${getStatusClass()}`} />
        )}
      </div>
      {showName && (
        <span className="user-name">{user.displayName}</span>
      )}
    </div>
  );
};

export default UserAvatar; 