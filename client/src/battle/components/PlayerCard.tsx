import React from 'react';
import { BattleParticipant } from '../types/battle';

interface PlayerCardProps {
  participant: BattleParticipant;
  isHost?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ participant, isHost = false }) => {
  return (
    <div className={`player-card ${participant.isReady ? 'ready' : ''}`}>
      <div className="player-avatar">
        {participant.avatar ? (
          <img src={participant.avatar} alt={participant.username} />
        ) : (
          <div className="avatar-placeholder">{participant.username.charAt(0).toUpperCase()}</div>
        )}
      </div>
      <div className="player-info">
        <div className="player-name">
          {participant.username}
          {isHost && <span className="host-badge">Host</span>}
        </div>
        <div className={`player-status ${participant.isReady ? 'text-green-500' : 'text-yellow-500'}`}>
          {participant.isReady ? 'Ready' : 'Waiting'}
        </div>
      </div>
    </div>
  );
};


