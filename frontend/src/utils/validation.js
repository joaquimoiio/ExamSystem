import { VALIDATION_RULES } from './constants'

// Basic validation functions
export const required = (value, message = 'Campo obrigatório') => {
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return message
  }
  return null
}

export const minLength = (min, message) => (value) => {
  if (!value) return null
  if (value.length < min) {
    return message || `Deve ter pelo menos ${min} caracteres`
  }
  return null
}

export const maxLength = (max, message) => (value) => {
  if (!value) return null
  if (value.length > max) {
    return message || `Deve ter no máximo ${max} caracteres`
  }
  return null
}

export const email = (value, message = 'Email inválido') => {
  if (!value) return null
  if (!VALIDATION_RULES.EMAIL.test(value)) {
    return message
  }
  return null
}

export const password = (value, message) => {
  if (!value) return null
  
  const { MIN_LENGTH, PATTERN } = VALIDATION_RULES.PASSWORD
  
  if (value.length < MIN_LENGTH) {
    return message || `Senha deve ter pelo menos ${MIN_LENGTH} caracteres`
  }
  
  if (!PATTERN.test(value)) {
    return message || 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
  }
  
  return null
}

export const confirmPassword = (originalPassword, message = 'Senhas não coincidem') => (value) => {
  if (!value) return null
  if (value !== originalPassword) {
    return message
  }
  return null
}

export const minValue = (min, message) => (value) => {
  if (value === null || value === undefined || value === '') return null
  const numValue = Number(value)
  if (isNaN(numValue) || numValue < min) {
    return message || `Valor deve ser maior ou igual a ${min}`
  }
  return null
}

export const maxValue = (max, message) => (value) => {
  if (value === null || value === undefined || value === '') return null
  const numValue = Number(value)
  if (isNaN(numValue) || numValue > max) {
    return message || `Valor deve ser menor ou igual a ${max}`
  }
  return null
}

export const pattern = (regex, message = 'Formato inválido') => (value) => {
  if (!value) return null
  if (!regex.test(value)) {
    return message
  }
  return null
}

export const url = (value, message = 'URL inválida') => {
  if (!value) return null
  try {
    new URL(value)
    return null
  } catch {
    return message
  }
}

export const phone = (value, message = 'Telefone inválido') => {
  if (!value) return null
  const phoneRegex = /^(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[1-9]\d{3}[-\s]?\d{4}$/
  if (!phoneRegex.test(value.replace(/\D/g, ''))) {
    return message
  }
  return null
}

export const cpf = (value, message = 'CPF inválido') => {
  if (!value) return null
  
  const cpfNumbers = value.replace(/\D/g, '')
  
  if (cpfNumbers.length !== 11) {
    return message
  }
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cpfNumbers)) {
    return message
  }
  
  // Validate CPF algorithm
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpfNumbers.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpfNumbers.charAt(9))) return message
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpfNumbers.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpfNumbers.charAt(10))) return message
  
  return null
}

export const cnpj = (value, message = 'CNPJ inválido') => {
  if (!value) return null
  
  const cnpjNumbers = value.replace(/\D/g, '')
  
  if (cnpjNumbers.length !== 14) {
    return message
  }
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cnpjNumbers)) {
    return message
  }
  
  // Validate CNPJ algorithm
  let sum = 0
  let pos = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpjNumbers.charAt(i)) * pos--
    if (pos < 2) pos = 9
  }
  let remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (remainder !== parseInt(cnpjNumbers.charAt(12))) return message
  
  sum = 0
  pos = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpjNumbers.charAt(i)) * pos--
    if (pos < 2) pos = 9
  }
  remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (remainder !== parseInt(cnpjNumbers.charAt(13))) return message
  
  return null
}

export const date = (value, message = 'Data inválida') => {
  if (!value) return null
  const dateObj = new Date(value)
  if (isNaN(dateObj.getTime())) {
    return message
  }
  return null
}

export const futureDate = (value, message = 'Data deve ser futura') => {
  if (!value) return null
  const dateObj = new Date(value)
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }
  if (dateObj <= new Date()) {
    return message
  }
  return null
}

export const pastDate = (value, message = 'Data deve ser passada') => (value) => {
  if (!value) return null
  const dateObj = new Date(value)
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }
  if (dateObj >= new Date()) {
    return message
  }
  return null
}

export const fileSize = (maxSizeInMB, message) => (file) => {
  if (!file) return null
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    return message || `Arquivo deve ter no máximo ${maxSizeInMB}MB`
  }
  return null
}

export const fileType = (allowedTypes, message) => (file) => {
  if (!file) return null
  if (!allowedTypes.includes(file.type)) {
    return message || `Tipo de arquivo não permitido`
  }
  return null
}

// Composite validators for specific entities
export const validateSubject = (data) => {
  const errors = {}
  
  // Name validation
  const nameError = required(data.name) || 
                   minLength(VALIDATION_RULES.SUBJECT.NAME_MIN_LENGTH)(data.name) ||
                   maxLength(VALIDATION_RULES.SUBJECT.NAME_MAX_LENGTH)(data.name)
  if (nameError) errors.name = nameError
  
  // Code validation (optional)
  if (data.code) {
    const codeError = maxLength(VALIDATION_RULES.SUBJECT.CODE_MAX_LENGTH)(data.code)
    if (codeError) errors.code = codeError
  }
  
  // Description validation (optional)
  if (data.description) {
    const descError = maxLength(VALIDATION_RULES.SUBJECT.DESCRIPTION_MAX_LENGTH)(data.description)
    if (descError) errors.description = descError
  }
  
  // Color validation
  const colorError = required(data.color, 'Cor é obrigatória')
  if (colorError) errors.color = colorError
  
  // Credits validation
  const creditsError = required(data.credits, 'Créditos são obrigatórios') ||
                      minValue(1)(data.credits) ||
                      maxValue(10)(data.credits)
  if (creditsError) errors.credits = creditsError
  
  return errors
}

export const validateQuestion = (data) => {
  const errors = {}
  
  // Statement validation
  const statementError = required(data.statement, 'Enunciado é obrigatório') ||
                         minLength(VALIDATION_RULES.QUESTION.STATEMENT_MIN_LENGTH)(data.statement) ||
                         maxLength(VALIDATION_RULES.QUESTION.STATEMENT_MAX_LENGTH)(data.statement)
  if (statementError) errors.statement = statementError
  
  // Difficulty validation
  const difficultyError = required(data.difficulty, 'Dificuldade é obrigatória')
  if (difficultyError) errors.difficulty = difficultyError
  
  // Points validation
  const pointsError = required(data.points, 'Pontuação é obrigatória') ||
                     minValue(0.5)(data.points) ||
                     maxValue(10)(data.points)
  if (pointsError) errors.points = pointsError
  
  // Alternatives validation
  if (!data.alternatives || data.alternatives.length < VALIDATION_RULES.QUESTION.MIN_ALTERNATIVES) {
    errors.alternatives = `Deve ter pelo menos ${VALIDATION_RULES.QUESTION.MIN_ALTERNATIVES} alternativas`
  } else if (data.alternatives.length > VALIDATION_RULES.QUESTION.MAX_ALTERNATIVES) {
    errors.alternatives = `Deve ter no máximo ${VALIDATION_RULES.QUESTION.MAX_ALTERNATIVES} alternativas`
  } else {
    // Validate each alternative
    const alternativeErrors = []
    let hasCorrectAlternative = false
    
    data.alternatives.forEach((alt, index) => {
      const altErrors = {}
      
      const textError = required(alt.text, 'Texto da alternativa é obrigatório') ||
                       minLength(VALIDATION_RULES.QUESTION.ALTERNATIVE_MIN_LENGTH)(alt.text) ||
                       maxLength(VALIDATION_RULES.QUESTION.ALTERNATIVE_MAX_LENGTH)(alt.text)
      if (textError) altErrors.text = textError
      
      if (alt.isCorrect) hasCorrectAlternative = true
      
      alternativeErrors[index] = altErrors
    })
    
    if (!hasCorrectAlternative) {
      errors.correctAnswer = 'Selecione pelo menos uma alternativa correta'
    }
    
    if (alternativeErrors.some(err => Object.keys(err).length > 0)) {
      errors.alternatives = alternativeErrors
    }
  }
  
  // Explanation validation (optional)
  if (data.explanation) {
    const explanationError = maxLength(VALIDATION_RULES.QUESTION.EXPLANATION_MAX_LENGTH)(data.explanation)
    if (explanationError) errors.explanation = explanationError
  }
  
  return errors
}

export const validateExam = (data) => {
  const errors = {}
  
  // Title validation
  const titleError = required(data.title, 'Título é obrigatório') ||
                    maxLength(VALIDATION_RULES.EXAM.TITLE_MAX_LENGTH)(data.title)
  if (titleError) errors.title = titleError
  
  // Description validation (optional)
  if (data.description) {
    const descError = maxLength(VALIDATION_RULES.EXAM.DESCRIPTION_MAX_LENGTH)(data.description)
    if (descError) errors.description = descError
  }
  
  // Subject validation
  const subjectError = required(data.subjectId, 'Disciplina é obrigatória')
  if (subjectError) errors.subjectId = subjectError
  
  // Questions validation
  const questionsError = required(data.questions, 'Selecione pelo menos uma questão')
  if (questionsError) {
    errors.questions = questionsError
  } else if (data.questions.length < VALIDATION_RULES.EXAM.MIN_QUESTIONS) {
    errors.questions = `Deve ter pelo menos ${VALIDATION_RULES.EXAM.MIN_QUESTIONS} questão`
  } else if (data.questions.length > VALIDATION_RULES.EXAM.MAX_QUESTIONS) {
    errors.questions = `Deve ter no máximo ${VALIDATION_RULES.EXAM.MAX_QUESTIONS} questões`
  }
  
  // Time limit validation (optional)
  if (data.timeLimit) {
    const timeLimitError = minValue(VALIDATION_RULES.EXAM.MIN_TIME_LIMIT)(data.timeLimit) ||
                          maxValue(VALIDATION_RULES.EXAM.MAX_TIME_LIMIT)(data.timeLimit)
    if (timeLimitError) errors.timeLimit = timeLimitError
  }
  
  // Start date validation (optional)
  if (data.startDate) {
    const startDateError = date(data.startDate)
    if (startDateError) errors.startDate = startDateError
  }
  
  // End date validation (optional)
  if (data.endDate) {
    const endDateError = date(data.endDate)
    if (endDateError) {
      errors.endDate = endDateError
    } else if (data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
      errors.endDate = 'Data de fim deve ser posterior à data de início'
    }
  }
  
  return errors
}

export const validateUser = (data, isEditing = false) => {
  const errors = {}
  
  // Name validation
  const nameError = required(data.name, 'Nome é obrigatório') ||
                   minLength(VALIDATION_RULES.NAME.MIN_LENGTH)(data.name) ||
                   maxLength(VALIDATION_RULES.NAME.MAX_LENGTH)(data.name)
  if (nameError) errors.name = nameError
  
  // Email validation
  const emailError = required(data.email, 'Email é obrigatório') ||
                    email(data.email)
  if (emailError) errors.email = emailError
  
  // Password validation (required for new users)
  if (!isEditing || data.password) {
    const passwordError = required(data.password, 'Senha é obrigatória') ||
                         password(data.password)
    if (passwordError) errors.password = passwordError
    
    // Confirm password validation
    if (data.confirmPassword !== undefined) {
      const confirmError = required(data.confirmPassword, 'Confirmação de senha é obrigatória') ||
                          confirmPassword(data.password)(data.confirmPassword)
      if (confirmError) errors.confirmPassword = confirmError
    }
  }
  
  // Role validation
  const roleError = required(data.role, 'Tipo de usuário é obrigatório')
  if (roleError) errors.role = roleError
  
  return errors
}

// Utility function to combine multiple validators
export const combine = (...validators) => (value) => {
  for (const validator of validators) {
    const error = validator(value)
    if (error) return error
  }
  return null
}

// Utility function to validate an entire form
export const validateForm = (data, schema) => {
  const errors = {}
  
  Object.entries(schema).forEach(([field, validators]) => {
    const value = data[field]
    const fieldValidators = Array.isArray(validators) ? validators : [validators]
    
    for (const validator of fieldValidators) {
      const error = typeof validator === 'function' ? validator(value) : validator
      if (error) {
        errors[field] = error
        break
      }
    }
  })
  
  return errors
}

// Utility function to check if form has errors
export const hasErrors = (errors) => {
  return Object.keys(errors).some(key => {
    const error = errors[key]
    if (Array.isArray(error)) {
      return error.some(item => item && Object.keys(item).length > 0)
    }
    return error !== null && error !== undefined && error !== ''
  })
}

// Utility function to get first error message
export const getFirstError = (errors) => {
  for (const key in errors) {
    const error = errors[key]
    if (error) {
      if (Array.isArray(error)) {
        for (const item of error) {
          if (item && Object.keys(item).length > 0) {
            return Object.values(item)[0]
          }
        }
      } else {
        return error
      }
    }
  }
  return null
}

// Real-time validation hook-compatible functions
export const createValidator = (validationFn) => {
  return (value, allValues = {}) => {
    try {
      return validationFn(value, allValues)
    } catch (error) {
      console.error('Validation error:', error)
      return 'Erro de validação'
    }
  }
}

// Async validation for server-side checks
export const createAsyncValidator = (asyncFn, debounceMs = 300) => {
  let timeoutId
  
  return (value) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        try {
          const result = await asyncFn(value)
          resolve(result)
        } catch (error) {
          resolve('Erro na validação')
        }
      }, debounceMs)
    })
  }
}

// Custom validation schemas for react-hook-form
export const createSchema = (validators) => {
  return Object.entries(validators).reduce((schema, [field, validator]) => {
    schema[field] = {
      validate: createValidator(validator)
    }
    return schema
  }, {})
}

// Field-level validation rules for forms
export const fieldValidation = {
  // User fields
  userName: combine(
    required,
    minLength(VALIDATION_RULES.NAME.MIN_LENGTH),
    maxLength(VALIDATION_RULES.NAME.MAX_LENGTH)
  ),
  
  userEmail: combine(
    required,
    email
  ),
  
  userPassword: combine(
    required,
    password
  ),
  
  // Subject fields
  subjectName: combine(
    required,
    minLength(2),
    maxLength(VALIDATION_RULES.SUBJECT.NAME_MAX_LENGTH)
  ),
  
  subjectCode: maxLength(VALIDATION_RULES.SUBJECT.CODE_MAX_LENGTH),
  
  subjectDescription: maxLength(VALIDATION_RULES.SUBJECT.DESCRIPTION_MAX_LENGTH),
  
  // Question fields
  questionStatement: combine(
    required,
    minLength(VALIDATION_RULES.QUESTION.STATEMENT_MIN_LENGTH),
    maxLength(VALIDATION_RULES.QUESTION.STATEMENT_MAX_LENGTH)
  ),
  
  questionAlternative: combine(
    required,
    minLength(VALIDATION_RULES.QUESTION.ALTERNATIVE_MIN_LENGTH),
    maxLength(VALIDATION_RULES.QUESTION.ALTERNATIVE_MAX_LENGTH)
  ),
  
  questionExplanation: maxLength(VALIDATION_RULES.QUESTION.EXPLANATION_MAX_LENGTH),
  
  // Exam fields
  examTitle: combine(
    required,
    maxLength(VALIDATION_RULES.EXAM.TITLE_MAX_LENGTH)
  ),
  
  examDescription: maxLength(VALIDATION_RULES.EXAM.DESCRIPTION_MAX_LENGTH),
  
  examTimeLimit: combine(
    minValue(VALIDATION_RULES.EXAM.MIN_TIME_LIMIT),
    maxValue(VALIDATION_RULES.EXAM.MAX_TIME_LIMIT)
  )
}

// Export all validation functions
export default {
  // Basic validators
  required,
  minLength,
  maxLength,
  email,
  password,
  confirmPassword,
  minValue,
  maxValue,
  pattern,
  url,
  phone,
  cpf,
  cnpj,
  date,
  futureDate,
  pastDate,
  fileSize,
  fileType,
  
  // Entity validators
  validateSubject,
  validateQuestion,
  validateExam,
  validateUser,
  
  // Utility functions
  combine,
  validateForm,
  hasErrors,
  getFirstError,
  createValidator,
  createAsyncValidator,
  createSchema,
  
  // Field validation rules
  fieldValidation
}