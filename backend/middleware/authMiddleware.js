const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token',
      error: 'NoTokenError'
    });
  }

  try {
    // Verify token with enhanced options
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'cadd-attendance',
      audience: 'cadd-attendance-users'
    });

    // Validate token fingerprint
    const userAgent = req.get('User-Agent') || '';
    const clientIP = req.ip || req.connection.remoteAddress || '';
    const expectedFingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}-${clientIP}`)
      .digest('hex')
      .substring(0, 16);

    if (decoded.fp && decoded.fp !== expectedFingerprint) {
      return res.status(401).json({
        message: 'Token fingerprint mismatch',
        error: 'TokenFingerprintMismatch'
      });
    }

    // Get user from the token
    const user = await User.findById(decoded.id).select('-password');

    // If user not found or not active
    if (!user || !user.active) {
      return res.status(401).json({
        message: 'User not found or inactive',
        error: 'UserNotFoundOrInactive'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);

    // Clear the invalid cookie if present
    if (req.cookies.jwt) {
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/'
      });
    }

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        error: 'TokenExpiredError',
        shouldRefresh: true
      });
    }

    return res.status(401).json({
      message: 'Not authorized',
      error: error.name
    });
  }
};

// Verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({
      message: 'Refresh token not provided',
      error: 'NoRefreshTokenError'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user from the token
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        message: 'Invalid refresh token',
        error: 'InvalidRefreshTokenError'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Refresh token verification error:', error.message);

    // Clear the invalid cookie if present
    if (req.cookies.refreshToken) {
      res.clearCookie('refreshToken');
    }

    return res.status(401).json({
      message: 'Invalid refresh token',
      error: error.name
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

module.exports = { 
  protect, 
  verifyRefreshToken,
  admin, 
  teacher, 
  labAccess 
};
