const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const { checkPlanLimits } = require('../middleware/planLimits');
const { requireActiveSubscription } = require('../middleware/subscriptionCheck');

// Validation rules for question creation/update
const questionValidation = [
  body('subjectId')
    .isUUID()
    .withMessage('ID da disciplina deve ser um UUID válido'),
  body('text')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Enunciado deve ter entre 10 e 2000 caracteres'),
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

// Routes (todas protegidas com autenticação)
router.get('/', authenticateToken, requireActiveSubscription, questionController.getQuestions);
router.get('/stats', authenticateToken, requireActiveSubscription, questionController.getQuestionsStats);
router.get('/:id', authenticateToken, requireActiveSubscription, questionController.getQuestionById);
router.post('/', authenticateToken, requireActiveSubscription, requireTeacher, checkPlanLimits('questions'), questionValidation, questionController.createQuestion);
router.put('/:id', authenticateToken, requireActiveSubscription, requireTeacher, questionValidation, questionController.updateQuestion);
router.put('/:id/points', authenticateToken, requireActiveSubscription, requireTeacher, questionController.updateQuestionPoints);
router.delete('/:id', authenticateToken, requireActiveSubscription, requireTeacher, questionController.deleteQuestion);

module.exports = router;