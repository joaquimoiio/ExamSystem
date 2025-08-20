const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const examHeaderController = require('../controllers/examHeaderController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validation rules for exam header creation/update
const examHeaderValidation = [
  body('schoolName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome da escola deve ter entre 2 e 200 caracteres'),
  body('subjectName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome da matéria deve ter entre 2 e 100 caracteres'),
  body('year')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Ano deve estar entre 2020 e 2050'),
  body('evaluationCriteria')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Critérios de avaliação devem ter no máximo 1000 caracteres'),
  body('instructions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Instruções devem ter no máximo 1000 caracteres'),
  body('timeLimit')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Tempo limite deve estar entre 15 e 480 minutos'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault deve ser verdadeiro ou falso')
];

// Routes
router.get('/', examHeaderController.getExamHeaders);
router.get('/default', examHeaderController.getDefaultExamHeader);
router.get('/:id', examHeaderController.getExamHeaderById);
router.post('/', examHeaderValidation, examHeaderController.createExamHeader);
router.put('/:id', examHeaderValidation, examHeaderController.updateExamHeader);
router.put('/:id/set-default', examHeaderController.setAsDefault);
router.delete('/:id', examHeaderController.deleteExamHeader);

module.exports = router;