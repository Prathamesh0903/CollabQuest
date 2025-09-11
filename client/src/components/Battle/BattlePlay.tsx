import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Editor, { DiffEditor } from '@monaco-editor/react';
import './BattlePlay.css';
import './SelectionHighlight.css';
import problems from './problems';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';
import { useScreenShare } from '../../hooks/useScreenShare';
import BattleResults from './BattleResults';
import CursorDisplay from './CursorDisplay';
import FollowControls from './FollowControls';
import ActivityFeed from './ActivityFeed';
import ParticipantList from './ParticipantList';
import DebugPanel from './DebugPanel';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface ActivityItem {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  activity: 'test-run' | 'submission' | 'code-change' | 'joined' | 'left';
  timestamp: Date;
  details: {
    action: string;
    description: string;
    score?: number;
    passed?: number;
    total?: number;
    timeMs?: number;
    linesChanged?: number;
  };
}

const BattlePlay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const editorValueRef = useRef<string>('');
  const battleConfig = location.state?.battleConfig;
  const roomId = location.state?.roomId;
  
  const [difficulty, setDifficulty] = useState<Difficulty>(battleConfig?.difficulty || 'Easy');
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [timer, setTimer] = useState<number>((battleConfig?.battleTime || 10) * 60);
  const [roomCode, setRoomCode] = useState<string>(battleConfig?.roomCode || '');
  const [opponents, setOpponents] = useState<any[]>([]);
  const [battleStarted, setBattleStarted] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFollowingMode, setIsFollowingMode] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isActivityFeedVisible, setIsActivityFeedVisible] = useState(false);
  const [isParticipantListVisible, setIsParticipantListVisible] = useState(false);
  const [isChangesPanelVisible, setIsChangesPanelVisible] = useState(false);
  const [isTeachingMode, setIsTeachingMode] = useState(false);
  const [isForceFollow, setIsForceFollow] = useState(false);
  const [baseCodeForDiff, setBaseCodeForDiff] = useState<string>('');
  const [participantCodeSnapshots, setParticipantCodeSnapshots] = useState<Map<string, { code: string; updatedAt: Date }>>(new Map());
  const pendingChangesRef = useRef<any[]>([]);
  const lastEmitVersionRef = useRef<number>(0);
  const editorRef = useRef<any>(null);
  const monacoEditorRef = useRef<any>(null);
  const lastCodeLengthRef = useRef<number>(0);
  const codeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectionDecorationsRef = useRef<Map<string, string[]>>(new Map());
  const monacoRef = useRef<any>(null);

  // Debugging state
  const [debugBreakpoints, setDebugBreakpoints] = useState<Array<{ lineNumber: number; users: string[] }>>([]);
  const [debugState, setDebugState] = useState<{ line: number | null; variables: any; isActive: boolean }>({ line: null, variables: {}, isActive: false });

  const problem = useMemo(() => {
    if (battleConfig?.questionSelection === 'specific' && battleConfig?.selectedProblem) {
      return problems.find(p => p.id === battleConfig.selectedProblem) || problems[0];
    }
    const pool = problems.filter(p => p.difficulty === difficulty);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [difficulty, battleConfig]);

  // Use socket hook for real-time communication
  const {
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
    setBreakpoint,
    removeBreakpoint,
    startDebug,
    stopDebug,
    stepDebug,
    continueDebug,
    updateDebugVariables,
    startForceFollow,
    stopForceFollow,
    generateUserColor
  } = useSocket({
    roomId,
    mode: 'battle',
    onBattleStarted: (data: any) => {
      console.log('Battle started:', data);
      setBattleStarted(true);
      
      // Add battle start activity
      const activity: ActivityItem = {
        id: `battle-start-${Date.now()}-${Math.random()}`,
        userId: 'system',
        displayName: 'System',
        avatar: '⚔️',
        activity: 'joined',
        timestamp: new Date(),
        details: {
          action: 'battle started',
          description: `Battle has begun! Duration: ${Math.floor(data.duration / 60)} minutes`
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    },
    onBattleTick: (data: any) => {
      setTimer(data.remaining);
    },
    onBattleEnded: (data: any) => {
      console.log('Battle ended:', data);
      setBattleEnded(true);
      setShowResults(true);
      
      // Add battle end activity
      const activity: ActivityItem = {
        id: `battle-end-${Date.now()}-${Math.random()}`,
        userId: 'system',
        displayName: 'System',
        avatar: '🏁',
        activity: 'left',
        timestamp: new Date(),
        details: {
          action: 'battle ended',
          description: 'Battle has concluded! Check results to see final scores.'
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    },
    onParticipantUpdate: (data: any) => {
      console.log('Participant update:', data);
      setOpponents(prev => prev.map(opp => 
        opp.userId === data.userId 
          ? { ...opp, score: data.score, passed: data.passed, total: data.total }
          : opp
      ));
    },
    onParticipantJoined: (data: any) => {
      console.log('Participant joined:', data);
      setOpponents(prev => [...prev, {
        userId: data.userId,
        name: data.displayName,
        avatar: data.avatar,
        status: 'joined'
      }]);
      
      // Add join activity
      const activity: ActivityItem = {
        id: `${data.userId}-joined-${Date.now()}`,
        userId: data.userId,
        displayName: data.displayName,
        avatar: data.avatar,
        activity: 'joined',
        timestamp: new Date(),
        details: {
          action: 'joined the battle',
          description: 'Participant joined the battle'
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    },
    onParticipantLeft: (data: any) => {
      console.log('Participant left:', data);
      setOpponents(prev => prev.filter(opp => opp.userId !== data.userId));
      
      // Add leave activity
      const activity: ActivityItem = {
        id: `${data.userId}-left-${Date.now()}`,
        userId: data.userId,
        displayName: data.displayName || 'Unknown User',
        avatar: data.avatar || '👤',
        activity: 'left',
        timestamp: new Date(),
        details: {
          action: 'left the battle',
          description: 'Participant left the battle'
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    },
    onCodeChange: (data: any) => {
      console.log('Code change from opponent:', data);
    },
    onFollowStarted: (data: any) => {
      console.log('Follow started:', data);
      setIsFollowingMode(true);
      
      // Add follow activity
      const activity: ActivityItem = {
        id: `follow-${Date.now()}-${Math.random()}`,
        userId: currentUser?.uid || 'current-user',
        displayName: currentUser?.displayName || currentUser?.email || 'You',
        avatar: currentUser?.photoURL || '👤',
        activity: 'code-change',
        timestamp: new Date(),
        details: {
          action: 'started following',
          description: `Started following ${data.targetUser?.displayName || 'another participant'}`
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    },
    onFollowStopped: (data: any) => {
      console.log('Follow stopped:', data);
      setIsFollowingMode(false);
      
      // Add unfollow activity
      const activity: ActivityItem = {
        id: `unfollow-${Date.now()}-${Math.random()}`,
        userId: currentUser?.uid || 'current-user',
        displayName: currentUser?.displayName || currentUser?.email || 'You',
        avatar: currentUser?.photoURL || '👤',
        activity: 'code-change',
        timestamp: new Date(),
        details: {
          action: 'stopped following',
          description: `Stopped following ${data.targetUser?.displayName || 'another participant'}`
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    },
    onUserFollowing: (data: any) => {
      console.log('User following me:', data);
    },
    onUserUnfollowed: (data: any) => {
      console.log('User unfollowed me:', data);
    },
    onViewportUpdate: (data: any) => {
      console.log('Viewport update received:', data);
      // Handle viewport synchronization when following
      if ((isFollowingMode || isForceFollow) && monacoEditorRef.current) {
        const editor = monacoEditorRef.current;
        const { viewport } = data;
        
        // Scroll to the followed user's viewport
        editor.setScrollTop(viewport.scrollTop);
        editor.setScrollLeft(viewport.scrollLeft);
        
        // Reveal the visible range
        editor.revealRangeInCenter({
          startLineNumber: viewport.visibleRange.startLineNumber,
          endLineNumber: viewport.visibleRange.endLineNumber,
          startColumn: 1,
          endColumn: 1
        });
      }
    },
    onParticipantActivity: (data: any) => {
      console.log('Participant activity received:', data);
      const activity: ActivityItem = {
        id: `${data.userId}-${Date.now()}-${Math.random()}`,
        userId: data.userId,
        displayName: data.displayName,
        avatar: data.avatar,
        activity: data.activity,
        timestamp: new Date(data.timestamp),
        details: data.details
      };
      
      setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50 activities
    },
    onBattleCodeChange: (data: any) => {
      const fromUser = data.userId;
      setParticipantCodeSnapshots(prev => {
        const next = new Map(prev);
        const current = next.get(fromUser)?.code || '';
        const updated = current + (typeof data.text === 'string' ? data.text : '');
        next.set(fromUser, { code: updated, updatedAt: new Date(data.timestamp) });
        return next;
      });
    },
    onSelectionHighlight: (data: any) => {
      console.log('Selection highlight received:', data);
      // This will trigger the applySelectionDecorations effect
      // The userSelections map will be updated by the existing selection change handler
    },
    onDiagnosticsUpdate: (payload: any) => {
      try {
        if (!monacoEditorRef.current || !monacoRef.current) return;
        const monaco = monacoRef.current;
        const editorModel = monacoEditorRef.current.getModel();
        if (!editorModel) return;

        // Map incoming diagnostics (Monaco-like) to markers
        const markers = (payload?.diagnostics || []).map((d: any) => ({
          severity: d.severity ?? 8, // MarkerSeverity.Error
          message: d.message || 'Issue',
          startLineNumber: d.startLineNumber || 1,
          startColumn: d.startColumn || 1,
          endLineNumber: d.endLineNumber || d.startLineNumber || 1,
          endColumn: d.endColumn || (d.startColumn ? d.startColumn + 1 : 2),
          source: payload?.displayName || 'Collaborator'
        }));

        // Merge with existing markers by replacing; in a fuller impl we could namespace per user
        monaco.editor.setModelMarkers(editorModel, 'collab-diagnostics', markers);
      } catch (e) {
        console.error('Failed to apply diagnostics markers', e);
      }
    },
    onDebugBreakpoints: (payload: any) => {
      if (payload?.roomId !== roomId) return;
      setDebugBreakpoints(payload.breakpoints || []);
      // Update Monaco breakpoint glyphs
      try {
        if (!monacoEditorRef.current || !monacoRef.current) return;
        const monaco = monacoRef.current;
        const model = monacoEditorRef.current.getModel();
        if (!model) return;
        const decorations = (payload.breakpoints || []).map((bp: any) => ({
          range: new monaco.Range(bp.lineNumber, 1, bp.lineNumber, 1),
          options: { isWholeLine: true, className: 'debug-line', glyphMarginClassName: 'debug-breakpoint' }
        }));
        monacoEditorRef.current.deltaDecorations([], decorations);
      } catch {}
    },
    onDebugState: (payload: any) => {
      if (payload?.roomId !== roomId) return;
      setDebugState(payload.state || { line: null, variables: {}, isActive: false });
      // Reveal current execution line
      try {
        if (monacoEditorRef.current && payload?.state?.line) {
          monacoEditorRef.current.revealLineInCenter(payload.state.line);
        }
      } catch {}
    },
    onForceFollow: (payload: any) => {
      if (!monacoEditorRef.current || !payload?.enabled) return;
      setIsForceFollow(Boolean(payload.enabled));
    },
    onTeachingMode: (payload: any) => {
      setIsTeachingMode(Boolean(payload?.enabled));
      if (monacoEditorRef.current) {
        monacoEditorRef.current.updateOptions({ readOnly: Boolean(payload?.enabled) });
      }
    },
    onError: (error: any) => {
      console.error('Socket error:', error);
    }
  });

  // Screen sharing hook
  const {
    isSharing,
    localStream,
    remoteStreams,
    activeSharers,
    startScreenShare,
    stopScreenShare
  } = useScreenShare({ socket, roomId });

  const [isScreenPanelVisible, setIsScreenPanelVisible] = useState(false);
  const [screenPanelWidth, setScreenPanelWidth] = useState(360);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(240, screenPanelWidth - e.movementX), 720);
      setScreenPanelWidth(newWidth);
    };
    const handleMouseUp = () => { isResizingRef.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [screenPanelWidth]);

  // Timer effect
  useEffect(() => {
    if (!battleStarted || battleEnded) return;
    
    const id = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setBattleEnded(true);
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(id);
  }, [battleStarted, battleEnded]);

  // Viewport synchronization effect
  useEffect(() => {
    if (!monacoEditorRef.current || !battleStarted || battleEnded) return;

    const editor = monacoEditorRef.current;
    let viewportSyncInterval: NodeJS.Timeout;

    // Set up viewport synchronization when not following
    if (!isFollowingMode) {
      viewportSyncInterval = setInterval(() => {
        if (editor && !isFollowingMode) {
          const scrollTop = editor.getScrollTop();
          const scrollLeft = editor.getScrollLeft();
          const visibleRanges = editor.getVisibleRanges();
          
          if (visibleRanges.length > 0) {
            const visibleRange = visibleRanges[0];
            emitViewportSync({
              scrollTop,
              scrollLeft,
              visibleRange: {
                startLineNumber: visibleRange.startLineNumber,
                endLineNumber: visibleRange.endLineNumber
              }
            });
          }
        }
      }, 1000); // Sync every second
    }

    return () => {
      if (viewportSyncInterval) {
        clearInterval(viewportSyncInterval);
      }
    };
  }, [battleStarted, battleEnded, isFollowingMode, emitViewportSync]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (codeChangeTimeoutRef.current) {
        clearTimeout(codeChangeTimeoutRef.current);
      }
    };
  }, []);

  // Request cursor positions when participant list becomes visible
  useEffect(() => {
    if (isParticipantListVisible && requestCursorPositions) {
      requestCursorPositions();
    }
  }, [isParticipantListVisible, requestCursorPositions]);

  const runTests = async () => {
    if (!roomId) return;
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/${roomId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ code: editorValueRef.current })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run tests');
      setTestResults(data);

      // Clear diagnostics on success
      if (monacoEditorRef.current && monacoRef.current) {
        const monaco = monacoRef.current;
        const model = monacoEditorRef.current.getModel();
        if (model) monaco.editor.setModelMarkers(model, 'collab-diagnostics', []);
      }

      // Add local test run activity
      const activity: ActivityItem = {
        id: `test-run-${Date.now()}-${Math.random()}`,
        userId: currentUser?.uid || 'current-user',
        displayName: currentUser?.displayName || currentUser?.email || 'You',
        avatar: currentUser?.photoURL || '👤',
        activity: 'test-run',
        timestamp: new Date(),
        details: {
          action: 'ran tests',
          description: `Ran ${data.total || 0} test cases`,
          passed: data.passed || 0,
          total: data.total || 0,
          timeMs: data.timeMs || 0
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    } catch (e: any) {
      console.error('Test error:', e);
      setTestResults({ error: e.message || 'Failed to run tests' });

      // Emit diagnostics for collaborators (basic single-line error extraction)
      try {
        const message: string = e?.message || '';
        const lineColMatch = message.match(/:(\d+):(\d+)/);
        const diag = lineColMatch ? [{
          message,
          severity: 8,
          startLineNumber: parseInt(lineColMatch[1], 10) || 1,
          startColumn: parseInt(lineColMatch[2], 10) || 1,
          endLineNumber: parseInt(lineColMatch[1], 10) || 1,
          endColumn: (parseInt(lineColMatch[2], 10) || 1) + 1
        }] : [{ message, severity: 8, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 }];
        emitDiagnostics?.(diag, language);

        // Also apply locally
        if (monacoEditorRef.current && monacoRef.current) {
          const monaco = monacoRef.current;
          const model = monacoEditorRef.current.getModel();
          if (model) monaco.editor.setModelMarkers(model, 'collab-diagnostics', diag);
        }
      } catch {}
    }
  };

  const submitSolution = async () => {
    if (!roomId || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/${roomId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ code: editorValueRef.current, codeChanges: pendingChangesRef.current })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      
      // Emit submission to socket for real-time updates
      emitBattleSubmission({ roomId, score: data.score, passed: data.passed, total: data.total });
      
      // Add local submission activity
      const activity: ActivityItem = {
        id: `submission-${Date.now()}-${Math.random()}`,
        userId: currentUser?.uid || 'current-user',
        displayName: currentUser?.displayName || currentUser?.email || 'You',
        avatar: currentUser?.photoURL || '👤',
        activity: 'submission',
        timestamp: new Date(),
        details: {
          action: 'submitted solution',
          description: `Submitted solution with ${data.passed || 0}/${data.total || 0} tests passed`,
          score: data.score || 0,
          passed: data.passed || 0,
          total: data.total || 0,
          timeMs: data.timeMs || 0
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
      
      setTestResults(data);
    } catch (e: any) {
      console.error('Submit error:', e);
      setTestResults({ error: e.message || 'Failed to submit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jump to participant's cursor position
  const jumpToParticipant = (participant: any) => {
    if (!monacoEditorRef.current) return;
    
    const editor = monacoEditorRef.current;
    const userCursor = userCursors.get(participant.userId);
    
    if (userCursor && userCursor.position) {
      const { lineNumber, column } = userCursor.position;
      
      // Reveal the line in center of viewport
      editor.revealLineInCenter(lineNumber);
      
      // Set cursor position to the participant's position
      editor.setPosition({ lineNumber, column });
      
      // Add jump activity
      const activity: ActivityItem = {
        id: `jump-${Date.now()}-${Math.random()}`,
        userId: currentUser?.uid || 'current-user',
        displayName: currentUser?.displayName || currentUser?.email || 'You',
        avatar: currentUser?.photoURL || '👤',
        activity: 'code-change',
        timestamp: new Date(),
        details: {
          action: 'jumped to participant',
          description: `Jumped to ${participant.name}'s cursor at line ${lineNumber}`
        }
      };
      setActivities(prev => [activity, ...prev].slice(0, 50));
    }
  };

  // Enhanced participants list with cursor positions
  const enhancedParticipants = useMemo(() => {
    return opponents.map(opponent => {
      const userCursor = userCursors.get(opponent.userId);
      return {
        ...opponent,
        lastCursorPosition: userCursor?.position,
        color: userCursor?.color || '#4ECDC4',
        isOnline: userCursors.has(opponent.userId)
      };
    });
  }, [opponents, userCursors]);

  // Apply selection decorations to Monaco Editor
  const applySelectionDecorations = () => {
    if (!monacoEditorRef.current || !monacoRef.current) return;

    const editor = monacoEditorRef.current;
    const monaco = monacoRef.current;
    
    // Clear all existing decorations
    const allDecorations: string[] = [];
    selectionDecorationsRef.current.forEach(decorations => {
      allDecorations.push(...decorations);
    });
    
    if (allDecorations.length > 0) {
      editor.deltaDecorations(allDecorations, []);
    }
    
    // Clear the decorations map
    selectionDecorationsRef.current.clear();
    
    // Apply new decorations for each user's selection
    userSelections.forEach((userSelection, userId) => {
      if (userId === currentUser?.uid) return; // Skip current user
      
      const { selection, color, displayName } = userSelection;
      
      // Skip empty selections
      if (selection.startLineNumber === selection.endLineNumber && 
          selection.startColumn === selection.endColumn) {
        return;
      }
      
      // Create decoration for the selection
      const decoration: any = {
        range: new monaco.Range(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        ),
        options: {
          className: 'user-selection-highlight',
          hoverMessage: {
            value: `**${displayName}'s selection**\n\nLines: ${selection.startLineNumber}-${selection.endLineNumber}`,
            isTrusted: true
          },
          glyphMarginClassName: 'user-selection-glyph',
          glyphMarginHoverMessage: {
            value: `${displayName} selected this code`,
            isTrusted: true
          },
          minimap: {
            color: color,
            position: monaco.editor.MinimapPosition.Inline
          },
          overviewRuler: {
            color: color,
            position: monaco.editor.OverviewRulerLane.Left
          },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          afterContentClassName: 'user-selection-after',
          beforeContentClassName: 'user-selection-before'
        }
      };
      
      // Apply the decoration
      const decorationIds = editor.deltaDecorations([], [decoration]);
      selectionDecorationsRef.current.set(userId, decorationIds);
      
      // Add dynamic CSS for this user's color
      const styleId = `user-selection-${userId}`;
      let existingStyle = document.getElementById(styleId);
      if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = styleId;
        document.head.appendChild(existingStyle);
      }
      
      existingStyle.textContent = `
        .user-selection-highlight[data-user-id="${userId}"] {
          background-color: ${color}20 !important;
          border-color: ${color}60 !important;
        }
        .user-selection-glyph[data-user-id="${userId}"] {
          background-color: ${color} !important;
        }
      `;
    });
  };

  // Update selection decorations when userSelections change
  useEffect(() => {
    applySelectionDecorations();
  }, [userSelections, currentUser?.uid]);

  if (showResults) {
    return (
      <BattleResults 
        roomId={roomId} 
        roomCode={roomCode}
        onPlayAgain={() => {
          setShowResults(false);
          setBattleEnded(false);
          setBattleStarted(false);
          setTimer((battleConfig?.battleTime || 10) * 60);
          setTestResults(null);
        }}
      />
    );
  }

  return (
    <div className="battle-play">
      <header className="battle-play__header">
        <div className="brand" onClick={() => navigate('/battle')}>
          <span className="brand-mark">⚔️</span>
          <span className="brand-text">Code Battle</span>
        </div>
        <div className="header-controls">
          {roomCode && <div className="room-code-display">Room: {roomCode}</div>}
          <div className="battle-status">
            {!battleStarted ? (
              <span className="status-waiting">⏳ Waiting to start</span>
            ) : battleEnded ? (
              <span className="status-ended">🏁 Battle ended</span>
            ) : (
              <span className="status-active">🔥 Battle active</span>
            )}
          </div>
          <FollowControls
            participants={opponents}
            followRelationship={followRelationship}
            followers={followers}
            currentUserId={currentUser?.uid}
            onStartFollowing={startFollowing}
            onStopFollowing={stopFollowing}
            isFollowingMode={isFollowingMode}
          />
          <button 
            className={`cta cta--secondary ${isActivityFeedVisible ? 'active' : ''}`}
            onClick={() => setIsActivityFeedVisible(!isActivityFeedVisible)}
            title="Toggle Activity Feed"
          >
            📊 Activity
          </button>
          <button 
            className={`cta cta--secondary ${isScreenPanelVisible ? 'active' : ''}`}
            onClick={() => setIsScreenPanelVisible(!isScreenPanelVisible)}
            title="Toggle Screen Share Panel"
          >
            🖥️ Screens
          </button>
          {isSharing ? (
            <button className="cta cta--ghost" onClick={stopScreenShare} title="Stop sharing your screen">Stop Share</button>
          ) : (
            <button className="cta" onClick={startScreenShare} title="Share your screen" disabled={!battleStarted || battleEnded}>Share Screen</button>
          )}
          <button 
            className={`cta cta--secondary ${isParticipantListVisible ? 'active' : ''}`}
            onClick={() => setIsParticipantListVisible(!isParticipantListVisible)}
            title="Toggle Participant List"
          >
            👥 Participants
          </button>
          <select value={language} onChange={e => {
            const newLanguage = e.target.value as any;
            setLanguage(newLanguage);
            
            // Add language switch activity
            const activity: ActivityItem = {
              id: `language-switch-${Date.now()}-${Math.random()}`,
              userId: currentUser?.uid || 'current-user',
              displayName: currentUser?.displayName || currentUser?.email || 'You',
              avatar: currentUser?.photoURL || '👤',
              activity: 'code-change',
              timestamp: new Date(),
              details: {
                action: 'switched language',
                description: `Switched to ${newLanguage === 'javascript' ? 'JavaScript' : 'Python'}`
              }
            };
            setActivities(prev => [activity, ...prev].slice(0, 50));
          }}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          <button className="cta cta--ghost" onClick={() => navigate('/battle')}>Exit</button>
        </div>
      </header>

      <div className="battle-play__content">
        <section className="problem-panel">
          <div className="problem-header">
            <h2 className="problem-title">{problem.title}</h2>
            <span className={`badge ${problem.difficulty === 'Easy' ? 'badge--easy' : problem.difficulty === 'Medium' ? 'badge--medium' : 'badge--hard'}`}>{problem.difficulty}</span>
          </div>
          <div className="problem-body">
            <div className="problem-desc" dangerouslySetInnerHTML={{ __html: problem.description }} />
            <div className="problem-meta">
              <div>
                <div className="meta-label">Examples</div>
                {problem.examples.map((ex, idx) => (
                  <pre key={idx} className="io-block"><strong>Input</strong>: {ex.input}\n<strong>Output</strong>: {ex.output}</pre>
                ))}
              </div>
              <div>
                <div className="meta-label">Constraints</div>
                <ul className="constraints">
                  {problem.constraints.map((c, idx) => (<li key={idx}>{c}</li>))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="editor-panel" style={{ marginRight: isScreenPanelVisible ? screenPanelWidth + 8 : 0 }}>
          <div className="editor-header">
            <div className="timer-section">
              <div className={`timer ${timer < 60 ? 'timer-warning' : ''} ${timer < 30 ? 'timer-critical' : ''}`}>
                ⏱ {Math.floor(timer/60).toString().padStart(2,'0')}:{(timer%60).toString().padStart(2,'0')}
              </div>
              {!battleStarted && (
                <div className="waiting-message">Waiting for battle to start...</div>
              )}
            </div>
            <div className="actions">
              <button 
                className="cta cta--secondary" 
                onClick={runTests}
                disabled={!battleStarted || battleEnded}
              >
                Run Tests
              </button>
              <button 
                className={`cta ${isSubmitting ? 'loading' : ''}`}
                onClick={submitSolution}
                disabled={!battleStarted || battleEnded || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </button>
              {/* Host teaching/force-follow controls */}
              {currentUser?.uid === (battleConfig?.hostId) && (
                <>
                  {!isForceFollow ? (
                    <button className="cta cta--secondary" onClick={startForceFollow}>Force Follow</button>
                  ) : (
                    <button className="cta cta--ghost" onClick={stopForceFollow}>Release Follow</button>
                  )}
                  <button className={`cta cta--secondary ${isTeachingMode ? 'active' : ''}`}
                    onClick={() => {
                      // Toggle via REST settings for persistence and broadcast
                      fetch(`${API_BASE}/battle/${roomId}/settings`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teachingMode: !isTeachingMode })
                      }).catch(()=>{});
                    }}
                  >{isTeachingMode ? 'Unlock Inputs' : 'Teaching Mode'}</button>
                </>
              )}
              <button 
                className={`cta cta--secondary ${isChangesPanelVisible ? 'active' : ''}`}
                onClick={() => setIsChangesPanelVisible(!isChangesPanelVisible)}
                title="Toggle Changes Panel"
              >
                📝 Changes
              </button>
            </div>
          </div>
          
          <div className="editor-container" ref={editorRef}>
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage={language}
              defaultValue={language === 'javascript' ? problem.templates.javascript : problem.templates.python}
              options={{ 
                minimap: { enabled: true }, 
                fontSize: 14, 
                wordWrap: 'on', 
                automaticLayout: true,
                glyphMargin: true,
                readOnly: !battleStarted || battleEnded
              }}
              onChange={(value) => { 
                editorValueRef.current = value || '';
                if (!baseCodeForDiff) {
                  setBaseCodeForDiff(value || '');
                }
                
                // Track significant code changes for activity feed
                if (battleStarted && !battleEnded && value) {
                  const currentLength = value.length;
                  const previousLength = lastCodeLengthRef.current;
                  
                  // Only track if there's a significant change (more than 10 characters)
                  if (Math.abs(currentLength - previousLength) > 10) {
                    // Clear existing timeout
                    if (codeChangeTimeoutRef.current) {
                      clearTimeout(codeChangeTimeoutRef.current);
                    }
                    
                    // Set new timeout to debounce code change events
                    codeChangeTimeoutRef.current = setTimeout(() => {
                      const linesChanged = Math.abs(currentLength - previousLength);
                      emitCodeChangeActivity('modified code', linesChanged);
                      lastCodeLengthRef.current = currentLength;
                      if (roomId) {
                        emitBattleCodeChange({ text: value.slice(previousLength), version: ++lastEmitVersionRef.current });
                        pendingChangesRef.current.push({
                          timestamp: new Date().toISOString(),
                          range: undefined,
                          text: value.slice(previousLength),
                          version: lastEmitVersionRef.current,
                          linesChanged
                        });
                      }
                    }, 2000); // 2 second debounce
                  }
                }
              }}
              onMount={(editor, monaco) => {
                monacoEditorRef.current = editor;
                monacoRef.current = monaco;
                // Enable breakpoint toggling on glyph margin
                editor.onMouseDown((e: any) => {
                  if (e.target?.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                    const lineNumber = e.target?.position?.lineNumber;
                    if (!lineNumber) return;
                    const exists = debugBreakpoints.some(bp => bp.lineNumber === lineNumber);
                    if (exists) removeBreakpoint(lineNumber); else setBreakpoint(lineNumber);
                  }
                });
                
                // Track cursor position changes
                editor.onDidChangeCursorPosition((e) => {
                  if (battleStarted && !battleEnded) {
                    // If force-follow is active (and I'm not the host), jump to host's position handled by listener
                    emitCursorPosition({
                      lineNumber: e.position.lineNumber,
                      column: e.position.column
                    });
                  }
                });

                // Enhanced selection change tracking
                editor.onDidChangeCursorSelection((e) => {
                  if (battleStarted && !battleEnded) {
                    const selection = e.selection;
                    
                    // Emit selection change (including empty selections to clear)
                    emitSelectionChange({
                      startLineNumber: selection.startLineNumber,
                      startColumn: selection.startColumn,
                      endLineNumber: selection.endLineNumber,
                      endColumn: selection.endColumn
                    });
                    
                    // Emit selection highlight for non-empty selections
                    if (!selection.isEmpty()) {
                      emitSelectionHighlight({
                        startLineNumber: selection.startLineNumber,
                        startColumn: selection.startColumn,
                        endLineNumber: selection.endLineNumber,
                        endColumn: selection.endColumn
                      });
                      
                      // Add selection activity
                      const activity: ActivityItem = {
                        id: `selection-${Date.now()}-${Math.random()}`,
                        userId: currentUser?.uid || 'current-user',
                        displayName: currentUser?.displayName || currentUser?.email || 'You',
                        avatar: currentUser?.photoURL || '👤',
                        activity: 'code-change',
                        timestamp: new Date(),
                        details: {
                          action: 'selected code',
                          description: `Selected code from line ${selection.startLineNumber} to ${selection.endLineNumber}`
                        }
                      };
                      setActivities(prev => [activity, ...prev].slice(0, 50));
                    }
                  }
                });

                // Track scroll changes for viewport sync
                editor.onDidScrollChange((e) => {
                  if (battleStarted && !battleEnded && !isFollowingMode) {
                    const scrollTop = editor.getScrollTop();
                    const scrollLeft = editor.getScrollLeft();
                    const visibleRanges = editor.getVisibleRanges();
                    
                    if (visibleRanges.length > 0) {
                      const visibleRange = visibleRanges[0];
                      emitViewportSync({
                        scrollTop,
                        scrollLeft,
                        visibleRange: {
                          startLineNumber: visibleRange.startLineNumber,
                          endLineNumber: visibleRange.endLineNumber
                        }
                      });
                    }
                  }
                });
              }}
            />
            <CursorDisplay
              userCursors={userCursors}
              userSelections={userSelections}
              currentUserId={currentUser?.uid}
              editorRef={editorRef}
              followRelationship={followRelationship}
            />
          </div>

          {/* Test Results Panel */}
          {testResults && (
            <div className="test-results-panel">
              <div className="test-results-header">
                <h3>Test Results</h3>
                <button 
                  className="close-results" 
                  onClick={() => setTestResults(null)}
                >
                  ×
                </button>
              </div>
              <div className="test-results-content">
                {testResults.error ? (
                  <div className="test-error">
                    <span className="error-icon">❌</span>
                    <span>{testResults.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="test-summary">
                      <div className="test-stats">
                        <span className="passed">✅ {testResults.passed || 0}</span>
                        <span className="total">/ {testResults.total || 0}</span>
                        <span className="score">Score: {testResults.score || 0}</span>
                      </div>
                    </div>
                    {testResults.results && (
                      <div className="test-details">
                        {testResults.results.map((result: any, idx: number) => (
                          <div key={idx} className={`test-case ${result.isPassed ? 'passed' : 'failed'}`}>
                            <span className="test-icon">{result.isPassed ? '✅' : '❌'}</span>
                            <div className="test-info">
                              <div className="test-input">Input: {JSON.stringify(result.args)}</div>
                              <div className="test-expected">Expected: {JSON.stringify(result.expected)}</div>
                              <div className="test-actual">Actual: {JSON.stringify(result.actual)}</div>
                              {result.error && <div className="test-error-msg">Error: {result.error}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Changes Panel with Diff Editor */}
          {isChangesPanelVisible && (
            <div className="test-results-panel">
              <div className="test-results-header">
                <h3>Changes</h3>
                <button 
                  className="close-results" 
                  onClick={() => setIsChangesPanelVisible(false)}
                >
                  ×
                </button>
              </div>
              <div className="test-results-content">
                <DiffEditor
                  height="300px"
                  theme="vs-dark"
                  original={baseCodeForDiff || ''}
                  modified={editorValueRef.current || ''}
                  options={{ readOnly: true, renderSideBySide: true, automaticLayout: true }}
                />
              </div>
            </div>
          )}
          {/* Debug Panel */}
          <DebugPanel
            isActive={debugState.isActive}
            currentLine={debugState.line}
            variables={debugState.variables}
            breakpoints={debugBreakpoints}
            onStart={startDebug}
            onStop={stopDebug}
            onStep={stepDebug}
            onContinue={continueDebug}
          />
        </section>
        {isScreenPanelVisible && (
          <aside className="screens-panel" style={{ width: screenPanelWidth }}>
            <div className="screens-header">
              <div className="screens-title">Shared Screens</div>
              <div className="screens-meta">{activeSharers.length} active</div>
            </div>
            <div className="screens-list">
              {isSharing && localStream && (
                <div className="screen-item">
                  <video
                    className="screen-video"
                    ref={(el) => { if (el && localStream) { el.srcObject = localStream; el.muted = true; el.autoplay = true; el.playsInline = true; } }}
                  />
                  <div className="screen-caption">You (sharing)</div>
                </div>
              )}
              {Array.from(remoteStreams.values()).map((rs) => (
                <div className="screen-item" key={rs.userId}>
                  <video
                    className="screen-video"
                    ref={(el) => { if (el) { el.srcObject = rs.stream; el.autoplay = true; el.playsInline = true; } }}
                  />
                  <div className="screen-caption">{rs.userId}</div>
                </div>
              ))}
              {activeSharers.length === 0 && !isSharing && (
                <div className="screens-empty">No one is sharing yet.</div>
              )}
            </div>
            <div
              className="screens-resizer"
              ref={resizerRef}
              onMouseDown={() => { isResizingRef.current = true; }}
              title="Drag to resize"
            />
          </aside>
        )}
      </div>
      
      {/* Activity Feed Sidebar */}
      <ActivityFeed
        activities={activities}
        isVisible={isActivityFeedVisible}
        onToggle={() => setIsActivityFeedVisible(!isActivityFeedVisible)}
      />
      
      {/* Participant List Sidebar */}
      <ParticipantList
        participants={enhancedParticipants}
        currentUserId={currentUser?.uid}
        onJumpToParticipant={jumpToParticipant}
        onFollowParticipant={startFollowing}
        followRelationship={followRelationship}
        isCollapsed={!isParticipantListVisible}
        onToggleCollapse={() => setIsParticipantListVisible(!isParticipantListVisible)}
      />
    </div>
  );
};

export default BattlePlay;


