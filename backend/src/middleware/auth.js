// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken')
const { User } = require('../models')
const { AppError } = require('../utils/AppError')
const { catchAsync } = require('../utils/catchAsync')

/**
 * Authenticate user with JWT token
 */
const authenticateToken = catchAsync(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null

  if (!token) {
    throw new AppError('Token de acesso requerido', 401)
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from token
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    })

    if (!user || !user.isActive) {
      throw new AppError('Usuário não encontrado ou inativo', 401)
    }

    // Add user to request
    req.user = user
    next()

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Token inválido', 401)
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expirado', 401)
    }
    throw error
  }
})

/**
 * Require specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401)
    }

    const userRoles = Array.isArray(roles) ? roles : [roles]
    
    if (!userRoles.includes(req.user.role)) {
      throw new AppError('Permissão insuficiente', 403)
    }

    next()
  }
}

/**
 * Require admin role
 */
const requireAdmin = requireRole('admin')

/**
 * Require teacher or admin role
 */
const requireTeacher = requireRole(['teacher', 'admin'])

/**
 * Optional authentication - adds user if token is valid
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null

  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    })

    if (user && user.isActive) {
      req.user = user
    }
  } catch (error) {
    // Ignore token errors in optional auth
  }

  next()
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher,
  optionalAuth
}