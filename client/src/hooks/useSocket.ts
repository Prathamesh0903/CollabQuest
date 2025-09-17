import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import io from 'socket.io-client';

interface CursorPosition {
  lineNumber: number;
  column: number;
}

interface UserCursor {
  userId: string;
  position: CursorPosition;
  color: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
}

interface UserSelection {
  userId: string;
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  color: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
}

interface ViewportState {
  scrollTop: number;
  scrollLeft: number;
  visibleRange: {
    startLineNumber: number;
    endLineNumber: number;
  };
}

interface FollowRelationship {
  followingId: string;
  followingName: string;
  startedAt: Date;
}

interface UseSocketOptions {
  roomId?: string;
  mode?: 'battle' | 'collaborative';
  onBattleStarted?: (data: any) => void;
  onBattleTick?: (data: any) => void;
  onBattleEnded?: (data: any) => void;
  onParticipantUpdate?: (data: any) => void;
  onParticipantJoined?: (data: any) => void;
  onParticipantLeft?: (data: any) => void;
  onCodeChange?: (data: any) => void;
  onCursorMove?: (data: UserCursor) => void;
  onSelectionChange?: (data: UserSelection) => void;
  onFollowStarted?: (data: FollowRelationship) => void;
  onFollowStopped?: (data: { followingId: string }) => void;
  onUserFollowing?: (data: { followerId: string; followerName: string; followerAvatar?: string }) => void;
  onUserUnfollowed?: (data: { followerId: string; followerName: string }) => void;
  onViewportUpdate?: (data: { userId: string; viewport: ViewportState }) => void;
  onParticipantActivity?: (data: any) => void;
  onSelectionHighlight?: (data: { userId: string; selection: any; color: string; displayName: string }) => void;
  onBattleCodeChange?: (data: { userId: string; displayName: string; avatar?: string; range?: any; text?: string; version?: number; timestamp: Date }) => void;
  onDiagnosticsUpdate?: (data: { roomId: string; fromUserId: string; displayName: string; language?: string; diagnostics: any[]; timestamp: Date }) => void;
  onDebugBreakpoints?: (data: { roomId: string; breakpoints: Array<{ lineNumber: number; users: string[] }> }) => void;
  onDebugState?: (data: { roomId: string; state: { line: number | null; variables: any; isActive: boolean } }) => void;
  onForceFollow?: (data: { roomId: string; enabled: boolean; hostUserId?: string }) => void;
  onTeachingMode?: (data: { roomId: string; enabled: boolean }) => void;
  onError?: (error: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const [userSelections, setUserSelections] = useState<Map<string, UserSelection>>(new Map());
  const [followRelationship, setFollowRelationship] = useState<FollowRelationship | null>(null);
  const [followers, setFollowers] = useState<Map<string, { followerName: string; followerAvatar?: string; startedAt: Date }>>(new Map());
  const socketRef = useRef<any | null>(null);

  const {
    roomId,
    mode = 'battle',
    onBattleStarted,
    onBattleTick,
    onBattleEnded,
    onParticipantUpdate,
    onParticipantJoined,
    onParticipantLeft,
    onCodeChange,
    onCursorMove,
    onSelectionChange,
    onFollowStarted,
    onFollowStopped,
    onUserFollowing,
    onUserUnfollowed,
    onViewportUpdate,
    onParticipantActivity,
    onSelectionHighlight,
    onBattleCodeChange,
    onDiagnosticsUpdate,
    onDebugBreakpoints,
    onDebugState,
    onForceFollow,
    onTeachingMode,
    onError
  } = options;

  // Generate a consistent color for a user
  const generateUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      if (!roomId || !currentUser) return;
      
      try {
        const token = await currentUser.getIdToken();
        const socketConnection = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', {
          auth: {
            token: token || undefined
          }
        });

        socketRef.current = socketConnection;
        setSocket(socketConnection);

        socketConnection.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
        });

        socketConnection.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        // Join room
        socketConnection.emit('join-room', { roomId, mode });

        // Presence/init events
        socketConnection.on('room-joined', (data: any) => {
          console.log('Room joined:', data);
          onParticipantUpdate?.({ participants: data.participants });
        });

        socketConnection.on('users-in-room', (users: any[]) => {
          console.log('Users in room:', users);
          onParticipantUpdate?.({ participants: users });
        });

        // Battle events
        socketConnection.on('battle-started', (data: any) => {
          console.log('Battle started:', data);
          onBattleStarted?.(data);
        });

        socketConnection.on('battle-tick', (data: any) => {
          onBattleTick?.(data);
        });

        socketConnection.on('battle-ended', (data: any) => {
          console.log('Battle ended:', data);
          onBattleEnded?.(data);
        });

        socketConnection.on('participant-update', (data: any) => {
          console.log('Participant update:', data);
          onParticipantUpdate?.(data);
        });

        socketConnection.on('participant-joined', (data: any) => {
          console.log('Participant joined:', data);
          onParticipantJoined?.(data);
        });

        socketConnection.on('participant-left', (data: any) => {
          console.log('Participant left:', data);
          onParticipantLeft?.(data);
        });

        socketConnection.on('code-change', (data: any) => {
          console.log('Code change:', data);
          onCodeChange?.(data);
        });

        socketConnection.on('participant-activity', (data: any) => {
          console.log('Participant activity:', data);
          onParticipantActivity?.(data);
        });

        // Cursor and selection events
        socketConnection.on('cursor-position', (data: UserCursor) => {
          console.log('Cursor position received:', data);
          setUserCursors(prev => {
            const newCursors = new Map(prev);
            newCursors.set(data.userId, data);
            return newCursors;
          });
          onCursorMove?.(data);
        });

        socketConnection.on('user-selection', (data: UserSelection) => {
          console.log('User selection received:', data);
          setUserSelections(prev => {
            const newSelections = new Map(prev);
            newSelections.set(data.userId, data);
            return newSelections;
          });
          onSelectionChange?.(data);
        });

        // Follow-related events
        socketConnection.on('follow-started', (data: FollowRelationship) => {
          console.log('Follow started:', data);
          setFollowRelationship(data);
          onFollowStarted?.(data);
        });

        socketConnection.on('follow-stopped', (data: { followingId: string }) => {
          console.log('Follow stopped:', data);
          setFollowRelationship(null);
          onFollowStopped?.(data);
        });

        socketConnection.on('user-following', (data: { followerId: string; followerName: string; followerAvatar?: string }) => {
          console.log('User following me:', data);
          setFollowers(prev => {
            const newFollowers = new Map(prev);
            newFollowers.set(data.followerId, {
              followerName: data.followerName,
              followerAvatar: data.followerAvatar,
              startedAt: new Date()
            });
            return newFollowers;
          });
          onUserFollowing?.(data);
        });

        socketConnection.on('user-unfollowed', (data: { followerId: string; followerName: string }) => {
          console.log('User unfollowed me:', data);
          setFollowers(prev => {
            const newFollowers = new Map(prev);
            newFollowers.delete(data.followerId);
            return newFollowers;
          });
          onUserUnfollowed?.(data);
        });

        socketConnection.on('viewport-update', (data: { userId: string; viewport: ViewportState }) => {
          console.log('Viewport update received:', data);
          onViewportUpdate?.(data);
        });

        // Selection highlighting events
        socketConnection.on('selection-highlight', (data: { userId: string; selection: any; color: string; displayName: string }) => {
          console.log('Selection highlight received:', data);
          onSelectionHighlight?.(data);
        });

        // Battle diff-like code change events
        socketConnection.on('battle-code-change', (data: { userId: string; displayName: string; avatar?: string; range?: any; text?: string; version?: number; timestamp: Date }) => {
          console.log('Battle code change received:', data);
          onBattleCodeChange?.(data);
        });

        // Collaborative diagnostics events
        socketConnection.on('diagnostics-update', (data: any) => {
          console.log('Diagnostics update received:', data);
          onDiagnosticsUpdate?.(data);
        });

        // Debug events
        socketConnection.on('debug-breakpoints', (data: any) => {
          console.log('Debug breakpoints update:', data);
          onDebugBreakpoints?.(data);
        });

        socketConnection.on('debug-state', (data: any) => {
          console.log('Debug state update:', data);
          onDebugState?.(data);
        });

        // Host modes
        socketConnection.on('force-follow', (data: any) => {
          console.log('Force follow update:', data);
          onForceFollow?.(data);
        });
        socketConnection.on('teaching-mode', (data: any) => {
          console.log('Teaching mode update:', data);
          onTeachingMode?.(data);
        });

        socketConnection.on('error', (error: any) => {
          console.error('Socket error:', error);
          onError?.(error);
        });

        // Refresh token on user token changes and update handshake auth
        const unsubscribeToken = auth.onIdTokenChanged(async (user) => {
          try {
            const newToken = await user?.getIdToken();
            if (socketRef.current && newToken) {
              socketRef.current.auth = { token: newToken };
              socketRef.current.disconnect();
              socketRef.current.connect();
            }
          } catch (e) {
            // ignore
          }
        });

        // Clean up token subscription when unmounting or deps change
        socketConnection.on('disconnect', () => {
          if (typeof unsubscribeToken === 'function') {
            try { unsubscribeToken(); } catch {}
          }
        });

      } catch (err) {
        console.error('Socket initialization error:', err);
        onError?.(err);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [roomId, currentUser, mode]);

  // Emit cursor position
  const emitCursorPosition = (position: CursorPosition) => {
    if (!socket || !currentUser || !roomId) return;
    
    const cursorData: UserCursor = {
      userId: currentUser.uid,
      position,
      color: generateUserColor(currentUser.uid),
      displayName: currentUser.displayName || currentUser.email || 'Anonymous',
      avatar: currentUser.photoURL || undefined,
      timestamp: new Date()
    };

    socket.emit('cursor-position', {
      ...cursorData,
      roomId,
      mode
    });
  };

  // Emit selection change
  const emitSelectionChange = (selection: UserSelection['selection']) => {
    if (!socket || !currentUser || !roomId) return;
    
    const selectionData: UserSelection = {
      userId: currentUser.uid,
      selection,
      color: generateUserColor(currentUser.uid),
      displayName: currentUser.displayName || currentUser.email || 'Anonymous',
      avatar: currentUser.photoURL || undefined,
      timestamp: new Date()
    };

    socket.emit('user-selection', {
      ...selectionData,
      roomId,
      mode
    });
  };

  // Emit battle submission
  const emitBattleSubmission = (data: { roomId: string; score: number; passed: number; total: number }) => {
    if (!socket) return;
    socket.emit('battle-submission', data);
  };

  // Start following a user
  const startFollowing = (followingUserId: string) => {
    if (!socket || !roomId) return;
    socket.emit('start-following', {
      followingUserId,
      roomId,
      mode
    });
  };

  // Stop following a user
  const stopFollowing = () => {
    if (!socket || !roomId) return;
    socket.emit('stop-following', {
      roomId,
      mode
    });
  };

  // Emit viewport synchronization
  const emitViewportSync = (viewport: ViewportState) => {
    if (!socket || !roomId) return;
    socket.emit('viewport-sync', {
      viewport,
      roomId,
      mode
    });
  };

  // Emit battle diff-like code change event
  const emitBattleCodeChange = (payload: { range?: any; text?: string; version?: number }) => {
    if (!socket || !roomId) return;
    socket.emit('battle-code-change', {
      roomId,
      ...payload
    });
  };

  // Emit code change activity
  const emitCodeChangeActivity = (changeType: string, linesChanged?: number) => {
    if (!socket || !roomId) return;
    socket.emit('code-change-activity', {
      roomId,
      changeType,
      linesChanged,
      mode
    });
  };

  // Request cursor positions from all participants
  const requestCursorPositions = () => {
    if (!socket || !roomId) return;
    socket.emit('request-cursor-positions', {
      roomId,
      mode
    });
  };

  // Emit selection highlight
  const emitSelectionHighlight = (selection: any) => {
    if (!socket || !currentUser || !roomId) return;
    
    socket.emit('selection-highlight', {
      userId: currentUser.uid,
      selection,
      color: generateUserColor(currentUser.uid),
      displayName: currentUser.displayName || currentUser.email || 'Anonymous',
      roomId,
      mode
    });
  };

  // Emit diagnostics to room
  const emitDiagnostics = (diagnostics: any[], language?: string) => {
    if (!socket || !roomId) return;
    socket.emit('diagnostics-update', {
      roomId,
      diagnostics,
      language
    });
  };

  // Debug emitters
  const setBreakpoint = (lineNumber: number) => {
    if (!socket || !roomId) return;
    socket.emit('debug-set-breakpoint', { roomId, lineNumber });
  };
  const removeBreakpoint = (lineNumber: number) => {
    if (!socket || !roomId) return;
    socket.emit('debug-remove-breakpoint', { roomId, lineNumber });
  };
  const startDebug = () => { if (socket && roomId) socket.emit('debug-start', { roomId }); };
  const stopDebug = () => { if (socket && roomId) socket.emit('debug-stop', { roomId }); };
  const stepDebug = () => { if (socket && roomId) socket.emit('debug-step', { roomId }); };
  const continueDebug = () => { if (socket && roomId) socket.emit('debug-continue', { roomId }); };
  const updateDebugVariables = (variables: any) => { if (socket && roomId) socket.emit('debug-update-variables', { roomId, variables }); };

  // Host mode emitters
  const startForceFollow = () => { if (socket && roomId) socket.emit('force-follow-start', { roomId }); };
  const stopForceFollow = () => { if (socket && roomId) socket.emit('force-follow-stop', { roomId }); };

  return {
    socket,
    isConnected,
    userCursors,
    userSelections,
    followRelationship,
    followers,
    emitCursorPosition,
    emitSelectionChange,
    emitBattleSubmission,
    startFollowing,
    stopFollowing,
    emitViewportSync,
    emitCodeChangeActivity,
    requestCursorPositions,
    emitSelectionHighlight,
    emitBattleCodeChange,
    emitDiagnostics,
    startForceFollow,
    stopForceFollow,
    setBreakpoint,
    removeBreakpoint,
    startDebug,
    stopDebug,
    stepDebug,
    continueDebug,
    updateDebugVariables,
    generateUserColor
  };
};
