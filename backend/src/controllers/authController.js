const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simulação de banco de dados - substitua pela implementação real
const users = [
  {
    id: 1,
    name: 'Professor Demo',
    email: 'professor@teste.com',
    password: '$2a$12$LQv3c1yqBwEHxv/4HrTwQOsB5K8Q9Dxd.VjZyYgD1tZJnQ2K3lM7u', // senha: 123456
    role: 'teacher'
  },
  {
    id: 2,
    name: 'Admin Demo',
    email: 'admin@teste.com',
    password: '$2a$12$LQv3c1yqBwEHxv/4HrTwQOsB5K8Q9Dxd.VjZyYgD1tZJnQ2K3lM7u', // senha: 123456
    role: 'admin'
  }
];

const authController = {
  async login(req, res) {
    console.log('🔐 AuthController.login iniciado');
    console.log('📧 Email recebido:', req.body.email);
    
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }
      
      // Buscar usuário no "banco de dados"
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.log('❌ Usuário não encontrado:', email);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }
      
      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log('❌ Senha inválida para:', email);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'fallback-secret',
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
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  async register(req, res) {
    console.log('📝 AuthController.register iniciado');
    
    try {
      const { name, email, password, role } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }
      
      // Verificar se usuário já existe
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Criar novo usuário
      const newUser = {
        id: users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: role || 'teacher'
      };
      
      users.push(newUser);
      
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
      
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  async getProfile(req, res) {
    console.log('👤 AuthController.getProfile iniciado');
    
    try {
      // Em um cenário real, pegar dados do token/middleware de autenticação
      const user = users.find(u => u.id === 1); // Demo user
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
};

module.exports = authController;