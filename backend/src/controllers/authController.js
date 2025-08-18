// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'exam_system_super_secret_key_2024_muito_segura';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Usuários hardcoded para funcionar imediatamente
const hardcodedUsers = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDT7JrJQhVJCgJG', // password123
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Professor Teste',
    email: 'teacher@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDT7JrJQhVJCgJG', // password123
    role: 'teacher',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Joaquim Paes',
    email: 'joaquimpaes03@gmail.com',
    password: '$2a$12$8K8O9qZXvF2YzZz7W5H5W.5O8mF5v9RkW2J4F8n2C9n4Y8p2Z3w4Q', // minhasenha123
    role: 'teacher',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Tentar importar User model, mas ter fallback funcional
let User;
let useDatabase = false;

try {
  const { User: UserModel } = require('../models');
  if (UserModel && typeof UserModel.findOne === 'function') {
    User = UserModel;
    useDatabase = true;
    console.log('✅ User model carregado - usando banco de dados');
  } else {
    throw new Error('User model não está funcionalmente disponível');
  }
} catch (error) {
  console.warn('⚠️ Usando usuários hardcoded - banco não disponível:', error.message);
  
  // Mock User model que funciona com usuários hardcoded
  User = {
    findOne: async ({ where }) => {
      const user = hardcodedUsers.find(u => u.email.toLowerCase() === where.email.toLowerCase());
      return user ? {
        ...user,
        toJSON: function() {
          const { password, ...userData } = this;
          return userData;
        },
        validatePassword: async function(candidatePassword) {
          return await bcrypt.compare(candidatePassword, this.password);
        }
      } : null;
    },
    
    create: async (userData) => {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        password: hashedPassword,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() {
          const { password, ...userData } = this;
          return userData;
        }
      };
      hardcodedUsers.push(newUser);
      return newUser;
    },
    
    findByPk: async (id) => {
      const user = hardcodedUsers.find(u => u.id.toString() === id.toString());
      return user ? {
        ...user,
        toJSON: function() {
          const { password, ...userData } = this;
          return userData;
        }
      } : null;
    }
  };
}

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

      // Criar usuário
      const newUser = await User.create({
        name,
        email,
        password, // O hash será feito no modelo ou no mock
        role,
        isActive: true
      });

      // Gerar token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      });

      console.log('✅ Usuário criado com sucesso:', newUser.email);

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
      console.log('🔐 Tentativa de login:', req.body.email);
      
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário
      const user = await User.findOne({ where: { email } });
      console.log('👤 Usuário encontrado:', user ? 'SIM' : 'NÃO');

      if (!user) {
        console.log('❌ Usuário não encontrado');
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        console.log('❌ Usuário inativo');
        return res.status(401).json({
          success: false,
          message: 'Conta desativada'
        });
      }

      // Verificar senha
      let isPasswordValid;
      if (user.validatePassword) {
        isPasswordValid = await user.validatePassword(password);
      } else {
        isPasswordValid = await bcrypt.compare(password, user.password);
      }

      console.log('🔑 Senha válida:', isPasswordValid ? 'SIM' : 'NÃO');

      if (!isPasswordValid) {
        console.log('❌ Senha incorreta');
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Gerar token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      });

      console.log('✅ Login bem-sucedido para:', user.email);

      // Atualizar último login se usando banco
      if (useDatabase && user.update) {
        try {
          await user.update({ lastLogin: new Date() });
        } catch (updateError) {
          console.warn('⚠️ Não foi possível atualizar lastLogin:', updateError.message);
        }
      }

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
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Buscar usuário atualizado
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
        message: 'Erro interno do servidor'
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      console.log('✏️ Atualizando perfil do usuário:', req.user?.userId);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { name, phone, bio } = req.body;
      
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Atualizar campos se fornecidos
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;

      if (useDatabase && user.update) {
        await user.update(updateData);
      } else {
        // Atualizar no array hardcoded
        Object.assign(user, updateData);
      }

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
        message: 'Erro interno do servidor'
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      console.log('👋 Logout do usuário:', req.user?.email);
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      console.log('🔑 Alterando senha do usuário:', req.user?.userId);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
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
      let isCurrentPasswordValid;
      if (user.validatePassword) {
        isCurrentPasswordValid = await user.validatePassword(currentPassword);
      } else {
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      }

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Atualizar senha
      if (useDatabase && user.update) {
        await user.update({ 
          password: hashedNewPassword,
          passwordChangedAt: new Date()
        });
      } else {
        user.password = hashedNewPassword;
      }

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro no changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // Placeholder methods
  forgotPassword: async (req, res) => {
    res.json({
      success: true,
      message: 'E-mail de recuperação enviado (funcionalidade em desenvolvimento)'
    });
  },

  resetPassword: async (req, res) => {
    res.json({
      success: true,
      message: 'Senha redefinida com sucesso (funcionalidade em desenvolvimento)'
    });
  },

  refreshToken: async (req, res) => {
    res.json({
      success: true,
      message: 'Token renovado (funcionalidade em desenvolvimento)'
    });
  },

  getUserStats: async (req, res) => {
    res.json({
      success: true,
      data: {
        examsCreated: 0,
        questionsCreated: 0,
        subjectsCreated: 0
      }
    });
  },

  deactivateAccount: async (req, res) => {
    res.json({
      success: true,
      message: 'Conta desativada (funcionalidade em desenvolvimento)'
    });
  },

  getAllUsers: async (req, res) => {
    res.json({
      success: true,
      data: {
        users: hardcodedUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive
        })),
        pagination: {
          page: 1,
          limit: 10,
          total: hardcodedUsers.length
        }
      }
    });
  },

  updateUserStatus: async (req, res) => {
    res.json({
      success: true,
      message: 'Status do usuário atualizado'
    });
  },

  deleteUser: async (req, res) => {
    res.json({
      success: true,
      message: 'Usuário deletado'
    });
  }
};

module.exports = authController;