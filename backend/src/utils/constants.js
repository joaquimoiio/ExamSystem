// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher'
};

// Question difficulties
const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Exam statuses
const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
  ARCHIVED: 'archived'
};

// Alternative letters
const ALTERNATIVE_LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Grade letters and thresholds
const GRADE_THRESHOLDS = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  F: 0
};

// File upload limits
const FILE_LIMITS = {
  IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 20
};

// Supported file types
const SUPPORTED_FILE_TYPES = {
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'txt'],
  IMPORT: ['json', 'csv', 'xlsx']
};

// API response messages
const MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    FOUND: 'Resource found successfully'
  },
  ERROR: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    DUPLICATE: 'Resource already exists'
  }
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Time constants
const TIME = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000
};

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  EXAM_NOTIFICATION: 'exam_notification',
  SUBMISSION_NOTIFICATION: 'submission_notification'
};

// QR Code types
const QR_CODE_TYPES = {
  EXAM_VARIATION: 'exam_variation',
  ANSWER_SHEET: 'answer_sheet'
};

// OCR confidence thresholds
const OCR_THRESHOLDS = {
  HIGH_CONFIDENCE: 80,
  MEDIUM_CONFIDENCE: 60,
  LOW_CONFIDENCE: 40
};

// Default colors for subjects
const SUBJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
];

// System settings
const SYSTEM_SETTINGS = {
  MAX_EXAM_VARIATIONS: 50,
  MAX_QUESTIONS_PER_EXAM: 100,
  MAX_ALTERNATIVES_PER_QUESTION: 5,
  MIN_ALTERNATIVES_PER_QUESTION: 2,
  MAX_TAGS_PER_QUESTION: 10,
  MAX_SUBJECTS_PER_USER: 100,
  MAX_QUESTIONS_PER_SUBJECT: 1000
};

// Rate limiting
const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    WINDOW: 15 * TIME.MINUTE, // 15 minutes
    MAX_ATTEMPTS: 5
  },
  API_CALLS: {
    WINDOW: 15 * TIME.MINUTE, // 15 minutes
    MAX_CALLS: 100
  },
  PASSWORD_RESET: {
    WINDOW: TIME.HOUR, // 1 hour
    MAX_ATTEMPTS: 3
  }
};

// Validation rules
const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 255,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: false,
    REQUIRE_SPECIAL_CHARS: false
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  EMAIL: {
    MAX_LENGTH: 255
  },
  SUBJECT: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 1000
  },
  QUESTION: {
    TEXT_MIN_LENGTH: 10,
    TEXT_MAX_LENGTH: 5000,
    ALTERNATIVE_MIN_LENGTH: 1,
    ALTERNATIVE_MAX_LENGTH: 500,
    TAG_MAX_LENGTH: 50
  },
  EXAM: {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    INSTRUCTIONS_MAX_LENGTH: 2000,
    MIN_QUESTIONS: 1,
    MAX_TIME_LIMIT: 480 // 8 hours in minutes
  }
};

// Database table names
const TABLE_NAMES = {
  USERS: 'users',
  SUBJECTS: 'subjects',
  QUESTIONS: 'questions',
  EXAMS: 'exams',
  EXAM_VARIATIONS: 'exam_variations',
  EXAM_QUESTIONS: 'exam_questions',
  ANSWERS: 'answers'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// JWT token types
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET: 'reset',
  VERIFY: 'verify'
};

// PDF generation options
const PDF_OPTIONS = {
  FORMAT: 'A4',
  MARGIN: {
    TOP: 50,
    BOTTOM: 50,
    LEFT: 50,
    RIGHT: 50
  },
  QR_SIZE: 80,
  FONT_SIZES: {
    TITLE: 16,
    SUBTITLE: 14,
    HEADING: 12,
    BODY: 11,
    SMALL: 10,
    TINY: 8
  }
};

// Statistics time ranges
const STATS_TIME_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  ALL_TIME: 'all_time'
};

// Sort orders
const SORT_ORDERS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// Common sort fields
const SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  NAME: 'name',
  TITLE: 'title',
  SCORE: 'score',
  DATE: 'date'
};

// Export formats
const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  XLSX: 'xlsx',
  PDF: 'pdf'
};

// Notification types
const NOTIFICATION_TYPES = {
  EXAM_CREATED: 'exam_created',
  EXAM_PUBLISHED: 'exam_published',
  SUBMISSION_RECEIVED: 'submission_received',
  USER_REGISTERED: 'user_registered',
  PASSWORD_RESET: 'password_reset'
};

// Cache keys
const CACHE_KEYS = {
  USER_STATS: 'user_stats',
  EXAM_STATS: 'exam_stats',
  SUBJECT_QUESTIONS: 'subject_questions',
  SYSTEM_STATS: 'system_stats'
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 5 * TIME.MINUTE,    // 5 minutes
  MEDIUM: 30 * TIME.MINUTE,  // 30 minutes
  LONG: 2 * TIME.HOUR,       // 2 hours
  VERY_LONG: 24 * TIME.HOUR  // 24 hours
};

// Environment types
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TESTING: 'test',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

// Log levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly'
};

// Security settings
const SECURITY = {
  BCRYPT_ROUNDS: 12,
  SESSION_TIMEOUT: 24 * TIME.HOUR, // 24 hours
  REFRESH_TOKEN_LIFETIME: 30 * TIME.DAY, // 30 days
  PASSWORD_RESET_TIMEOUT: TIME.HOUR, // 1 hour
  EMAIL_VERIFICATION_TIMEOUT: 24 * TIME.HOUR // 24 hours
};

module.exports = {
  USER_ROLES,
  DIFFICULTY_LEVELS,
  EXAM_STATUS,
  ALTERNATIVE_LETTERS,
  GRADE_THRESHOLDS,
  FILE_LIMITS,
  SUPPORTED_FILE_TYPES,
  MESSAGES,
  PAGINATION,
  TIME,
  EMAIL_TEMPLATES,
  QR_CODE_TYPES,
  OCR_THRESHOLDS,
  SUBJECT_COLORS,
  SYSTEM_SETTINGS,
  RATE_LIMITS,
  VALIDATION_RULES,
  TABLE_NAMES,
  HTTP_STATUS,
  TOKEN_TYPES,
  PDF_OPTIONS,
  STATS_TIME_RANGES,
  SORT_ORDERS,
  SORT_FIELDS,
  EXPORT_FORMATS,
  NOTIFICATION_TYPES,
  CACHE_KEYS,
  CACHE_TTL,
  ENVIRONMENTS,
  LOG_LEVELS,
  SECURITY
};