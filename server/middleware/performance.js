const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();
  
  // Add request ID for tracking
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    // Log performance metrics
    const metrics = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryDelta: `${Math.round(memoryDelta / 1024 / 1024 * 100) / 100}MB`,
      user: req.user?.uid || 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    // Log slow queries
    if (duration > 1000) {
      console.warn('Slow query detected:', metrics);
    } else if (duration > 500) {
      console.log('Moderate query:', metrics);
    } else {
      console.log('Fast query:', metrics);
    }
    
    // Log memory usage for large operations
    if (memoryDelta > 10 * 1024 * 1024) { // 10MB
      console.warn('High memory usage detected:', metrics);
    }
  });
  
  next();
};

// Database connection health check
const healthCheck = async (req, res) => {
  const checks = {
    mongodb: false,
    supabase: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
  
  try {
    // Check MongoDB connection
    const mongoose = require('mongoose');
    await mongoose.connection.db.admin().ping();
    checks.mongodb = true;
  } catch (error) {
    console.error('MongoDB health check failed:', error.message);
  }
  
  try {
    // In development, mark Supabase healthy if URL or JWKS is configured
    if (process.env.NODE_ENV === 'development') {
      checks.supabase = Boolean(process.env.SUPABASE_URL || process.env.SUPABASE_JWKS_URL);
    } else {
      // Production: perform a lightweight check only if service role key is available
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        // Avoid requiring any schema setup: call the auth jwks endpoint as a quick ping
        const fetch = require('node-fetch');
        const jwksUrl = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/keys`;
        const res = await fetch(jwksUrl, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY } });
        checks.supabase = res.ok;
      } else {
        checks.supabase = false;
      }
    }
  } catch (error) {
    console.error('Supabase health check failed:', error.message);
  }
  
  // In development, only MongoDB is required for overall 200 status
  const isHealthy = checks.mongodb && (checks.supabase || process.env.NODE_ENV === 'development');
  res.status(isHealthy ? 200 : 503).json(checks);
};

module.exports = {
  performanceMiddleware,
  healthCheck
};
