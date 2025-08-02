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
        <a href="#" className="navbar-logo">
          <span className="logo-text">Collab Quest</span>
        </a>
        <ul className="nav-links">
          <li><a href="#">About</a></li>
          <li><a href="#">Code Together</a></li>
          <li><a href="#">Contest</a></li>
          <li><a href="#">Discuss</a></li>
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
