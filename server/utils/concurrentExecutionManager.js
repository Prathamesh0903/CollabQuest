const { executeCode } = require('./codeExecutor');

/**
 * Concurrent Execution Manager
 * Handles multiple users executing code simultaneously in the same session
 * with proper user association, output management, and execution queuing
 */
class ConcurrentExecutionManager {
  constructor() {
    // Store execution queues per room/session
    this.executionQueues = new Map(); // roomId -> Queue
    
    // Store active executions per room
    this.activeExecutions = new Map(); // roomId -> Set of executionIds
    
    // Store execution results with user association
    this.executionResults = new Map(); // executionId -> ExecutionResult
    
    // Store user-specific execution contexts
    this.userExecutions = new Map(); // userId -> Set of executionIds
    
    // Execution configuration
    this.config = {
      maxConcurrentExecutions: 3, // Max concurrent executions per room
      maxQueueSize: 10, // Max queued executions per room
      executionTimeout: 30000, // 30 seconds
      cleanupInterval: 60000 // Cleanup every minute
    };
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Request code execution for a user
   * @param {string} roomId - Room/session identifier
   * @param {string} userId - User identifier
   * @param {string} displayName - User display name
   * @param {string} avatar - User avatar
   * @param {string} language - Programming language
   * @param {string} code - Source code to execute
   * @param {string} input - Input data
   * @param {Object} socket - Socket instance for real-time updates
   * @param {Object} io - Socket.io instance for broadcasting
   * @returns {Promise<Object>} Execution result
   */
  async requestExecution(roomId, userId, displayName, avatar, language, code, input, socket, io) {
    const executionId = this.generateExecutionId();
    const executionRequest = {
      id: executionId,
      roomId,
      userId,
      displayName,
      avatar,
      language,
      code,
      input,
      socket,
      io,
      timestamp: new Date(),
      status: 'queued'
    };

    // Initialize queue and active executions for room if not exists
    if (!this.executionQueues.has(roomId)) {
      this.executionQueues.set(roomId, []);
      this.activeExecutions.set(roomId, new Set());
    }

    const queue = this.executionQueues.get(roomId);
    const activeExecutions = this.activeExecutions.get(roomId);

    // Check if user already has an execution in progress
    const userActiveExecutions = this.getUserActiveExecutions(userId);
    if (userActiveExecutions.size > 0) {
      throw new Error('You already have code execution in progress. Please wait for it to complete.');
    }

    // Check queue size limit
    if (queue.length >= this.config.maxQueueSize) {
      throw new Error('Execution queue is full. Please wait for other executions to complete.');
    }

    // Add to queue
    queue.push(executionRequest);
    
    // Initialize user executions tracking
    if (!this.userExecutions.has(userId)) {
      this.userExecutions.set(userId, new Set());
    }
    this.userExecutions.get(userId).add(executionId);

    // Notify user that execution is queued
    socket.emit('execution-queued', {
      executionId,
      position: queue.length,
      estimatedWaitTime: this.estimateWaitTime(roomId)
    });

    // Broadcast to room that user has queued execution
    io.in(`collab-room:${roomId}`).emit('execution-queued', {
      userId,
      displayName,
      avatar,
      executionId,
      position: queue.length,
      timestamp: new Date()
    });

    // Process queue
    await this.processQueue(roomId);

    // Wait for execution to complete
    return this.waitForExecution(executionId);
  }

  /**
   * Process execution queue for a room
   * @param {string} roomId - Room identifier
   */
  async processQueue(roomId) {
    const queue = this.executionQueues.get(roomId);
    const activeExecutions = this.activeExecutions.get(roomId);

    if (!queue || !activeExecutions) return;

    // Process queued executions if we have capacity
    while (queue.length > 0 && activeExecutions.size < this.config.maxConcurrentExecutions) {
      const executionRequest = queue.shift();
      
      // Skip if execution was cancelled
      if (executionRequest.status === 'cancelled') {
        continue;
      }

      // Start execution
      this.startExecution(executionRequest);
    }
  }

  /**
   * Start code execution
   * @param {Object} executionRequest - Execution request object
   */
  async startExecution(executionRequest) {
    const { id, roomId, userId, displayName, avatar, language, code, input, socket, io } = executionRequest;

    // Mark as active
    executionRequest.status = 'executing';
    this.activeExecutions.get(roomId).add(id);

    // Store execution context
    this.executionResults.set(id, {
      id,
      roomId,
      userId,
      displayName,
      avatar,
      language,
      code,
      input,
      status: 'executing',
      startTime: new Date(),
      result: null,
      error: null
    });

    // Notify all users that execution has started
    io.in(`collab-room:${roomId}`).emit('execution-started', {
      executionId: id,
      userId,
      displayName,
      avatar,
      language,
      timestamp: new Date()
    });

    // Execute code with timeout
    const executionPromise = this.executeCodeWithTimeout(language, code, input);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), this.config.executionTimeout);
    });

    try {
      const result = await Promise.race([executionPromise, timeoutPromise]);
      
      // Store successful result
      const executionResult = this.executionResults.get(id);
      executionResult.status = 'completed';
      executionResult.result = result;
      executionResult.endTime = new Date();
      executionResult.executionTime = executionResult.endTime - executionResult.startTime;

      // Broadcast completion to all users
      io.in(`collab-room:${roomId}`).emit('execution-completed', {
        executionId: id,
        userId,
        displayName,
        avatar,
        result,
        executionTime: executionResult.executionTime,
        timestamp: new Date()
      });

    } catch (error) {
      // Store error result
      const executionResult = this.executionResults.get(id);
      executionResult.status = 'failed';
      executionResult.error = error.message;
      executionResult.endTime = new Date();
      executionResult.executionTime = executionResult.endTime - executionResult.startTime;

      // Broadcast error to all users
      io.in(`collab-room:${roomId}`).emit('execution-failed', {
        executionId: id,
        userId,
        displayName,
        avatar,
        error: error.message,
        executionTime: executionResult.executionTime,
        timestamp: new Date()
      });
    } finally {
      // Remove from active executions
      this.activeExecutions.get(roomId).delete(id);
      
      // Process next queued execution
      await this.processQueue(roomId);
    }
  }

  /**
   * Execute code with enhanced error handling
   * @param {string} language - Programming language
   * @param {string} code - Source code
   * @param {string} input - Input data
   * @returns {Promise<Object>} Execution result
   */
  async executeCodeWithTimeout(language, code, input) {
    try {
      return await executeCode(language, code, input);
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  /**
   * Wait for execution to complete
   * @param {string} executionId - Execution identifier
   * @returns {Promise<Object>} Execution result
   */
  waitForExecution(executionId) {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const result = this.executionResults.get(executionId);
        
        if (!result) {
          reject(new Error('Execution not found'));
          return;
        }

        if (result.status === 'completed') {
          resolve(result);
        } else if (result.status === 'failed') {
          reject(new Error(result.error));
        } else {
          // Still executing, check again in 100ms
          setTimeout(checkStatus, 100);
        }
      };

      checkStatus();
    });
  }

  /**
   * Cancel execution for a user
   * @param {string} userId - User identifier
   * @param {string} roomId - Room identifier
   */
  cancelUserExecution(userId, roomId) {
    const userExecutions = this.userExecutions.get(userId);
    if (!userExecutions) return;

    // Find and cancel queued executions
    const queue = this.executionQueues.get(roomId);
    if (queue) {
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].userId === userId && queue[i].status === 'queued') {
          queue[i].status = 'cancelled';
          queue.splice(i, 1);
        }
      }
    }

    // Note: Active executions cannot be cancelled for security reasons
    // They will complete naturally
  }

  /**
   * Get execution status for a room
   * @param {string} roomId - Room identifier
   * @returns {Object} Room execution status
   */
  getRoomExecutionStatus(roomId) {
    const queue = this.executionQueues.get(roomId) || [];
    const activeExecutions = this.activeExecutions.get(roomId) || new Set();
    
    const queuedExecutions = queue
      .filter(req => req.status === 'queued')
      .map(req => ({
        userId: req.userId,
        displayName: req.displayName,
        avatar: req.avatar,
        timestamp: req.timestamp
      }));

    const activeExecutionDetails = Array.from(activeExecutions).map(id => {
      const result = this.executionResults.get(id);
      return result ? {
        userId: result.userId,
        displayName: result.displayName,
        avatar: result.avatar,
        startTime: result.startTime
      } : null;
    }).filter(Boolean);

    return {
      queued: queuedExecutions,
      active: activeExecutionDetails,
      queueLength: queuedExecutions.length,
      activeCount: activeExecutionDetails.length,
      maxConcurrent: this.config.maxConcurrentExecutions
    };
  }

  /**
   * Get execution history for a room
   * @param {string} roomId - Room identifier
   * @param {number} limit - Maximum number of results to return
   * @returns {Array} Execution history
   */
  getRoomExecutionHistory(roomId, limit = 20) {
    const history = Array.from(this.executionResults.values())
      .filter(result => result.roomId === roomId && result.status !== 'executing')
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, limit);

    return history.map(result => ({
      id: result.id,
      userId: result.userId,
      displayName: result.displayName,
      avatar: result.avatar,
      language: result.language,
      status: result.status,
      executionTime: result.executionTime,
      timestamp: result.endTime,
      result: result.result,
      error: result.error
    }));
  }

  /**
   * Get user's active executions
   * @param {string} userId - User identifier
   * @returns {Set} Set of active execution IDs
   */
  getUserActiveExecutions(userId) {
    const userExecutions = this.userExecutions.get(userId) || new Set();
    const activeExecutions = new Set();

    for (const executionId of userExecutions) {
      const result = this.executionResults.get(executionId);
      if (result && result.status === 'executing') {
        activeExecutions.add(executionId);
      }
    }

    return activeExecutions;
  }

  /**
   * Estimate wait time for execution
   * @param {string} roomId - Room identifier
   * @returns {number} Estimated wait time in milliseconds
   */
  estimateWaitTime(roomId) {
    const queue = this.executionQueues.get(roomId) || [];
    const activeExecutions = this.activeExecutions.get(roomId) || new Set();
    
    // Assume average execution time of 5 seconds
    const averageExecutionTime = 5000;
    const positionInQueue = queue.length;
    const activeCount = activeExecutions.size;
    
    // Calculate wait time based on queue position and active executions
    const queueWaitTime = positionInQueue * averageExecutionTime;
    const activeWaitTime = activeCount >= this.config.maxConcurrentExecutions ? averageExecutionTime : 0;
    
    return queueWaitTime + activeWaitTime;
  }

  /**
   * Generate unique execution ID
   * @returns {string} Unique execution identifier
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup timer to remove old execution results
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupOldResults();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up old execution results
   */
  cleanupOldResults() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [executionId, result] of this.executionResults.entries()) {
      if (result.endTime && result.endTime.getTime() < cutoffTime) {
        this.executionResults.delete(executionId);
        
        // Remove from user executions
        const userExecutions = this.userExecutions.get(result.userId);
        if (userExecutions) {
          userExecutions.delete(executionId);
          if (userExecutions.size === 0) {
            this.userExecutions.delete(result.userId);
          }
        }
      }
    }
  }

  /**
   * Get execution statistics
   * @returns {Object} Execution statistics
   */
  getStatistics() {
    const totalExecutions = this.executionResults.size;
    const activeExecutions = Array.from(this.executionResults.values())
      .filter(result => result.status === 'executing').length;
    const completedExecutions = Array.from(this.executionResults.values())
      .filter(result => result.status === 'completed').length;
    const failedExecutions = Array.from(this.executionResults.values())
      .filter(result => result.status === 'failed').length;

    return {
      totalExecutions,
      activeExecutions,
      completedExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0
    };
  }
}

// Create singleton instance
const concurrentExecutionManager = new ConcurrentExecutionManager();

module.exports = concurrentExecutionManager;
