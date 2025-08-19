const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const questionController = require('../controllers/questionController');

// Validation rules for question creation/update
const questionValidation = [
  body('subjectId')
    .isInt({ min: 1 })
    .withMessage('ID da disciplina é obrigatório'),
  body('statement')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Enunciado deve ter entre 10 e 1000 caracteres'),
  body('type')
    .optional()
    .isIn(['multiple_choice', 'true_false', 'essay', 'fill_blank'])
    .withMessage('Tipo de questão inválido'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser easy, medium ou hard'),
  body('points')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Pontuação deve estar entre 0.1 e 10'),
  body('alternatives')
    .optional()
    .isArray()
    .withMessage('Alternativas devem ser um array'),
  body('explanation')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Explicação deve ter no máximo 500 caracteres'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array'),
];

// Routes
router.get('/', questionController.getQuestions);
router.get('/stats', questionController.getQuestionsStats);
router.get('/:id', questionController.getQuestionById);
router.post('/', questionValidation, questionController.createQuestion);
router.put('/:id', questionValidation, questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;