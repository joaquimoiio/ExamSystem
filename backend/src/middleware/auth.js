// backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../utils/appError');

// Função para extrair token do header
const extractToken = (req) => {
  let token = null;
  
  // Verificar Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Verificar cookie como fallback
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  return token;
};

// Middleware de autenticação obrigatória
const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
    }

    console.log('🔍 Token extraído:', token.substring(0, 20) + '...');

    // Verificar token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('✅ Token decodificado:', { id: decoded.id, email: decoded.email, role: decoded.role });

    // Buscar usuário no banco de dados
    let user;
    try {
      user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });
    } catch (dbError) {
      console.error('❌ Erro ao buscar usuário no banco:', dbError.message);
      // Se não conseguir acessar o banco, usar dados do token
      user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'teacher',
        name: decoded.name || 'Unknown User',
        isActive: true
      };
    }

    if (!user) {
      console.log('❌ Usuário não encontrado no banco de dados');
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
        error: 'USER_NOT_FOUND'
      });
    }

    if (user.isActive === false) {
      console.log('❌ Usuário desativado');
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
        error: 'USER_DEACTIVATED'
      });
    }

    // Anexar usuário à requisição
    req.user = user;
    console.log('✅ Usuário autenticado:', { id: user.id, email: user.email, role: user.role });
    
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    
    // Diferentes tipos de erro JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: 'AUTH_ERROR'
      });
    }
  }
};

// Middleware de autenticação opcional
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      // Sem token, continuar sem usuário
      req.user = null;
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuário no banco de dados
    let user;
    try {
      user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });
    } catch (dbError) {
      console.warn('⚠️ Erro ao buscar usuário no banco (auth opcional):', dbError.message);
      user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'teacher',
        name: decoded.name || 'Unknown User',
        isActive: true
      };
    }

    if (user && user.isActive !== false) {
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Em caso de erro na autenticação opcional, continuar sem usuário
    console.warn('⚠️ Erro na autenticação opcional:', error.message);
    req.user = null;
    next();
  }
};

// Middleware para verificar roles específicas
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

// Middleware para verificar se é teacher ou admin
const requireTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTH_REQUIRED'
    });
  }

  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Teacher or admin access required',
      error: 'TEACHER_REQUIRED'
    });
  }
  
  next();
};

// Middleware para verificar ownership de recursos
const checkOwnership = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTH_REQUIRED'
        });
      }

      const { id } = req.params;
      const { userIdField = 'userId', allowAdmin = true } = options;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required',
          error: 'MISSING_ID'
        });
      }

      // Admin pode acessar tudo (se permitido)
      if (allowAdmin && req.user.role === 'admin') {
        return next();
      }

      try {
        const resource = await Model.findByPk(id);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found',
            error: 'RESOURCE_NOT_FOUND'
          });
        }

        // Verificar ownership
        if (resource[userIdField] !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource',
            error: 'OWNERSHIP_REQUIRED'
          });
        }

        // Anexar recurso à requisição para uso posterior
        req.resource = resource;
        next();
      } catch (dbError) {
        console.error('❌ Erro ao verificar ownership:', dbError.message);
        return res.status(500).json({
          success: false,
          message: 'Error checking resource ownership',
          error: 'OWNERSHIP_CHECK_ERROR'
        });
      }
    } catch (error) {
      console.error('❌ Erro no middleware de ownership:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  };
};

// Middleware para debug de autenticação
const debugAuth = (req, res, next) => {
  console.log('🔍 DEBUG AUTH:');
  console.log('  URL:', req.method, req.originalUrl);
  console.log('  Headers:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type']
  });
  console.log('  User:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'Not authenticated');
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  restrictTo,
  requireAdmin,
  requireTeacher,
  checkOwnership,
  debugAuth
};