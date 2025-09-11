import React, { useState } from 'react';
import './ParticipantList.css';

interface Participant {
  userId: string;
  name: string;
  avatar: string;
  status: 'joined' | 'active' | 'inactive';
  score?: number;
  passed?: number;
  total?: number;
  isOnline?: boolean;
  lastCursorPosition?: {
    lineNumber: number;
    column: number;
  };
  color?: string;
}

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
  onJumpToParticipant: (participant: Participant) => void;
  onFollowParticipant: (participantId: string) => void;
  followRelationship?: {
    followingId: string;
    followingName: string;
    startedAt: Date;
  } | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserId,
  onJumpToParticipant,
  onFollowParticipant,
  followRelationship,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);

  const getStatusIcon = (participant: Participant) => {
    if (participant.userId === currentUserId) return '👤';
    if (participant.status === 'active') return '🟢';
    if (participant.status === 'inactive') return '🔴';
    return '⚪';
  };

  const getStatusText = (participant: Participant) => {
    if (participant.userId === currentUserId) return 'You';
    if (participant.status === 'active') return 'Active';
    if (participant.status === 'inactive') return 'Inactive';
    return 'Joined';
  };

  const formatScore = (participant: Participant) => {
    if (participant.passed !== undefined && participant.total !== undefined) {
      return `${participant.passed}/${participant.total}`;
    }
    return participant.score ? participant.score.toString() : '0';
  };

  const getCursorPositionText = (participant: Participant) => {
    if (!participant.lastCursorPosition) return '';
    const { lineNumber, column } = participant.lastCursorPosition;
    return `L${lineNumber}:${column}`;
  };

  return (
    <div className={`participant-list ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="participant-list__header" onClick={onToggleCollapse}>
        <div className="participant-list__title">
          <span className="participant-icon">👥</span>
          <span className="participant-count">{participants.length}</span>
          <span className="participant-label">Participants</span>
        </div>
        <button className="participant-list__toggle">
          {isCollapsed ? '▶' : '▼'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="participant-list__content">
          {participants.length === 0 ? (
            <div className="participant-list__empty">
              <span className="empty-icon">👥</span>
              <p>No participants yet</p>
            </div>
          ) : (
            <div className="participant-list__items">
              {participants.map((participant) => {
                const isCurrentUser = participant.userId === currentUserId;
                const isFollowing = followRelationship?.followingId === participant.userId;
                const isHovered = hoveredParticipant === participant.userId;

                return (
                  <div
                    key={participant.userId}
                    className={`participant-item ${isCurrentUser ? 'current-user' : ''} ${isFollowing ? 'following' : ''}`}
                    onMouseEnter={() => setHoveredParticipant(participant.userId)}
                    onMouseLeave={() => setHoveredParticipant(null)}
                  >
                    <div className="participant-item__main">
                      <div className="participant-item__info">
                        <div className="participant-item__avatar" style={{ backgroundColor: participant.color }}>
                          {participant.avatar}
                        </div>
                        <div className="participant-item__details">
                          <div className="participant-item__name">
                            {participant.name}
                            {isCurrentUser && <span className="current-user-badge">You</span>}
                            {isFollowing && <span className="following-badge">Following</span>}
                          </div>
                          <div className="participant-item__status">
                            <span className="status-icon">{getStatusIcon(participant)}</span>
                            <span className="status-text">{getStatusText(participant)}</span>
                            {participant.lastCursorPosition && (
                              <span className="cursor-position">
                                {getCursorPositionText(participant)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="participant-item__metrics">
                        {participant.score !== undefined && (
                          <div className="participant-score">
                            <span className="score-label">Score:</span>
                            <span className="score-value">{formatScore(participant)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isCurrentUser && (
                      <div className={`participant-item__actions ${isHovered ? 'visible' : ''}`}>
                        <button
                          className="action-btn jump-btn"
                          onClick={() => onJumpToParticipant(participant)}
                          title="Jump to participant's cursor"
                        >
                          🎯 Jump
                        </button>
                        <button
                          className={`action-btn follow-btn ${isFollowing ? 'active' : ''}`}
                          onClick={() => onFollowParticipant(participant.userId)}
                          title={isFollowing ? 'Stop following' : 'Follow participant'}
                        >
                          {isFollowing ? '👁️ Following' : '👁️ Follow'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantList;

