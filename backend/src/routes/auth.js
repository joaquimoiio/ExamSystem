const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de validação básica
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }
  
  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nome, email e senha são obrigatórios'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Senha deve ter pelo menos 6 caracteres'
    });
  }
  
  next();
};

// Rotas públicas
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);

// Rota de debug para testar autenticação
router.get('/debug', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Autenticação funcionando!',
    data: {
      user: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

// Rotas protegidas
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;