// backend/src/middleware/validation.js

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

// Auth validations
const validateUserRegister = [
  body('name')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim()
    .escape(),
  
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email deve ter no máximo 100 caracteres'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirmação de senha é obrigatória')
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
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim()
    .escape(),
  
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
    .withMessage('Bio deve ter no máximo 500 caracteres')
    .trim(),
  
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

// Subject validations
const validateSubjectCreate = [
  body('name')
    .notEmpty()
    .withMessage('Nome da disciplina é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim()
    .escape(),
  
  body('code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Código deve ter entre 2 e 20 caracteres')
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres')
    .trim(),
  
  body('color')
    .notEmpty()
    .withMessage('Cor é obrigatória')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
  
  body('credits')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Créditos devem ser um número entre 1 e 20'),
  
  handleValidationErrors
];

const validateSubjectUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim()
    .escape(),
  
  body('code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Código deve ter entre 2 e 20 caracteres')
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres')
    .trim(),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
  
  body('credits')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Créditos devem ser um número entre 1 e 20'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser boolean'),
  
  handleValidationErrors
];

// Question validations
const validateQuestionCreate = [
  body('statement')
    .notEmpty()
    .withMessage('Enunciado da questão é obrigatório')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Enunciado deve ter entre 10 e 2000 caracteres')
    .trim(),
  
  body('type')
    .isIn(['multiple_choice', 'true_false', 'essay'])
    .withMessage('Tipo deve ser multiple_choice, true_false ou essay'),
  
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser easy, medium ou hard'),
  
  body('points')
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Pontos devem ser um número entre 0.1 e 100'),
  
  body('alternatives')
    .custom((value, { req }) => {
      if (req.body.type === 'multiple_choice' || req.body.type === 'true_false') {
        if (!Array.isArray(value) || value.length < 2) {
          throw new Error('Questões de múltipla escolha devem ter pelo menos 2 alternativas');
        }
        if (value.length > 6) {
          throw new Error('Questões não podem ter mais de 6 alternativas');
        }
        
        // Verificar se há pelo menos uma alternativa correta
        const correctAnswers = value.filter(alt => alt.isCorrect);
        if (correctAnswers.length === 0) {
          throw new Error('Deve haver pelo menos uma alternativa correta');
        }
        
        // Verificar se todas as alternativas têm texto
        value.forEach((alt, index) => {
          if (!alt.text || alt.text.trim().length < 1) {
            throw new Error(`Alternativa ${index + 1} deve ter texto`);
          }
          if (alt.text.length > 500) {
            throw new Error(`Alternativa ${index + 1} deve ter no máximo 500 caracteres`);
          }
        });
      }
      return true;
    }),
  
  body('explanation')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Explicação deve ter no máximo 1000 caracteres')
    .trim(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array'),
  
  body('subjectId')
    .isUUID()
    .withMessage('ID da disciplina deve ser um UUID válido'),
  
  handleValidationErrors
];

const validateQuestionUpdate = [
  body('statement')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Enunciado deve ter entre 10 e 2000 caracteres')
    .trim(),
  
  body('type')
    .optional()
    .isIn(['multiple_choice', 'true_false', 'essay'])
    .withMessage('Tipo deve ser multiple_choice, true_false ou essay'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser easy, medium ou hard'),
  
  body('points')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Pontos devem ser um número entre 0.1 e 100'),
  
  body('alternatives')
    .optional()
    .custom((value, { req }) => {
      if (value && (req.body.type === 'multiple_choice' || req.body.type === 'true_false')) {
        if (!Array.isArray(value) || value.length < 2) {
          throw new Error('Questões de múltipla escolha devem ter pelo menos 2 alternativas');
        }
        if (value.length > 6) {
          throw new Error('Questões não podem ter mais de 6 alternativas');
        }
        
        const correctAnswers = value.filter(alt => alt.isCorrect);
        if (correctAnswers.length === 0) {
          throw new Error('Deve haver pelo menos uma alternativa correta');
        }
        
        value.forEach((alt, index) => {
          if (!alt.text || alt.text.trim().length < 1) {
            throw new Error(`Alternativa ${index + 1} deve ter texto`);
          }
          if (alt.text.length > 500) {
            throw new Error(`Alternativa ${index + 1} deve ter no máximo 500 caracteres`);
          }
        });
      }
      return true;
    }),
  
  body('explanation')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Explicação deve ter no máximo 1000 caracteres')
    .trim(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser boolean'),
  
  handleValidationErrors
];

// Exam validations
const validateExamCreate = [
  body('title')
    .notEmpty()
    .withMessage('Título da prova é obrigatório')
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres')
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres')
    .trim(),
  
  body('subjectId')
    .isUUID()
    .withMessage('ID da disciplina deve ser um UUID válido'),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Tempo limite deve ser entre 1 e 600 minutos'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data de início deve ser uma data válida'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim deve ser uma data válida')
    .custom((value, { req }) => {
      if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Data de fim deve ser posterior à data de início');
      }
      return true;
    }),
  
  body('variations')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Número de variações deve ser entre 1 e 10'),
  
  body('questionsPerVariation')
    .isInt({ min: 1, max: 100 })
    .withMessage('Questões por variação deve ser entre 1 e 100'),
  
  body('questionCriteria')
    .optional()
    .isObject()
    .withMessage('Critérios de questão devem ser um objeto'),
  
  body('instructions')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Instruções devem ter no máximo 5000 caracteres'),
  
  body('maxAttempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Máximo de tentativas deve ser um número positivo'),
  
  body('shuffleQuestions')
    .optional()
    .isBoolean()
    .withMessage('Embaralhar questões deve ser boolean'),
  
  body('shuffleAlternatives')
    .optional()
    .isBoolean()
    .withMessage('Embaralhar alternativas deve ser boolean'),
  
  body('showResults')
    .optional()
    .isBoolean()
    .withMessage('Mostrar resultados deve ser boolean'),
  
  handleValidationErrors
];

const validateExamUpdate = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres')
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres')
    .trim(),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Tempo limite deve ser entre 1 e 600 minutos'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data de início deve ser uma data válida'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim deve ser uma data válida')
    .custom((value, { req }) => {
      if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Data de fim deve ser posterior à data de início');
      }
      return true;
    }),
  
  body('instructions')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Instruções devem ter no máximo 5000 caracteres'),
  
  body('maxAttempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Máximo de tentativas deve ser um número positivo'),
  
  body('shuffleQuestions')
    .optional()
    .isBoolean()
    .withMessage('Embaralhar questões deve ser boolean'),
  
  body('shuffleAlternatives')
    .optional()
    .isBoolean()
    .withMessage('Embaralhar alternativas deve ser boolean'),
  
  body('showResults')
    .optional()
    .isBoolean()
    .withMessage('Mostrar resultados deve ser boolean'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser boolean'),
  
  handleValidationErrors
];

// Answer submission validation
const validateAnswerSubmission = [
  body('studentName')
    .notEmpty()
    .withMessage('Nome do estudante é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim()
    .escape(),
  
  body('studentId')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('ID do estudante deve ter entre 1 e 50 caracteres')
    .trim()
    .escape(),
  
  body('studentEmail')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Respostas devem ser um array não vazio'),
  
  body('answers.*.questionId')
    .isUUID()
    .withMessage('ID da questão deve ser um UUID válido'),
  
  body('answers.*.selectedAlternatives')
    .optional()
    .isArray()
    .withMessage('Alternativas selecionadas devem ser um array'),
  
  body('answers.*.textAnswer')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Resposta textual deve ter no máximo 10000 caracteres'),
  
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

// File upload validations
const validateImageUpload = [
  body()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP');
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
        }
      }
      return true;
    }),
  handleValidationErrors
];

const validateDocumentUpload = [
  body()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new Error('Tipo de arquivo não permitido');
        }
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
          throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
        }
      }
      return true;
    }),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Termo de busca deve ter entre 1 e 100 caracteres')
    .trim()
    .escape(),
  
  query('category')
    .optional()
    .isIn(['subjects', 'questions', 'exams', 'users'])
    .withMessage('Categoria deve ser subjects, questions, exams ou users'),
  
  handleValidationErrors
];

module.exports = {
  // Pagination
  validatePagination,
  
  // Auth validations
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  
  // Subject validations
  validateSubjectCreate,
  validateSubjectUpdate,
  
  // Question validations
  validateQuestionCreate,
  validateQuestionUpdate,
  
  // Exam validations
  validateExamCreate,
  validateExamUpdate,
  
  // Answer validations
  validateAnswerSubmission,
  
  // File upload validations
  validateImageUpload,
  validateDocumentUpload,
  
  // Search validation
  validateSearch,
  
  // Utility validations
  validateUUIDParam,
  handleValidationErrors
};