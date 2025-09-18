import React from 'react';

type HistoryEntry = {
  sessionId: string;
  name?: string;
  finalizedAt?: string;
  topPlayer?: { username: string; score: number };
};

interface BattleHistoryProps {
  history?: HistoryEntry[];
}

export const BattleHistory: React.FC<BattleHistoryProps> = ({ history = [] }) => {
  return (
    <div className="battle-history">
      <h1>Battle History</h1>
      {history.length === 0 ? (
        <div className="empty">No battles yet.</div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.sessionId} className="history-item">
              <div className="title">{item.name || item.sessionId}</div>
              <div className="meta">
                <span>{item.finalizedAt ? new Date(item.finalizedAt).toLocaleString() : '—'}</span>
                {item.topPlayer && (
                  <span className="top-player">Winner: {item.topPlayer.username} ({item.topPlayer.score})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


