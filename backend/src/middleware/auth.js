// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'exam_system_super_secret_key_2024_muito_segura';

// Importar User model
const { User } = require('../models');

// Middleware para autenticar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Verificando autenticação para:', req.method, req.originalUrl);
    
    // Extrair token do header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    // Verificar e decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token válido para usuário:', decoded.userId, '(', decoded.email, ')');
    } catch (jwtError) {
      console.log('❌ Token inválido:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Buscar usuário no banco de dados
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      console.log('❌ Usuário não encontrado no sistema:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      console.log('❌ Usuário inativo:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Conta de usuário desativada'
      });
    }

    // Adicionar informações do usuário ao request
    req.user = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    console.log('✅ Usuário autenticado:', req.user.email, '(' + req.user.role + ')');
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor na autenticação'
    });
  }
};

// Middleware para autenticação opcional
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Sem token, continuar sem autenticação
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = {
          userId: user.id,
          name: user.name || decoded.name,
          email: user.email || decoded.email,
          role: user.role || decoded.role,
          isActive: user.isActive
        };
      } else {
        req.user = null;
      }
    } catch (error) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('❌ Erro no middleware optionalAuth:', error);
    req.user = null;
    next();
  }
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  try {
    console.log('👑 Verificando permissões de admin para:', req.user?.email);
    
    if (!req.user) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária'
      });
    }

    if (req.user.role !== 'admin') {
      console.log('❌ Usuário sem permissões de admin:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões de administrador necessárias.'
      });
    }

    console.log('✅ Usuário com permissões de admin confirmadas');
    next();
  } catch (error) {
    console.error('❌ Erro no middleware requireAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor na verificação de permissões'
    });
  }
};

// Middleware para verificar se o usuário é professor ou admin
const requireTeacher = (req, res, next) => {
  try {
    console.log('👨‍🏫 Verificando permissões de professor para:', req.user?.email);
    
    if (!req.user) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária'
      });
    }

    if (!['teacher', 'admin'].includes(req.user.role)) {
      console.log('❌ Usuário sem permissões de professor:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões de professor necessárias.'
      });
    }

    console.log('✅ Usuário com permissões de professor confirmadas');
    next();
  } catch (error) {
    console.error('❌ Erro no middleware requireTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor na verificação de permissões'
    });
  }
};

// Middleware para verificar ownership de recursos
const checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        // Admins podem acessar qualquer recurso
        return next();
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID do recurso não fornecido'
        });
      }

      const resource = await Model.findByPk(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Recurso não encontrado'
        });
      }

      if (resource.userId && resource.userId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você não é o proprietário deste recurso.'
        });
      }

      next();
    } catch (error) {
      console.error('❌ Erro no middleware checkOwnership:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireTeacher,
  checkOwnership
};