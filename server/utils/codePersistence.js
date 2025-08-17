const CollaborativeSession = require('../models/CollaborativeSession');

// In-memory cache for session states to reduce database load
const sessionCache = new Map();

// Periodic save intervals (in milliseconds)
const SAVE_INTERVALS = {
  FREQUENT: 5000,    // Every 5 seconds for active sessions
  NORMAL: 30000,     // Every 30 seconds for moderate activity
  INFREQUENT: 120000 // Every 2 minutes for idle sessions
};

// Auto-save timers for each session
const autoSaveTimers = new Map();

// Version control for conflict resolution
const versionHistory = new Map(); // sessionId -> { fileName -> [versions] }

/**
 * Enhanced code persistence manager for collaborative sessions
 */
class CodePersistenceManager {
  
  /**
   * Initialize auto-save for a session
   */
  static initializeAutoSave(sessionId, initialFiles = []) {
    if (autoSaveTimers.has(sessionId)) {
      clearInterval(autoSaveTimers.get(sessionId));
    }

    // Initialize cache
    sessionCache.set(sessionId, {
      files: new Map(initialFiles.map(f => [f.fileName, f])),
      lastSave: new Date(),
      isDirty: false,
      saveCount: 0,
      lastActivity: new Date()
    });

    // Start auto-save timer
    const timer = setInterval(() => {
      this.performAutoSave(sessionId);
    }, SAVE_INTERVALS.NORMAL);

    autoSaveTimers.set(sessionId, timer);
    
    console.log(`Auto-save initialized for session ${sessionId}`);
  }

  /**
   * Mark session as dirty (needs saving)
   */
  static markDirty(sessionId, fileName) {
    const cache = sessionCache.get(sessionId);
    if (cache) {
      cache.isDirty = true;
      cache.lastActivity = new Date();
      
      // Adjust save frequency based on activity
      this.adjustSaveFrequency(sessionId);
    }
  }

  /**
   * Update file content in cache
   */
  static updateFileContent(sessionId, fileName, content, version, modifiedBy) {
    const cache = sessionCache.get(sessionId);
    if (!cache) return;

    const file = cache.files.get(fileName) || {
      fileName,
      filePath: `/${fileName}`,
      language: 'javascript',
      content: '',
      version: 0,
      lastModified: new Date(),
      lastModifiedBy: modifiedBy,
      isActive: true
    };

    // Update file
    file.content = content;
    file.version = version;
    file.lastModified = new Date();
    file.lastModifiedBy = modifiedBy;

    cache.files.set(fileName, file);
    cache.isDirty = true;
    cache.lastActivity = new Date();

    // Add to version history for conflict resolution
    this.addVersionHistory(sessionId, fileName, {
      content,
      version,
      modifiedBy,
      timestamp: new Date()
    });
  }

  /**
   * Perform auto-save to database
   */
  static async performAutoSave(sessionId) {
    const cache = sessionCache.get(sessionId);
    if (!cache || !cache.isDirty) return;

    try {
      const session = await CollaborativeSession.findBySessionId(sessionId);
      if (!session) {
        console.warn(`Session ${sessionId} not found for auto-save`);
        return;
      }

      // Update all modified files
      for (const [fileName, file] of cache.files) {
        const dbFile = session.files.find(f => f.fileName === fileName && f.isActive);
        
        if (!dbFile) {
          // New file
          await session.addFile(fileName, file.language, file.content, file.lastModifiedBy);
        } else if (dbFile.version < file.version) {
          // Update existing file
          await session.updateFile(fileName, file.content, file.lastModifiedBy);
        }
      }

      // Update session metadata
      session.lastActive = new Date();
      await session.save();

      // Update cache
      cache.isDirty = false;
      cache.lastSave = new Date();
      cache.saveCount++;

      console.log(`Auto-saved session ${sessionId} (${cache.saveCount} saves)`);

    } catch (error) {
      console.error(`Auto-save failed for session ${sessionId}:`, error);
    }
  }

  /**
   * Force immediate save
   */
  static async forceSave(sessionId) {
    const cache = sessionCache.get(sessionId);
    if (!cache) return;

    await this.performAutoSave(sessionId);
  }

  /**
   * Load session state from database
   */
  static async loadSessionState(sessionId) {
    try {
      const session = await CollaborativeSession.findBySessionId(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Initialize cache with database state
      const files = session.files.filter(f => f.isActive);
      this.initializeAutoSave(sessionId, files);

      // Load version history
      for (const file of files) {
        this.addVersionHistory(sessionId, file.fileName, {
          content: file.content,
          version: file.version,
          modifiedBy: file.lastModifiedBy,
          timestamp: file.lastModified
        });
      }

      console.log(`Loaded session state for ${sessionId} with ${files.length} files`);
      return session;

    } catch (error) {
      console.error(`Failed to load session state for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get current session state from cache
   */
  static getSessionState(sessionId) {
    const cache = sessionCache.get(sessionId);
    if (!cache) return null;

    return {
      files: Array.from(cache.files.values()),
      lastSave: cache.lastSave,
      isDirty: cache.isDirty,
      saveCount: cache.saveCount,
      lastActivity: cache.lastActivity
    };
  }

  /**
   * Get specific file content
   */
  static getFileContent(sessionId, fileName) {
    const cache = sessionCache.get(sessionId);
    if (!cache) return null;

    const file = cache.files.get(fileName);
    return file ? file.content : null;
  }

  /**
   * Add version history for conflict resolution
   */
  static addVersionHistory(sessionId, fileName, versionData) {
    if (!versionHistory.has(sessionId)) {
      versionHistory.set(sessionId, new Map());
    }

    const sessionHistory = versionHistory.get(sessionId);
    if (!sessionHistory.has(fileName)) {
      sessionHistory.set(fileName, []);
    }

    const fileHistory = sessionHistory.get(fileName);
    fileHistory.push(versionData);

    // Keep only last 10 versions per file
    if (fileHistory.length > 10) {
      fileHistory.splice(0, fileHistory.length - 10);
    }
  }

  /**
   * Get version history for a file
   */
  static getVersionHistory(sessionId, fileName) {
    const sessionHistory = versionHistory.get(sessionId);
    if (!sessionHistory) return [];

    return sessionHistory.get(fileName) || [];
  }

  /**
   * Adjust save frequency based on activity
   */
  static adjustSaveFrequency(sessionId) {
    const cache = sessionCache.get(sessionId);
    if (!cache) return;

    const now = new Date();
    const timeSinceActivity = now - cache.lastActivity;
    const timeSinceLastSave = now - cache.lastSave;

    let newInterval = SAVE_INTERVALS.NORMAL;

    // More frequent saves for active sessions
    if (timeSinceActivity < 60000) { // Less than 1 minute since last activity
      newInterval = SAVE_INTERVALS.FREQUENT;
    } else if (timeSinceActivity > 300000) { // More than 5 minutes since last activity
      newInterval = SAVE_INTERVALS.INFREQUENT;
    }

    // Update timer if interval changed
    const currentTimer = autoSaveTimers.get(sessionId);
    if (currentTimer) {
      clearInterval(currentTimer);
      
      const newTimer = setInterval(() => {
        this.performAutoSave(sessionId);
      }, newInterval);

      autoSaveTimers.set(sessionId, newTimer);
    }
  }

  /**
   * Clean up session resources
   */
  static cleanupSession(sessionId) {
    // Force final save
    this.forceSave(sessionId);

    // Clear timers
    const timer = autoSaveTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      autoSaveTimers.delete(sessionId);
    }

    // Clear cache
    sessionCache.delete(sessionId);
    versionHistory.delete(sessionId);

    console.log(`Cleaned up session ${sessionId}`);
  }

  /**
   * Recover session state after reconnection
   */
  static async recoverSessionState(sessionId, fileName = null) {
    try {
      const session = await CollaborativeSession.findBySessionId(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found for recovery`);
      }

      // Get current cache state
      const cache = sessionCache.get(sessionId);
      const cacheState = cache ? this.getSessionState(sessionId) : null;

      // If cache exists and is recent, use it
      if (cacheState && cacheState.lastSave && 
          (new Date() - cacheState.lastSave) < 60000) { // Less than 1 minute old
        return {
          source: 'cache',
          files: cacheState.files,
          lastModified: cacheState.lastSave
        };
      }

      // Otherwise, reload from database
      const dbFiles = session.files.filter(f => f.isActive);
      
      // Reinitialize cache
      this.initializeAutoSave(sessionId, dbFiles);

      return {
        source: 'database',
        files: dbFiles,
        lastModified: session.lastActive
      };

    } catch (error) {
      console.error(`Failed to recover session state for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  static getSessionStats(sessionId) {
    const cache = sessionCache.get(sessionId);
    if (!cache) return null;

    return {
      totalFiles: cache.files.size,
      isDirty: cache.isDirty,
      saveCount: cache.saveCount,
      lastSave: cache.lastSave,
      lastActivity: cache.lastActivity,
      timeSinceLastSave: new Date() - cache.lastSave,
      timeSinceLastActivity: new Date() - cache.lastActivity
    };
  }

  /**
   * Batch save multiple sessions
   */
  static async batchSave(sessionIds) {
    const savePromises = sessionIds.map(sessionId => 
      this.performAutoSave(sessionId).catch(error => 
        console.error(`Batch save failed for session ${sessionId}:`, error)
      )
    );

    await Promise.allSettled(savePromises);
    console.log(`Batch save completed for ${sessionIds.length} sessions`);
  }

  /**
   * Get all dirty sessions
   */
  static getDirtySessions() {
    const dirtySessions = [];
    
    for (const [sessionId, cache] of sessionCache.entries()) {
      if (cache.isDirty) {
        dirtySessions.push(sessionId);
      }
    }

    return dirtySessions;
  }

  /**
   * Emergency save all sessions
   */
  static async emergencySaveAll() {
    const dirtySessions = this.getDirtySessions();
    
    if (dirtySessions.length > 0) {
      console.log(`Emergency saving ${dirtySessions.length} dirty sessions`);
      await this.batchSave(dirtySessions);
    }
  }
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Shutting down code persistence manager...');
  await CodePersistenceManager.emergencySaveAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down code persistence manager...');
  await CodePersistenceManager.emergencySaveAll();
  process.exit(0);
});

module.exports = CodePersistenceManager;
