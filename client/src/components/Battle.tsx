import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Battle.css';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  description?: string;
}

interface BattleRoom {
  roomId: string;
  roomCode: string;
  problem: Problem;
  state: any;
}

const Battle: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create battle form state
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [battleTime, setBattleTime] = useState<number>(10);
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [problems, setProblems] = useState<Problem[]>([]);
  
  // Join battle form state
  const [roomCode, setRoomCode] = useState<string>('');

  // Fetch available problems
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/dsa/problems?limit=20`);
        if (response.ok) {
          const data = await response.json();
          setProblems(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch problems:', error);
      }
    };

    fetchProblems();
  }, []);

  const handleCreateBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in to create a battle');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/battle/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          difficulty,
          battleTime,
          selectedProblem: selectedProblem || undefined,
          questionSelection: selectedProblem ? 'specific' : 'random'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to battle play page
        navigate(`/battle/play/${data.problem.id}`, { 
          state: { 
            roomId: data.roomId, 
            roomCode: data.roomCode,
            problem: data.problem,
            isHost: true
          }
        });
      } else {
        setError(data.error || 'Failed to create battle room');
      }
    } catch (error) {
      console.error('Error creating battle:', error);
      setError('Failed to create battle room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in to join a battle');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/battle/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomCode: roomCode.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to battle play page
        navigate(`/battle/play/${data.state.battle.problemId}`, { 
          state: { 
            roomId: data.room._id, 
            roomCode: data.roomCode,
            problem: data.state.battle,
            isHost: false
          }
        });
      } else {
        setError(data.error || 'Failed to join battle room');
      }
    } catch (error) {
      console.error('Error joining battle:', error);
      setError('Failed to join battle room. Please check the room code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="battle-page">
      <div className="battle-container">
        {/* Header */}
        <div className="battle-header">
          <h1>⚔️ Battle Mode</h1>
          <p>Compete in timed coding battles and climb the leaderboard!</p>
        </div>

        {/* Tab Navigation */}
        <div className="battle-tabs">
          <button 
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Battle
          </button>
          <button 
            className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Battle
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Create Battle Form */}
        {activeTab === 'create' && (
          <div className="battle-form">
            <h2>Create New Battle</h2>
            <form onSubmit={handleCreateBattle}>
              <div className="form-group">
                <label htmlFor="difficulty">Difficulty</label>
                <select 
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="battleTime">Battle Duration (minutes)</label>
                <input
                  type="number"
                  id="battleTime"
                  value={battleTime}
                  onChange={(e) => setBattleTime(Number(e.target.value))}
                  min="1"
                  max="180"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="problem">Problem Selection</label>
                <select 
                  id="problem"
                  value={selectedProblem}
                  onChange={(e) => setSelectedProblem(e.target.value)}
                >
                  <option value="">Random Problem</option>
                  {problems.map((problem) => (
                    <option key={problem.id} value={problem.id}>
                      {problem.title} ({problem.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="battle-button create-button"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Battle'}
              </button>
            </form>
          </div>
        )}

        {/* Join Battle Form */}
        {activeTab === 'join' && (
          <div className="battle-form">
            <h2>Join Battle</h2>
            <form onSubmit={handleJoinBattle}>
              <div className="form-group">
                <label htmlFor="roomCode">Room Code</label>
                <input
                  type="text"
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character room code"
                  maxLength={6}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="battle-button join-button"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Battle'}
              </button>
            </form>
          </div>
        )}

        {/* Battle Info */}
        <div className="battle-info">
          <h3>How Battle Mode Works</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">🎯</div>
              <h4>Choose Your Challenge</h4>
              <p>Select difficulty level and battle duration, or pick a specific problem</p>
            </div>
            <div className="info-item">
              <div className="info-icon">⚡</div>
              <h4>Real-time Competition</h4>
              <p>Code against other players in real-time with live leaderboards</p>
            </div>
            <div className="info-item">
              <div className="info-icon">🏆</div>
              <h4>Win & Climb</h4>
              <p>Submit your solution to climb the leaderboard and earn points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Battle;
