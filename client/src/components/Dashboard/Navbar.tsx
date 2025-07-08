import React from 'react';
import '../Dashboard.css';

interface NavbarProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCreateRoom, onJoinRoom }) => (
  <header className="dashboard-navbar dashboard-navbar-modern">
    <div className="navbar-logo gamified-logo">
      <span role="img" aria-label="logo">🎮</span> Collab Quest
    </div>
    <nav className="navbar-links navbar-links-modern">
      <button className="navbar-action" onClick={onCreateRoom}>Create Room</button>
      <button className="navbar-action" onClick={onJoinRoom}>Join Room</button>
      <button className="navbar-action">Profile</button>
    </nav>
  </header>
);

export default Navbar;