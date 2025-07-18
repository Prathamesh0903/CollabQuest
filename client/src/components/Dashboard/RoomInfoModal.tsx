import React from 'react';
import '../Dashboard.css';

interface RoomInfoModalProps {
  open: boolean;
  onClose: () => void;
  roomCode: string;
  password: string;
  sharableLink: string;
  isHost?: boolean;
  onStartBattle?: () => void;
}

const RoomInfoModal: React.FC<RoomInfoModalProps> = ({
  open,
  onClose,
  roomCode,
  password,
  sharableLink,
  isHost = false,
  onStartBattle
}) => {
  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sharableLink);
  };

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
        <h2>Room Created!</h2>
        <div className="room-info-block">
          <div><b>Room Code:</b> <span className="room-info-value">{roomCode}</span></div>
          <div><b>Password:</b> <span className="room-info-value">{password}</span></div>
          <div style={{ marginTop: 12 }}>
            <b>Sharable Link:</b>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={sharableLink}
                readOnly
                style={{ flex: 1, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <button onClick={handleCopy} style={{ padding: '4px 12px' }}>Copy</button>
            </div>
          </div>
        </div>
        {isHost && onStartBattle && (
          <button className="modal-submit-btn" style={{ marginTop: 20 }} onClick={onStartBattle}>
            Start Battle
          </button>
        )}
        <button className="close-modal" onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
};

export default RoomInfoModal; 