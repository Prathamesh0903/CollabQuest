import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContestList from './ContestList';
import Leaderboard from './Leaderboard';
import './contests.css';

export const ContestsPage: React.FC = () => {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'all' | 'live' | 'upcoming' | 'ended'>('all');
  const navigate = useNavigate();
  return (
    <div className="app" style={{ padding: 16 }}>
      <div className="cq-contests">
        <div className="cq-header">
          <h2>Weekly Contests</h2>
          <p className="cq-subtitle">Compete weekly. Solve curated problems. Climb the leaderboard.</p>
        </div>
        <div className="cq-banner">
          <div className="cq-banner-left">
            <div className="cq-title">This Week’s Spotlight Contest</div>
            <div className="cq-desc">High-value problems with fair scoring and anti-cheat. Join and start solving.</div>
          </div>
          <div className="cq-banner-cta">
            <button className="cq-btn" onClick={() => navigate('/')}>Dashboard</button>
            <button className="cq-btn cq-btn-primary" onClick={() => setSelected('demo-1')}>View Leaderboard</button>
            <button className="cq-btn" onClick={() => { setSelected(null); setTab('all'); }}>Explore All</button>
          </div>
        </div>
        <div className={`cq-grid ${selected ? 'two' : ''}`}>
          <div className="cq-card">
            <div className="cq-section">
              <div className="cq-title">Contests</div>
              <div className="cq-desc">Browse live and upcoming weekly contests.</div>
              <div className="cq-spacer" />
              <div className="cq-tabs">
                <div className={`cq-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All</div>
                <div className={`cq-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>Live</div>
                <div className={`cq-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</div>
                <div className={`cq-tab ${tab === 'ended' ? 'active' : ''}`} onClick={() => setTab('ended')}>Ended</div>
              </div>
            </div>
            <div className="cq-section">
              <ContestList onSelect={setSelected} filter={tab} />
            </div>
          </div>
          {selected && (
            <div className="cq-card">
              <div className="cq-section">
                <div className="cq-title">Leaderboard</div>
                <div className="cq-desc">Live scores update automatically during contests.</div>
              </div>
              <div className="cq-section">
                <div className="cq-table-head cq-section" style={{ borderBottom: '1px solid rgba(229,229,229,0.06)' }}>
                  <div>#</div>
                  <div>Participant</div>
                  <div style={{ textAlign: 'right' }}>Score</div>
                </div>
                <Leaderboard contestId={selected} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestsPage;


