import { useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { useBattleContext } from '../context/BattleProvider';

export const useBattleSocket = () => {
  const { currentUser, token } = useAuth();
  const { dispatch } = useBattleContext();
  
  const socket = useRef<any | null>(null);

  const connect = useCallback(() => {
    if (!token || socket.current) return;

    socket.current = io(process.env.REACT_APP_SERVER_URL as string, {
      auth: { token },
      transports: ['websocket']
    });

    socket.current.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
    });

    socket.current.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    });

    socket.current.on('lobby:joined', (data: any) => {
      dispatch({ type: 'SET_BATTLE', payload: data.session });
      dispatch({ type: 'UPDATE_PARTICIPANTS', payload: data.participants });
    });

    socket.current.on('lobby:participant-joined', (data: any) => {
      dispatch({ type: 'ADD_PARTICIPANT', payload: data.participant });
    });

    socket.current.on('lobby:ready-changed', (data: any) => {
      dispatch({ type: 'UPDATE_READY_STATUS', payload: data });
    });

    socket.current.on('lobby:countdown-started', (data: any) => {
      dispatch({ type: 'START_COUNTDOWN', payload: data.countdown });
    });

    socket.current.on('lobby:countdown-tick', (data: any) => {
      dispatch({ type: 'COUNTDOWN_TICK', payload: data.timeLeft });
    });

    socket.current.on('battle:started', (data: any) => {
      dispatch({ type: 'START_BATTLE', payload: data });
    });

    socket.current.on('battle:submission-result', (data: any) => {
      dispatch({ type: 'SET_SUBMISSION_RESULT', payload: data });
    });

    socket.current.on('battle:leaderboard-updated', (data: any) => {
      dispatch({ type: 'UPDATE_LEADERBOARD', payload: data.leaderboard });
    });

    socket.current.on('lobby:error', (data: any) => {
      dispatch({ type: 'SET_ERROR', payload: data.message });
    });

    // Auth and connection errors
    socket.current.on('connect_error', async (err: any) => {
      const msg = String(err?.message || err || 'connect_error');
      dispatch({ type: 'SET_ERROR', payload: msg });
      if (msg.toLowerCase().includes('auth')) {
        // Token refresh handled automatically by Supabase
      }
    });

    socket.current.on('error', (err: any) => {
      dispatch({ type: 'SET_ERROR', payload: String(err?.message || err || 'socket error') });
    });
  }, [token, dispatch]);

  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
  }, []);

  const joinLobby = useCallback((sessionId: string) => {
    socket.current?.emit('lobby:join', { sessionId });
  }, []);

  const toggleReady = useCallback(() => {
    socket.current?.emit('lobby:ready-toggle');
  }, []);

  const startBattle = useCallback(() => {
    socket.current?.emit('lobby:start-battle');
  }, []);

  const submitCode = useCallback((code: string) => {
    socket.current?.emit('battle:submit-code', { code });
  }, []);

  useEffect(() => {
    if (currentUser && token) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [currentUser, token, connect, disconnect]);

  return {
    joinLobby,
    toggleReady, 
    startBattle,
    submitCode,
    isConnected: socket.current?.connected || false
  };
}; 


