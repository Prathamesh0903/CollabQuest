import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../utils/api';
import io from 'socket.io-client';
import './BattleLobby.css';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'participant';
  isActive: boolean;
  joinedAt: string;
  lastSeen: string;
  elapsedSeconds: number;
  ready: boolean;
  isTyping?: boolean;
  isIdle?: boolean;
  connectionQuality?: 'good' | 'fair' | 'poor';
  rttMs?: number | null;
  lastActivity?: string;
  permissions?: 'view-only' | 'edit-code' | 'full-access';
  isOnline?: boolean;
}

interface BattleState {
  started: boolean;
  durationMinutes: number | null;
  problemId: string | null;
  difficulty: string | null;
  numReady: number;
  total: number;
}

interface BattleLobbyProps {
  onStartBattle?: () => void;
}

const BattleLobby: React.FC<BattleLobbyProps> = ({ onStartBattle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Get roomId and roomCode from navigation state
  const roomId = location.state?.roomId;
  const roomCode = location.state?.roomCode;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const socketRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Check if required data is available
  useEffect(() => {
    if (!roomId || !roomCode) {
      setError('Missing room information. Please join a battle room first.');
      setIsLoading(false);
    }
  }, [roomId, roomCode]);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId) return; // Don't initialize socket if roomId is not available
    
    const initializeSocket = async () => {
      try {
        const token = await currentUser?.getIdToken();
        const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
          auth: {
            token: token || undefined
          }
        });

        socketRef.current = socket;

        // Join battle room
        socket.emit('join-room', { roomId, mode: 'battle' });

        // Listen for battle events
        socket.on('battle-started', (data: any) => {
          console.log('Battle started:', data);
          if (onStartBattle) {
            onStartBattle();
          } else {
            navigate('/battle/play', { 
              state: { 
                roomId, 
                roomCode, 
                battleConfig: { 
                  difficulty: battleState?.difficulty,
                  battleTime: battleState?.durationMinutes 
                } 
              } 
            });
          }
        });

        socket.on('participant-joined', (data: any) => {
          console.log('Participant joined:', data);
          fetchLobbyData();
        });

        socket.on('participant-left', (data: any) => {
          console.log('Participant left:', data);
          fetchLobbyData();
        });

        socket.on('participant-ready', (data: any) => {
          console.log('Participant ready:', data);
          fetchLobbyData();
        });

        socket.on('participant-update', (data: any) => {
          console.log('Participant update:', data);
          fetchLobbyData();
        });

        // Presence events
        socket.on('user-typing', (data: any) => {
          setParticipants(prev => prev.map(p =>
            p.id === String(data.userId) ? { ...p, isTyping: !!data.isTyping } : p
          ));
        });

        socket.on('user-idle', (data: any) => {
          setParticipants(prev => prev.map(p =>
            p.id === String(data.userId) ? { ...p, isIdle: !!data.isIdle } : p
          ));
        });

        socket.on('connection-quality', (data: any) => {
          setParticipants(prev => prev.map(p =>
            p.id === String(data.userId) ? { ...p, connectionQuality: data.quality, rttMs: data.rtt ?? null } : p
          ));
        });

        socket.on('error', (error: any) => {
          console.error('Socket error:', error);
          setError(error.message || 'Connection error');
        });

      } catch (err) {
        console.error('Socket initialization error:', err);
        setError('Failed to connect to battle room');
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [roomId, currentUser, navigate, onStartBattle, battleState]);

  // Fetch lobby data
  const fetchLobbyData = async () => {
    if (!roomId) return; // Don't fetch if roomId is not available
    
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/${roomId}/lobby`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error('Failed to fetch lobby data');
      
      const data = await res.json();
      if (data.success) {
        setParticipants(data.participants || []);
        setBattleState(data.battle || null);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Fetch lobby error:', err);
      setError(err.message || 'Failed to load lobby');
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (roomId) {
      fetchLobbyData();
      
      // Poll for updates
      pollRef.current = setInterval(fetchLobbyData, 2000);
    }
  }, [roomId]);

  // Toggle ready status
  const toggleReady = async () => {
    if (!socketRef.current || !roomId) return;
    
    try {
      const newReadyState = !isReady;
      setIsReady(newReadyState);
      
      socketRef.current.emit('battle-ready', { 
        roomId, 
        ready: newReadyState 
      });
    } catch (err) {
      console.error('Toggle ready error:', err);
      setIsReady(!isReady); // Revert on error
    }
  };

  // Typing indicator: emit when user types in lobby chat/input (stub using window keydown)
  useEffect(() => {
    if (!roomId) return;
    const handleKey = () => {
      if (!socketRef.current) return;
      socketRef.current.emit('user-typing', { roomId, isTyping: true });
      // Auto clear typing after 2s
      setTimeout(() => {
        socketRef.current && socketRef.current.emit('user-typing', { roomId, isTyping: false });
      }, 2000);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roomId]);

  // Idle detection
  useEffect(() => {
    if (!roomId) return;
    let idleTimer: any;
    let lastActivity = Date.now();
    const reset = () => { lastActivity = Date.now(); };
    const checkIdle = () => {
      const idle = Date.now() - lastActivity > 60000; // 60s
      if (socketRef.current) {
        socketRef.current.emit('user-idle', { roomId, isIdle: idle });
      }
    };
    const events = ['mousemove','mousedown','keydown','touchstart'];
    events.forEach(ev => window.addEventListener(ev, reset));
    idleTimer = setInterval(checkIdle, 10000);
    return () => {
      events.forEach(ev => window.removeEventListener(ev, reset));
      clearInterval(idleTimer);
    };
  }, [roomId]);

  // Enhanced connection quality: RTT ping with better measurement
  useEffect(() => {
    if (!roomId) return;
    let timer: any;
    let pingCount = 0;
    const pingHistory: number[] = [];
    
    const ping = () => {
      if (!socketRef.current) return;
      const start = Date.now();
      const ackEvent = `pong:${start}`;
      
      const onPong = () => {
        const rtt = Date.now() - start;
        pingHistory.push(rtt);
        
        // Keep only last 5 pings for average calculation
        if (pingHistory.length > 5) {
          pingHistory.shift();
        }
        
        const avgRtt = pingHistory.reduce((a, b) => a + b, 0) / pingHistory.length;
        const quality = avgRtt < 100 ? 'good' : avgRtt < 300 ? 'fair' : 'poor';
        
        socketRef.current.emit('connection-quality', { 
          roomId, 
          rtt: Math.round(avgRtt), 
          quality,
          pingCount: ++pingCount,
          timestamp: new Date()
        });
        socketRef.current.off(ackEvent, onPong);
      };
      
      socketRef.current.once(ackEvent, onPong);
      socketRef.current.emit('ping-measure', { ts: start, roomId });
    };
    
    // Initial ping after 2 seconds, then every 10 seconds
    const initialTimer = setTimeout(ping, 2000);
    timer = setInterval(ping, 10000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [roomId]);

  // Start battle (host only)
  const startBattle = async () => {
    if (!socketRef.current || isStarting || !roomId) return;
    
    try {
      setIsStarting(true);
      socketRef.current.emit('start-battle', { roomId });
    } catch (err) {
      console.error('Start battle error:', err);
      setIsStarting(false);
    }
  };

  // Copy room code
  const copyRoomCode = async () => {
    if (!roomCode) return;
    
    try {
      await navigator.clipboard.writeText(roomCode);
      // You could add a toast notification here
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Get current user's role
  const currentUserRole = participants.find(p => p.id === currentUser?.uid)?.role || 'participant';
  const isHost = currentUserRole === 'host';
  const allReady = participants.length >= 2 && participants.every(p => p.ready);
  const canStart = isHost && allReady && !battleState?.started;

  if (isLoading) {
    return (
      <div className="battle-lobby">
        <div className="lobby-loading">
          <div className="loading-spinner"></div>
          <p>Loading battle lobby...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="battle-lobby">
        <div className="lobby-error">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/battle')}>
            Back to Battle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-lobby">
      <div className="lobby-header">
        <div className="lobby-brand">
          <span className="brand-icon">⚔️</span>
          <h1>Battle Lobby</h1>
        </div>
        <div className="room-info">
          <div className="room-code-display">
            <span className="room-code-label">Room Code:</span>
            <span className="room-code-value">{roomCode || 'N/A'}</span>
            <button className="copy-btn" onClick={copyRoomCode} title="Copy room code" disabled={!roomCode}>
              📋
            </button>
          </div>
        </div>
      </div>

      <div className="lobby-content">
        <div className="participants-section">
          <h2>Participants ({participants.length}/2)</h2>
          <div className="participants-grid">
            {Array.from({ length: 2 }).map((_, index) => {
              const participant = participants[index];
              return (
                <div key={index} className={`participant-slot ${participant ? 'filled' : 'empty'}`}>
                  {participant ? (
                    <>
                      <div className={`participant-avatar status-${participant.isIdle ? 'idle' : participant.connectionQuality || 'good'}`}>
                        <div className="avatar-img">{participant.avatar || '👤'}</div>
                        {participant.isTyping && <div className="activity-badge typing">✍️</div>}
                        {participant.ready && <div className="activity-badge ready">✅</div>}
                      </div>
                      <div className="participant-info">
                        <div className="participant-name">
                          {participant.name}
                          {participant.role === 'host' && <span className="host-badge">Host</span>}
                          {participant.permissions && participant.permissions !== 'edit-code' && (
                            <span className={`permission-badge ${participant.permissions}`}>
                              {participant.permissions === 'view-only' ? '👁️' : '🔓'}
                            </span>
                          )}
                        </div>
                        <div className={`participant-status ${participant.ready ? 'ready' : 'waiting'}`}>
                          {participant.ready ? '✅ Ready' : '⏳ Waiting'}
                        </div>
                        <div className="participant-presence">
                          <span className={`presence-dot ${participant.isIdle ? 'idle' : 'active'}`}></span>
                          <span className="presence-text">
                            {participant.isIdle ? 'Idle' : (participant.isTyping ? 'Typing…' : 'Active')}
                          </span>
                          {typeof participant.rttMs === 'number' && (
                            <span className={`quality-badge ${participant.connectionQuality || 'good'}`} title={`RTT ${participant.rttMs} ms`}>
                              {participant.connectionQuality === 'poor' ? '🟥' : participant.connectionQuality === 'fair' ? '🟨' : '🟩'}
                              <span className="quality-text">{participant.rttMs} ms</span>
                            </span>
                          )}
                          {participant.isTyping && (
                            <span className="typing-indicator">
                              <span className="typing-dot"></span>
                              <span className="typing-dot"></span>
                              <span className="typing-dot"></span>
                            </span>
                          )}
                        </div>
                        <div className="participant-time">
                          Joined {Math.floor(participant.elapsedSeconds / 60)}m {participant.elapsedSeconds % 60}s ago
                          {participant.lastActivity && (
                            <span className="last-activity">
                              • Last active: {new Date(participant.lastActivity).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="participant-avatar-placeholder">👤</div>
                      <div className="participant-info">
                        <div className="participant-name">Waiting for opponent...</div>
                        <div className="participant-status">Empty Slot</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="battle-info-section">
          <h2>Battle Settings</h2>
          <div className="battle-info-card">
            <div className="info-row">
              <span className="info-label">Difficulty:</span>
              <span className="info-value">{battleState?.difficulty || 'Easy'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Duration:</span>
              <span className="info-value">{battleState?.durationMinutes || 10} minutes</span>
            </div>
            <div className="info-row">
              <span className="info-label">Mode:</span>
              <span className="info-value">1v1 Battle</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className={`info-value status-${battleState?.started ? 'active' : 'waiting'}`}>
                {battleState?.started ? 'Active' : 'Waiting'}
              </span>
            </div>
          </div>
        </div>

        <div className="lobby-actions">
          <div className="ready-section">
            <button 
              className={`ready-btn ${isReady ? 'ready' : 'not-ready'}`}
              onClick={toggleReady}
              disabled={battleState?.started}
            >
              {isReady ? '✅ Ready' : '⏳ Not Ready'}
            </button>
            <p className="ready-hint">
              {participants.length < 2 
                ? 'Waiting for opponent to join...' 
                : allReady 
                  ? 'All players ready!' 
                  : 'Mark yourself ready when prepared'
              }
            </p>
          </div>

          <div className="spectator-section">
            <button 
              className="spectator-btn"
              onClick={() => navigate('/battle/spectator', { 
                state: { roomId, roomCode, role: 'spectator' } 
              })}
            >
              👁️ Join as Spectator
            </button>
            <p className="spectator-hint">
              Watch the battle in real-time without participating
            </p>
          </div>

          {isHost && (
            <div className="host-actions">
              <button 
                className={`start-btn ${canStart ? 'enabled' : 'disabled'}`}
                onClick={startBattle}
                disabled={!canStart || isStarting}
              >
                {isStarting ? 'Starting...' : '🚀 Start Battle'}
              </button>
              <p className="start-hint">
                {!allReady ? 'All players must be ready' : 'Ready to begin the battle!'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="lobby-footer">
        <button className="btn btn-secondary" onClick={() => navigate('/battle')}>
          ← Leave Lobby
        </button>
        <div className="lobby-stats">
          <span>Ready: {battleState?.numReady || 0}/{battleState?.total || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default BattleLobby;