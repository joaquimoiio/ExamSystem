const express = require('express');
const router = express.Router();

// Import routes with fallback
let authRoutes, subjectRoutes, questionRoutes, examRoutes, examHeaderRoutes, correctionRoutes;

try {
  authRoutes = require('./auth');
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  authRoutes = express.Router();
  authRoutes.post('/login', (req, res) => {
    res.status(500).json({ success: false, message: 'Auth module not available' });
  });
}

try {
  subjectRoutes = require('./subjects');
  console.log('✅ Subject routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading subject routes:', error.message);
  subjectRoutes = express.Router();
  subjectRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { subjects: [], total: 0 } });
  });
  subjectRoutes.get('/stats', (req, res) => {
    res.json({ success: true, data: { total: 0 } });
  });
}

try {
  questionRoutes = require('./questions');
  console.log('✅ Question routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading question routes:', error.message);
  questionRoutes = express.Router();
  questionRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { questions: [], total: 0 } });
  });
  questionRoutes.get('/stats', (req, res) => {
    res.json({ success: true, data: { total: 0 } });
  });
}

try {
  examRoutes = require('./exams');
  console.log('✅ Exam routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading exam routes:', error.message);
  examRoutes = express.Router();
  examRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { exams: [], total: 0 } });
  });
  examRoutes.get('/stats', (req, res) => {
    res.json({ success: true, data: { total: 0, published: 0 } });
  });
}

try {
  examHeaderRoutes = require('./examHeaders');
  console.log('✅ Exam header routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading exam header routes:', error.message);
  examHeaderRoutes = express.Router();
  examHeaderRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { headers: [], total: 0 } });
  });
}

try {
  correctionRoutes = require('./corrections');
  console.log('✅ Correction routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading correction routes:', error.message);
  correctionRoutes = express.Router();
  correctionRoutes.post('/validate-qr', (req, res) => {
    res.status(500).json({ success: false, message: 'Correction module not available' });
  });
  correctionRoutes.post('/correct-exam', (req, res) => {
    res.status(500).json({ success: false, message: 'Correction module not available' });
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

// Mount other routes
router.use('/subjects', subjectRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/exam-headers', examHeaderRoutes);
router.use('/corrections', correctionRoutes);

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
      'GET /api/auth/profile',
      'GET /api/subjects',
      'GET /api/subjects/stats',
      'GET /api/questions',
      'GET /api/questions/stats',
      'GET /api/exams',
      'GET /api/exams/stats'
    ]
  });
});

module.exports = router;