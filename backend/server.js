const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const batchRoutes = require('./routes/batchRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const labRoutes = require('./routes/labRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Load environment variables
dotenv.config();

// Environment validation and logging
console.log('🔧 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   PORT: ${process.env.PORT || 5000}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? 'Configured' : 'Not configured'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);

// Connect to database
connectDB();

const app = express();

// CORS - Must be before other middleware
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      process.env.FRONTEND_URL,
      process.env.PROD_FRONTEND_URL
    ].filter(Boolean);

console.log('🔗 CORS Origins configured:', corsOrigins);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced security middleware
const {
  securityHeaders,
  suspiciousUserAgentDetection,
  sqlInjectionDetection,
  xssDetection,
  authFailureMonitoring,
  requestSizeMonitoring
} = require('./middleware/securityMiddleware');

app.use(securityHeaders);
app.use(suspiciousUserAgentDetection);
app.use(requestSizeMonitoring);
app.use(sqlInjectionDetection);
app.use(xssDetection);
app.use(authFailureMonitoring);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Enhanced rate limiting (only in production or when explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMITING === 'true') {
  const {
    apiRateLimiter,
    burstProtectionRateLimiter
  } = require('./middleware/rateLimitMiddleware');

  console.log('🛡️ Rate limiting enabled');

  // Apply burst protection globally
  app.use(burstProtectionRateLimiter);

  // Apply general API rate limiting
  app.use('/api', apiRateLimiter);
} else {
  console.log('⚠️ Rate limiting disabled for development');
}

// Handle preflight requests
app.options('*', cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'CDC Attendance Management System API is running!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    status: 'healthy'
  });
});

// Error handler
app.use(errorHandler);

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
