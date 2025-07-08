import React, { useState } from 'react';
import './RoomSelector.css';

interface RoomSelectorProps {
  onJoinRoom: (roomId: string, language: 'javascript' | 'python') => void;
}

const RoomSelector: React.FC<RoomSelectorProps> = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    
    setIsJoining(true);
    // Simulate a brief loading state
    setTimeout(() => {
      onJoinRoom(roomId.trim(), language);
      setIsJoining(false);
    }, 500);
  };

  const generateRandomRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomId(result);
  };

  return (
    <div className="room-selector">
      <div className="selector-container">
        <div className="selector-header">
          <h1>🚀 Collaborative Code Editor</h1>
          <p>Join a room and start coding with your team in real-time!</p>
        </div>

        <form onSubmit={handleJoinRoom} className="room-form">
          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <div className="room-input-group">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room ID (e.g., ABC123)"
                maxLength={6}
                required
              />
              <button
                type="button"
                className="generate-btn"
                onClick={generateRandomRoomId}
                title="Generate random room ID"
              >
                🎲
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="language">Programming Language</label>
            <div className="language-options">
              <label className="language-option">
                <input
                  type="radio"
                  name="language"
                  value="javascript"
                  checked={language === 'javascript'}
                  onChange={(e) => setLanguage(e.target.value as 'javascript' | 'python')}
                />
                <span className="language-card">
                  <span className="language-icon">⚡</span>
                  <span className="language-name">JavaScript</span>
                </span>
              </label>
              
              <label className="language-option">
                <input
                  type="radio"
                  name="language"
                  value="python"
                  checked={language === 'python'}
                  onChange={(e) => setLanguage(e.target.value as 'javascript' | 'python')}
                />
                <span className="language-card">
                  <span className="language-icon">🐍</span>
                  <span className="language-name">Python</span>
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="join-btn"
            disabled={isJoining || !roomId.trim()}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        <div className="features-list">
          <h3>✨ Features</h3>
          <ul>
            <li>Real-time collaborative editing</li>
            <li>Syntax highlighting for JavaScript & Python</li>
            <li>Dark/Light theme toggle</li>
            <li>Live user presence indicators</li>
            <li>Auto-save and sync</li>
            <li>Responsive design</li>
          </ul>
        </div>

        <div className="quick-start">
          <h3>🚀 Quick Start</h3>
          <ol>
            <li>Enter a room ID or generate one randomly</li>
            <li>Choose your preferred programming language</li>
            <li>Click "Join Room" to start coding</li>
            <li>Share the room ID with your teammates</li>
            <li>Start coding together in real-time!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RoomSelector; 