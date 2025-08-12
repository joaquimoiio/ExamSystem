// backend/src/middleware/validation.js
const Joi = require('joi')
const { AppError } = require('../utils/AppError')

/**
 * Generic validation middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ')
      throw new AppError(`Erro de validação: ${errorMessage}`, 400)
    }

    req[property] = value
    next()
  }
}

// User validation schemas
const userRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'string.max': 'Senha deve ter no máximo 50 caracteres',
    'any.required': 'Senha é obrigatória'
  }),
  role: Joi.string().valid('teacher', 'admin').default('teacher')
})

const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  })
})

const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres'
  }),
  email: Joi.string().email().messages({
    'string.email': 'Email deve ser válido'
  })
})

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Senha atual é obrigatória'
  }),
  newPassword: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
    'string.max': 'Nova senha deve ter no máximo 50 caracteres',
    'any.required': 'Nova senha é obrigatória'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirmação de senha deve ser igual à nova senha',
    'any.required': 'Confirmação de senha é obrigatória'
  })
})

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório'
  })
})

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token é obrigatório'
  }),
  newPassword: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
    'string.max': 'Nova senha deve ter no máximo 50 caracteres',
    'any.required': 'Nova senha é obrigatória'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirmação de senha deve ser igual à nova senha',
    'any.required': 'Confirmação de senha é obrigatória'
  })
})

// Subject validation schemas
const subjectCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres'
  }),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6').messages({
    'string.pattern.base': 'Cor deve ser um código hexadecimal válido'
  })
})

const subjectUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres'
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres'
  }),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).messages({
    'string.pattern.base': 'Cor deve ser um código hexadecimal válido'
  })
})

// Question validation schemas
const questionCreateSchema = Joi.object({
  text: Joi.string().min(10).max(5000).required().messages({
    'string.min': 'Texto da questão deve ter pelo menos 10 caracteres',
    'string.max': 'Texto da questão deve ter no máximo 5000 caracteres',
    'any.required': 'Texto da questão é obrigatório'
  }),
  alternatives: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string().min(1).max(500),
        Joi.object({
          text: Joi.string().min(1).max(500).required(),
          explanation: Joi.string().max(1000).allow('')
        })
      )
    )
    .min(2)
    .max(5)
    .required()
    .messages({
      'array.min': 'Deve ter pelo menos 2 alternativas',
      'array.max': 'Deve ter no máximo 5 alternativas',
      'any.required': 'Alternativas são obrigatórias'
    }),
  correctAnswer: Joi.number().integer().min(0).max(4).required().messages({
    'number.base': 'Resposta correta deve ser um número',
    'number.min': 'Resposta correta deve ser pelo menos 0',
    'number.max': 'Resposta correta deve ser no máximo 4',
    'any.required': 'Resposta correta é obrigatória'
  }),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').required().messages({
    'any.only': 'Dificuldade deve ser easy, medium ou hard',
    'any.required': 'Dificuldade é obrigatória'
  }),
  subjectId: Joi.string().uuid().required().messages({
    'string.guid': 'ID da disciplina deve ser um UUID válido',
    'any.required': 'ID da disciplina é obrigatório'
  }),
  tags: Joi.array().items(Joi.string().max(50)).max(10).default([]).messages({
    'array.max': 'Máximo de 10 tags permitidas'
  }),
  explanation: Joi.string().max(2000).allow('').messages({
    'string.max': 'Explicação deve ter no máximo 2000 caracteres'
  }),
  points: Joi.number().min(0.1).max(10).default(1).messages({
    'number.min': 'Pontuação deve ser pelo menos 0.1',
    'number.max': 'Pontuação deve ser no máximo 10'
  }),
  timeEstimate: Joi.number().integer().min(30).max(3600).allow(null).messages({
    'number.min': 'Tempo estimado deve ser pelo menos 30 segundos',
    'number.max': 'Tempo estimado deve ser no máximo 3600 segundos'
  })
})

const questionUpdateSchema = Joi.object({
  text: Joi.string().min(10).max(5000).messages({
    'string.min': 'Texto da questão deve ter pelo menos 10 caracteres',
    'string.max': 'Texto da questão deve ter no máximo 5000 caracteres'
  }),
  alternatives: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string().min(1).max(500),
        Joi.object({
          text: Joi.string().min(1).max(500).required(),
          explanation: Joi.string().max(1000).allow('')
        })
      )
    )
    .min(2)
    .max(5)
    .messages({
      'array.min': 'Deve ter pelo menos 2 alternativas',
      'array.max': 'Deve ter no máximo 5 alternativas'
    }),
  correctAnswer: Joi.number().integer().min(0).max(4).messages({
    'number.base': 'Resposta correta deve ser um número',
    'number.min': 'Resposta correta deve ser pelo menos 0',
    'number.max': 'Resposta correta deve ser no máximo 4'
  }),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').messages({
    'any.only': 'Dificuldade deve ser easy, medium ou hard'
  }),
  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    'array.max': 'Máximo de 10 tags permitidas'
  }),
  explanation: Joi.string().max(2000).allow('').messages({
    'string.max': 'Explicação deve ter no máximo 2000 caracteres'
  }),
  points: Joi.number().min(0.1).max(10).messages({
    'number.min': 'Pontuação deve ser pelo menos 0.1',
    'number.max': 'Pontuação deve ser no máximo 10'
  }),
  timeEstimate: Joi.number().integer().min(30).max(3600).allow(null).messages({
    'number.min': 'Tempo estimado deve ser pelo menos 30 segundos',
    'number.max': 'Tempo estimado deve ser no máximo 3600 segundos'
  }),
  isActive: Joi.boolean(),
  allowUpdateUsed: Joi.boolean().default(false)
})

// Exam validation schemas
const examCreateSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Título deve ter pelo menos 3 caracteres',
    'string.max': 'Título deve ter no máximo 200 caracteres',
    'any.required': 'Título é obrigatório'
  }),
  description: Joi.string().max(2000).allow('').messages({
    'string.max': 'Descrição deve ter no máximo 2000 caracteres'
  }),
  subjectId: Joi.string().uuid().messages({
    'string.guid': 'ID da disciplina deve ser um UUID válido'
  }),
  totalQuestions: Joi.number().integer().min(1).max(100).required().messages({
    'number.min': 'Deve ter pelo menos 1 questão',
    'number.max': 'Deve ter no máximo 100 questões',
    'any.required': 'Número total de questões é obrigatório'
  }),
  easyQuestions: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Número de questões fáceis não pode ser negativo'
  }),
  mediumQuestions: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Número de questões médias não pode ser negativo'
  }),
  hardQuestions: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Número de questões difíceis não pode ser negativo'
  }),
  totalVariations: Joi.number().integer().min(1).max(50).default(1).messages({
    'number.min': 'Deve ter pelo menos 1 variação',
    'number.max': 'Deve ter no máximo 50 variações'
  }),
  timeLimit: Joi.number().integer().min(5).max(480).allow(null).messages({
    'number.min': 'Tempo limite deve ser pelo menos 5 minutos',
    'number.max': 'Tempo limite deve ser no máximo 480 minutos'
  }),
  passingScore: Joi.number().min(0).max(10).default(6).messages({
    'number.min': 'Nota de aprovação deve ser pelo menos 0',
    'number.max': 'Nota de aprovação deve ser no máximo 10'
  }),
  instructions: Joi.string().max(5000).allow('').messages({
    'string.max': 'Instruções devem ter no máximo 5000 caracteres'
  }),
  allowReview: Joi.boolean().default(true),
  showCorrectAnswers: Joi.boolean().default(true),
  randomizeQuestions: Joi.boolean().default(true),
  randomizeAlternatives: Joi.boolean().default(true),
  expiresAt: Joi.date().greater('now').allow(null).messages({
    'date.greater': 'Data de expiração deve ser no futuro'
  }),
  accessCode: Joi.string().max(20).allow('').messages({
    'string.max': 'Código de acesso deve ter no máximo 20 caracteres'
  }),
  maxAttempts: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Deve permitir pelo menos 1 tentativa'
  }),
  showResults: Joi.boolean().default(true),
  requireFullScreen: Joi.boolean().default(false),
  preventCopyPaste: Joi.boolean().default(false),
  shuffleAnswers: Joi.boolean().default(true),
  questionSelection: Joi.object({
    type: Joi.string().valid('automatic', 'manual').default('automatic'),
    subjectIds: Joi.array().items(Joi.string().uuid()),
    distribution: Joi.object({
      easy: Joi.number().integer().min(0),
      medium: Joi.number().integer().min(0),
      hard: Joi.number().integer().min(0)
    })
  }).allow(null)
})

const examUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(200).messages({
    'string.min': 'Título deve ter pelo menos 3 caracteres',
    'string.max': 'Título deve ter no máximo 200 caracteres'
  }),
  description: Joi.string().max(2000).allow('').messages({
    'string.max': 'Descrição deve ter no máximo 2000 caracteres'
  }),
  timeLimit: Joi.number().integer().min(5).max(480).allow(null).messages({
    'number.min': 'Tempo limite deve ser pelo menos 5 minutos',
    'number.max': 'Tempo limite deve ser no máximo 480 minutos'
  }),
  passingScore: Joi.number().min(0).max(10).messages({
    'number.min': 'Nota de aprovação deve ser pelo menos 0',
    'number.max': 'Nota de aprovação deve ser no máximo 10'
  }),
  instructions: Joi.string().max(5000).allow('').messages({
    'string.max': 'Instruções devem ter no máximo 5000 caracteres'
  }),
  allowReview: Joi.boolean(),
  showCorrectAnswers: Joi.boolean(),
  expiresAt: Joi.date().greater('now').allow(null).messages({
    'date.greater': 'Data de expiração deve ser no futuro'
  }),
  accessCode: Joi.string().max(20).allow('').messages({
    'string.max': 'Código de acesso deve ter no máximo 20 caracteres'
  }),
  maxAttempts: Joi.number().integer().min(1).messages({
    'number.min': 'Deve permitir pelo menos 1 tentativa'
  }),
  showResults: Joi.boolean(),
  requireFullScreen: Joi.boolean(),
  preventCopyPaste: Joi.boolean(),
  allowPublishedUpdate: Joi.boolean().default(false)
})

// Pagination validation schema
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Página deve ser pelo menos 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.min': 'Limite deve ser pelo menos 1',
    'number.max': 'Limite deve ser no máximo 100'
  }),
  search: Joi.string().max(255).allow('').messages({
    'string.max': 'Busca deve ter no máximo 255 caracteres'
  }),
  sortBy: Joi.string().max(50).messages({
    'string.max': 'Campo de ordenação inválido'
  }),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
})

// Answer submission schema
const answerSubmissionSchema = Joi.object({
  studentName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome do aluno deve ter pelo menos 2 caracteres',
    'string.max': 'Nome do aluno deve ter no máximo 100 caracteres',
    'any.required': 'Nome do aluno é obrigatório'
  }),
  studentEmail: Joi.string().email().allow('').messages({
    'string.email': 'Email deve ser válido'
  }),
  answers: Joi.array().items(
    Joi.number().integer().min(0).max(4).allow(null)
  ).required().messages({
    'any.required': 'Respostas são obrigatórias'
  }),
  timeSpent: Joi.number().integer().min(0).messages({
    'number.min': 'Tempo gasto não pode ser negativo'
  }),
  submittedAt: Joi.date().default(() => new Date())
})

// Validation middleware functions
const validateUserRegister = validate(userRegisterSchema)
const validateUserLogin = validate(userLoginSchema)
const validateUserUpdate = validate(userUpdateSchema)
const validateChangePassword = validate(changePasswordSchema)
const validateForgotPassword = validate(forgotPasswordSchema)
const validateResetPassword = validate(resetPasswordSchema)

const validateSubjectCreate = validate(subjectCreateSchema)
const validateSubjectUpdate = validate(subjectUpdateSchema)

const validateQuestionCreate = validate(questionCreateSchema)
const validateQuestionUpdate = validate(questionUpdateSchema)

const validateExamCreate = validate(examCreateSchema)
const validateExamUpdate = validate(examUpdateSchema)

const validatePagination = validate(paginationSchema, 'query')
const validateAnswerSubmission = validate(answerSubmissionSchema)

module.exports = {
  validate,
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
  validatePagination,
  validateAnswerSubmission
}