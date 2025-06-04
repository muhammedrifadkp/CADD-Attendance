/**
 * Security monitoring and protection middleware
 */

const crypto = require('crypto');

// Track suspicious activities
const suspiciousActivities = new Map();

// Security event logger
const logSecurityEvent = (event, req, details = {}) => {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    userEmail: req.user?.email,
    ...details
  };

  console.warn('🚨 Security Event:', JSON.stringify(securityEvent, null, 2));

  // In production, you would send this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to security monitoring service
    // securityMonitoringService.log(securityEvent);
  }
};

// Detect and prevent brute force attacks
const bruteForceProtection = (req, res, next) => {
  const key = `${req.ip}-${req.originalUrl}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!suspiciousActivities.has(key)) {
    suspiciousActivities.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
  } else {
    const activity = suspiciousActivities.get(key);
    
    // Reset if window has passed
    if (now - activity.firstAttempt > windowMs) {
      suspiciousActivities.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
    } else {
      activity.attempts++;
      activity.lastAttempt = now;
      
      // Log suspicious activity
      if (activity.attempts > 10) {
        logSecurityEvent('BRUTE_FORCE_DETECTED', req, {
          attempts: activity.attempts,
          timeWindow: windowMs / 1000 / 60 + ' minutes'
        });
        
        return res.status(429).json({
          error: 'TooManyAttempts',
          message: 'Suspicious activity detected. Please try again later.',
          retryAfter: Math.ceil((windowMs - (now - activity.firstAttempt)) / 1000)
        });
      }
    }
  }
  
  next();
};

// Detect suspicious user agent patterns
const suspiciousUserAgentDetection = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Common bot/scanner patterns
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
    /python-requests/i,
    /curl/i,
    /wget/i,
    /scanner/i,
    /bot/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    logSecurityEvent('SUSPICIOUS_USER_AGENT', req, {
      userAgent,
      reason: 'Matches known scanner/bot patterns'
    });
    
    // Don't block immediately, but log for monitoring
    // In production, you might want to apply additional restrictions
  }
  
  next();
};

// Detect SQL injection attempts
const sqlInjectionDetection = (req, res, next) => {
  const checkForSQLInjection = (obj, path = '') => {
    if (typeof obj === 'string') {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(\'|\"|;|--|\*|\|)/,
        /(\bSCRIPT\b)/i,
        /(\b(WAITFOR|DELAY)\b)/i
      ];
      
      const isSQLInjection = sqlPatterns.some(pattern => pattern.test(obj));
      
      if (isSQLInjection) {
        logSecurityEvent('SQL_INJECTION_ATTEMPT', req, {
          field: path,
          value: obj.substring(0, 100), // Log first 100 chars only
          pattern: 'SQL injection pattern detected'
        });
        
        return true;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForSQLInjection(value, path ? `${path}.${key}` : key)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Check query parameters, body, and headers
  const hasInjection = 
    checkForSQLInjection(req.query, 'query') ||
    checkForSQLInjection(req.body, 'body') ||
    checkForSQLInjection(req.params, 'params');
  
  if (hasInjection) {
    return res.status(400).json({
      error: 'InvalidInput',
      message: 'Invalid characters detected in request'
    });
  }
  
  next();
};

// Detect XSS attempts
const xssDetection = (req, res, next) => {
  const checkForXSS = (obj, path = '') => {
    if (typeof obj === 'string') {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]+src[^>]*>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
      ];
      
      const isXSS = xssPatterns.some(pattern => pattern.test(obj));
      
      if (isXSS) {
        logSecurityEvent('XSS_ATTEMPT', req, {
          field: path,
          value: obj.substring(0, 100),
          pattern: 'XSS pattern detected'
        });
        
        return true;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForXSS(value, path ? `${path}.${key}` : key)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  const hasXSS = 
    checkForXSS(req.query, 'query') ||
    checkForXSS(req.body, 'body') ||
    checkForXSS(req.params, 'params');
  
  if (hasXSS) {
    return res.status(400).json({
      error: 'InvalidInput',
      message: 'Invalid content detected in request'
    });
  }
  
  next();
};

// Monitor failed authentication attempts
const authFailureMonitoring = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Check if this is an authentication failure
    if (res.statusCode === 401 || res.statusCode === 423) {
      logSecurityEvent('AUTH_FAILURE', req, {
        statusCode: res.statusCode,
        endpoint: req.originalUrl
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Request size monitoring
const requestSizeMonitoring = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.get('content-length') && parseInt(req.get('content-length')) > maxSize) {
    logSecurityEvent('LARGE_REQUEST', req, {
      contentLength: req.get('content-length'),
      maxAllowed: maxSize
    });
    
    return res.status(413).json({
      error: 'PayloadTooLarge',
      message: 'Request entity too large'
    });
  }
  
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Clean up old suspicious activities periodically
setInterval(() => {
  const now = Date.now();
  const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, activity] of suspiciousActivities.entries()) {
    if (now - activity.lastAttempt > cleanupThreshold) {
      suspiciousActivities.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour

module.exports = {
  bruteForceProtection,
  suspiciousUserAgentDetection,
  sqlInjectionDetection,
  xssDetection,
  authFailureMonitoring,
  requestSizeMonitoring,
  securityHeaders,
  logSecurityEvent
};
