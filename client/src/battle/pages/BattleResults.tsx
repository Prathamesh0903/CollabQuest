import React from 'react';
import { useBattleContext } from '../context/BattleProvider';

export const BattleResults: React.FC = () => {
  const { state } = useBattleContext();

  const problem = state.currentBattle?.settings.problem;

  return (
    <div className="battle-results">
      <div className="results-header">
        <h1>Results{problem?.title ? `: ${problem.title}` : ''}</h1>
        {problem?.difficulty && (
          <div className="difficulty">Difficulty: {problem.difficulty}</div>
        )}
      </div>

      <div className="leaderboard-panel">
        <h3>Leaderboard</h3>
        <div className="leaderboard">
          {state.leaderboard.length === 0 && (
            <div className="empty">No results yet.</div>
          )}
          {state.leaderboard.map((entry) => (
            <div key={entry.userId} className="leaderboard-entry">
              <span className="rank">#{entry.rank}</span>
              <span className="username">{entry.username}</span>
              <span className="score">{entry.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


