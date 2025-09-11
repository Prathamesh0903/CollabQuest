import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../utils/api';
import './BattleResults.css';

interface BattleResult {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  passed: number;
  total: number;
  timeMs: number;
  codeLength: number;
  rank: number;
  isWinner: boolean;
}

interface BattleResultsProps {
  roomId: string;
  roomCode: string;
  onPlayAgain?: () => void;
}

const BattleResults: React.FC<BattleResultsProps> = ({ roomId, roomCode, onPlayAgain }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [results, setResults] = useState<BattleResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [battleInfo, setBattleInfo] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchBattleResults();
    fetchAnalytics();
  }, [roomId]);

  const fetchBattleResults = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/${roomId}/results`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error('Failed to fetch battle results');
      
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setBattleInfo(data.battleInfo || null);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Fetch results error:', err);
      setError(err.message || 'Failed to load results');
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/${roomId}/analytics`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
    } catch (e) {
      // non-fatal
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    if (score >= 50) return '#ef4444';
    return '#6b7280';
  };

  if (isLoading) {
    return (
      <div className="battle-results">
        <div className="results-loading">
          <div className="loading-spinner"></div>
          <p>Calculating results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="battle-results">
        <div className="results-error">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/battle')}>
            Back to Battle
          </button>
        </div>
      </div>
    );
  }

  const winner = results.find(r => r.isWinner);
  const currentUserResult = results.find(r => r.userId === currentUser?.uid);

  return (
    <div className="battle-results">
      <div className="results-header">
        <div className="results-brand">
          <span className="brand-icon">🏆</span>
          <h1>Battle Results</h1>
        </div>
        <div className="room-info">
          <span className="room-code">Room: {roomCode}</span>
        </div>
      </div>

      <div className="results-content">
        {/* Winner Announcement */}
        {winner && (
          <div className="winner-announcement">
            <div className="winner-crown">👑</div>
            <h2>Congratulations!</h2>
            <div className="winner-info">
              <div className="winner-avatar">{winner.avatar || '👤'}</div>
              <div className="winner-details">
                <div className="winner-name">{winner.name}</div>
                <div className="winner-score">Score: {winner.score}</div>
              </div>
            </div>
            <div className="victory-message">
              {winner.name} has won the battle with an impressive score of {winner.score}!
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="results-table-section">
          <h2>Final Rankings</h2>
          <div className="results-table">
            {results.map((result, index) => (
              <div key={result.userId} className={`result-row ${result.isWinner ? 'winner' : ''} ${result.userId === currentUser?.uid ? 'current-user' : ''}`}>
                <div className="rank-cell">
                  <span className="rank-icon">{getRankIcon(result.rank)}</span>
                </div>
                <div className="player-cell">
                  <div className="player-avatar">{result.avatar || '👤'}</div>
                  <div className="player-info">
                    <div className="player-name">
                      {result.name}
                      {result.userId === currentUser?.uid && <span className="you-badge">You</span>}
                    </div>
                    <div className="player-stats">
                      {result.passed}/{result.total} tests passed
                    </div>
                  </div>
                </div>
                <div className="score-cell">
                  <div className="score-value" style={{ color: getScoreColor(result.score) }}>
                    {result.score}
                  </div>
                  <div className="score-label">Score</div>
                </div>
                <div className="time-cell">
                  <div className="time-value">{formatTime(result.timeMs)}</div>
                  <div className="time-label">Time</div>
                </div>
                <div className="code-cell">
                  <div className="code-value">{result.codeLength}</div>
                  <div className="code-label">Chars</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Battle Statistics */}
        {battleInfo && (
          <div className="battle-stats-section">
            <h2>Battle Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-value">{battleInfo.durationMinutes || 10}</div>
                  <div className="stat-label">Minutes</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{battleInfo.difficulty || 'Easy'}</div>
                  <div className="stat-label">Difficulty</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{results.length}</div>
                  <div className="stat-label">Participants</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)}</div>
                  <div className="stat-label">Avg Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Breakdown */}
        {currentUserResult && (
          <div className="performance-section">
            <h2>Your Performance</h2>
            <div className="performance-card">
              <div className="performance-metrics">
                <div className="metric">
                  <div className="metric-label">Accuracy</div>
                  <div className="metric-value">
                    {Math.round((currentUserResult.passed / currentUserResult.total) * 100)}%
                  </div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: `${(currentUserResult.passed / currentUserResult.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">Speed</div>
                  <div className="metric-value">{formatTime(currentUserResult.timeMs)}</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill speed" 
                      style={{ width: `${Math.max(0, 100 - (currentUserResult.timeMs / 60000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">Code Efficiency</div>
                  <div className="metric-value">{currentUserResult.codeLength} chars</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill efficiency" 
                      style={{ width: `${Math.max(0, 100 - (currentUserResult.codeLength / 1000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Collaboration Analytics */}
        {analytics && (
          <div className="analytics-section">
            <h2>Collaboration Analytics</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-title">Contribution %</div>
                <div className="contrib-list">
                  {analytics.contributions.map((c: any) => (
                    <div key={c.userId} className="contrib-item">
                      <div className="contrib-bar">
                        <div className="contrib-fill" style={{ width: `${c.contributionPct}%` }}></div>
                      </div>
                      <div className="contrib-meta">
                        <span className="contrib-user">{c.userId.slice(0,6)}</span>
                        <span className="contrib-pct">{c.contributionPct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-title">Interaction Heatmap</div>
                <div className="heatmap">
                  {analytics.heatmap.map((v: number, i: number) => (
                    <div key={i} className="heat-cell" style={{ opacity: Math.min(1, 0.1 + (v/Math.max(1, Math.max(...analytics.heatmap))) ) }}></div>
                  ))}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-title">Activity Timeline</div>
                <div className="timeline">
                  {analytics.timeline.map((t: any) => (
                    <div key={t.ts} className="timeline-bar" title={`${new Date(t.ts).toLocaleTimeString()} • ${t.activity}`}>
                      <div className="timeline-fill" style={{ height: `${Math.min(100, t.activity)}%` }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="results-footer">
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={() => navigate('/battle')}>
            ← Back to Battle
          </button>
          {onPlayAgain && (
            <button className="btn btn-primary" onClick={onPlayAgain}>
              🔄 Play Again
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResults;
