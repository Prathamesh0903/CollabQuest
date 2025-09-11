import React, { useState, useEffect } from 'react';
import './ActivityFeed.css';

interface ActivityItem {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  activity: 'test-run' | 'submission' | 'code-change' | 'joined' | 'left';
  timestamp: Date;
  details: {
    action: string;
    description: string;
    score?: number;
    passed?: number;
    total?: number;
    timeMs?: number;
    linesChanged?: number;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isVisible: boolean;
  onToggle: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isVisible, onToggle }) => {
  const [filter, setFilter] = useState<'all' | 'test-run' | 'submission' | 'code-change'>('all');

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.activity === filter
  );

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'test-run':
        return '🧪';
      case 'submission':
        return '📤';
      case 'code-change':
        return '✏️';
      case 'joined':
        return '👋';
      case 'left':
        return '👋';
      default:
        return '📝';
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'test-run':
        return '#4ECDC4';
      case 'submission':
        return '#45B7D1';
      case 'code-change':
        return '#96CEB4';
      case 'joined':
        return '#FFEAA7';
      case 'left':
        return '#DDA0DD';
      default:
        return '#F7DC6F';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '#666';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className={`activity-feed ${isVisible ? 'visible' : ''}`}>
      <div className="activity-feed__header">
        <div className="activity-feed__title">
          <span className="activity-icon">📊</span>
          <span>Activity Feed</span>
        </div>
        <button className="activity-feed__toggle" onClick={onToggle}>
          {isVisible ? '−' : '+'}
        </button>
      </div>

      {isVisible && (
        <>
          <div className="activity-feed__filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'test-run' ? 'active' : ''}`}
              onClick={() => setFilter('test-run')}
            >
              🧪 Tests
            </button>
            <button 
              className={`filter-btn ${filter === 'submission' ? 'active' : ''}`}
              onClick={() => setFilter('submission')}
            >
              📤 Submissions
            </button>
            <button 
              className={`filter-btn ${filter === 'code-change' ? 'active' : ''}`}
              onClick={() => setFilter('code-change')}
            >
              ✏️ Code
            </button>
          </div>

          <div className="activity-feed__content">
            {filteredActivities.length === 0 ? (
              <div className="activity-feed__empty">
                <span className="empty-icon">📭</span>
                <p>No activities yet</p>
                <small>Activities will appear here as participants work</small>
              </div>
            ) : (
              <div className="activity-feed__list">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-item__header">
                      <div className="activity-item__user">
                        <span className="user-avatar">{activity.avatar}</span>
                        <span className="user-name">{activity.displayName}</span>
                      </div>
                      <span className="activity-timestamp">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    
                    <div className="activity-item__content">
                      <div className="activity-item__icon" style={{ backgroundColor: getActivityColor(activity.activity) }}>
                        {getActivityIcon(activity.activity)}
                      </div>
                      <div className="activity-item__details">
                        <div className="activity-action">{activity.details.action}</div>
                        <div className="activity-description">{activity.details.description}</div>
                        
                        {activity.activity === 'submission' && activity.details.score && (
                          <div className="activity-metrics">
                            <span className="metric score" style={{ color: getScoreColor(activity.details.score) }}>
                              Score: {activity.details.score}
                            </span>
                            <span className="metric tests">
                              {activity.details.passed}/{activity.details.total} tests
                            </span>
                            {activity.details.timeMs && (
                              <span className="metric time">
                                {activity.details.timeMs}ms
                              </span>
                            )}
                          </div>
                        )}
                        
                        {activity.activity === 'test-run' && (
                          <div className="activity-metrics">
                            {activity.details.passed !== undefined && activity.details.total !== undefined ? (
                              <>
                                <span className="metric tests">
                                  {activity.details.passed}/{activity.details.total} tests
                                </span>
                                {activity.details.timeMs && (
                                  <span className="metric time">
                                    {activity.details.timeMs}ms
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="metric">Running test cases</span>
                            )}
                          </div>
                        )}
                        
                        {activity.activity === 'code-change' && activity.details.linesChanged && (
                          <div className="activity-metrics">
                            <span className="metric">
                              {activity.details.linesChanged} lines changed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityFeed;
