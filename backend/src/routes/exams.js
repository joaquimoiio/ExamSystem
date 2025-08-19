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
router.get('/:id', examController.getExamById);
router.post('/', examValidation, examController.createExam);
router.put('/:id', examValidation, examController.updateExam);
router.delete('/:id', examController.deleteExam);

// Endpoints que podem não existir ainda - com fallback
router.post('/:id/publish', examController.publishExam || ((req, res) => {
  res.json({ success: true, message: 'Função de publicação em desenvolvimento' });
}));

router.post('/:id/generate-pdfs', examController.generatePDFs || ((req, res) => {
  res.json({ success: true, message: 'Geração de PDFs em desenvolvimento' });
}));

module.exports = router;