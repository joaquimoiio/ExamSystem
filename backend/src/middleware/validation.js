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
    .withMessage('Tag deve ter entre 1 e 50 caracteres'),
  body('explanation')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Explicação deve ter no máximo 1000 caracteres'),
  body('points')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Pontos devem ser entre 1 e 10'),
  body('timeEstimate')
    .optional()
    .isInt({ min: 30, max: 1800 })
    .withMessage('Tempo estimado deve ser entre 30 segundos e 30 minutos'),
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
    .notEmpty()
    .withMessage('Alternativa não pode estar vazia')
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
    .isInt({ min: 1, max: 10 })
    .withMessage('Pontos devem ser entre 1 e 10'),
  body('timeEstimate')
    .optional()
    .isInt({ min: 30, max: 1800 })
    .withMessage('Tempo estimado deve ser entre 30 segundos e 30 minutos'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser um valor booleano'),
  handleValidationErrors
];

const validateQuestionFilter = [
  query('subjectId')
    .optional()
    .isUUID()
    .withMessage('ID da disciplina deve ser um UUID válido'),
  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser: easy, medium ou hard'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags devem ser uma string'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Busca deve ter entre 1 e 100 caracteres'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser um valor booleano'),
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
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Cor deve ser um código hexadecimal válido'),
  handleValidationErrors
];

const validateSubjectUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Cor deve ser um código hexadecimal válido'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser um valor booleano'),
  handleValidationErrors
];

// Exam validation
const validateExamCreate = [
  body('title')
    .notEmpty()
    .withMessage('Título da prova é obrigatório')
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('instructions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Instruções devem ter no máximo 2000 caracteres'),
  body('subjectId')
    .isUUID()
    .withMessage('ID da disciplina deve ser um UUID válido'),
  body('timeLimit')
    .optional()
    .isInt({ min: 300, max: 18000 })
    .withMessage('Tempo limite deve ser entre 5 minutos e 5 horas (em segundos)'),
  body('totalQuestions')
    .isInt({ min: 1, max: 100 })
    .withMessage('Total de questões deve ser entre 1 e 100'),
  body('questionsConfig')
    .optional()
    .isObject()
    .withMessage('Configuração de questões deve ser um objeto'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Configurações devem ser um objeto'),
  handleValidationErrors
];

const validateExamUpdate = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('instructions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Instruções devem ter no máximo 2000 caracteres'),
  body('timeLimit')
    .optional()
    .isInt({ min: 300, max: 18000 })
    .withMessage('Tempo limite deve ser entre 5 minutos e 5 horas (em segundos)'),
  body('totalQuestions')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Total de questões deve ser entre 1 e 100'),
  body('questionsConfig')
    .optional()
    .isObject()
    .withMessage('Configuração de questões deve ser um objeto'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Configurações devem ser um objeto'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'closed'])
    .withMessage('Status deve ser: draft, published ou closed'),
  handleValidationErrors
];

// Answer submission validation
const validateAnswerSubmit = [
  body('studentName')
    .notEmpty()
    .withMessage('Nome do aluno é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('studentEmail')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido'),
  body('studentId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('ID do aluno deve ter entre 1 e 50 caracteres'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Respostas são obrigatórias'),
  body('answers.*.questionId')
    .isUUID()
    .withMessage('ID da questão deve ser um UUID válido'),
  body('answers.*.selectedAnswer')
    .isInt({ min: 0, max: 4 })
    .withMessage('Resposta selecionada deve ser um índice válido'),
  body('answers.*.timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tempo gasto deve ser um número positivo'),
  handleValidationErrors
];

// Answer review validation
const validateAnswerReview = [
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback deve ter no máximo 1000 caracteres'),
  body('manualScores')
    .optional()
    .isArray()
    .withMessage('Pontuações manuais devem ser um array'),
  body('manualScores.*.questionId')
    .optional()
    .isUUID()
    .withMessage('ID da questão deve ser um UUID válido'),
  body('manualScores.*.score')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Pontuação deve ser entre 0 e 10'),
  body('status')
    .optional()
    .isIn(['pending', 'graded', 'reviewed'])
    .withMessage('Status deve ser: pending, graded ou reviewed'),
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

const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  handleValidationErrors
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('Nova senha deve ter entre 6 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirmação de nova senha não confere');
      }
      return true;
    }),
  handleValidationErrors
];

// ID parameter validation
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  handleValidationErrors
];

const validateExamParams = [
  param('examId')
    .isUUID()
    .withMessage('ID da prova deve ser um UUID válido'),
  param('variationId')
    .optional()
    .isUUID()
    .withMessage('ID da variação deve ser um UUID válido'),
  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('category')
    .optional()
    .isIn(['document', 'image', 'import', 'export'])
    .withMessage('Categoria deve ser: document, image, import ou export'),
  handleValidationErrors
];

// Bulk operations validation
const validateBulkOperation = [
  body('operation')
    .isIn(['delete', 'activate', 'deactivate', 'move', 'tag'])
    .withMessage('Operação deve ser: delete, activate, deactivate, move ou tag'),
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('IDs devem ser um array com 1 a 100 itens'),
  body('ids.*')
    .isUUID()
    .withMessage('Todos os IDs devem ser UUIDs válidos'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Dados devem ser um objeto'),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Termo de busca deve ter entre 1 e 100 caracteres'),
  query('filters')
    .optional()
    .isObject()
    .withMessage('Filtros devem ser um objeto'),
  handleValidationErrors
];

// Custom validation helpers
const customValidators = {
  // Validate array of UUIDs
  isUUIDArray: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
  },

  // Validate Brazilian CPF
  isCPF: (value) => {
    if (!value) return false;
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    
    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    return checkDigit === parseInt(cpf.charAt(10));
  },

  // Validate Brazilian phone number
  isBrazilianPhone: (value) => {
    if (!value) return false;
    const phone = value.replace(/\D/g, '');
    return /^(?:(?:\+55\s?)?(?:\(?0?[1-9]{2}\)?\s?)?(?:9\s?\d{4}-?\d{4}|\d{4}-?\d{4}))$/.test(phone);
  }
};

module.exports = {
  validatePagination,
  validateQuestionCreate,
  validateQuestionUpdate,
  validateQuestionFilter,
  validateSubjectCreate,
  validateSubjectUpdate,
  validateExamCreate,
  validateExamUpdate,
  validateAnswerSubmit,
  validateAnswerReview,
  validateUserRegister,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordChange,
  validateUUID,
  validateExamParams,
  validateFileUpload,
  validateBulkOperation,
  validateSearch,
  handleValidationErrors,
  customValidators
};