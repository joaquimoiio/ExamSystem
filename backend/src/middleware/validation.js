const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../utils/appError');

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return next(new AppError('Dados de entrada inválidos', 400, true, errorMessages));
  }
  next();
};

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit deve ser um número entre 1 e 100'),
  query('sortBy')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('SortBy deve ser uma string válida'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('SortOrder deve ser ASC ou DESC'),
  handleValidationErrors
];

// Auth validation
const validateUserRegister = [
  body('name')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    }),
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
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone deve ser válido'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio deve ter no máximo 500 caracteres'),
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('Nova senha deve ter entre 6 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    }),
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
    .withMessage('Senha deve ter entre 6 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    }),
  handleValidationErrors
];

// Subject validation
const validateSubjectCreate = [
  body('name')
    .notEmpty()
    .withMessage('Nome da disciplina é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve ser um código hex válido'),
  handleValidationErrors
];

const validateSubjectUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve ser um código hex válido'),
  handleValidationErrors
];

// Question validation
const validateQuestionCreate = [
  body('text')
    .notEmpty()
    .withMessage('Texto da questão é obrigatório')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Texto deve ter entre 10 e 2000 caracteres'),
  body('alternatives')
    .isArray({ min: 2, max: 5 })
    .withMessage('Deve haver entre 2 e 5 alternativas'),
  body('alternatives.*')
    .notEmpty()
    .withMessage('Alternativa não pode estar vazia')
    .isLength({ min: 1, max: 500 })
    .withMessage('Alternativa deve ter entre 1 e 500 caracteres'),
  body('correctAnswer')
    .isInt({ min: 0, max: 4 })
    .withMessage('Resposta correta deve ser um índice válido'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser: easy, medium ou hard'),
  body('subjectId')
    .isUUID()
    .withMessage('ID da disciplina deve ser um UUID válido'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Cada tag deve ter entre 1 e 50 caracteres'),
  body('explanation')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Explicação deve ter no máximo 1000 caracteres'),
  body('points')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Pontuação deve ser entre 0.1 e 10'),
  handleValidationErrors
];

const validateQuestionUpdate = [
  body('text')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Texto deve ter entre 10 e 2000 caracteres'),
  body('alternatives')
    .optional()
    .isArray({ min: 2, max: 5 })
    .withMessage('Deve haver entre 2 e 5 alternativas'),
  body('alternatives.*')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Alternativa deve ter entre 1 e 500 caracteres'),
  body('correctAnswer')
    .optional()
    .isInt({ min: 0, max: 4 })
    .withMessage('Resposta correta deve ser um índice válido'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser: easy, medium ou hard'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array'),
  body('explanation')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Explicação deve ter no máximo 1000 caracteres'),
  body('points')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Pontuação deve ser entre 0.1 e 10'),
  handleValidationErrors
];

// Exam validation
const validateExamCreate = [
  body('title')
    .notEmpty()
    .withMessage('Título da prova é obrigatório')
    .isLength({ min: 3, max: 200 })
    .withMessage('Título deve ter entre 3 e 200 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Descrição deve ter no máximo 2000 caracteres'),
  body('subjectId')
    .isUUID()
    .withMessage('ID da disciplina deve ser um UUID válido'),
  body('totalQuestions')
    .isInt({ min: 1, max: 100 })
    .withMessage('Total de questões deve ser entre 1 e 100'),
  body('easyQuestions')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Questões fáceis deve ser um número positivo'),
  body('mediumQuestions')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Questões médias deve ser um número positivo'),
  body('hardQuestions')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Questões difíceis deve ser um número positivo'),
  body('totalVariations')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Total de variações deve ser entre 1 e 50'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Tempo limite deve ser um número positivo'),
  body('passingScore')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Nota mínima deve ser entre 0 e 10'),
  body('instructions')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Instruções devem ter no máximo 5000 caracteres'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Máximo de tentativas deve ser um número positivo'),
  handleValidationErrors
];

const validateExamUpdate = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Título deve ter entre 3 e 200 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Descrição deve ter no máximo 2000 caracteres'),
  body('totalQuestions')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Total de questões deve ser entre 1 e 100'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Tempo limite deve ser um número positivo'),
  body('passingScore')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Nota mínima deve ser entre 0 e 10'),
  body('instructions')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Instruções devem ter no máximo 5000 caracteres'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Máximo de tentativas deve ser um número positivo'),
  handleValidationErrors
];

// Answer submission validation
const validateAnswerSubmission = [
  body('studentName')
    .notEmpty()
    .withMessage('Nome do estudante é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('studentId')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('ID do estudante deve ter entre 1 e 50 caracteres'),
  body('studentEmail')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Respostas devem ser um array não vazio'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tempo gasto deve ser um número positivo'),
  handleValidationErrors
];

// UUID param validation
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} deve ser um UUID válido`),
  handleValidationErrors
];

module.exports = {
  validatePagination,
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateSubjectCreate,
  validateSubjectUpdate,
  validateQuestionCreate,
  validateQuestionUpdate,
  validateExamCreate,
  validateExamUpdate,
  validateAnswerSubmission,
  validateUUIDParam,
  handleValidationErrors
};