const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const examController = require('../controllers/examController');

// Validation rules for exam creation/update
const examValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Título deve ter entre 3 e 200 caracteres'),
  body('subjectId')
    .isInt({ min: 1 })
    .withMessage('ID da disciplina é obrigatório'),
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
];

// Routes básicas usando os controllers existentes
router.get('/', examController.getExams);
router.get('/stats', examController.getExamsStats);
router.get('/recent', examController.getRecentExams);
router.get('/:id', examController.getExamById);
router.post('/', examValidation, examController.createExam);
router.put('/:id', examValidation, examController.updateExam);
router.delete('/:id', examController.deleteExam);

// Exam management
router.post('/:id/publish', examController.publishExam);
router.post('/:id/unpublish', examController.unpublishExam);
router.post('/:id/duplicate', examController.duplicateExam);
router.post('/:id/regenerate-variations', examController.regenerateVariations);

// Variations
router.get('/:id/variations', examController.getExamVariations);
router.get('/:id/variations/:variationId', examController.getExamVariation);

// Analytics and reports
router.get('/:id/analytics', examController.getExamAnalytics);
router.get('/:id/answers', examController.getExamAnswers);
router.post('/:id/export', examController.exportExamResults);
router.post('/:id/report', examController.generateExamReport);
router.post('/:id/bulk-grade', examController.bulkGradeExam);

// PDF Generation with QR codes
router.post('/:id/generate-pdf', examController.generateExamPDF);
router.post('/:id/generate-all-pdfs', examController.generateAllExamPDFs);

module.exports = router;