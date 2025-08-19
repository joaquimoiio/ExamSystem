const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateToken } = require('../middleware/auth');

// Validation rules for subject creation/update
const subjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Cor deve estar no formato hexadecimal (#FFFFFF)'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Créditos deve ser um número entre 1 e 20'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser verdadeiro ou falso'),
];

// Routes
router.get('/', authenticateToken, subjectController.getSubjects);
router.get('/stats', authenticateToken, subjectController.getSubjectsStats);
router.get('/:id', authenticateToken, subjectController.getSubjectById);
router.post('/', authenticateToken, subjectValidation, subjectController.createSubject);
router.put('/:id', authenticateToken, subjectValidation, subjectController.updateSubject);
router.delete('/:id', authenticateToken, subjectController.deleteSubject);

module.exports = router;