import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-avatar" onClick={toggleDropdown}>
        {currentUser.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt={currentUser.displayName || 'User'} 
            className="avatar-image"
          />
        ) : (
          <div className="avatar-placeholder">
            {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
          </div>
        )}
      </div>
      
      {isDropdownOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-name">
              {currentUser.displayName || 'Anonymous User'}
            </div>
            <div className="user-email">
              {currentUser.email}
            </div>
          </div>
          <div className="dropdown-actions">
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 