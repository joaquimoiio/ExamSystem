// backend/src/controllers/authController.js - CORREÇÃO DO ERRO 401

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateToken } = require('../utils/auth');

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const useDatabase = process.env.USE_DATABASE !== 'false';

const authController = {
  // Login user - CORRIGIDO
  login: async (req, res) => {
    try {
      console.log('🔐 Tentativa de login:', req.body.email);
      
      const { email, password } = req.body;

      // Validação de entrada
      if (!email || !password) {
        console.log('❌ Dados incompletos');
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário
      let user;
      try {
        if (useDatabase) {
          user = await User.findOne({ where: { email: email.toLowerCase() } });
        } else {
          // Fallback para dados em memória ou arquivo
          const users = require('../data/users.json') || [];
          user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        }
      } catch (dbError) {
        console.error('❌ Erro ao buscar usuário:', dbError.message);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }

      console.log('👤 Usuário encontrado:', user ? 'SIM' : 'NÃO');

      if (!user) {
        console.log('❌ Usuário não encontrado para email:', email);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar se usuário está ativo
      if (user.hasOwnProperty('isActive') && !user.isActive) {
        console.log('❌ Usuário inativo');
        return res.status(401).json({
          success: false,
          message: 'Conta desativada'
        });
      }

      // Verificar senha
      let isPasswordValid = false;
      try {
        if (user.validatePassword && typeof user.validatePassword === 'function') {
          // Método do Sequelize
          isPasswordValid = await user.validatePassword(password);
        } else if (user.password) {
          // Comparação direta com bcrypt
          isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
          console.log('❌ Senha não definida para usuário');
          return res.status(401).json({
            success: false,
            message: 'Credenciais inválidas'
          });
        }
      } catch (passwordError) {
        console.error('❌ Erro ao validar senha:', passwordError.message);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }

      console.log('🔑 Senha válida:', isPasswordValid ? 'SIM' : 'NÃO');

      if (!isPasswordValid) {
        console.log('❌ Senha incorreta para:', email);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Preparar dados do usuário para o token
      const userPayload = {
        userId: user.id,
        email: user.email,
        role: user.role || 'user',
        name: user.name
      };

      // Gerar token
      let token;
      try {
        if (generateToken) {
          token = generateToken(userPayload);
        } else {
          // Fallback manual
          token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
        }
      } catch (tokenError) {
        console.error('❌ Erro ao gerar token:', tokenError.message);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }

      console.log('✅ Login bem-sucedido para:', user.email);

      // Atualizar último login se usando banco
      if (useDatabase && user.update && typeof user.update === 'function') {
        try {
          await user.update({ lastLogin: new Date() });
        } catch (updateError) {
          console.warn('⚠️ Não foi possível atualizar lastLogin:', updateError.message);
        }
      }

      // Preparar dados do usuário para resposta (sem senha)
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      // RESPOSTA CORRIGIDA - Estrutura compatível com frontend
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userResponse,
          token: token
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

  // Register user - CORRIGIDO
  register: async (req, res) => {
    try {
      console.log('📝 Tentativa de registro:', req.body.email);
      
      const { name, email, password, confirmPassword } = req.body;

      // Validações
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Senhas não coincidem'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      // Verificar se usuário já existe
      let existingUser;
      try {
        if (useDatabase) {
          existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
        } else {
          const users = require('../data/users.json') || [];
          existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        }
      } catch (dbError) {
        console.error('❌ Erro ao verificar usuário existente:', dbError.message);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);

      // Criar usuário
      let newUser;
      try {
        if (useDatabase) {
          newUser = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'user',
            isActive: true
          });
        } else {
          // Implementar criação em arquivo/memória se necessário
          newUser = {
            id: Date.now(),
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      } catch (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar conta'
        });
      }

      console.log('✅ Usuário criado com sucesso:', newUser.email);

      res.status(201).json({
        success: true,
        message: 'Conta criada com sucesso! Faça login para continuar.',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = authController;