const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const autoSeedAdmin = require('./autoSeed');
const userRoutes = require('./routes/userRoutes');
const batchRoutes = require('./routes/batchRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const labRoutes = require('./routes/labRoutes');

// Load environment variables
dotenv.config();

// Connect to database and auto-seed admin
connectDB().then(() => {
  // Auto-seed admin user after database connection
  autoSeedAdmin();
});

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// CORS configuration
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Allow specific methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Test routes
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is running correctly',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    origin: req.headers.origin || 'No origin header'
  });
});

// Manual seed endpoint (for backup)
app.get('/api/seed-admin', async (req, res) => {
  try {
    await autoSeedAdmin();
    res.json({
      message: 'Admin seeding completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error seeding admin',
      error: error.message
    });
  }
});

// Reset admin password endpoint
app.get('/api/reset-admin-password', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/userModel');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@caddcentre.com' });

    if (!admin) {
      return res.status(404).json({
        message: 'Admin user not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123456', salt);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    res.json({
      message: 'Admin password reset successfully',
      email: 'admin@caddcentre.com',
      password: 'Admin@123456',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error resetting admin password',
      error: error.message
    });
  }
});

// Debug admin user endpoint
app.get('/api/debug-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/userModel');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@caddcentre.com' });

    if (!admin) {
      return res.status(404).json({
        message: 'Admin user not found'
      });
    }

    // Test password comparison
    const testPassword = 'Admin@123456';
    const isMatch = await bcrypt.compare(testPassword, admin.password);

    res.json({
      message: 'Admin user debug info',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        active: admin.active,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },
      passwordTest: {
        testPassword: testPassword,
        isMatch: isMatch,
        hashedPassword: admin.password.substring(0, 20) + '...'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error debugging admin user',
      error: error.message
    });
  }
});

// Test login endpoint
app.post('/api/test-login', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/userModel');

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        email: email
      });
    }

    // Test password
    const isMatch = await bcrypt.compare(password, user.password);

    res.json({
      message: 'Login test result',
      email: email,
      userFound: true,
      passwordMatch: isMatch,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error testing login',
      error: error.message
    });
  }
});

// Recreate admin user endpoint
app.get('/api/recreate-admin', async (req, res) => {
  try {
    const User = require('./models/userModel');

    // Delete existing admin user
    await User.deleteOne({ email: 'admin@caddcentre.com' });

    // Create new admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@caddcentre.com',
      password: 'Admin@123456',
      role: 'admin'
    });

    res.json({
      message: 'Admin user recreated successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        active: adminUser.active
      },
      credentials: {
        email: 'admin@caddcentre.com',
        password: 'Admin@123456'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error recreating admin user',
      error: error.message
    });
  }
});

// CORS test route
app.post('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful',
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    origin: req.headers.origin || 'No origin header'
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/lab', labRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});
