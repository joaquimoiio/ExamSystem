const express = require('express');
const router = express.Router();

// Import routes with fallback
let authRoutes;
try {
  authRoutes = require('./auth');
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  // Criar fallback básico
  authRoutes = express.Router();
  authRoutes.post('/login', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Auth module not available'
    });
  });
}

// API info
router.get('/', (req, res) => {
  console.log('📋 API info accessed');
  res.json({
    success: true,
    message: 'Exam System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  console.log('💚 Health check accessed');
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount auth routes
router.use('/auth', authRoutes);

// Catch-all for undefined routes
router.use('*', (req, res) => {
  console.log('❓ Undefined API route:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Endpoint da API não encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /api',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile'
    ]
  });
});

module.exports = router;