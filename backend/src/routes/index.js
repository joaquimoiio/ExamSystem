const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const subjectRoutes = require('./subjects');
const questionRoutes = require('./questions');
const examRoutes = require('./exams');
const correctionRoutes = require('./corrections');

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API version info
router.get('/version', (req, res) => {
  res.json({
    success: true,
    data: {
      version: process.env.npm_package_version || '1.0.0',
      name: process.env.npm_package_name || 'exam-system-backend',
      description: 'Sistema de Provas Online - Backend API',
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
      uptime: process.uptime()
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/corrections', correctionRoutes);

// Public routes for students (no authentication required)
router.use('/public', require('./public'));

// Admin routes (restricted access)
router.use('/admin', require('./admin'));

module.exports = router;