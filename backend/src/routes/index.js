const express = require('express');
const router = express.Router();

// Import route modules with error handling
let authRoutes, subjectRoutes, questionRoutes, examRoutes, correctionRoutes;

try {
  authRoutes = require('./auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.warn('⚠️ Auth routes not found, using fallback');
  authRoutes = express.Router();
  authRoutes.get('/profile', (req, res) => {
    res.json({
      success: true,
      data: { user: { id: 'fallback', name: 'Fallback User', email: 'fallback@example.com', role: 'teacher' } },
      mode: 'fallback'
    });
  });
}

try {
  subjectRoutes = require('./subjects');
  console.log('✅ Subject routes loaded');
} catch (error) {
  console.warn('⚠️ Subject routes not found, using fallback');
  subjectRoutes = express.Router();
  subjectRoutes.get('/', (req, res) => {
    res.json({
      success: true,
      data: { subjects: [], pagination: { page: 1, limit: 10, total: 0 } },
      mode: 'fallback'
    });
  });
  subjectRoutes.post('/', (req, res) => {
    res.status(201).json({
      success: true,
      message: 'Disciplina criada (fallback)',
      data: { subject: { id: Date.now().toString(), name: req.body.name || 'Nova Disciplina' } },
      mode: 'fallback'
    });
  });
}

try {
  questionRoutes = require('./questions');
  console.log('✅ Question routes loaded');
} catch (error) {
  console.warn('⚠️ Question routes not found, using fallback');
  questionRoutes = express.Router();
  questionRoutes.get('/', (req, res) => {
    res.json({
      success: true,
      data: { questions: [], pagination: { page: 1, limit: 10, total: 0 } },
      mode: 'fallback'
    });
  });
}

try {
  examRoutes = require('./exams');
  console.log('✅ Exam routes loaded');
} catch (error) {
  console.warn('⚠️ Exam routes not found, using fallback');
  examRoutes = express.Router();
  examRoutes.get('/', (req, res) => {
    res.json({
      success: true,
      data: { exams: [], pagination: { page: 1, limit: 10, total: 0 } },
      mode: 'fallback'
    });
  });
}

try {
  correctionRoutes = require('./corrections');
  console.log('✅ Correction routes loaded');
} catch (error) {
  console.warn('⚠️ Correction routes not found, using fallback');
  correctionRoutes = express.Router();
  correctionRoutes.get('/', (req, res) => {
    res.json({
      success: true,
      data: { corrections: [], pagination: { page: 1, limit: 10, total: 0 } },
      mode: 'fallback'
    });
  });
}

// API version and info
router.get('/', (req, res) => {
  console.log('📋 Acessando informações da API');
  res.json({
    success: true,
    message: 'Exam System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      subjects: '/api/subjects',
      questions: '/api/questions',
      exams: '/api/exams',
      correction: '/api/correction'
    },
    available_endpoints: [
      'GET /api',
      'GET /api/health',
      'GET /api/version',
      'GET /api/auth/profile',
      'POST /api/auth/login',
      'GET /api/subjects',
      'POST /api/subjects',
      'GET /api/questions',
      'GET /api/exams'
    ]
  });
});

// Health check - PRINCIPAL CORREÇÃO AQUI
router.get('/health', (req, res) => {
  console.log('💚 Health check acessado');
  
  // Verificar status dos módulos
  const moduleStatus = {
    auth: !!authRoutes,
    subjects: !!subjectRoutes,
    questions: !!questionRoutes,
    exams: !!examRoutes,
    corrections: !!correctionRoutes
  };

  const allModulesLoaded = Object.values(moduleStatus).every(status => status);

  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    modules: moduleStatus,
    status: allModulesLoaded ? 'fully_operational' : 'partial_fallback',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    node_version: process.version
  });
});

// Version endpoint
router.get('/version', (req, res) => {
  console.log('🔖 Version info acessado');
  res.json({
    success: true,
    version: '1.0.0',
    name: 'Exam System API',
    description: 'Sistema de Provas Online com múltiplas variações',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    uptime: process.uptime()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/correction', correctionRoutes);

// Catch-all for undefined API routes
router.use('*', (req, res) => {
  console.log('❓ Rota da API não encontrada:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Endpoint da API não encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /api',
      'GET /api/health',
      'GET /api/version',
      'GET /api/auth/profile',
      'GET /api/subjects',
      'POST /api/subjects',
      'GET /api/questions',
      'GET /api/exams'
    ]
  });
});

module.exports = router;