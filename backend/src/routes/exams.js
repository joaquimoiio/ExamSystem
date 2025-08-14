const express = require('express');
const router = express.Router();

const examController = require('../controllers/examController');
const { authenticateToken, requireTeacher, checkOwnership, optionalAuth } = require('../middleware/auth');
const {
  validateExamCreate,
  validateExamUpdate,
  validatePagination,
  validateUUIDParam
} = require('../middleware/validation');
const { Exam } = require('../models');

// Public routes (no authentication required)
router.get('/public', validatePagination, examController.getPublicExams);
router.get('/access/:accessCode', examController.getExamByAccessCode);

// Routes with optional authentication
router.get('/take/:examId/:variationId', 
  optionalAuth,
  validateUUIDParam('examId'),
  validateUUIDParam('variationId'),
  examController.getExamForTaking
);

// Protected routes (authentication required)
router.use(authenticateToken);

// List exams with pagination and search
router.get('/', validatePagination, examController.getExams);

// Get exam statistics
router.get('/stats', examController.getExamsStats);

// Get recent exams
router.get('/recent', examController.getRecentExams);

// Create new exam (teachers and admins only)
router.post('/', 
  requireTeacher, 
  validateExamCreate, 
  examController.createExam
);

// Get exam by ID
router.get('/:id',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  examController.getExamById
);

// Update exam (only owner or admin)
router.put('/:id',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  validateExamUpdate,
  examController.updateExam
);

// Delete exam (only owner or admin)
router.delete('/:id',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  examController.deleteExam
);

// Publish exam
router.post('/:id/publish',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  requireTeacher,
  examController.publishExam
);

// Unpublish exam
router.post('/:id/unpublish',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  requireTeacher,
  examController.unpublishExam
);

// Duplicate exam
router.post('/:id/duplicate',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  requireTeacher,
  examController.duplicateExam
);

// Generate new variations
router.post('/:id/regenerate-variations',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  requireTeacher,
  examController.regenerateVariations
);

// Get exam variations
router.get('/:id/variations',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  examController.getExamVariations
);

// Get specific variation
router.get('/:id/variations/:variationId',
  validateUUIDParam('id'),
  validateUUIDParam('variationId'),
  checkOwnership(Exam),
  examController.getExamVariation
);

// Download variation QR codes
router.get('/:id/qr-codes',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  examController.downloadQRCodes
);

// Get exam answers/submissions
router.get('/:id/answers',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  validatePagination,
  examController.getExamAnswers
);

// Get exam statistics and analytics
router.get('/:id/analytics',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  examController.getExamAnalytics
);

// Export exam results
router.post('/:id/export-results',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  examController.exportExamResults
);

// Generate exam report
router.get('/:id/report',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  examController.generateExamReport
);

// Bulk grade exam submissions
router.post('/:id/bulk-grade',
  validateUUIDParam('id'),
  checkOwnership(Exam),
  requireTeacher,
  examController.bulkGradeExam
);

module.exports = router;