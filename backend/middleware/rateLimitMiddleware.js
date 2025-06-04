/**
 * Enhanced rate limiting middleware with multiple strategies
 */

const rateLimit = require('express-rate-limit');

// Create different rate limiters for different endpoints
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // Default limit
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = null,
    logLimitReached = true
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'RateLimitExceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: keyGenerator || ((req) => {
      // Use IP + User-Agent for better fingerprinting
      return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
    }),
    // Custom handler for rate limit exceeded (replaces onLimitReached)
    handler: (req, res, next, options) => {
      // Log rate limit exceeded if enabled
      if (logLimitReached) {
        console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          limit: options.max,
          windowMs: options.windowMs
        });
      }

      res.status(429).json({
        error: 'RateLimitExceeded',
        message: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Strict rate limiter for authentication endpoints
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed attempts
  keyGenerator: (req) => {
    // More strict fingerprinting for auth
    return `auth-${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  }
});

// Password reset rate limiter
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts from this IP, please try again after 1 hour.',
  keyGenerator: (req) => `password-reset-${req.ip}`
});

// API rate limiter for general endpoints
const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 2000, // Much higher for development
  message: 'Too many API requests from this IP, please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Strict rate limiter for sensitive operations
const sensitiveOperationsRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 sensitive operations per hour
  message: 'Too many sensitive operations from this IP, please try again after 1 hour.',
  keyGenerator: (req) => `sensitive-${req.ip}-${req.user?.id || 'anonymous'}`
});

// File upload rate limiter
const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: 'Too many file uploads from this IP, please try again later.',
  keyGenerator: (req) => `upload-${req.ip}`
});

// Progressive rate limiter that increases restrictions based on violations
const createProgressiveRateLimiter = (baseOptions = {}) => {
  const violationCounts = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const violations = violationCounts.get(key) || 0;

    // Increase restrictions based on violation history
    let maxRequests = baseOptions.max || 100;
    let windowMs = baseOptions.windowMs || 15 * 60 * 1000;

    if (violations > 0) {
      maxRequests = Math.max(10, maxRequests - (violations * 20));
      windowMs = windowMs * (1 + violations * 0.5);
    }

    const limiter = rateLimit({
      ...baseOptions,
      max: maxRequests,
      windowMs: windowMs,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip,
      handler: (req, res, next, options) => {
        // Increment violation count
        violationCounts.set(key, violations + 1);

        // Clean up old violations (after 24 hours)
        setTimeout(() => {
          const currentViolations = violationCounts.get(key) || 0;
          if (currentViolations > 0) {
            violationCounts.set(key, currentViolations - 1);
          }
        }, 24 * 60 * 60 * 1000);

        console.warn(`Progressive rate limit violation #${violations + 1} for ${key}`);

        res.status(429).json({
          error: 'ProgressiveRateLimitExceeded',
          message: `Too many violations detected. Restriction level: ${violations + 1}`,
          retryAfter: Math.ceil(windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      }
    });

    limiter(req, res, next);
  };
};

// User-specific rate limiter (requires authentication)
const createUserRateLimiter = (options = {}) => {
  return createRateLimiter({
    ...options,
    keyGenerator: (req) => {
      if (req.user) {
        return `user-${req.user.id}`;
      }
      return `ip-${req.ip}`;
    }
  });
};

// Burst protection - allows short bursts but limits sustained traffic
const burstProtectionRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === 'development' ? 200 : 20, // Much higher limit in development
  message: 'Request rate too high, please slow down.',
  logLimitReached: process.env.NODE_ENV === 'production' // Only log in production
});

// Export all rate limiters
module.exports = {
  createRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  sensitiveOperationsRateLimiter,
  uploadRateLimiter,
  createProgressiveRateLimiter,
  createUserRateLimiter,
  burstProtectionRateLimiter
};
