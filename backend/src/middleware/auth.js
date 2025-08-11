const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole(['admin']);

// Middleware to check if user is teacher or admin
const requireTeacher = requireRole(['teacher', 'admin']);

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to check resource ownership
const checkOwnership = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const { [modelName]: Model } = require('../models');
      const resourceId = req.params[paramName];
      
      const resource = await Model.findByPk(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check if user owns the resource
      if (resource.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - not the owner'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Generate refresh token
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Generate password reset token
const generateResetToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'reset'
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.resetTokenExpiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Verify password reset token
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    if (decoded.type !== 'reset') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher,
  optionalAuth,
  checkOwnership,
  generateToken,
  generateRefreshToken,
  generateResetToken,
  verifyResetToken
};