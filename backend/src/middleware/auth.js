const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { verifyToken } = require('../config/jwt');

// Authenticate token middleware
const authenticateToken = catchAsync(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access token is required', 401));
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }

    // Check if user changed password after token was issued
    if (user.passwordChangedAfter && user.passwordChangedAfter(decoded.iat)) {
      return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
});

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Silent fail for optional auth
    }
  }

  next();
});

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

// Check if user is teacher or admin
const requireTeacher = (req, res, next) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return next(new AppError('Teacher or admin access required', 403));
  }
  next();
};

// Check if user owns resource or is admin
const checkOwnership = (model, ownerField = 'userId') => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const resource = await model.findByPk(id);
    
    if (!resource) {
      return next(new AppError('Resource not found', 404));
    }

    if (req.user.role !== 'admin' && resource[ownerField] !== req.user.id) {
      return next(new AppError('You can only access your own resources', 403));
    }

    req.resource = resource;
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  restrictTo,
  requireAdmin,
  requireTeacher,
  checkOwnership
};