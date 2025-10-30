const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { checkPlanLimits } = require('../middleware/planLimits');
const { requireActiveSubscription } = require('../middleware/subscriptionCheck');

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
router.get('/', authenticateToken, requireActiveSubscription, examController.getExams);
router.get('/stats', authenticateToken, requireActiveSubscription, examController.getExamsStats);
router.get('/recent', authenticateToken, requireActiveSubscription, examController.getRecentExams);
router.get('/:id', authenticateToken, requireActiveSubscription, examController.getExamById);
router.post('/', authenticateToken, requireActiveSubscription, requireTeacher, checkPlanLimits('exams'), examValidation, examController.createExam);
router.put('/:id', authenticateToken, requireActiveSubscription, requireTeacher, examValidation, examController.updateExam);
router.put('/:id/questions', authenticateToken, requireActiveSubscription, requireTeacher, examController.updateExamQuestions);
router.delete('/:id', authenticateToken, requireActiveSubscription, requireTeacher, examController.deleteExam);

// Exam management
router.post('/:id/publish', authenticateToken, requireActiveSubscription, requireTeacher, examController.publishExam);
router.post('/:id/unpublish', authenticateToken, requireActiveSubscription, requireTeacher, examController.unpublishExam);
router.post('/:id/duplicate', authenticateToken, requireActiveSubscription, requireTeacher, examController.duplicateExam);
router.post('/:id/regenerate-variations', authenticateToken, requireActiveSubscription, requireTeacher, examController.regenerateVariations);

// Variations
router.get('/:id/variations', authenticateToken, requireActiveSubscription, examController.getExamVariations);
router.get('/:id/variations/:variationId', authenticateToken, requireActiveSubscription, examController.getExamVariation);

// Analytics and reports
router.get('/:id/analytics', authenticateToken, requireActiveSubscription, examController.getExamAnalytics);
router.get('/:id/answers', authenticateToken, requireActiveSubscription, examController.getExamAnswers);
router.post('/:id/export', authenticateToken, requireActiveSubscription, requireTeacher, examController.exportExamResults);
router.post('/:id/report', authenticateToken, requireActiveSubscription, requireTeacher, examController.generateExamReport);
router.post('/:id/bulk-grade', authenticateToken, requireActiveSubscription, requireTeacher, examController.bulkGradeExam);

// PDF Generation with QR codes
router.post('/:id/generate-pdf', authenticateToken, requireActiveSubscription, requireTeacher, examController.generateExamPDF);
router.post('/:id/generate-all-pdfs', authenticateToken, requireActiveSubscription, requireTeacher, examController.generateAllExamPDFs);
router.get('/:id/generate-all-variations-pdf', authenticateToken, requireActiveSubscription, requireTeacher, examController.generateAllVariationsPDF);
router.get('/:id/variations/:variationId/generate-pdf', authenticateToken, requireActiveSubscription, requireTeacher, examController.generateSingleVariationPDF);

// Answer sheet generation
router.get('/:id/answer-sheet', authenticateToken, requireActiveSubscription, requireTeacher, examController.generateAnswerSheet);

// QR Code validation and correction
router.post('/validate-qr', authenticateToken, requireActiveSubscription, examController.validateQRAnswers);
router.post('/correct-camera', authenticateToken, requireActiveSubscription, requireTeacher, examController.correctAnswersFromCamera);

// Manual correction
router.post('/:id/correct-manual', authenticateToken, requireActiveSubscription, requireTeacher, examController.correctExamManually);

module.exports = router;