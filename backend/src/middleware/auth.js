// middleware/auth.js
const jwt = require('jsonwebtoken');

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_very_long_and_secure';

// Tentar importar User model
let User;
try {
  const { User: UserModel } = require('../models');
  User = UserModel;
  console.log('✅ User model carregado no middleware auth');
} catch (error) {
  console.warn('⚠️ User model não encontrado no middleware auth, usando fallback');
  // Mock User model
  User = {
    findByPk: (id) => {
      if (id == 1) {
        return Promise.resolve({
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true
        });
      }
      if (id == 2) {
        return Promise.resolve({
          id: 2,
          name: 'Teacher User',
          email: 'teacher@example.com',
          role: 'teacher',
          isActive: true
        });
      }
      return Promise.resolve(null);
    }
  };
}

// Middleware para autenticar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Verificando autenticação para:', req.method, req.url);
    
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
      console.log('✅ Token válido para usuário:', decoded.userId);
    } catch (jwtError) {
      console.log('❌ Token inválido:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Buscar usuário no banco
    try {
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        console.log('❌ Usuário não encontrado:', decoded.userId);
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

      console.log('✅ Usuário autenticado:', user.email, '(' + user.role + ')');
      next();
    } catch (dbError) {
      console.error('❌ Erro ao buscar usuário no banco:', dbError.message);
      
      // Em caso de erro no banco, usar dados do token (modo fallback)
      req.user = {
        userId: decoded.userId,
        name: decoded.name || 'Unknown User',
        email: decoded.email,
        role: decoded.role || 'teacher',
        isActive: true
      };
      
      console.log('⚠️ Usando dados do token (fallback mode)');
      next();
    }
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor na autenticação'
    });
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

// Middleware opcional para autenticação (não bloqueia se não autenticado)
const optionalAuth = async (req, res, next) => {
  try {
    console.log('🔓 Autenticação opcional para:', req.method, req.url);
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('ℹ️ Nenhum token fornecido (opcional)');
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      try {
        const user = await User.findByPk(decoded.userId);
        
        if (user && user.isActive) {
          req.user = {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          };
          console.log('✅ Usuário autenticado opcionalmente:', user.email);
        } else {
          req.user = null;
          console.log('⚠️ Usuário não encontrado ou inativo (auth opcional)');
        }
      } catch (dbError) {
        console.warn('⚠️ Erro ao buscar usuário (auth opcional):', dbError.message);
        req.user = null;
      }
    } catch (jwtError) {
      console.log('⚠️ Token inválido (auth opcional):', jwtError.message);
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação opcional:', error);
    req.user = null;
    next(); // Continuar mesmo com erro
  }
};

// Middleware para verificar propriedade de recurso
const requireResourceOwner = (resourceModel, resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      console.log('🔒 Verificando propriedade do recurso');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticação necessária'
        });
      }

      // Admin tem acesso a tudo
      if (req.user.role === 'admin') {
        console.log('✅ Admin tem acesso total');
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID do recurso não fornecido'
        });
      }

      try {
        const resource = await resourceModel.findByPk(resourceId);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Recurso não encontrado'
          });
        }

        if (resource[userIdField] !== req.user.userId) {
          console.log('❌ Usuário não é proprietário do recurso');
          return res.status(403).json({
            success: false,
            message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
          });
        }

        console.log('✅ Usuário é proprietário do recurso');
        req.resource = resource;
        next();
      } catch (dbError) {
        console.error('❌ Erro ao verificar propriedade do recurso:', dbError.message);
        // Em caso de erro no banco, permitir acesso (modo fallback)
        console.log('⚠️ Permitindo acesso devido a erro no banco (fallback)');
        next();
      }
    } catch (error) {
      console.error('❌ Erro no middleware requireResourceOwner:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor na verificação de propriedade'
      });
    }
  };
};

// Função utilitária para gerar token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
  });
};

// Função utilitária para verificar token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacher,
  optionalAuth,
  requireResourceOwner,
  generateToken,
  verifyToken
};