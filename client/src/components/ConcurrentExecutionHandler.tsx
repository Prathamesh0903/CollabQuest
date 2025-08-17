import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import './ConcurrentExecutionHandler.css';

interface ExecutionStatus {
  queued: Array<{
    userId: string;
    displayName: string;
    avatar?: string;
    timestamp: Date;
  }>;
  active: Array<{
    userId: string;
    displayName: string;
    avatar?: string;
    startTime: Date;
  }>;
  queueLength: number;
  activeCount: number;
  maxConcurrent: number;
}

interface ExecutionHistory {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  language: string;
  status: 'completed' | 'failed';
  executionTime: number;
  timestamp: Date;
  result?: any;
  error?: string;
}

interface ConcurrentExecutionHandlerProps {
  socket: ReturnType<typeof io> | null;
  roomId: string;
  currentUserId: string;
  onExecutionStatusChange?: (status: ExecutionStatus) => void;
  onExecutionHistoryUpdate?: (history: ExecutionHistory[]) => void;
}

const ConcurrentExecutionHandler: React.FC<ConcurrentExecutionHandlerProps> = ({
  socket,
  roomId,
  currentUserId,
  onExecutionStatusChange,
  onExecutionHistoryUpdate
}) => {
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [userExecutions, setUserExecutions] = useState<Set<string>>(new Set());

  // Request execution status
  const requestExecutionStatus = useCallback(() => {
    if (socket && roomId) {
      socket.emit('get-execution-status', { roomId });
    }
  }, [socket, roomId]);

  // Request execution history
  const requestExecutionHistory = useCallback(() => {
    if (socket && roomId) {
      socket.emit('get-execution-history', { roomId, limit: 20 });
    }
  }, [socket, roomId]);

  // Cancel user's execution
  const cancelExecution = useCallback(() => {
    if (socket && roomId) {
      socket.emit('cancel-execution', { roomId });
    }
  }, [socket, roomId]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Execution queued event
    const handleExecutionQueued = (data: {
      userId: string;
      displayName: string;
      avatar?: string;
      executionId: string;
      position: number;
      timestamp: Date;
    }) => {
      console.log('Execution queued:', data);
      if (data.userId === currentUserId) {
        setUserExecutions(prev => new Set(prev).add(data.executionId));
      }
      requestExecutionStatus();
    };

    // Execution started event
    const handleExecutionStarted = (data: {
      executionId: string;
      userId: string;
      displayName: string;
      avatar?: string;
      language: string;
      timestamp: Date;
    }) => {
      console.log('Execution started:', data);
      requestExecutionStatus();
    };

    // Execution completed event
    const handleExecutionCompleted = (data: {
      executionId: string;
      userId: string;
      displayName: string;
      avatar?: string;
      result: any;
      executionTime: number;
      timestamp: Date;
    }) => {
      console.log('Execution completed:', data);
      if (data.userId === currentUserId) {
        setUserExecutions(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.executionId);
          return newSet;
        });
      }
      requestExecutionStatus();
      requestExecutionHistory();
    };

    // Execution failed event
    const handleExecutionFailed = (data: {
      executionId: string;
      userId: string;
      displayName: string;
      avatar?: string;
      error: string;
      executionTime: number;
      timestamp: Date;
    }) => {
      console.log('Execution failed:', data);
      if (data.userId === currentUserId) {
        setUserExecutions(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.executionId);
          return newSet;
        });
      }
      requestExecutionStatus();
      requestExecutionHistory();
    };

    // Execution cancelled event
    const handleExecutionCancelled = (data: {
      userId: string;
      displayName: string;
      avatar?: string;
      timestamp: Date;
    }) => {
      console.log('Execution cancelled:', data);
      if (data.userId === currentUserId) {
        setUserExecutions(new Set());
      }
      requestExecutionStatus();
    };

    // Execution status response
    const handleExecutionStatus = (status: ExecutionStatus) => {
      setExecutionStatus(status);
      onExecutionStatusChange?.(status);
    };

    // Execution history response
    const handleExecutionHistory = (history: ExecutionHistory[]) => {
      setExecutionHistory(history);
      onExecutionHistoryUpdate?.(history);
    };

    // Socket event listeners
    socket.on('execution-queued', handleExecutionQueued);
    socket.on('execution-started', handleExecutionStarted);
    socket.on('execution-completed', handleExecutionCompleted);
    socket.on('execution-failed', handleExecutionFailed);
    socket.on('execution-cancelled', handleExecutionCancelled);
    socket.on('execution-status', handleExecutionStatus);
    socket.on('execution-history', handleExecutionHistory);

    // Initial requests
    requestExecutionStatus();
    requestExecutionHistory();

    // Cleanup
    return () => {
      socket.off('execution-queued', handleExecutionQueued);
      socket.off('execution-started', handleExecutionStarted);
      socket.off('execution-completed', handleExecutionCompleted);
      socket.off('execution-failed', handleExecutionFailed);
      socket.off('execution-cancelled', handleExecutionCancelled);
      socket.off('execution-status', handleExecutionStatus);
      socket.off('execution-history', handleExecutionHistory);
    };
  }, [socket, roomId, currentUserId, requestExecutionStatus, requestExecutionHistory, onExecutionStatusChange, onExecutionHistoryUpdate]);

  // Auto-refresh execution status
  useEffect(() => {
    const interval = setInterval(() => {
      if (executionStatus && (executionStatus.activeCount > 0 || executionStatus.queueLength > 0)) {
        requestExecutionStatus();
      }
    }, 2000); // Refresh every 2 seconds when there's activity

    return () => clearInterval(interval);
  }, [executionStatus, requestExecutionStatus]);

  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getUserPosition = (userId: string): number => {
    if (!executionStatus) return -1;
    return executionStatus.queued.findIndex(exec => exec.userId === userId) + 1;
  };

  const isUserInQueue = (userId: string): boolean => {
    return executionStatus?.queued.some(exec => exec.userId === userId) || false;
  };

  const isUserExecuting = (userId: string): boolean => {
    return executionStatus?.active.some(exec => exec.userId === userId) || false;
  };

  if (!executionStatus) return null;

  return (
    <div className="concurrent-execution-handler">
      {/* Execution Status Indicator */}
      <div className="execution-status-indicator">
        <button
          className={`status-button ${showExecutionPanel ? 'active' : ''}`}
          onClick={() => setShowExecutionPanel(!showExecutionPanel)}
        >
          <span className="status-icon">
            {executionStatus.activeCount > 0 ? '⚡' : '⏳'}
          </span>
          <span className="status-text">
            {executionStatus.activeCount > 0 
              ? `${executionStatus.activeCount} executing`
              : executionStatus.queueLength > 0 
                ? `${executionStatus.queueLength} queued`
                : 'Ready'
            }
          </span>
          {(executionStatus.activeCount > 0 || executionStatus.queueLength > 0) && (
            <span className="status-badge">
              {executionStatus.activeCount + executionStatus.queueLength}
            </span>
          )}
        </button>
      </div>

      {/* Execution Panel */}
      {showExecutionPanel && (
        <div className="execution-panel">
          <div className="panel-header">
            <h3>Execution Status</h3>
            <button 
              className="close-button"
              onClick={() => setShowExecutionPanel(false)}
            >
              ×
            </button>
          </div>

          {/* Active Executions */}
          {executionStatus.active.length > 0 && (
            <div className="execution-section">
              <h4>Currently Executing ({executionStatus.active.length}/{executionStatus.maxConcurrent})</h4>
              <div className="execution-list">
                {executionStatus.active.map((exec, index) => (
                  <div key={index} className={`execution-item active ${exec.userId === currentUserId ? 'current-user' : ''}`}>
                    <div className="execution-user">
                      {exec.avatar && <img src={exec.avatar} alt={exec.displayName} className="user-avatar" />}
                      <span className="user-name">{exec.displayName}</span>
                      {exec.userId === currentUserId && <span className="user-badge">You</span>}
                    </div>
                    <div className="execution-time">
                      Started: {formatTimestamp(exec.startTime)}
                    </div>
                    <div className="execution-status">
                      <span className="status-dot executing"></span>
                      Executing...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Queued Executions */}
          {executionStatus.queued.length > 0 && (
            <div className="execution-section">
              <h4>Queued ({executionStatus.queued.length})</h4>
              <div className="execution-list">
                {executionStatus.queued.map((exec, index) => (
                  <div key={index} className={`execution-item queued ${exec.userId === currentUserId ? 'current-user' : ''}`}>
                    <div className="execution-user">
                      {exec.avatar && <img src={exec.avatar} alt={exec.displayName} className="user-avatar" />}
                      <span className="user-name">{exec.displayName}</span>
                      {exec.userId === currentUserId && <span className="user-badge">You</span>}
                    </div>
                    <div className="execution-position">
                      Position: {index + 1}
                    </div>
                    <div className="execution-time">
                      Queued: {formatTimestamp(exec.timestamp)}
                    </div>
                    <div className="execution-status">
                      <span className="status-dot queued"></span>
                      Waiting...
                    </div>
                    {exec.userId === currentUserId && (
                      <button 
                        className="cancel-button"
                        onClick={cancelExecution}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent History */}
          {executionHistory.length > 0 && (
            <div className="execution-section">
              <h4>Recent Executions</h4>
              <div className="execution-list">
                {executionHistory.slice(0, 5).map((exec) => (
                  <div key={exec.id} className={`execution-item history ${exec.userId === currentUserId ? 'current-user' : ''}`}>
                    <div className="execution-user">
                      {exec.avatar && <img src={exec.avatar} alt={exec.displayName} className="user-avatar" />}
                      <span className="user-name">{exec.displayName}</span>
                      {exec.userId === currentUserId && <span className="user-badge">You</span>}
                    </div>
                    <div className="execution-details">
                      <span className="language-badge">{exec.language}</span>
                      <span className="execution-time">{formatExecutionTime(exec.executionTime)}</span>
                    </div>
                    <div className="execution-status">
                      <span className={`status-dot ${exec.status}`}></span>
                      {exec.status === 'completed' ? 'Success' : 'Failed'}
                    </div>
                    <div className="execution-timestamp">
                      {formatTimestamp(exec.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Activity */}
          {executionStatus.active.length === 0 && executionStatus.queued.length === 0 && executionHistory.length === 0 && (
            <div className="no-activity">
              <p>No recent executions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConcurrentExecutionHandler;
