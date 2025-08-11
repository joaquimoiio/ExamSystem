const express = require('express');
const router = express.Router();

const examController = require('../controllers/examController');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const {
  validateExamCreate,
  validateExamUpdate,
  validatePagination
} = require('../middleware/validation');

// All routes require authentication and teacher role
router.use(authenticateToken, requireTeacher);

// Exam CRUD operations
router.get('/', validatePagination, examController.getExams);
router.get('/:id', examController.getExam);
router.post('/', validateExamCreate, examController.createExam);
router.put('/:id', validateExamUpdate, examController.updateExam);
router.delete('/:id', examController.deleteExam);

// Exam operations
router.post('/:id/publish', examController.publishExam);
router.post('/:id/unpublish', examController.unpublishExam);
router.post('/:id/duplicate', examController.duplicateExam);

// Variation management
router.post('/:id/regenerate-variations', examController.regenerateVariations);
router.post('/:id/generate-pdfs', examController.generateExamPDFs);

// Statistics and analysis
router.get('/:id/statistics', examController.getExamStatistics);

// Preview functionality
router.get('/preview/questions', examController.previewExamQuestions);

module.exports = router;