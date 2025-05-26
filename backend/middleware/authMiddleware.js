const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      // If user not found or not active
      if (!req.user || !req.user.active) {
        return res.status(401).json({
          message: 'User not found or inactive',
          error: 'UserNotFoundOrInactive'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);

      // Clear the invalid cookie if present
      if (req.cookies.jwt) {
        res.clearCookie('jwt');
      }

      // Send proper JSON response instead of throwing error
      return res.status(401).json({
        message: error.name === 'TokenExpiredError'
          ? 'Token expired, please login again'
          : 'Not authorized, token failed',
        error: error.name
      });
    }
  } else {
    return res.status(401).json({
      message: 'Not authorized, no token',
      error: 'NoTokenError'
    });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      message: 'Not authorized as an admin',
      error: 'AdminAccessRequired'
    });
  }
};

// Teacher middleware
const teacher = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      message: 'Not authorized as a teacher',
      error: 'TeacherAccessRequired'
    });
  }
};

// Lab access middleware (admin or teacher)
const labAccess = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) {
    next();
  } else {
    return res.status(403).json({
      message: 'Not authorized to access lab features',
      error: 'LabAccessRequired'
    });
  }
};

module.exports = { protect, admin, teacher, labAccess };
