// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
}

// Application Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Sistema de Provas Online',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DESCRIPTION: 'Sistema completo para criação e correção de provas online',
  AUTHOR: 'Sistema de Provas Online',
  CONTACT_EMAIL: 'contato@sistemaprovas.com'
}

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
}

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.TEACHER]: 'Professor',
  [USER_ROLES.STUDENT]: 'Aluno'
}

// Question Difficulties
export const QUESTION_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

export const QUESTION_DIFFICULTY_LABELS = {
  [QUESTION_DIFFICULTIES.EASY]: 'Fácil',
  [QUESTION_DIFFICULTIES.MEDIUM]: 'Médio',
  [QUESTION_DIFFICULTIES.HARD]: 'Difícil'
}

export const QUESTION_DIFFICULTY_COLORS = {
  [QUESTION_DIFFICULTIES.EASY]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  [QUESTION_DIFFICULTIES.MEDIUM]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  [QUESTION_DIFFICULTIES.HARD]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  }
}

// Alternative Letters
export const ALTERNATIVE_LETTERS = ['A', 'B', 'C', 'D', 'E']

// Question Points
export const QUESTION_POINTS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10]

// Subject Colors
export const SUBJECT_COLORS = [
  { value: '#3B82F6', label: 'Azul', class: 'bg-blue-500' },
  { value: '#10B981', label: 'Verde', class: 'bg-green-500' },
  { value: '#F59E0B', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: '#EF4444', label: 'Vermelho', class: 'bg-red-500' },
  { value: '#8B5CF6', label: 'Roxo', class: 'bg-purple-500' },
  { value: '#F97316', label: 'Laranja', class: 'bg-orange-500' },
  { value: '#06B6D4', label: 'Ciano', class: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lima', class: 'bg-lime-500' },
  { value: '#EC4899', label: 'Rosa', class: 'bg-pink-500' },
  { value: '#6B7280', label: 'Cinza', class: 'bg-gray-500' }
]

// Exam Statuses
export const EXAM_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ARCHIVED: 'archived'
}

export const EXAM_STATUS_LABELS = {
  [EXAM_STATUSES.DRAFT]: 'Rascunho',
  [EXAM_STATUSES.PUBLISHED]: 'Publicada',
  [EXAM_STATUSES.ACTIVE]: 'Ativa',
  [EXAM_STATUSES.CLOSED]: 'Encerrada',
  [EXAM_STATUSES.ARCHIVED]: 'Arquivada'
}

export const EXAM_STATUS_COLORS = {
  [EXAM_STATUSES.DRAFT]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800'
  },
  [EXAM_STATUSES.PUBLISHED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800'
  },
  [EXAM_STATUSES.ACTIVE]: {
    bg: 'bg-green-100',
    text: 'text-green-800'
  },
  [EXAM_STATUSES.CLOSED]: {
    bg: 'bg-red-100',
    text: 'text-red-800'
  },
  [EXAM_STATUSES.ARCHIVED]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800'
  }
}

// Exam Types
export const EXAM_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  ESSAY: 'essay',
  MIXED: 'mixed'
}

export const EXAM_TYPE_LABELS = {
  [EXAM_TYPES.MULTIPLE_CHOICE]: 'Múltipla Escolha',
  [EXAM_TYPES.ESSAY]: 'Dissertativa',
  [EXAM_TYPES.MIXED]: 'Mista'
}

// Answer Statuses
export const ANSWER_STATUSES = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  REVIEWED: 'reviewed'
}

export const ANSWER_STATUS_LABELS = {
  [ANSWER_STATUSES.PENDING]: 'Pendente',
  [ANSWER_STATUSES.SUBMITTED]: 'Enviada',
  [ANSWER_STATUSES.GRADED]: 'Corrigida',
  [ANSWER_STATUSES.REVIEWED]: 'Revisada'
}

// File Types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ARCHIVE: ['application/zip', 'application/x-rar-compressed']
}

export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  SPREADSHEET: 10 * 1024 * 1024, // 10MB
  ARCHIVE: 50 * 1024 * 1024 // 50MB
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  LIMITS: [5, 10, 20, 50, 100]
}

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  MEDIUM: 'dd MMM yyyy',
  LONG: 'dd MMMM yyyy',
  FULL: 'EEEE, dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
}

// Time Zones
export const TIMEZONE = 'America/Sao_Paulo'

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  PREFERENCES: 'preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_ACTIVITY: 'lastActivity'
}

// Theme Configuration
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

// Language Configuration
export const LANGUAGES = {
  PT_BR: 'pt-BR',
  EN_US: 'en-US',
  ES_ES: 'es-ES'
}

export const LANGUAGE_LABELS = {
  [LANGUAGES.PT_BR]: 'Português (Brasil)',
  [LANGUAGES.EN_US]: 'English (US)',
  [LANGUAGES.ES_ES]: 'Español (España)'
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Acesso negado. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  TIMEOUT_ERROR: 'Operação expirou. Tente novamente.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Criado com sucesso!',
  UPDATED: 'Atualizado com sucesso!',
  DELETED: 'Excluído com sucesso!',
  SAVED: 'Salvo com sucesso!',
  SUBMITTED: 'Enviado com sucesso!',
  PUBLISHED: 'Publicado com sucesso!',
  DUPLICATED: 'Duplicado com sucesso!',
  IMPORTED: 'Importado com sucesso!',
  EXPORTED: 'Exportado com sucesso!'
}

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  SUBJECT: {
    NAME_MAX_LENGTH: 100,
    CODE_MAX_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 500
  },
  QUESTION: {
    STATEMENT_MIN_LENGTH: 10,
    STATEMENT_MAX_LENGTH: 2000,
    ALTERNATIVE_MIN_LENGTH: 1,
    ALTERNATIVE_MAX_LENGTH: 500,
    EXPLANATION_MAX_LENGTH: 1000,
    MIN_ALTERNATIVES: 2,
    MAX_ALTERNATIVES: 5
  },
  EXAM: {
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    MIN_QUESTIONS: 1,
    MAX_QUESTIONS: 100,
    MIN_TIME_LIMIT: 5, // minutes
    MAX_TIME_LIMIT: 480 // minutes (8 hours)
  }
}

// QR Code Configuration
export const QR_CODE = {
  SIZE: 256,
  ERROR_CORRECTION_LEVEL: 'M',
  MARGIN: 4,
  COLOR: {
    DARK: '#000000',
    LIGHT: '#FFFFFF'
  }
}

// Chart Colors
export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#EC4899', // pink
  '#6B7280'  // gray
]

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
}

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
}

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 10,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  TOAST: 9999
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
}

// Feature Flags
export const FEATURES = {
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  SENTRY: import.meta.env.VITE_ENABLE_SENTRY === 'true',
  QR_SCANNER_DEBUG: import.meta.env.VITE_QR_SCANNER_DEBUG === 'true',
  DARK_MODE: true,
  MULTI_LANGUAGE: false,
  OFFLINE_MODE: false,
  EXPORT_PDF: true,
  BULK_OPERATIONS: true,
  REAL_TIME_UPDATES: false
}

// Default Values
export const DEFAULTS = {
  QUESTION_DIFFICULTY: QUESTION_DIFFICULTIES.MEDIUM,
  QUESTION_POINTS: 1,
  SUBJECT_COLOR: SUBJECT_COLORS[0].value,
  SUBJECT_CREDITS: 1,
  EXAM_TIME_LIMIT: 60, // minutes
  PAGINATION_LIMIT: PAGINATION.DEFAULT_LIMIT,
  THEME: THEMES.LIGHT,
  LANGUAGE: LANGUAGES.PT_BR
}

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  QUICK: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 30 * 60 * 1000,    // 30 minutes
  LONG: 60 * 60 * 1000,      // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
}

// Performance Monitoring
export const PERFORMANCE = {
  SLOW_QUERY_THRESHOLD: 1000, // ms
  LARGE_RESPONSE_THRESHOLD: 1024 * 1024, // 1MB
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024 // 50MB
}

// Security Configuration
export const SECURITY = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_EXPIRY_DAYS: 90,
  CSP_HEADER: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
}

export default {
  API_CONFIG,
  APP_CONFIG,
  USER_ROLES,
  USER_ROLE_LABELS,
  QUESTION_DIFFICULTIES,
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_DIFFICULTY_COLORS,
  ALTERNATIVE_LETTERS,
  QUESTION_POINTS,
  SUBJECT_COLORS,
  EXAM_STATUSES,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  EXAM_TYPES,
  EXAM_TYPE_LABELS,
  ANSWER_STATUSES,
  ANSWER_STATUS_LABELS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  PAGINATION,
  DATE_FORMATS,
  TIMEZONE,
  STORAGE_KEYS,
  THEMES,
  LANGUAGES,
  LANGUAGE_LABELS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  QR_CODE,
  CHART_COLORS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  Z_INDEX,
  HTTP_STATUS,
  FEATURES,
  DEFAULTS,
  CACHE_TTL,
  PERFORMANCE,
  SECURITY
}