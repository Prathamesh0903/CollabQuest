import React, { useState } from 'react';
import './FollowControls.css';

interface Participant {
  userId: string;
  name: string;
  avatar?: string;
  status: string;
}

interface FollowRelationship {
  followingId: string;
  followingName: string;
  startedAt: Date;
}

interface FollowControlsProps {
  participants: Participant[];
  followRelationship: FollowRelationship | null;
  followers: Map<string, { followerName: string; followerAvatar?: string; startedAt: Date }>;
  currentUserId?: string;
  onStartFollowing: (userId: string) => void;
  onStopFollowing: () => void;
  isFollowingMode: boolean;
}

const FollowControls: React.FC<FollowControlsProps> = ({
  participants,
  followRelationship,
  followers,
  currentUserId,
  onStartFollowing,
  onStopFollowing,
  isFollowingMode
}) => {
  const [showFollowMenu, setShowFollowMenu] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState(false);

  // Filter out current user from participants
  const otherParticipants = participants.filter(p => p.userId !== currentUserId);

  const handleStartFollowing = (userId: string) => {
    onStartFollowing(userId);
    setShowFollowMenu(false);
  };

  const handleStopFollowing = () => {
    onStopFollowing();
  };

  return (
    <div className="follow-controls">
      {/* Follow Button */}
      <div className="follow-button-container">
        {followRelationship ? (
          <button
            className="follow-button following"
            onClick={handleStopFollowing}
            title={`Stop following ${followRelationship.followingName}`}
          >
            <span className="follow-icon">👁️</span>
            <span className="follow-text">Following {followRelationship.followingName}</span>
            <span className="stop-follow-icon">✕</span>
          </button>
        ) : (
          <div className="follow-dropdown">
            <button
              className="follow-button"
              onClick={() => setShowFollowMenu(!showFollowMenu)}
              title="Follow a participant"
            >
              <span className="follow-icon">👁️</span>
              <span className="follow-text">Follow</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showFollowMenu && (
              <div className="follow-menu">
                <div className="follow-menu-header">
                  <span>Follow Participant</span>
                  <button 
                    className="close-menu"
                    onClick={() => setShowFollowMenu(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="follow-menu-content">
                  {otherParticipants.length > 0 ? (
                    otherParticipants.map(participant => (
                      <button
                        key={participant.userId}
                        className="follow-option"
                        onClick={() => handleStartFollowing(participant.userId)}
                      >
                        <div className="participant-avatar">
                          {participant.avatar ? (
                            <img src={participant.avatar} alt={participant.name} />
                          ) : (
                            <span>{participant.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="participant-name">{participant.name}</span>
                        <span className="follow-arrow">→</span>
                      </button>
                    ))
                  ) : (
                    <div className="no-participants">
                      No other participants to follow
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Followers Indicator */}
      {followers.size > 0 && (
        <div className="followers-indicator">
          <button
            className="followers-button"
            onClick={() => setShowFollowersList(!showFollowersList)}
            title={`${followers.size} follower${followers.size > 1 ? 's' : ''}`}
          >
            <span className="followers-icon">👥</span>
            <span className="followers-count">{followers.size}</span>
          </button>
          
          {showFollowersList && (
            <div className="followers-list">
              <div className="followers-header">
                <span>Following You</span>
                <button 
                  className="close-followers"
                  onClick={() => setShowFollowersList(false)}
                >
                  ✕
                </button>
              </div>
              <div className="followers-content">
                {Array.from(followers.entries()).map(([followerId, follower]) => (
                  <div key={followerId} className="follower-item">
                    <div className="follower-avatar">
                      {follower.followerAvatar ? (
                        <img src={follower.followerAvatar} alt={follower.followerName} />
                      ) : (
                        <span>{follower.followerName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="follower-name">{follower.followerName}</span>
                    <span className="follow-time">
                      {Math.floor((Date.now() - follower.startedAt.getTime()) / 1000)}s ago
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Following Mode Indicator */}
      {isFollowingMode && (
        <div className="following-mode-indicator">
          <span className="mode-icon">🎯</span>
          <span className="mode-text">Following Mode</span>
        </div>
      )}
    </div>
  );
};

export default FollowControls;
