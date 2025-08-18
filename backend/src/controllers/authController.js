// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Tentar importar modelos com fallback
let User;
try {
  const { User: UserModel } = require('../models');
  User = UserModel;
  console.log('✅ User model carregado no authController');
} catch (error) {
  console.warn('⚠️ User model não encontrado, usando fallback');
  // Criar mock do User model
  User = {
    findOne: ({ where }) => {
      if (where.email === 'admin@example.com') {
        return Promise.resolve({
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDT7JrJQhVJCgJG', // 'password123'
          role: 'admin',
          isActive: true,
          toJSON: function() {
            const { password, ...userData } = this;
            return userData;
          }
        });
      }
      if (where.email === 'teacher@example.com') {
        return Promise.resolve({
          id: 2,
          name: 'Teacher User',
          email: 'teacher@example.com',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDT7JrJQhVJCgJG', // 'password123'
          role: 'teacher',
          isActive: true,
          toJSON: function() {
            const { password, ...userData } = this;
            return userData;
          }
        });
      }
      return Promise.resolve(null);
    },
    create: (userData) => {
      return Promise.resolve({
        id: Date.now(),
        ...userData,
        password: undefined, // Não retornar password
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() {
          const { password, ...userData } = this;
          return userData;
        }
      });
    },
    findByPk: (id) => {
      if (id == 1) {
        return Promise.resolve({
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true,
          toJSON: function() {
            return this;
          }
        });
      }
      if (id == 2) {
        return Promise.resolve({
          id: 2,
          name: 'Teacher User',
          email: 'teacher@example.com',
          role: 'teacher',
          isActive: true,
          toJSON: function() {
            return this;
          }
        });
      }
      return Promise.resolve(null);
    }
  };
}

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_very_long_and_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Função para gerar token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Função para verificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
};

// Controller functions
const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      console.log('📝 Registrando novo usuário:', req.body.email);
      
      const { name, email, password, role = 'teacher' } = req.body;

      // Verificar se usuário já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'E-mail já está em uso'
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);

      // Criar usuário
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true
      });

      // Gerar token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: newUser.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('❌ Erro no register:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      console.log('🔐 Fazendo login:', req.body.email);
      
      const { email, password } = req.body;

      // Buscar usuário
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Conta desativada'
        });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Gerar token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('❌ Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      console.log('👤 Buscando perfil do usuário:', req.user?.userId);
      
      // Se não tiver user no req (fallback mode)
      if (!req.user) {
        return res.json({
          success: true,
          data: {
            user: {
              id: 'fallback-user',
              name: 'Fallback User',
              email: 'fallback@example.com',
              role: 'teacher',
              isActive: true
            }
          },
          mode: 'fallback'
        });
      }

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('❌ Erro no getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      console.log('✏️ Atualizando perfil do usuário:', req.user?.userId);
      
      if (!req.user) {
        return res.json({
          success: true,
          message: 'Perfil atualizado com sucesso (modo fallback)',
          data: {
            user: {
              id: 'fallback-user',
              name: req.body.name || 'Fallback User',
              email: req.body.email || 'fallback@example.com',
              role: 'teacher'
            }
          },
          mode: 'fallback'
        });
      }

      const { name, email } = req.body;
      
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se email já está em uso por outro usuário
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'E-mail já está em uso'
          });
        }
      }

      // Atualizar dados
      await user.update({
        name: name || user.name,
        email: email || user.email
      });

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('❌ Erro no updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      console.log('🔑 Alterando senha do usuário:', req.user?.userId);
      
      if (!req.user) {
        return res.json({
          success: true,
          message: 'Senha alterada com sucesso (modo fallback)',
          mode: 'fallback'
        });
      }

      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Atualizar senha
      await user.update({ password: hashedNewPassword });

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro no changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      console.log('📧 Solicitação de recuperação de senha:', req.body.email);
      
      // Simular envio de email de recuperação
      res.json({
        success: true,
        message: 'E-mail de recuperação enviado (modo demonstração)',
        mode: 'demo'
      });
    } catch (error) {
      console.error('❌ Erro no forgotPassword:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      console.log('🔄 Reset de senha solicitado');
      
      // Simular reset de senha
      res.json({
        success: true,
        message: 'Senha redefinida com sucesso (modo demonstração)',
        mode: 'demo'
      });
    } catch (error) {
      console.error('❌ Erro no resetPassword:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      console.log('🔄 Refresh token solicitado');
      
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token é obrigatório'
        });
      }

      // Verificar token
      const decoded = verifyToken(token);
      
      // Gerar novo token
      const newToken = generateToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      });

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          token: newToken
        }
      });
    } catch (error) {
      console.error('❌ Erro no refreshToken:', error);
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      console.log('👋 Logout do usuário:', req.user?.userId);
      
      // Em uma implementação real, invalidaríamos o token
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get user stats
  getUserStats: async (req, res) => {
    try {
      console.log('📊 Buscando estatísticas do usuário:', req.user?.userId);
      
      res.json({
        success: true,
        data: {
          stats: {
            totalSubjects: 0,
            totalQuestions: 0,
            totalExams: 0,
            totalSubmissions: 0,
            lastLogin: new Date().toISOString()
          }
        },
        mode: 'fallback'
      });
    } catch (error) {
      console.error('❌ Erro no getUserStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Deactivate account
  deactivateAccount: async (req, res) => {
    try {
      console.log('🚫 Desativando conta do usuário:', req.user?.userId);
      
      if (!req.user) {
        return res.json({
          success: true,
          message: 'Conta desativada com sucesso (modo fallback)',
          mode: 'fallback'
        });
      }

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      await user.update({ isActive: false });

      res.json({
        success: true,
        message: 'Conta desativada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro no deactivateAccount:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Admin: Get all users
  getAllUsers: async (req, res) => {
    try {
      console.log('👥 Admin buscando todos os usuários');
      
      res.json({
        success: true,
        data: {
          users: [
            {
              id: 1,
              name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin',
              isActive: true
            },
            {
              id: 2,
              name: 'Teacher User',
              email: 'teacher@example.com',
              role: 'teacher',
              isActive: true
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        },
        mode: 'fallback'
      });
    } catch (error) {
      console.error('❌ Erro no getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Admin: Update user status
  updateUserStatus: async (req, res) => {
    try {
      console.log('🔄 Admin atualizando status do usuário:', req.params.userId);
      
      res.json({
        success: true,
        message: 'Status do usuário atualizado com sucesso (modo fallback)',
        mode: 'fallback'
      });
    } catch (error) {
      console.error('❌ Erro no updateUserStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Admin: Delete user
  deleteUser: async (req, res) => {
    try {
      console.log('🗑️ Admin deletando usuário:', req.params.userId);
      
      res.json({
        success: true,
        message: 'Usuário deletado com sucesso (modo fallback)',
        mode: 'fallback'
      });
    } catch (error) {
      console.error('❌ Erro no deleteUser:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = authController;