const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

/**
 * Safely extract JWT from Authorization header or custom headers.
 * Supports:
 * - 'Bearer <token>' or 'bearer <token>' (case-insensitive)
 * - Raw token without Bearer prefix
 * - 'x-access-token' and 'x-auth-token'
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (/^Bearer\s+/i.test(trimmed)) {
      return trimmed.replace(/^Bearer\s+/i, '').trim();
    }
    // Handle raw token directly in Authorization header
    if (!trimmed.includes(' ') && trimmed.length > 20) {
      return trimmed;
    }
  }

  // Fallback custom headers
  if (req.headers['x-access-token']) {
    return String(req.headers['x-access-token']).trim();
  }
  if (req.headers['x-auth-token']) {
    return String(req.headers['x-auth-token']).trim();
  }

  // Fallback query parameters (for direct browser media/image navigation)
  if (req.query?.token) {
    return String(req.query.token).trim();
  }
  if (req.query?.auth) {
    return String(req.query.auth).trim();
  }
  if (req.query?.t) {
    return String(req.query.t).trim();
  }

  return null;
};

const verifyToken = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Authentication token missing or invalid'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        error: 'User associated with this token no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authentication token has expired' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        error: `Access denied. Requires ${role} role privileges.`
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Non-fatal for optional authentication
  }
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  requireAdmin: requireRole('admin')
};
