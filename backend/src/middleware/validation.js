const Joi = require('joi');

// Generic validation middleware
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};

// Validation for pagination parameters
const validatePagination = validate(
  Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'name', 'title', 'score').default('createdAt'),
    order: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),
  'query'
);

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(255).required(),
    role: Joi.string().valid('admin', 'teacher').default('teacher')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(255).required(),
    confirmPassword: Joi.string().required().valid(Joi.ref('newPassword'))
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).max(255).required(),
    confirmPassword: Joi.string().required().valid(Joi.ref('password'))
  })
};

// Subject validation schemas
const subjectSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).allow(''),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#3B82F6')
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(1000).allow(''),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    isActive: Joi.boolean()
  })
};

// Question validation schemas
const questionSchemas = {
  create: Joi.object({
    text: Joi.string().min(10).max(5000).required(),
    alternatives: Joi.array().items(
      Joi.object({
        letter: Joi.string().valid('A', 'B', 'C', 'D', 'E').required(),
        text: Joi.string().min(1).max(500).required()
      })
    ).min(2).max(5).required(),
    correctAnswer: Joi.string().valid('A', 'B', 'C', 'D', 'E').required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
    subjectId: Joi.string().uuid().required()
  }),

  update: Joi.object({
    text: Joi.string().min(10).max(5000),
    alternatives: Joi.array().items(
      Joi.object({
        letter: Joi.string().valid('A', 'B', 'C', 'D', 'E').required(),
        text: Joi.string().min(1).max(500).required()
      })
    ).min(2).max(5),
    correctAnswer: Joi.string().valid('A', 'B', 'C', 'D', 'E'),
    difficulty: Joi.string().valid('easy', 'medium', 'hard'),
    tags: Joi.array().items(Joi.string().max(50)).max(10),
    isActive: Joi.boolean()
  }),

  filter: Joi.object({
    subjectId: Joi.string().uuid(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard'),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    search: Joi.string().max(255)
  })
};

// Exam validation schemas
const examSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).allow(''),
    subjectId: Joi.string().uuid().required(),
    totalQuestions: Joi.number().integer().min(1).max(100).required(),
    easyQuestions: Joi.number().integer().min(0).default(0),
    mediumQuestions: Joi.number().integer().min(0).default(0),
    hardQuestions: Joi.number().integer().min(0).default(0),
    totalVariations: Joi.number().integer().min(1).max(50).default(1),
    timeLimit: Joi.number().integer().min(1).max(480),
    passingScore: Joi.number().min(0).max(100).default(60),
    instructions: Joi.string().max(2000).allow(''),
    allowReview: Joi.boolean().default(true),
    showCorrectAnswers: Joi.boolean().default(false),
    randomizeQuestions: Joi.boolean().default(true),
    randomizeAlternatives: Joi.boolean().default(true),
    expiresAt: Joi.date().greater('now')
  }).custom((value, helpers) => {
    // Validate that sum of difficulty questions equals total questions
    const sum = value.easyQuestions + value.mediumQuestions + value.hardQuestions;
    if (sum !== value.totalQuestions) {
      return helpers.error('any.custom', {
        message: 'Sum of easy, medium, and hard questions must equal total questions'
      });
    }
    return value;
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(1000).allow(''),
    timeLimit: Joi.number().integer().min(1).max(480),
    passingScore: Joi.number().min(0).max(100),
    instructions: Joi.string().max(2000).allow(''),
    allowReview: Joi.boolean(),
    showCorrectAnswers: Joi.boolean(),
    expiresAt: Joi.date().greater('now'),
    isActive: Joi.boolean()
  })
};

// Answer validation schemas
const answerSchemas = {
  submit: Joi.object({
    studentName: Joi.string().min(2).max(100).required(),
    studentId: Joi.string().max(50).allow(''),
    studentEmail: Joi.string().email().allow(''),
    answers: Joi.array().items(
      Joi.string().valid('A', 'B', 'C', 'D', 'E', null)
    ).required(),
    timeSpent: Joi.number().integer().min(0),
    startedAt: Joi.date()
  }),

  review: Joi.object({
    feedback: Joi.string().max(1000).allow('')
  })
};

// Export validation middlewares
module.exports = {
  validate,
  validatePagination,
  
  // User validations
  validateUserRegister: validate(userSchemas.register),
  validateUserLogin: validate(userSchemas.login),
  validateUserUpdate: validate(userSchemas.updateProfile),
  validateChangePassword: validate(userSchemas.changePassword),
  validateForgotPassword: validate(userSchemas.forgotPassword),
  validateResetPassword: validate(userSchemas.resetPassword),
  
  // Subject validations
  validateSubjectCreate: validate(subjectSchemas.create),
  validateSubjectUpdate: validate(subjectSchemas.update),
  
  // Question validations
  validateQuestionCreate: validate(questionSchemas.create),
  validateQuestionUpdate: validate(questionSchemas.update),
  validateQuestionFilter: validate(questionSchemas.filter, 'query'),
  
  // Exam validations
  validateExamCreate: validate(examSchemas.create),
  validateExamUpdate: validate(examSchemas.update),
  
  // Answer validations
  validateAnswerSubmit: validate(answerSchemas.submit),
  validateAnswerReview: validate(answerSchemas.review)
};