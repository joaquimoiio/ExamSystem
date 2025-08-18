// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'exam_system_super_secret_key_2024_muito_segura';

// Usuários hardcoded (mesmo que no authController)
const hardcodedUsers = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true
  },
  {
    id: '2',
    name: 'Professor Teste',
    email: 'teacher@example.com',
    role: 'teacher',
    isActive: true
  },
  {
    id: '3',
    name: 'Joaquim Paes',
    email: 'joaquimpaes03@gmail.com',
    role: 'teacher',
    isActive: true
  }
];

// Tentar importar User model
let User;
let useDatabase = false;

try {
  const { User: UserModel } = require('../models');
  if (UserModel && typeof UserModel.findByPk === 'function') {
    User = UserModel;
    useDatabase = true;
    console.log('✅ User model carregado no middleware');
  } else {
    throw new Error('User model não disponível');
  }
} catch (error) {
  console.warn('⚠️ Middleware auth usando fallback hardcoded');
  
  // Mock User model
  User = {
    findByPk: async (id) => {
      const user = hardcodedUsers.find(u => u.id.toString() === id.toString());
      return user || null;
    }
  };
}

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

    // Buscar usuário
    let user;
    try {
      user = await User.findByPk(decoded.userId);
      
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
        name: user.name || decoded.name,
        email: user.email || decoded.email,
        role: user.role || decoded.role,
        isActive: user.isActive
      };

      console.log('✅ Usuário autenticado:', req.user.email, '(' + req.user.role + ')');
      next();

    } catch (dbError) {
      console.error('❌ Erro ao buscar usuário:', dbError.message);
      
      // Fallback: usar dados do token se o banco falhar
      req.user = {
        userId: decoded.userId,
        name: decoded.name || 'User',
        email: decoded.email,
        role: decoded.role || 'teacher',
        isActive: true
      };
      
      console.log('⚠️ Usando dados do token (fallback):', req.user.email);
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

      // Para o sistema de fallback, permitir acesso
      if (!useDatabase) {
        console.log('⚠️ Verificação de ownership pulada (fallback mode)');
        return next();
      }

      try {
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
        console.error('❌ Erro verificando ownership:', error);
        // Em caso de erro, permitir acesso (fallback)
        next();
      }
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