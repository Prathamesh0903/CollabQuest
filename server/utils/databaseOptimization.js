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

      // Helper function to create indexes safely
      const createIndexesSafely = async (collectionName, indexes) => {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          
          // Get existing indexes
          const existingIndexes = await collection.indexes();
          const existingIndexNames = existingIndexes.map(idx => idx.name);
          
          // Filter out indexes that already exist
          const indexesToCreate = indexes.filter(idx => 
            !existingIndexNames.includes(idx.name || `${Object.keys(idx.key).join('_')}_${Object.values(idx.key).join('_')}`)
          );
          
          if (indexesToCreate.length > 0) {
            await collection.createIndexes(indexesToCreate);
            console.log(`${collectionName} indexes created: ${indexesToCreate.map(idx => idx.name).join(', ')}`);
          } else {
            console.log(`${collectionName} indexes already exist, skipping creation`);
          }
        } catch (error) {
          // Handle specific index conflicts
          if (error.code === 86 || error.codeName === 'IndexKeySpecsConflict') {
            console.log(`${collectionName} indexes have conflicts, but this is expected in production. Skipping.`);
          } else {
            console.log(`${collectionName} index creation failed:`, error.message);
          }
        }
      };

      // DSAProblem indexes
      await createIndexesSafely('dsaproblems', [
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

      // DSAProgress indexes
      await createIndexesSafely('dsaprogress', [
        { key: { firebaseUid: 1, problemId: 1 }, unique: true, name: 'firebaseUid_problemId_unique' },
        { key: { firebaseUid: 1 }, name: 'firebaseUid_1' },
        { key: { problemId: 1 }, name: 'problemId_1' },
        { key: { isCompleted: 1 }, name: 'isCompleted_1' },
        { key: { completedAt: 1 }, name: 'completedAt_1' },
        { key: { firebaseUid: 1, isCompleted: 1 }, name: 'firebaseUid_isCompleted_1' }
      ]);

      // DSASubmission indexes
      await createIndexesSafely('dsasubmissions', [
        { key: { user_id: 1, problem_id: 1 }, name: 'user_id_problem_id_1' },
        { key: { user_id: 1 }, name: 'user_id_1' },
        { key: { problem_id: 1 }, name: 'problem_id_1' },
        { key: { language: 1 }, name: 'language_1' },
        { key: { status: 1 }, name: 'status_1' },
        { key: { createdAt: 1 }, name: 'createdAt_1' },
        { key: { user_id: 1, createdAt: -1 }, name: 'user_id_createdAt_-1' },
        { key: { problem_id: 1, createdAt: -1 }, name: 'problem_id_createdAt_-1' }
      ]);

      // UserMapping indexes
      await createIndexesSafely('usermappings', [
        { key: { firebaseUid: 1 }, unique: true, name: 'firebaseUid_unique' },
        { key: { dsaUserId: 1 }, unique: true, name: 'dsaUserId_unique' },
        { key: { email: 1 }, name: 'email_1' },
        { key: { isActive: 1 }, name: 'isActive_1' },
        { key: { firebaseUid: 1, isActive: 1 }, name: 'firebaseUid_isActive_1' }
      ]);

      // DSACategory indexes
      await createIndexesSafely('dsacategories', [
        { key: { slug: 1 }, unique: true, name: 'slug_unique' },
        { key: { name: 1 }, name: 'name_1' },
        { key: { isActive: 1 }, name: 'isActive_1' }
      ]);

      this.indexesCreated = true;
      console.log('Database index creation completed successfully');
    } catch (error) {
      console.error('Error in database index creation process:', error);
      // Don't throw error - let the server continue running
      // Index conflicts are expected in production
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
