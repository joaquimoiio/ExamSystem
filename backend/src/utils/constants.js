const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher'
};

const QUESTION_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const ANSWER_STATUS = {
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  REVIEWED: 'reviewed'
};

const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
  SPREADSHEET: ['xls', 'xlsx', 'csv']
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_QUESTIONS_PER_EXAM = 100;
const MAX_ALTERNATIVES_PER_QUESTION = 5;
const MIN_ALTERNATIVES_PER_QUESTION = 2;

const DEFAULT_EXAM_CONFIG = {
  totalQuestions: 20,
  easyQuestions: 8,
  mediumQuestions: 8,
  hardQuestions: 4,
  timeLimit: 120, // minutes
  passingScore: 6.0,
  maxAttempts: 1,
  totalVariations: 3
};

const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100
};

module.exports = {
  USER_ROLES,
  QUESTION_DIFFICULTIES,
  EXAM_STATUS,
  ANSWER_STATUS,
  FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_QUESTIONS_PER_EXAM,
  MAX_ALTERNATIVES_PER_QUESTION,
  MIN_ALTERNATIVES_PER_QUESTION,
  DEFAULT_EXAM_CONFIG,
  PAGINATION_DEFAULTS
};