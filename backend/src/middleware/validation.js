// backend/src/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

// Middleware para tratar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validações de usuário
const validateUserRegister = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres'),
  
  body('role')
    .optional()
    .isIn(['teacher', 'admin'])
    .withMessage('Role deve ser teacher ou admin'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('Nova senha deve ter entre 6 e 128 caracteres'),
  
  handleValidationErrors
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  
  handleValidationErrors
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres'),
  
  handleValidationErrors
];

// Validações de paginação
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  handleValidationErrors
];

// Validação de UUID
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} deve ser um UUID válido`),
  
  handleValidationErrors
];

// Validações placeholder para outros módulos
const validateSubjectCreate = [handleValidationErrors];
const validateSubjectUpdate = [handleValidationErrors];
const validateQuestionCreate = [handleValidationErrors];
const validateQuestionUpdate = [handleValidationErrors];
const validateExamCreate = [handleValidationErrors];
const validateExamUpdate = [handleValidationErrors];

module.exports = {
  handleValidationErrors,
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validatePagination,
  validateUUIDParam,
  validateSubjectCreate,
  validateSubjectUpdate,
  validateQuestionCreate,
  validateQuestionUpdate,
  validateExamCreate,
  validateExamUpdate
};