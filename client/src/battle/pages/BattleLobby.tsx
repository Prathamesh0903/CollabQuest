import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBattleSocket } from '../hooks/useBattleSocket';
import { useBattleContext } from '../context/BattleProvider';
import { PlayerCard } from '../components/PlayerCard';
import { Countdown } from '../components/Countdown';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const BattleLobby: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { state } = useBattleContext();
  const { joinLobby, toggleReady, startBattle } = useBattleSocket();
  const { currentUser } = useAuth();
  
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownTime, setCountdownTime] = useState(0);

  useEffect(() => {
    if (sessionId) {
      joinLobby(sessionId);
    }
  }, [sessionId, joinLobby]);

  const handleToggleReady = () => {
    toggleReady();
  };

  const canStartBattle = () => {
    return (
      state.participants.length >= 2 &&
      state.participants.every(p => p.isReady) &&
      state.currentBattle?.host === currentUser?.uid
    );
  };

  const handleStartBattle = () => {
    if (canStartBattle()) {
      startBattle();
    }
  };

  useEffect(() => {
    if (state.countdown && state.countdown > 0) {
      setShowCountdown(true);
      setCountdownTime(state.countdown);
    }
  }, [state.countdown]);

  const onCountdownComplete = () => {
    navigate(`/battle/play/${sessionId}`);
  };

  if (showCountdown) {
    return <Countdown initialCount={countdownTime} onComplete={onCountdownComplete} />;
  }

  return (
    <ErrorBoundary>
      <LoadingOverlay show={state.isLoading} />
      <div className="battle-lobby">
      <div className="lobby-header">
        <h1>{state.currentBattle?.name}</h1>
        <div className="room-code">
          Room: {sessionId}
          <button onClick={() => navigator.clipboard.writeText(sessionId || '')}>
            Copy
          </button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="participants-section">
          <h2>Participants ({state.participants.length}/{state.currentBattle?.maxParticipants})</h2>
          <div className="participants-grid">
            {state.participants.map(participant => (
              <PlayerCard 
                key={participant.userId}
                participant={participant}
                isHost={participant.userId === state.currentBattle?.host}
              />
            ))}
          </div>
        </div>

        <div className="problem-section">
          <h2>Challenge</h2>
          <div className="problem-preview">
            <h3>{state.currentBattle?.settings.problem?.title}</h3>
            <p>{state.currentBattle?.settings.problem?.description}</p>
            <div className="difficulty">
              Difficulty: {state.currentBattle?.settings.problem?.difficulty}
            </div>
          </div>
        </div>
      </div>

      <div className="lobby-actions">
        <button 
          onClick={handleToggleReady}
          className={`ready-btn ${state.participants.find(p => p.userId === currentUser?.uid)?.isReady ? 'ready' : 'not-ready'}`}
        >
          {state.participants.find(p => p.userId === currentUser?.uid)?.isReady ? 'Ready!' : 'Not Ready'}
        </button>

        {state.currentBattle?.host === currentUser?.uid && (
          <button 
            onClick={handleStartBattle}
            disabled={!canStartBattle()}
            className="start-battle-btn"
          >
            Start Battle
          </button>
        )}
      </div>
      {state.error && (
        <div className="empty" style={{ marginTop: 12 }}>Error: {state.error}</div>
      )}
      </div>
    </ErrorBoundary>
  );
};


