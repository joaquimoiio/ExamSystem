const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validation rules for exam creation/update
const examValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Título deve ter entre 3 e 200 caracteres'),
  body('subjectId')
    .isUUID()
    .withMessage('ID da disciplina é obrigatório'),
  body('examHeaderId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('ID do cabeçalho da prova deve ser um UUID válido'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duração deve estar entre 15 e 480 minutos'),
  body('variations')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Número de variações deve estar entre 1 e 20'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('shuffleQuestions')
    .optional()
    .isBoolean()
    .withMessage('Embaralhar questões deve ser verdadeiro ou falso'),
  body('shuffleAlternatives')
    .optional()
    .isBoolean()
    .withMessage('Embaralhar alternativas deve ser verdadeiro ou falso'),
  body('showResults')
    .optional()
    .isBoolean()
    .withMessage('Mostrar resultados deve ser verdadeiro ou falso'),
  body('allowReview')
    .optional()
    .isBoolean()
    .withMessage('Permitir revisão deve ser verdadeiro ou falso'),
  handleValidationErrors
];

// Routes básicas usando os controllers existentes
router.get('/', authenticateToken, examController.getExams);
router.get('/stats', authenticateToken, examController.getExamsStats);
router.get('/recent', authenticateToken, examController.getRecentExams);
router.get('/:id', authenticateToken, examController.getExamById);
router.post('/', authenticateToken, requireTeacher, examValidation, examController.createExam);
router.put('/:id', authenticateToken, requireTeacher, examValidation, examController.updateExam);
router.put('/:id/questions', authenticateToken, requireTeacher, examController.updateExamQuestions);
router.delete('/:id', authenticateToken, requireTeacher, examController.deleteExam);

// Exam management
router.post('/:id/publish', authenticateToken, requireTeacher, examController.publishExam);
router.post('/:id/unpublish', authenticateToken, requireTeacher, examController.unpublishExam);
router.post('/:id/duplicate', authenticateToken, requireTeacher, examController.duplicateExam);
router.post('/:id/regenerate-variations', authenticateToken, requireTeacher, examController.regenerateVariations);

// Variations
router.get('/:id/variations', authenticateToken, examController.getExamVariations);
router.get('/:id/variations/:variationId', authenticateToken, examController.getExamVariation);

// Analytics and reports
router.get('/:id/analytics', authenticateToken, examController.getExamAnalytics);
router.get('/:id/answers', authenticateToken, examController.getExamAnswers);
router.post('/:id/export', authenticateToken, requireTeacher, examController.exportExamResults);
router.post('/:id/report', authenticateToken, requireTeacher, examController.generateExamReport);
router.post('/:id/bulk-grade', authenticateToken, requireTeacher, examController.bulkGradeExam);

// PDF Generation with QR codes
router.post('/:id/generate-pdf', authenticateToken, requireTeacher, examController.generateExamPDF);
router.post('/:id/generate-all-pdfs', authenticateToken, requireTeacher, examController.generateAllExamPDFs);
router.get('/:id/generate-all-variations-pdf', authenticateToken, requireTeacher, examController.generateAllVariationsPDF);
router.get('/:id/variations/:variationId/generate-pdf', authenticateToken, requireTeacher, examController.generateSingleVariationPDF);

// Answer sheet generation
router.get('/:id/answer-sheet', authenticateToken, requireTeacher, examController.generateAnswerSheet);

// QR Code validation
router.post('/validate-qr', authenticateToken, examController.validateQRAnswers);

// Manual correction
router.post('/:id/correct-manual', authenticateToken, requireTeacher, examController.correctExamManually);

module.exports = router;