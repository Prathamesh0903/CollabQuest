const mongoose = require('mongoose');

// Database optimization utilities
class DatabaseOptimizer {
  constructor() {
    this.indexesCreated = false;
  }

  // Create optimized indexes for DSA collections
  async createIndexes() {
    if (this.indexesCreated) {
      return;
    }

    try {
      console.log('Creating database indexes for optimization...');

      // DSAProblem indexes
      try {
        await mongoose.connection.db.collection('dsaproblems').createIndexes([
          { key: { problemNumber: 1 }, unique: true, name: 'problemNumber_unique' },
          { key: { title: 1 }, unique: true, name: 'title_unique' },
          { key: { difficulty: 1 }, name: 'difficulty_1' },
          { key: { category: 1 }, name: 'category_1' },
          { key: { tags: 1 }, name: 'tags_1' },
          { key: { isActive: 1 }, name: 'isActive_1' },
          { key: { difficulty: 1, category: 1 }, name: 'difficulty_category_1' },
          { key: { isActive: 1, difficulty: 1 }, name: 'isActive_difficulty_1' },
          { key: { isActive: 1, category: 1 }, name: 'isActive_category_1' }
        ]);
        console.log('DSAProblem indexes created successfully');
      } catch (error) {
        console.log('DSAProblem indexes already exist or failed to create:', error.message);
      }

      // DSAProgress indexes
      try {
        await mongoose.connection.db.collection('dsaprogress').createIndexes([
          { key: { firebaseUid: 1, problemId: 1 }, unique: true, name: 'firebaseUid_problemId_unique' },
          { key: { firebaseUid: 1 }, name: 'firebaseUid_1' },
          { key: { problemId: 1 }, name: 'problemId_1' },
          { key: { isCompleted: 1 }, name: 'isCompleted_1' },
          { key: { completedAt: 1 }, name: 'completedAt_1' },
          { key: { firebaseUid: 1, isCompleted: 1 }, name: 'firebaseUid_isCompleted_1' }
        ]);
        console.log('DSAProgress indexes created successfully');
      } catch (error) {
        console.log('DSAProgress indexes already exist or failed to create:', error.message);
      }

      // DSASubmission indexes
      await mongoose.connection.db.collection('dsasubmissions').createIndexes([
        { key: { user_id: 1, problem_id: 1 } },
        { key: { user_id: 1 } },
        { key: { problem_id: 1 } },
        { key: { language: 1 } },
        { key: { status: 1 } },
        { key: { createdAt: 1 } },
        { key: { user_id: 1, createdAt: -1 } },
        { key: { problem_id: 1, createdAt: -1 } }
      ]);

      // UserMapping indexes
      await mongoose.connection.db.collection('usermappings').createIndexes([
        { key: { firebaseUid: 1 }, unique: true },
        { key: { dsaUserId: 1 }, unique: true },
        { key: { email: 1 } },
        { key: { isActive: 1 } },
        { key: { firebaseUid: 1, isActive: 1 } }
      ]);

      // DSACategory indexes
      await mongoose.connection.db.collection('dsacategories').createIndexes([
        { key: { slug: 1 }, unique: true },
        { key: { name: 1 } },
        { key: { isActive: 1 } }
      ]);

      this.indexesCreated = true;
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating database indexes:', error);
      throw error;
    }
  }

  // Get query performance statistics
  async getQueryStats() {
    try {
      const stats = await mongoose.connection.db.stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize,
        totalSize: stats.dataSize + stats.indexSize
      };
    } catch (error) {
      console.error('Error getting query stats:', error);
      return null;
    }
  }

  // Analyze slow queries
  async analyzeSlowQueries() {
    try {
      const result = await mongoose.connection.db.runCommand({
        profile: 2, // Profile all operations
        slowms: 100 // Log operations slower than 100ms
      });
      return result;
    } catch (error) {
      console.error('Error analyzing slow queries:', error);
      return null;
    }
  }

  // Get collection statistics
  async getCollectionStats(collectionName) {
    try {
      const stats = await mongoose.connection.db.collection(collectionName).stats();
      return {
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize,
        storageSize: stats.storageSize,
        totalIndexSize: stats.totalIndexSize,
        indexSizes: stats.indexSizes
      };
    } catch (error) {
      console.error(`Error getting stats for ${collectionName}:`, error);
      return null;
    }
  }
}

// Query optimization helpers
class QueryOptimizer {
  // Optimize problem queries
  static optimizeProblemQuery(filter, options = {}) {
    const optimizedFilter = { ...filter };
    const optimizedOptions = { ...options };

    // Ensure isActive filter is always present for performance
    if (!optimizedFilter.isActive) {
      optimizedFilter.isActive = true;
    }

    // Add default sort for consistent results
    if (!optimizedOptions.sort) {
      optimizedOptions.sort = { problemNumber: 1 };
    }

    // Limit fields for better performance
    if (!optimizedOptions.select) {
      optimizedOptions.select = '_id title difficulty category tags problemNumber';
    }

    return { filter: optimizedFilter, options: optimizedOptions };
  }

  // Optimize progress queries
  static optimizeProgressQuery(firebaseUid, additionalFilter = {}) {
    const filter = {
      firebaseUid,
      ...additionalFilter
    };

    return {
      filter,
      options: {
        select: 'problemId isCompleted completedAt notes',
        sort: { completedAt: -1 }
      }
    };
  }

  // Optimize submission queries
  static optimizeSubmissionQuery(userId, additionalFilter = {}) {
    const filter = {
      user_id: userId,
      ...additionalFilter
    };

    return {
      filter,
      options: {
        select: '_id problem_id code language status createdAt',
        sort: { createdAt: -1 },
        limit: 50 // Limit to recent submissions
      }
    };
  }
}

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queryCount: 0,
      slowQueries: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }

  // Record query performance
  recordQuery(duration, queryType) {
    this.metrics.queryCount++;
    this.metrics.totalResponseTime += duration;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.queryCount;

    if (duration > 1000) { // Slow query threshold
      this.metrics.slowQueries++;
      console.warn(`Slow query detected: ${queryType} took ${duration}ms`);
    }
  }

  // Get performance metrics
  getMetrics() {
    return {
      ...this.metrics,
      slowQueryPercentage: this.metrics.queryCount > 0 
        ? (this.metrics.slowQueries / this.metrics.queryCount) * 100 
        : 0
    };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      queryCount: 0,
      slowQueries: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }
}

// Create singleton instances
const databaseOptimizer = new DatabaseOptimizer();
const performanceMonitor = new PerformanceMonitor();

module.exports = {
  DatabaseOptimizer,
  QueryOptimizer,
  PerformanceMonitor,
  databaseOptimizer,
  performanceMonitor
};
