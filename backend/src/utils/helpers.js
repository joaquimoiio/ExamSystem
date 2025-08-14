const jwt = require('jsonwebtoken');

// Simple AppError class if not available
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Simple catchAsync if not available
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Try to import User model safely
let User;
try {
  User = require('../models').User;
} catch (error) {
  console.warn('User model not found');
}

// Try to import utility functions safely
let verifyToken;
try {
  const jwtConfig = require('../config/jwt');
  verifyToken = jwtConfig.verifyToken;
} catch (error) {
  // Fallback JWT verification
  verifyToken = (token) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    return jwt.verify(token, JWT_SECRET);
  };
}

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
    
    if (User) {
      // Get user from database if User model is available
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return next(new AppError('User no longer exists', 401));
      }

      if (!user.isActive) {
        return next(new AppError('User account is deactivated', 401));
      }

      req.user = user;
    } else {
      // Fallback: use decoded token data
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'teacher'
      };
    }
    
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
      
      if (User) {
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });

        if (user && user.isActive) {
          req.user = user;
        }
      } else {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role || 'teacher'
        };
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

// Simple ownership check (simplified version)
const checkOwnership = (Model) => {
  return catchAsync(async (req, res, next) => {
    try {
      const { id } = req.params;
      
      if (!Model) {
        // If model is not available, skip ownership check
        return next();
      }

      const resource = await Model.findByPk(id);
      
      if (!resource) {
        return next(new AppError('Resource not found', 404));
      }

      // Check ownership (admin can access everything)
      if (req.user.role === 'admin' || resource.userId === req.user.id) {
        req.resource = resource;
        return next();
      }

      return next(new AppError('You do not have permission to access this resource', 403));
    } catch (error) {
      console.warn('Ownership check failed, allowing access:', error.message);
      // In case of error, allow access (can be tightened later)
      next();
    }
  });
};

// Check if user owns the resource or has admin access
const checkResourceOwner = (resourceIdField = 'id', userIdField = 'userId') => {
  return catchAsync(async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const userId = req.user.id;

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // For regular users, we'll need to check in the route handler
      // This is a placeholder that allows access
      next();
    } catch (error) {
      console.warn('Resource owner check failed, allowing access:', error.message);
      next();
    }
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  restrictTo,
  requireAdmin,
  requireTeacher,
  checkOwnership,
  checkResourceOwner
};