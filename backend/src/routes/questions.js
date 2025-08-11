const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const { uploadDocument, handleUploadError } = require('../middleware/upload');
const {
  validateQuestionCreate,
  validateQuestionUpdate,
  validateQuestionFilter,
  validatePagination
} = require('../middleware/validation');

// All routes require authentication and teacher role
router.use(authenticateToken, requireTeacher);

// Question CRUD operations
router.get('/', validatePagination, validateQuestionFilter, questionController.getQuestions);
router.get('/tags', questionController.getQuestionTags);
router.get('/for-exam', questionController.getQuestionsForExam);
router.get('/:id', questionController.getQuestion);
router.post('/', validateQuestionCreate, questionController.createQuestion);
router.put('/:id', validateQuestionUpdate, questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

// Bulk operations
router.post('/bulk', questionController.bulkCreateQuestions);
router.post('/:id/duplicate', questionController.duplicateQuestion);

// Import/Export
router.post('/import', uploadDocument, handleUploadError, questionController.importQuestions);
router.get('/export', questionController.exportQuestions);

module.exports = router;