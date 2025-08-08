import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const handleProfileHover = () => {
    setDropdownVisible(true);
  };

  const handleProfileLeave = () => {
    setDropdownVisible(false);
  };

  return (
    <header className="dashboard-navbar">
      <div className="navbar-left">
        <span role="button" className="navbar-logo">
          <span className="logo-text">Collab Quest</span>
        </span>
        <ul className="nav-links">
          <li><span role="button">About</span></li>
          <li><span role="button">Code Together</span></li>
          <li><span role="button">Contest</span></li>
          <li><span role="button">Discuss</span></li>
        </ul>
      </div>
      <div 
        className="navbar-right"
        onMouseEnter={handleProfileHover}
        onMouseLeave={handleProfileLeave}
      >
        <div className="user-profile">
          <span className="profile-icon">👤</span>
        </div>
        {isDropdownVisible && (
          <div className="profile-dropdown">
            {currentUser && (
              <div className="user-info">
                <p>{currentUser.displayName || currentUser.email}</p>
              </div>
            )}
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
