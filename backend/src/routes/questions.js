const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
const { authenticateToken, requireTeacher, checkOwnership } = require('../middleware/auth');
const {
  validateQuestionCreate,
  validateQuestionUpdate,
  validatePagination,
  validateUUIDParam
} = require('../middleware/validation');
const { uploadImage, cleanupOnError } = require('../middleware/upload');
const { Question } = require('../models');

// All routes require authentication
router.use(authenticateToken);

// List questions with pagination, search and filters
router.get('/', validatePagination, questionController.getQuestions);

// Get questions statistics
router.get('/stats', questionController.getQuestionsStats);

// Search questions across all subjects
router.get('/search', validatePagination, questionController.searchQuestions);

// Get questions by difficulty for a subject
router.get('/by-difficulty/:subjectId/:difficulty',
  validateUUIDParam('subjectId'),
  questionController.getQuestionsByDifficulty
);

// Import questions from file
router.post('/import',
  requireTeacher,
  uploadImage,
  cleanupOnError,
  questionController.importQuestions
);

// Export questions to file
router.post('/export',
  requireTeacher,
  questionController.exportQuestions
);

// Bulk operations
router.post('/bulk-delete',
  requireTeacher,
  questionController.bulkDeleteQuestions
);

router.post('/bulk-update',
  requireTeacher,
  questionController.bulkUpdateQuestions
);

// Create new question (teachers and admins only)
router.post('/',
  requireTeacher,
  uploadImage,
  cleanupOnError,
  validateQuestionCreate,
  questionController.createQuestion
);

// Get question by ID
router.get('/:id',
  validateUUIDParam('id'),
  checkOwnership(Question),
  questionController.getQuestionById
);

// Update question (only owner or admin)
router.put('/:id',
  validateUUIDParam('id'),
  checkOwnership(Question),
  uploadImage,
  cleanupOnError,
  validateQuestionUpdate,
  questionController.updateQuestion
);

// Delete question (only owner or admin)
router.delete('/:id',
  validateUUIDParam('id'),
  checkOwnership(Question),
  questionController.deleteQuestion
);

// Duplicate question
router.post('/:id/duplicate',
  validateUUIDParam('id'),
  checkOwnership(Question),
  requireTeacher,
  questionController.duplicateQuestion
);

// Get question usage statistics
router.get('/:id/stats',
  validateUUIDParam('id'),
  checkOwnership(Question),
  questionController.getQuestionStats
);

// Update question difficulty based on performance
router.post('/:id/recalculate-difficulty',
  validateUUIDParam('id'),
  checkOwnership(Question),
  requireTeacher,
  questionController.recalculateDifficulty
);

module.exports = router;