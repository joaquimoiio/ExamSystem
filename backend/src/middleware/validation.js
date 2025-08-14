const { body, query, param, validationResult } = require('express-validator');

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errorMessages
    });
  }
  
  next();
};

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Termo de busca deve ter no máximo 100 caracteres')
    .trim(),
  
  handleValidationErrors
];

// UUID parameter validation
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} deve ser um UUID válido`),
  
  handleValidationErrors
];

// Auth validations
const validateUserRegister = [
  body('name')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email deve ter no máximo 255 caracteres'),
  
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
    .trim(),
  
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
  
  handleValidationErrors
];

// Subject validations
const validateSubjectCreate = [
  body('name')
    .notEmpty()
    .withMessage('Nome da disciplina é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  
  body('code')
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 20 })
    .withMessage('Código deve ter entre 2 e 20 caracteres')
    .trim(),
  
  body('description')
    .optional({ checkFalsy: true })
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
    .withMessage('Créditos devem ser um número entre 1 e 20')
    .toInt(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser boolean')
    .toBoolean(),
  
  handleValidationErrors
];

const validateSubjectUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  
  body('code')
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 20 })
    .withMessage('Código deve ter entre 2 e 20 caracteres')
    .trim(),
  
  body('description')
    .optional({ checkFalsy: true })
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
    .withMessage('Créditos devem ser um número entre 1 e 20')
    .toInt(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser boolean')
    .toBoolean(),
  
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
      if (req.body.type === 'multiple_choice' || req.body.type === 'true_false') {
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
  
  handleValidationErrors
];

// Exam validations
const validateExamCreate = [
  body('title')
    .notEmpty()
    .withMessage('Título da prova é obrigatório')
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres')
    .trim(),
  
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
  
  body('totalQuestions')
    .isInt({ min: 1, max: 100 })
    .withMessage('Total de questões deve ser entre 1 e 100'),
  
  body('passingScore')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Nota de aprovação deve ser entre 0 e 10'),
  
  handleValidationErrors
];

const validateExamUpdate = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres')
    .trim(),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Tempo limite deve ser entre 1 e 600 minutos'),
  
  body('totalQuestions')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Total de questões deve ser entre 1 e 100'),
  
  body('passingScore')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Nota de aprovação deve ser entre 0 e 10'),
  
  handleValidationErrors
];

// Answer submission validation
const validateAnswerSubmission = [
  body('studentName')
    .notEmpty()
    .withMessage('Nome do estudante é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  
  body('studentId')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('ID do estudante deve ter entre 1 e 50 caracteres')
    .trim(),
  
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
  
  handleValidationErrors
];

module.exports = {
  // Utility functions
  handleValidationErrors,
  validatePagination,
  validateUUIDParam,
  
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
  validateAnswerSubmission
};