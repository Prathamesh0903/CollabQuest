import React, { useState } from 'react';
import '../Dashboard.css';

type RoomModalProps = {
  type: 'create' | 'join';
  onClose: () => void;
  onSubmit: (roomId: string, password: string, roomMode?: 'battle' | 'collab', language?: 'javascript' | 'python') => void;
};

const RoomModal: React.FC<RoomModalProps> = ({ type, onClose, onSubmit }) => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [roomMode, setRoomMode] = useState<'battle' | 'collab'>('collab');
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'create') {
      onSubmit(roomId, password, roomMode, language);
    } else {
      onSubmit(roomId, password, undefined, language);
    }
  };

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
        <h2>{type === 'create' ? 'Create Room' : 'Join Room'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Room Name/ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Room Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <div className="language-options">
            <label>
              <input
                type="radio"
                name="language"
                value="javascript"
                checked={language === 'javascript'}
                onChange={() => setLanguage('javascript')}
              />
              JavaScript
            </label>
            <label>
              <input
                type="radio"
                name="language"
                value="python"
                checked={language === 'python'}
                onChange={() => setLanguage('python')}
              />
              Python
            </label>
          </div>
          {type === 'create' && (
            <div className="room-mode-options">
              <label>
                <input
                  type="radio"
                  name="roomMode"
                  value="battle"
                  checked={roomMode === 'battle'}
                  onChange={() => setRoomMode('battle')}
                />
                Battle
              </label>
              <label>
                <input
                  type="radio"
                  name="roomMode"
                  value="collab"
                  checked={roomMode === 'collab'}
                  onChange={() => setRoomMode('collab')}
                />
                Collaborative Coding
              </label>
            </div>
          )}
          <button type="submit">{type === 'create' ? 'Create' : 'Join'}</button>
        </form>
        <button className="close-modal" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default RoomModal; 