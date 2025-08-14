const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const subjectRoutes = require('./subjects');
const questionRoutes = require('./questions');
const examRoutes = require('./exams');
const correctionRoutes = require('./correction');

// API version and info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Exam System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      subjects: '/api/subjects',
      questions: '/api/questions',
      exams: '/api/exams',
      correction: '/api/correction'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/correction', correctionRoutes);

module.exports = router;