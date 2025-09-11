import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SpectatorView from '../SpectatorView';
import './SpectatorMode.css';

interface SpectatorModeProps {
  roomId: string;
  roomCode: string;
  onExit?: () => void;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  ready: boolean;
  joinedAt?: string;
  lastSeen?: string;
  elapsedSeconds?: number;
}

interface BattleInfo {
  started: boolean;
  ended: boolean;
  durationMinutes?: number;
  problemId?: string;
  difficulty?: string;
  startedAt?: string;
  endedAt?: string;
}

const SpectatorMode: React.FC<SpectatorModeProps> = ({
  roomId,
  roomCode,
  onExit
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [battleInfo, setBattleInfo] = useState<BattleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch spectator data
  const fetchSpectatorData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await currentUser?.getIdToken();
      const response = await fetch(`/api/battle/${roomId}/spectator`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch spectator data: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.participants || []);
        setBattleInfo(data.battleInfo || null);
      } else {
        throw new Error(data.error || 'Failed to fetch spectator data');
      }
    } catch (err) {
      console.error('Error fetching spectator data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spectator data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (roomId && currentUser) {
      fetchSpectatorData();
    }
  }, [roomId, currentUser]);

  // Handle exit spectator mode
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      navigate('/battle');
    }
  };

  // Handle join as participant
  const handleJoinAsParticipant = () => {
    navigate('/battle/join', {
      state: {
        roomCode,
        role: 'participant'
      }
    });
  };

  if (isLoading) {
    return (
      <div className="spectator-mode-loading">
        <div className="loading-spinner"></div>
        <p>Loading spectator mode...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spectator-mode-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Spectator Mode</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={fetchSpectatorData} className="retry-button">
            Retry
          </button>
          <button onClick={handleExit} className="exit-button">
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="spectator-mode-container">
      <div className="spectator-mode-header">
        <div className="header-info">
          <h2>👁️ Spectator Mode</h2>
          <p>Room: {roomCode}</p>
          {battleInfo && (
            <div className="battle-status">
              {battleInfo.started && !battleInfo.ended && (
                <span className="status-badge active">⚔️ Battle Active</span>
              )}
              {battleInfo.ended && (
                <span className="status-badge ended">🏁 Battle Ended</span>
              )}
              {!battleInfo.started && (
                <span className="status-badge waiting">⏳ Waiting to Start</span>
              )}
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            onClick={handleJoinAsParticipant}
            className="join-participant-button"
            disabled={battleInfo?.ended}
          >
            Join as Participant
          </button>
          <button onClick={handleExit} className="exit-button">
            Exit Spectator Mode
          </button>
        </div>
      </div>

      <div className="spectator-mode-content">
        {participants.length === 0 ? (
          <div className="no-participants">
            <div className="no-participants-icon">👥</div>
            <h3>No Participants Yet</h3>
            <p>Waiting for participants to join the battle...</p>
          </div>
        ) : (
          <SpectatorView
            roomId={roomId}
            participants={participants}
            battleInfo={battleInfo || undefined}
          />
        )}
      </div>

      <div className="spectator-mode-footer">
        <div className="footer-info">
          <span>👁️ Spectator Mode - View Only Access</span>
          <span>•</span>
          <span>Participants: {participants.length}</span>
          <span>•</span>
          <span>Active: {participants.filter(p => p.isActive).length}</span>
        </div>
        <div className="footer-help">
          <span>💡 Tip: You can see all participant code, cursors, and test results in real-time</span>
        </div>
      </div>
    </div>
  );
};

export default SpectatorMode;

