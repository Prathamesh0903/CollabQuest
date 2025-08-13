import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import problems from './problems';
import './BattleConfigModal.css';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type QuestionSelection = 'random' | 'specific';

interface BattleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

const BattleConfigModal: React.FC<BattleConfigModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<BattleConfig>({
    difficulty: 'Easy',
    questionSelection: 'random',
    battleTime: 10,
    roomCode: '',
    isHost: true
  });
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const totalSteps = 3;

  // Generate room code when modal opens
  useEffect(() => {
    if (isOpen) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setConfig(prev => ({ ...prev, roomCode: code }));
      
      // Simulate opponents joining
      simulateOpponentsJoining();
    }
  }, [isOpen]);

  const simulateOpponentsJoining = () => {
    setTimeout(() => {
      setOpponents([
        { id: '1', name: 'Alice', avatar: '👩‍💻', status: 'joined', isHost: true },
        { id: '2', name: 'Bob', avatar: '👨‍💻', status: 'ready' }
      ]);
    }, 1500);
  };

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
    setIsLoading(true);
    
    // Simulate battle creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    navigate('/battle/play', { state: { battleConfig: config } });
    onClose();
    setIsLoading(false);
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

  const getShareLink = () => `${window.location.origin}/battle/join/${config.roomCode}`;

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
          <div className="time-slider">
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={config.battleTime}
              onChange={(e) => updateConfig({ battleTime: Number(e.target.value) })}
              className="time-range"
            />
            <div className="time-display">
              <span className="time-value">{config.battleTime} minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="step-header">
        <h3>🔗 Share Battle</h3>
        <p>Invite opponents to join your battle room</p>
      </div>

      <div className="share-section">
        <div className="room-info-card">
          <div className="room-header">
            <h4>Battle Room</h4>
            <div className="room-status">Active</div>
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
              </div>
            </div>

            <div className="share-link-section">
              <label>Share Link</label>
              <div className="link-display">
                <input
                  type="text"
                  value={getShareLink()}
                  readOnly
                  className="share-link-input"
                />
                <button 
                  className={`copy-button ${copied === 'link' ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(getShareLink(), 'link')}
                >
                  {copied === 'link' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="qr-section">
          <div className="qr-placeholder">
            <div className="qr-icon">📱</div>
            <p>Scan to join</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
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
                onClick={handleStartBattle}
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
