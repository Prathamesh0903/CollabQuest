import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import problems from './problems';
import './BattleConfigModal.css';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../utils/api';
import io from 'socket.io-client';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type QuestionSelection = 'random' | 'specific';

interface BattleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBattle?: (roomId: string, roomCode: string) => void;
}

interface Opponent {
  id: string;
  name: string;
  avatar: string;
  status: 'waiting' | 'ready' | 'joined';
  isHost?: boolean;
}

interface BattleConfig {
  difficulty: Difficulty;
  questionSelection: QuestionSelection;
  selectedProblem?: string;
  battleTime: number;
  roomCode: string;
  isHost: boolean;
  defaultPermissions: 'view-only' | 'edit-code' | 'full-access';
  allowPermissionChanges: boolean;
  securityCode?: string;
  restrictions?: {
    allowFileAccess: boolean;
    allowScreenShare: boolean;
    allowDebugging: boolean;
  };
}

interface ShareInfoResponse {
  success: boolean;
  roomId: string;
  roomCode: string;
  shareLink: string;
  codeExpiresAt: string | null;
  status: string;
  participants: { active: number; ready: number };
  battle: { durationMinutes: number | null; problemId: string | null; difficulty: string | null };
}

const BattleConfigModal: React.FC<BattleConfigModalProps> = ({ isOpen, onClose, onStartBattle }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<BattleConfig>({
    difficulty: 'Easy',
    questionSelection: 'random',
    battleTime: 10,
    roomCode: '',
    isHost: true,
    defaultPermissions: 'edit-code',
    allowPermissionChanges: true,
    restrictions: { allowFileAccess: true, allowScreenShare: true, allowDebugging: true }
  });
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfoResponse | null>(null);
  const [isRefreshingCode, setIsRefreshingCode] = useState(false);
  const [isSavingDuration, setIsSavingDuration] = useState(false);
  const socketRef = useRef<any>(null);

  const totalSteps = 4;

  // Stop polling when modal closes
  useEffect(() => {
    if (!isOpen && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isOpen]);

  // Immediately create a battle room when modal opens (if not created yet)
  useEffect(() => {
    const ensureRoomOnOpen = async () => {
      if (isOpen && !roomId && !isLoading) {
        try {
          setIsLoading(true);
          const token = await currentUser?.getIdToken();
          const res = await fetch(`${API_BASE}/battle/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Avoid sending a potentially invalid token to allow optionalAuth path
            },
            body: JSON.stringify({
              difficulty: config.difficulty,
              questionSelection: config.questionSelection,
              selectedProblem: config.selectedProblem,
              battleTime: config.battleTime,
              defaultPermissions: config.defaultPermissions,
              allowPermissionChanges: config.allowPermissionChanges
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setRoomId(data.roomId);
            setConfig(prev => ({ ...prev, roomCode: data.roomCode }));
          }
        } catch (err) {
          console.error('Create battle on open failed:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    ensureRoomOnOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Initialize socket when roomId becomes available and step >= 2 (Share/Opponents)
  useEffect(() => {
    const setupSocket = async () => {
      if (!roomId || socketRef.current) return;
      try {
        const token = await currentUser?.getIdToken();
        const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', {
          auth: { token: token || undefined }
        });
        socketRef.current = socket;

        socket.emit('join-room', { roomId, mode: 'battle' });

        // Reflect participants joining immediately in Step 3
        socket.on('participant-joined', () => {
          // Trigger an immediate refresh of opponents
          void (async () => {
            try {
              const res = await fetch(`${API_BASE}/battle/${roomId}/lobby`);
              const data = await res.json();
              if (data?.success && Array.isArray(data.participants)) {
                const mapped: Opponent[] = data.participants.map((p: any) => ({
                  id: String(p.id),
                  name: p.name,
                  avatar: p.avatar || '👤',
                  status: 'joined',
                  isHost: p.role === 'host'
                }));
                setOpponents(mapped);
                setCurrentStep(3);
              }
            } catch {}
          })();
        });

        // When battle starts, navigate host to play window
        socket.on('battle-started', (data: any) => {
          if (!roomId) return;
          navigate('/battle/play', {
            state: {
              roomId,
              roomCode: config.roomCode,
              battleConfig: {
                difficulty: config.difficulty,
                battleTime: config.battleTime
              }
            }
          });
        });

        socket.on('error', (_err: any) => {
          // Non-fatal for modal context
        });
      } catch (_) {}
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const availableProblems = problems.filter(p => p.difficulty === config.difficulty);

  const updateConfig = (updates: Partial<BattleConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStartBattle = async () => {
    try {
      setIsLoading(true);
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          difficulty: config.difficulty,
          questionSelection: config.questionSelection,
          selectedProblem: config.selectedProblem,
          battleTime: config.battleTime
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create battle');
      setRoomId(data.roomId);
      setConfig(prev => ({ ...prev, roomCode: data.roomCode }));
      setCurrentStep(2);
      setTimeout(startLobbyPolling, 200);
    } catch (e) {
      console.error('Create battle failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure a room exists when entering Share step (Step 2)
  useEffect(() => {
    const autoCreate = async () => {
      if (currentStep === 2 && !roomId && !isLoading) {
        try {
          setIsLoading(true);
          const token = await currentUser?.getIdToken();
          const res = await fetch(`${API_BASE}/battle/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Avoid sending a potentially invalid token to allow optionalAuth path
            },
            body: JSON.stringify({
              difficulty: config.difficulty,
              questionSelection: config.questionSelection,
              selectedProblem: config.selectedProblem,
              battleTime: config.battleTime,
              defaultPermissions: config.defaultPermissions,
              allowPermissionChanges: config.allowPermissionChanges
            })
          });
          const data = await res.json();
          if (res.ok && data.success && data.roomCode) {
            setRoomId(data.roomId);
            setConfig(prev => ({ ...prev, roomCode: data.roomCode }));
            setTimeout(startLobbyPolling, 200);
          } else {
            console.warn('Battle create did not return roomCode yet');
          }
        } catch (err) {
          console.error('Auto-create battle failed:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    autoCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const startLobbyPolling = () => {
    if (pollRef.current || !roomId) return;
    pollRef.current = setInterval(async () => {
      try {
        const token = await currentUser?.getIdToken();
        const res = await fetch(`${API_BASE}/battle/${roomId}/lobby`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.participants)) {
          const mapped: Opponent[] = data.participants.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            avatar: p.avatar || '👤',
            status: 'joined',
            isHost: p.role === 'host'
          }));
          setOpponents(mapped);
          setCurrentStep(3);
        }
      } catch (_) {}
    }, 1500);
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getShareLink = () => {
    if (shareInfo?.shareLink) return shareInfo.shareLink;
    const fallback = config.roomCode
      ? `${window.location.origin}/battle/join/${config.roomCode}`
      : `${window.location.origin}/battle/join/`;
    try {
      // TEMP: log fallback link if used
      console.log('[Battle] Using fallback share link:', fallback);
    } catch (_) {}
    return fallback;
  };

  // Fetch share info when entering Step 2
  useEffect(() => {
    const fetchShare = async () => {
      if (currentStep !== 2 || !roomId) return;
      try {
        const token = await currentUser?.getIdToken();
        const res = await fetch(`${API_BASE}/battle/${roomId}/share`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) return;
        const data: ShareInfoResponse = await res.json();
        if (data.success) {
          setShareInfo(data);
          try {
            // TEMP: log backend-provided share link if available
            if (data.shareLink) {
              console.log('[Battle] Share link from backend:', data.shareLink);
            }
          } catch (_) {}
          if (data.battle?.durationMinutes) {
            setConfig(prev => ({ ...prev, battleTime: data.battle.durationMinutes || prev.battleTime }));
          }
          if (data.roomCode && data.roomCode !== config.roomCode) {
            setConfig(prev => ({ ...prev, roomCode: data.roomCode }));
          }
        }
      } catch (_) {}
    };
    fetchShare();
    // also poll share info lightly while on step 2
    let interval: any;
    if (currentStep === 2 && roomId) {
      interval = setInterval(fetchShare, 3000);
    }
    return () => interval && clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, roomId]);

  const handleRefreshCode = async () => {
    if (!roomId || isRefreshingCode) return;
    try {
      setIsRefreshingCode(true);
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/${roomId}/refresh-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(prev => ({ ...prev, roomCode: data.roomCode }));
        setShareInfo(prev => prev ? { ...prev, roomCode: data.roomCode, shareLink: data.shareLink } : prev);
      }
    } catch (_) {
    } finally {
      setIsRefreshingCode(false);
    }
  };

  const handleSaveDuration = async (minutes: number) => {
    if (!roomId || isSavingDuration) return;
    try {
      setIsSavingDuration(true);
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/battle/${roomId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ durationMinutes: minutes })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(prev => ({ ...prev, battleTime: minutes }));
      }
    } catch (_) {
    } finally {
      setIsSavingDuration(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`step-dot ${index + 1 === currentStep ? 'active' : index + 1 < currentStep ? 'completed' : ''}`}
          onClick={() => setCurrentStep(index + 1)}
        >
          {index + 1 < currentStep && <span>✓</span>}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <div className="step-header">
        <h3>🎯 Battle Configuration</h3>
        <p>Choose your battle settings and preferences</p>
      </div>

      <div className="config-grid">
        {/* Difficulty Selection */}
        <div className="config-card">
          <h4>Difficulty Level</h4>
          <div className="difficulty-grid">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(diff => (
              <button
                key={diff}
                className={`difficulty-card ${config.difficulty === diff ? 'selected' : ''}`}
                onClick={() => updateConfig({ difficulty: diff })}
              >
                <div className="difficulty-icon">
                  {diff === 'Easy' ? '🟢' : diff === 'Medium' ? '🟡' : '🔴'}
                </div>
                <span>{diff}</span>
              </button>
            ))}
          </div>
        </div>



        {/* Question Selection */}
        <div className="config-card">
          <h4>Question Selection</h4>
          <div className="question-options">
            <label className={`option-card ${config.questionSelection === 'random' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="random"
                checked={config.questionSelection === 'random'}
                onChange={(e) => updateConfig({ questionSelection: e.target.value as QuestionSelection })}
              />
              <div className="option-content">
                <div className="option-icon">🎲</div>
                <div>
                  <div className="option-title">Random Question</div>
                  <div className="option-desc">Get a random problem from selected difficulty</div>
                </div>
              </div>
            </label>
            
            <label className={`option-card ${config.questionSelection === 'specific' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="specific"
                checked={config.questionSelection === 'specific'}
                onChange={(e) => updateConfig({ questionSelection: e.target.value as QuestionSelection })}
              />
              <div className="option-content">
                <div className="option-icon">📝</div>
                <div>
                  <div className="option-title">Choose Specific</div>
                  <div className="option-desc">Select a specific problem to solve</div>
                </div>
              </div>
            </label>
          </div>

          {config.questionSelection === 'specific' && (
            <div className="problem-selector">
              <select
                value={config.selectedProblem || ''}
                onChange={(e) => updateConfig({ selectedProblem: e.target.value })}
                className="problem-select"
              >
                <option value="">Choose a problem...</option>
                {availableProblems.map(problem => (
                  <option key={problem.id} value={problem.id}>
                    {problem.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Battle Duration */}
        <div className="config-card">
          <h4>Battle Duration</h4>
          <div className="problem-selector">
            <select
              value={String(config.battleTime)}
              onChange={(e) => updateConfig({ battleTime: Number(e.target.value) })}
              className="problem-select"
            >
              {[10, 20, 30].map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} minutes</option>
              ))}
            </select>
          </div>
        </div>

        {/* Security Controls */}
        <div className="config-card">
          <h4>Security & Access</h4>
          <div className="permission-settings">
            <label className="setting-item">
              <span>Guest Security Code (optional)</span>
              <input
                type="text"
                placeholder="e.g., 4-digit code"
                value={config.securityCode || ''}
                onChange={(e) => updateConfig({ securityCode: e.target.value })}
                className="problem-select"
              />
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={!!config.restrictions?.allowFileAccess}
                onChange={(e) => updateConfig({ restrictions: { allowFileAccess: e.target.checked, allowScreenShare: !!config.restrictions?.allowScreenShare, allowDebugging: !!config.restrictions?.allowDebugging } })}
              />
              <div className="setting-content">
                <div className="setting-title">Allow File Access</div>
                <div className="setting-desc">Participants can open/download files when enabled</div>
              </div>
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={!!config.restrictions?.allowScreenShare}
                onChange={(e) => updateConfig({ restrictions: { allowFileAccess: !!config.restrictions?.allowFileAccess, allowScreenShare: e.target.checked, allowDebugging: !!config.restrictions?.allowDebugging } })}
              />
              <div className="setting-content">
                <div className="setting-title">Allow Screen Share</div>
                <div className="setting-desc">Participants can share screens if enabled</div>
              </div>
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={!!config.restrictions?.allowDebugging}
                onChange={(e) => updateConfig({ restrictions: { allowFileAccess: !!config.restrictions?.allowFileAccess, allowScreenShare: !!config.restrictions?.allowScreenShare, allowDebugging: e.target.checked } })}
              />
              <div className="setting-content">
                <div className="setting-title">Allow Debugging</div>
                <div className="setting-desc">Enable collaborative debugging features</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="step-header">
        <h3>🔐 Permission Settings</h3>
        <p>Configure participant permissions and access levels</p>
      </div>

      <div className="config-grid">
        {/* Default Permissions */}
        <div className="config-card">
          <h4>Default Participant Permissions</h4>
          <div className="permission-options">
            <label className={`option-card ${config.defaultPermissions === 'view-only' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="view-only"
                checked={config.defaultPermissions === 'view-only'}
                onChange={(e) => updateConfig({ defaultPermissions: e.target.value as 'view-only' | 'edit-code' | 'full-access' })}
              />
              <div className="option-content">
                <div className="option-icon">👁️</div>
                <div>
                  <div className="option-title">View Only</div>
                  <div className="option-desc">Can only view the battle, no code editing</div>
                </div>
              </div>
            </label>
            
            <label className={`option-card ${config.defaultPermissions === 'edit-code' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="edit-code"
                checked={config.defaultPermissions === 'edit-code'}
                onChange={(e) => updateConfig({ defaultPermissions: e.target.value as 'view-only' | 'edit-code' | 'full-access' })}
              />
              <div className="option-content">
                <div className="option-icon">✏️</div>
                <div>
                  <div className="option-title">Edit Code</div>
                  <div className="option-desc">Can write and test code, submit solutions</div>
                </div>
              </div>
            </label>
            
            <label className={`option-card ${config.defaultPermissions === 'full-access' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="full-access"
                checked={config.defaultPermissions === 'full-access'}
                onChange={(e) => updateConfig({ defaultPermissions: e.target.value as 'view-only' | 'edit-code' | 'full-access' })}
              />
              <div className="option-content">
                <div className="option-icon">🔓</div>
                <div>
                  <div className="option-title">Full Access</div>
                  <div className="option-desc">Can edit code and manage room settings</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Permission Management */}
        <div className="config-card">
          <h4>Permission Management</h4>
          <div className="permission-settings">
            <label className="setting-item">
              <input
                type="checkbox"
                checked={config.allowPermissionChanges}
                onChange={(e) => updateConfig({ allowPermissionChanges: e.target.checked })}
              />
              <div className="setting-content">
                <div className="setting-title">Allow Permission Changes</div>
                <div className="setting-desc">Hosts can modify individual participant permissions during the battle</div>
              </div>
            </label>
          </div>
          
          <div className="permission-info">
            <h5>Permission Levels:</h5>
            <ul>
              <li><strong>View Only:</strong> Read-only access to battle content</li>
              <li><strong>Edit Code:</strong> Can write, test, and submit code solutions</li>
              <li><strong>Full Access:</strong> All edit-code permissions plus room management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <div className="step-header">
        <h3>🔗 Share Battle</h3>
        <p>Invite opponents, share the code, and set final details</p>
      </div>

      <div className="share-section">
        <div className="room-info-card">
          <div className="room-header">
            <h4>Battle Room</h4>
            <div className="room-status">
              {shareInfo?.status || 'Active'}
            </div>
          </div>
          
          <div className="room-details">
            <div className="room-code-section">
              <label>Room Code</label>
              <div className="code-display">
                <span className="room-code">{config.roomCode}</span>
                <button 
                  className={`copy-button ${copied === 'code' ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(config.roomCode, 'code')}
                >
                  {copied === 'code' ? '✓ Copied' : '📋 Copy'}
                </button>
                <button 
                  className="copy-button"
                  style={{ marginLeft: 8 }}
                  onClick={handleRefreshCode}
                  disabled={isRefreshingCode}
                  title="Generate a new room code"
                >
                  {isRefreshingCode ? 'Refreshing…' : '↻ Refresh'}
                </button>
              </div>
            </div>

            <div className="share-link-section">
              <label>Share Link</label>
              <div className="link-display">
                <input
                  type="text"
                  value={config.roomCode ? getShareLink() : 'Generating link...'}
                  readOnly
                  className="share-link-input"
                />
                <button 
                  className={`copy-button ${copied === 'link' ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(getShareLink(), 'link')}
                  disabled={!config.roomCode}
                  title={!config.roomCode ? 'Please wait, generating room...' : 'Copy link'}
                >
                  {copied === 'link' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="badge">
                👥 Active: {shareInfo?.participants?.active ?? 1}
              </div>
              <div className="badge">
                ✅ Ready: {shareInfo?.participants?.ready ?? 0}
              </div>
              {shareInfo?.codeExpiresAt && (
                <div className="badge" title={new Date(shareInfo.codeExpiresAt).toLocaleString()}>
                  ⏳ Expires soon
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="room-info-card" style={{ minWidth: 260 }}>
          <div className="room-header">
            <h4>Finalize Settings</h4>
          </div>
          <div className="room-details">
            <div style={{ marginBottom: 12 }}>
              <label>Duration</label>
              <div className="problem-selector">
                <select
                  value={String(config.battleTime)}
                  onChange={async (e) => {
                    const minutes = Number(e.target.value);
                    setConfig(prev => ({ ...prev, battleTime: minutes }));
                    await handleSaveDuration(minutes);
                  }}
                  className="problem-select"
                >
                  {[10, 20, 30].map((minutes) => (
                    <option key={minutes} value={minutes}>{minutes} minutes</option>
                  ))}
                </select>
              </div>
              {isSavingDuration && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Saving…</div>}
            </div>

            <div className="qr-section" onClick={() => config.roomCode && copyToClipboard(getShareLink(), 'link')} style={{ cursor: 'pointer' }}>
              {config.roomCode ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getShareLink())}`}
                    alt="Battle join QR"
                    style={{ width: 180, height: 180, borderRadius: 8 }}
                  />
                  <p>Tap QR to copy link</p>
                </div>
              ) : (
                <div className="qr-placeholder">
                  <div className="qr-icon">📱</div>
                  <p>Generating link...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <div className="step-header">
        <h3>👥 Opponents</h3>
        <p>Wait for opponents to join your battle</p>
      </div>

      <div className="opponents-section">
        <div className="opponents-grid">
          {Array.from({ length: 2 }).map((_, index) => {
            const opponent = opponents[index];
            return (
              <div key={index} className={`opponent-slot ${opponent ? 'filled' : 'empty'}`}>
                {opponent ? (
                  <>
                    <div className="opponent-avatar">{opponent.avatar}</div>
                    <div className="opponent-info">
                      <div className="opponent-name">{opponent.name}</div>
                      <div className={`opponent-status ${opponent.status}`}>
                        {opponent.status === 'ready' ? '✅ Ready' : 
                         opponent.status === 'joined' ? '👋 Joined' : '⏳ Waiting'}
                      </div>
                    </div>
                    {opponent.isHost && <div className="host-badge">Host</div>}
                  </>
                ) : (
                  <>
                    <div className="opponent-avatar-placeholder">👤</div>
                    <div className="opponent-info">
                      <div className="opponent-name">Waiting...</div>
                      <div className="opponent-status">Empty Slot</div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {opponents.length === 0 && (
          <div className="waiting-section">
            <div className="loading-animation">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <p>Waiting for opponents to join...</p>
          </div>
        )}

        <div className="battle-summary">
          <h4>Battle Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Mode:</span>
              <span className="summary-value">1v1</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Difficulty:</span>
              <span className="summary-value">{config.difficulty}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Duration:</span>
              <span className="summary-value">{config.battleTime} min</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Question:</span>
              <span className="summary-value">
                {config.questionSelection === 'random' ? 'Random' : 'Specific'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="battle-config-modal-overlay">
      <div className="battle-config-modal">
        <div className="modal-header">
          <div className="header-content">
            <h2>⚔️ Create Battle</h2>
            {renderStepIndicator()}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="modal-footer">
          <div className="footer-content">
            {currentStep > 1 && (
              <button className="btn btn-secondary" onClick={handleBack}>
                ← Back
              </button>
            )}
            
            <div className="step-info">
              Step {currentStep} of {totalSteps}
            </div>

            {currentStep < totalSteps ? (
              <button className="btn btn-primary" onClick={handleNext}>
                Next →
              </button>
            ) : (
              <button 
                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                onClick={() => {
                  // Emit start-battle over socket so everyone in room moves to play
                  if (socketRef.current && roomId) {
                    const durationSeconds = Math.max(60, (config.battleTime || 10) * 60);
                    socketRef.current.emit('start-battle', { roomId, duration: durationSeconds, securityCode: config.securityCode, restrictions: config.restrictions });
                    // Host will also navigate on battle-started; as a fallback, navigate after short delay
                    setTimeout(() => {
                      navigate('/battle/play', {
                        state: {
                          roomId,
                          roomCode: config.roomCode,
                          battleConfig: { difficulty: config.difficulty, battleTime: config.battleTime }
                        }
                      });
                    }, 300);
                  } else if (onStartBattle && roomId) {
                    onStartBattle(roomId, config.roomCode);
                  } else {
                    handleStartBattle();
                  }
                }}
                disabled={isLoading || (config.questionSelection === 'specific' && !config.selectedProblem)}
              >
                {isLoading ? 'Starting Battle...' : 'Start Battle'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleConfigModal;
 