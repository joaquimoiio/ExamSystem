// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email?.toLowerCase());
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Senha é obrigatória');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: getPasswordStrength(password)
  };
};

// Password strength calculation
const getPasswordStrength = (password) => {
  let score = 0;
  
  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character type bonuses
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // Complexity bonuses
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;
  if (/(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*\d)/.test(password)) score += 1;
  
  if (score <= 3) return 'weak';
  if (score <= 6) return 'medium';
  return 'strong';
};

// Name validation
export const validateName = (name, minLength = 2, maxLength = 50) => {
  const errors = [];
  
  if (!name || !name.trim()) {
    errors.push('Nome é obrigatório');
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < minLength) {
    errors.push(`Nome deve ter pelo menos ${minLength} caracteres`);
  }
  
  if (trimmedName.length > maxLength) {
    errors.push(`Nome deve ter no máximo ${maxLength} caracteres`);
  }
  
  // Only letters, spaces, apostrophes, and hyphens
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmedName)) {
    errors.push('Nome deve conter apenas letras, espaços, apostrofes e hífens');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: trimmedName
  };
};

// Phone validation (Brazilian format)
export const validatePhone = (phone) => {
  const errors = [];
  
  if (!phone) {
    errors.push('Telefone é obrigatório');
    return { isValid: false, errors };
  }
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Brazilian phone: 10 or 11 digits (with area code)
  if (cleaned.length < 10 || cleaned.length > 11) {
    errors.push('Telefone deve ter 10 ou 11 dígitos');
  }
  
  // Area code validation (11-99)
  if (cleaned.length >= 2) {
    const areaCode = parseInt(cleaned.substr(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      errors.push('Código de área inválido');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: cleaned,
    formatted: formatPhone(cleaned)
  };
};

// Format phone number
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

// CPF validation
export const validateCPF = (cpf) => {
  const errors = [];
  
  if (!cpf) {
    errors.push('CPF é obrigatório');
    return { isValid: false, errors };
  }
  
  // Remove all non-numeric characters
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) {
    errors.push('CPF deve ter 11 dígitos');
    return { isValid: false, errors };
  }
  
  // Check for repeated digits
  if (/^(\d)\1+$/.test(cleaned)) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }
  
  // Validate CPF algorithm
  let sum = 0;
  let remainder;
  
  // First verification digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }
  
  // Second verification digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: cleaned,
    formatted: formatCPF(cleaned)
  };
};

// Format CPF
const formatCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Date validation
export const validateDate = (date, options = {}) => {
  const { 
    required = false, 
    minDate = null, 
    maxDate = null,
    format = 'YYYY-MM-DD'
  } = options;
  
  const errors = [];
  
  if (!date) {
    if (required) {
      errors.push('Data é obrigatória');
    }
    return { isValid: !required, errors };
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    errors.push('Data inválida');
    return { isValid: false, errors };
  }
  
  if (minDate) {
    const minDateObj = new Date(minDate);
    if (dateObj < minDateObj) {
      errors.push(`Data deve ser posterior a ${formatDate(minDateObj)}`);
    }
  }
  
  if (maxDate) {
    const maxDateObj = new Date(maxDate);
    if (dateObj > maxDateObj) {
      errors.push(`Data deve ser anterior a ${formatDate(maxDateObj)}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: dateObj,
    formatted: formatDate(dateObj, format)
  };
};

// Format date
const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return d.toLocaleDateString('pt-BR');
  }
};

// Numeric validation
export const validateNumber = (value, options = {}) => {
  const {
    required = false,
    min = null,
    max = null,
    integer = false,
    positive = false
  } = options;
  
  const errors = [];
  
  if (value === null || value === undefined || value === '') {
    if (required) {
      errors.push('Valor é obrigatório');
    }
    return { isValid: !required, errors };
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    errors.push('Deve ser um número válido');
    return { isValid: false, errors };
  }
  
  if (integer && !Number.isInteger(num)) {
    errors.push('Deve ser um número inteiro');
  }
  
  if (positive && num <= 0) {
    errors.push('Deve ser um número positivo');
  }
  
  if (min !== null && num < min) {
    errors.push(`Valor mínimo é ${min}`);
  }
  
  if (max !== null && num > max) {
    errors.push(`Valor máximo é ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: num
  };
};

// URL validation
export const validateURL = (url, required = false) => {
  const errors = [];
  
  if (!url) {
    if (required) {
      errors.push('URL é obrigatória');
    }
    return { isValid: !required, errors };
  }
  
  try {
    new URL(url);
  } catch {
    errors.push('URL inválida');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: url
  };
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    allowedExtensions = []
  } = options;
  
  const errors = [];
  
  if (!file) {
    if (required) {
      errors.push('Arquivo é obrigatório');
    }
    return { isValid: !required, errors };
  }
  
  // Size validation
  if (file.size > maxSize) {
    errors.push(`Arquivo deve ter no máximo ${formatFileSize(maxSize)}`);
  }
  
  // Type validation
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`);
  }
  
  // Extension validation
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      errors.push(`Extensão não permitida. Extensões aceitas: ${allowedExtensions.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    file,
    size: file.size,
    type: file.type,
    name: file.name
  };
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Form validation
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    
    // Required validation
    if (fieldRules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = 'Este campo é obrigatório';
      isValid = false;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !fieldRules.required) {
      return;
    }
    
    // Email validation
    if (fieldRules.email && !isValidEmail(value)) {
      errors[field] = 'Email inválido';
      isValid = false;
      return;
    }
    
    // Min length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `Mínimo de ${fieldRules.minLength} caracteres`;
      isValid = false;
      return;
    }
    
    // Max length validation
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `Máximo de ${fieldRules.maxLength} caracteres`;
      isValid = false;
      return;
    }
    
    // Pattern validation
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.patternMessage || 'Formato inválido';
      isValid = false;
      return;
    }
    
    // Custom validation
    if (fieldRules.validate) {
      const customResult = fieldRules.validate(value, data);
      if (customResult !== true) {
        errors[field] = customResult;
        isValid = false;
        return;
      }
    }
    
    // Min/Max for numbers
    if (fieldRules.min !== undefined) {
      const num = Number(value);
      if (!isNaN(num) && num < fieldRules.min) {
        errors[field] = `Valor mínimo é ${fieldRules.min}`;
        isValid = false;
        return;
      }
    }
    
    if (fieldRules.max !== undefined) {
      const num = Number(value);
      if (!isNaN(num) && num > fieldRules.max) {
        errors[field] = `Valor máximo é ${fieldRules.max}`;
        isValid = false;
        return;
      }
    }
  });
  
  return {
    isValid,
    errors
  };
};

// Exam-specific validations
export const validateExamData = (examData) => {
  const rules = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    subjectId: {
      required: true
    },
    duration: {
      required: true,
      min: 1,
      max: 300,
      validate: (value) => {
        const num = Number(value);
        return !isNaN(num) && Number.isInteger(num) || 'Duração deve ser um número inteiro';
      }
    },
    totalQuestions: {
      required: true,
      min: 1,
      max: 100,
      validate: (value) => {
        const num = Number(value);
        return !isNaN(num) && Number.isInteger(num) || 'Total de questões deve ser um número inteiro';
      }
    },
    variations: {
      min: 1,
      max: 50,
      validate: (value) => {
        if (!value) return true;
        const num = Number(value);
        return !isNaN(num) && Number.isInteger(num) || 'Variações deve ser um número inteiro';
      }
    },
    passingScore: {
      min: 0,
      max: 100,
      validate: (value) => {
        if (!value) return true;
        const num = Number(value);
        return !isNaN(num) && Number.isInteger(num) || 'Nota de aprovação deve ser um número inteiro';
      }
    }
  };
  
  return validateForm(examData, rules);
};

// Question validation
export const validateQuestion = (questionData) => {
  const rules = {
    statement: {
      required: true,
      minLength: 10,
      maxLength: 1000
    },
    type: {
      required: true,
      validate: (value) => {
        const validTypes = ['multiple_choice', 'true_false'];
        return validTypes.includes(value) || 'Tipo de questão inválido';
      }
    },
    difficulty: {
      required: true,
      validate: (value) => {
        const validDifficulties = ['easy', 'medium', 'hard'];
        return validDifficulties.includes(value) || 'Dificuldade inválida';
      }
    },
    points: {
      required: true,
      min: 0.1,
      max: 10
    },
    subjectId: {
      required: true
    }
  };
  
  const result = validateForm(questionData, rules);
  
  // Validate alternatives
  if (questionData.alternatives) {
    const alternatives = questionData.alternatives;
    
    if (alternatives.length < 2) {
      result.errors.alternatives = 'Deve ter pelo menos 2 alternativas';
      result.isValid = false;
    }
    
    const correctAlternatives = alternatives.filter(alt => alt.isCorrect);
    
    if (questionData.type === 'multiple_choice' && correctAlternatives.length !== 1) {
      result.errors.alternatives = 'Deve ter exatamente 1 alternativa correta';
      result.isValid = false;
    }
    
    if (questionData.type === 'true_false' && alternatives.length !== 2) {
      result.errors.alternatives = 'Questão verdadeiro/falso deve ter exatamente 2 alternativas';
      result.isValid = false;
    }
    
    // Check if all alternatives have text
    const emptyAlternatives = alternatives.filter(alt => !alt.text || !alt.text.trim());
    if (emptyAlternatives.length > 0) {
      result.errors.alternatives = 'Todas as alternativas devem ter texto';
      result.isValid = false;
    }
  }
  
  return result;
};

// Subject validation
export const validateSubject = (subjectData) => {
  const rules = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    code: {
      required: true,
      minLength: 2,
      maxLength: 10,
      pattern: /^[A-Z0-9]+$/,
      patternMessage: 'Código deve conter apenas letras maiúsculas e números'
    },
    color: {
      required: true,
      pattern: /^#[0-9A-F]{6}$/i,
      patternMessage: 'Cor deve estar no formato hexadecimal (#RRGGBB)'
    }
  };
  
  return validateForm(subjectData, rules);
};

// Student info validation
export const validateStudentInfo = (studentData) => {
  const rules = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    studentId: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[A-Za-z0-9]+$/,
      patternMessage: 'ID do aluno deve conter apenas letras e números'
    }
  };
  
  return validateForm(studentData, rules);
};

// Sanitization utilities
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  
  return phone.replace(/\D/g, ''); // Keep only digits
};

// Validation message helpers
export const getValidationMessage = (field, rule, value) => {
  const messages = {
    required: `${field} é obrigatório`,
    email: `${field} deve ser um email válido`,
    minLength: `${field} deve ter pelo menos ${rule.minLength} caracteres`,
    maxLength: `${field} deve ter no máximo ${rule.maxLength} caracteres`,
    min: `${field} deve ser pelo menos ${rule.min}`,
    max: `${field} deve ser no máximo ${rule.max}`,
    pattern: `${field} tem formato inválido`
  };
  
  return messages[rule] || `${field} é inválido`;
};

export default {
  isValidEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateCPF,
  validateDate,
  validateNumber,
  validateURL,
  validateFile,
  validateForm,
  validateExamData,
  validateQuestion,
  validateSubject,
  validateStudentInfo,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  getValidationMessage,
  formatPhone,
  formatCPF,
  formatDate,
  formatFileSize
};