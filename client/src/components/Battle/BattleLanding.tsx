import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BattleLanding.css';
import BattleConfigModal from './BattleConfigModal';
import Footer from '../Dashboard/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../utils/api';

const BattleLanding: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      console.log('BattleLanding component loaded successfully');
    } catch (error) {
      console.error('Error loading BattleLanding:', error);
      setHasError(true);
    }
  }, []);

  if (hasError) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#fff', 
        background: '#1a1a1a',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1>Something went wrong</h1>
        <p>Please try refreshing the page</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="battle-landing">
      <header className="battle-landing__header">
        <div className="battle-landing__brand">
          <span className="brand-mark">⚔️</span>
          <span className="brand-text">Code Battle Arena</span>
        </div>
        <button className="cta cta--ghost" onClick={() => navigate('/')}>Back to Dashboard</button>
      </header>

      <main className="battle-landing__hero">
        <div className="hero__left">
          <h1 className="hero__title">Challenge. Collaborate. Conquer.</h1>
          <p className="hero__subtitle">Face off in real-time on LeetCode-style problems. Track progress, race the clock, and climb the leaderboard.</p>
          <div className="hero__actions">
            <button className="cta" onClick={() => setIsModalOpen(true)}>Start Battle</button>
            <button className="cta cta--ghost" style={{ marginLeft: 12 }} onClick={() => setIsJoinOpen(true)}>Join Battle</button>
          </div>
          
          <div className="hero__benefits">
            <div className="benefit">
              <span className="benefit__icon">⏱️</span>
              <div>
                <div className="benefit__title">Timed Battles</div>
                <div className="benefit__desc">Choose 10/20/30 minutes. Stay sharp under pressure.</div>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit__icon">👥</span>
              <div>
                <div className="benefit__title">1v1 Battles</div>
                <div className="benefit__desc">Challenge friends or match with skilled opponents.</div>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit__icon">🏆</span>
              <div>
                <div className="benefit__title">Leaderboard & XP</div>
                <div className="benefit__desc">Earn points for correct submissions and speed.</div>
              </div>
            </div>
          </div>

          <div className="features-section">
            <h3 className="section-title">Why Choose Code Battle?</h3>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <div className="feature-content">
                  <h4>Real-time Collaboration</h4>
                  <p>Code together with live synchronization and instant feedback.</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div className="feature-content">
                  <h4>Curated Problems</h4>
                  <p>Hand-picked problems from Easy to Hard difficulty levels.</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-content">
                  <h4>Instant Execution</h4>
                  <p>Run and test your code instantly with our powerful execution engine.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero__right">
          <div className="problems-section">
            <h3 className="section-title">Featured Problems</h3>
            <div className="problems-grid">
              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-title">Two Sum</div>
                  <div className="badge badge--easy">Easy</div>
                </div>
                <div className="preview-body">
                  <p>Given an array of integers, return indices of the two numbers such that they add up to a specific target.</p>
                  <div className="preview-meta">
                    <span>Participants: 2</span>
                    <span>Time: 10:00</span>
                  </div>
                </div>
              </div>

              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-title">Valid Parentheses</div>
                  <div className="badge badge--easy">Easy</div>
                </div>
                <div className="preview-body">
                  <p>Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.</p>
                  <div className="preview-meta">
                    <span>Participants: 1</span>
                    <span>Time: 15:00</span>
                  </div>
                </div>
              </div>

              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-title">Product of Array Except Self</div>
                  <div className="badge badge--medium">Medium</div>
                </div>
                <div className="preview-body">
                  <p>Return an array answer such that answer[i] is the product of all elements of nums except nums[i].</p>
                  <div className="preview-meta">
                    <span>Participants: 3</span>
                    <span>Time: 20:00</span>
                  </div>
                </div>
              </div>

              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-title">Longest Consecutive Sequence</div>
                  <div className="badge badge--hard">Hard</div>
                </div>
                <div className="preview-body">
                  <p>Return the length of the longest consecutive elements sequence in an unsorted array of integers.</p>
                  <div className="preview-meta">
                    <span>Participants: 1</span>
                    <span>Time: 25:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <BattleConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {isJoinOpen && (
        <div className="battle-config-modal-overlay">
          <div className="battle-config-modal">
            <div className="modal-header">
              <div className="header-content">
                <h2>🔗 Join Battle</h2>
              </div>
              <button className="close-btn" onClick={() => { setIsJoinOpen(false); setJoinError(null); }}>×</button>
            </div>

            <div className="modal-body">
              <div className="step-content">
                <div className="step-header">
                  <h3>Paste invite link or enter room code</h3>
                  <p>Example link: {window.location.origin}/battle/join/ABC123</p>
                </div>

                <div style={{ marginTop: 16 }}>
                  <input
                    type="text"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="Paste link or type code (e.g., ABC123)"
                    className="share-link-input"
                    style={{ width: '100%' }}
                  />
                </div>

                {joinError && (
                  <div style={{ color: '#f87171', marginTop: 8 }}>{joinError}</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <div className="footer-content">
                <button className="btn btn-secondary" onClick={() => setIsJoinOpen(false)}>Cancel</button>
                <div className="step-info" />
                <button
                  className={`btn btn-primary ${joining ? 'loading' : ''}`}
                  disabled={joining || !joinInput.trim()}
                  onClick={async () => {
                    try {
                      setJoining(true);
                      setJoinError(null);
                      // Extract room code from link or raw input
                      const input = joinInput.trim();
                      const match = input.match(/battle\/join\/([A-Za-z0-9]+)/i);
                      const roomCode = (match ? match[1] : input).toUpperCase();
                      const token = await currentUser?.getIdToken();
                      const res = await fetch(`${API_BASE}/battle/join`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ roomCode })
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to join');
                      setIsJoinOpen(false);
                      navigate('/battle/play', { state: { battleConfig: { roomCode }, roomId: data.roomId } });
                    } catch (e: any) {
                      setJoinError(e.message || 'Failed to join room');
                    } finally {
                      setJoining(false);
                    }
                  }}
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleLanding;


