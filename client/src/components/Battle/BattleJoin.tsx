import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../utils/api';

const BattleJoin: React.FC = () => {
  const { roomCode: routeRoomCode } = useParams<{ roomCode: string }>();
  const location = useLocation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const join = async () => {
      try {
        // Try to read room code from path param or query param (?code=)
        const urlParams = new URLSearchParams(location.search);
        const queryCode = urlParams.get('code') || undefined;
        const roomCode = (routeRoomCode || queryCode || '').toUpperCase();
        if (!roomCode) throw new Error('No room code provided');
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
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to join battle');
        navigate('/battle/play', { state: { battleConfig: { roomCode }, roomId: data.roomId } });
      } catch (e: any) {
        setError(e.message || 'Failed to join room');
      } finally {
        setJoining(false);
      }
    };
    join();
  }, [routeRoomCode, location.search, currentUser, navigate]);

  if (joining) {
    return (
      <div style={{ color: '#fff', padding: 24 }}>Joining battle room...</div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#fff', padding: 24 }}>
        <div>Failed to join battle: {error}</div>
        <button className="cta" onClick={() => navigate('/battle')}>Go back</button>
      </div>
    );
  }

  return null;
};

export default BattleJoin;


