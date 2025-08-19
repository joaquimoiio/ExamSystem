const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');

const authController = {
  login: catchAsync(async (req, res, next) => {
    console.log('🔐 AuthController.login iniciado');
    console.log('📧 Email recebido:', req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new AppError('Email e senha são obrigatórios', 400));
    }
    
    // Buscar usuário no banco de dados (primeiro sem filtro de isActive)
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase()
      }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return next(new AppError('Email não encontrado. Verifique se está correto ou crie uma nova conta.', 401));
    }
    
    // Verificar se a conta está ativa
    if (!user.isActive) {
      console.log('❌ Conta desativada:', email);
      return next(new AppError('Conta desativada. Entre em contato com o suporte.', 403));
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Senha inválida para:', email);
      return next(new AppError('Senha incorreta. Tente novamente ou clique em "Esqueceu sua senha?".', 401));
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'exam_system_super_secret_key_2024_muito_segura',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    console.log('✅ Login bem-sucedido:', {
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  }),

  register: catchAsync(async (req, res, next) => {
    console.log('📝 AuthController.register iniciado');
    
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return next(new AppError('Nome, email e senha são obrigatórios', 400));
    }
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      return next(new AppError('Email já está em uso', 409));
    }
    
    // Criar novo usuário no banco de dados (a senha será hasheada automaticamente pelo hook do modelo)
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: password,
      role: role || 'teacher',
      isActive: true
    });
    
    console.log('✅ Usuário criado:', {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });
    
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
  }),

  getProfile: catchAsync(async (req, res, next) => {
    console.log('👤 AuthController.getProfile iniciado');
    
    // req.user é preenchido pelo middleware de autenticação
    if (!req.user) {
      return next(new AppError('Usuário não autenticado', 401));
    }
    
    // Buscar dados atualizados do usuário no banco
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return next(new AppError('Usuário não encontrado', 404));
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          avatar: user.avatar,
          phone: user.phone,
          bio: user.bio,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  })
};

module.exports = authController;