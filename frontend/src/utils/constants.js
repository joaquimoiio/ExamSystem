// App Configuration
export const APP_CONFIG = {
  name: 'MontAí',
  version: '1.0.0',
  description: 'Sistema de Provas Online',
  author: 'MontAí Team',
  website: 'https://montai.com',
};

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Cache Configuration
export const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
};

// Question Types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  ESSAY: 'essay',
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Múltipla Escolha',
  [QUESTION_TYPES.TRUE_FALSE]: 'Verdadeiro/Falso',
  [QUESTION_TYPES.ESSAY]: 'Dissertativa',
};

// Question Difficulties
export const DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const DIFFICULTY_LABELS = {
  [DIFFICULTIES.EASY]: 'Fácil',
  [DIFFICULTIES.MEDIUM]: 'Médio',
  [DIFFICULTIES.HARD]: 'Difícil',
};

export const DIFFICULTY_COLORS = {
  [DIFFICULTIES.EASY]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  [DIFFICULTIES.MEDIUM]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  [DIFFICULTIES.HARD]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
  },
};

// Exam Status
export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

export const EXAM_STATUS_LABELS = {
  [EXAM_STATUS.DRAFT]: 'Rascunho',
  [EXAM_STATUS.PUBLISHED]: 'Publicada',
  [EXAM_STATUS.ARCHIVED]: 'Arquivada',
};

export const EXAM_STATUS_COLORS = {
  [EXAM_STATUS.DRAFT]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
  },
  [EXAM_STATUS.PUBLISHED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  [EXAM_STATUS.ARCHIVED]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.TEACHER]: 'Professor',
  [USER_ROLES.STUDENT]: 'Estudante',
};

// Default Colors for Subjects
export const SUBJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZES: [10, 20, 50, 100],
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  },
};


// Toast Configuration
export const TOAST_CONFIG = {
  DURATION: {
    SHORT: 3000,
    MEDIUM: 4000,
    LONG: 6000,
  },
  POSITION: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  PREFERENCES: 'userPreferences',
  STUDENT_INFO: 'studentInfo',
  EXAM_ANSWERS: 'examAnswers',
  RECENT_SEARCHES: 'recentSearches',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  SUBJECT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  QUESTION_STATEMENT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
  },
  EXAM_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  EXAM_DURATION: {
    MIN: 15, // minutes
    MAX: 300, // minutes
  },
  EXAM_VARIATIONS: {
    MIN: 1,
    MAX: 50,
  },
  QUESTION_ALTERNATIVES: {
    MIN: 2,
    MAX: 6,
  },
  ALTERNATIVE_TEXT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500,
  },
};

// Grade Thresholds
export const GRADE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  AVERAGE: 70,
  BELOW_AVERAGE: 60,
  POOR: 50,
};

export const GRADE_LABELS = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bom',
  AVERAGE: 'Regular',
  BELOW_AVERAGE: 'Insuficiente',
  POOR: 'Inadequado',
};

export const GRADE_COLORS = {
  EXCELLENT: 'text-green-600 bg-green-100',
  GOOD: 'text-blue-600 bg-blue-100',
  AVERAGE: 'text-yellow-600 bg-yellow-100',
  BELOW_AVERAGE: 'text-orange-600 bg-orange-100',
  POOR: 'text-red-600 bg-red-100',
};

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  EXTRA_SLOW: 500,
};

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  XS: 475,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Acesso não autorizado. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  TIMEOUT_ERROR: 'Tempo limite excedido. Tente novamente.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login realizado com sucesso!',
  LOGOUT: 'Logout realizado com sucesso!',
  REGISTER: 'Conta criada com sucesso!',
  SUBJECT_CREATED: 'Disciplina criada com sucesso!',
  SUBJECT_UPDATED: 'Disciplina atualizada com sucesso!',
  SUBJECT_DELETED: 'Disciplina excluída com sucesso!',
  QUESTION_CREATED: 'Questão criada com sucesso!',
  QUESTION_UPDATED: 'Questão atualizada com sucesso!',
  QUESTION_DELETED: 'Questão excluída com sucesso!',
  EXAM_CREATED: 'Prova criada com sucesso!',
  EXAM_UPDATED: 'Prova atualizada com sucesso!',
  EXAM_DELETED: 'Prova excluída com sucesso!',
  EXAM_PUBLISHED: 'Prova publicada com sucesso!',
  EXAM_SUBMITTED: 'Prova submetida com sucesso!',
  PDF_GENERATED: 'PDFs gerados com sucesso!',
};

// Default Exam Configuration
export const DEFAULT_EXAM_CONFIG = {
  duration: 60, // minutes
  variations: 1,
  shuffleQuestions: true,
  shuffleAlternatives: true,
  showResults: true,
  allowReview: false,
  difficultyDistribution: {
    easy: 8,
    medium: 8,
    hard: 4,
  },
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Modal Sizes
export const MODAL_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge',
  FULL: 'full',
};

// Table Configuration
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [5, 10, 20, 50],
  MAX_VISIBLE_PAGES: 5,
};

// Chart Colors
export const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA === 'true',
  ENABLE_OFFLINE: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
  ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  MEDIUM: 'dd/MM/yyyy HH:mm',
  LONG: 'dd/MM/yyyy HH:mm:ss',
  FULL: 'EEEE, dd \'de\' MMMM \'de\' yyyy \'às\' HH:mm',
};

// Time Formats
export const TIME_FORMATS = {
  SHORT: 'HH:mm',
  MEDIUM: 'HH:mm:ss',
  LONG: 'HH:mm:ss.SSS',
};

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  CEP: /^\d{5}-\d{3}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};