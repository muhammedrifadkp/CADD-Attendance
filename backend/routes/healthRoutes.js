// Health check routes for system monitoring
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Basic health check endpoint
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {}
    };

    // Check database connection
    try {
      const dbState = mongoose.connection.readyState;
      const dbStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      health.services.database = {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        state: dbStates[dbState] || 'unknown',
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };

      if (dbState === 1) {
        // Test database query
        const collections = await mongoose.connection.db.listCollections().toArray();
        health.services.database.collections = collections.length;
      }
    } catch (error) {
      health.services.database = {
        status: 'critical',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.services.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    };

    // Check CPU usage (basic)
    const cpuUsage = process.cpuUsage();
    health.services.cpu = {
      status: 'healthy',
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'critical',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database connectivity check
router.get('/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    
    if (dbState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected',
        state: dbState
      });
    }

    // Test database query
    const collections = await mongoose.connection.db.listCollections().toArray();
    const stats = await mongoose.connection.db.stats();

    res.status(200).json({
      success: true,
      message: 'Database connected',
      collections: collections.length,
      dbSize: `${Math.round(stats.dataSize / 1024 / 1024)}MB`,
      indexes: stats.indexes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database check failed',
      error: error.message
    });
  }
});

// API endpoints status check
router.get('/endpoints', (req, res) => {
  const endpoints = {
    auth: [
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/profile'
    ],
    users: [
      'GET /api/users/teachers',
      'POST /api/users/teachers',
      'GET /api/users/profile'
    ],
    students: [
      'GET /api/students',
      'POST /api/students',
      'PUT /api/students/:id',
      'DELETE /api/students/:id'
    ],
    batches: [
      'GET /api/batches',
      'POST /api/batches',
      'PUT /api/batches/:id',
      'DELETE /api/batches/:id'
    ],
    attendance: [
      'GET /api/attendance',
      'POST /api/attendance',
      'POST /api/attendance/bulk'
    ],
    lab: [
      'GET /api/lab/pcs',
      'POST /api/lab/pcs',
      'GET /api/lab/bookings',
      'POST /api/lab/bookings'
    ]
  };

  res.status(200).json({
    success: true,
    message: 'Available API endpoints',
    endpoints,
    totalEndpoints: Object.values(endpoints).flat().length
  });
});

module.exports = router;
