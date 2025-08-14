// backend/src/utils/helpers.js

const crypto = require('crypto');

/**
 * Paginate helper - converts page and limit to Sequelize limit and offset
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Items per page
 * @returns {object} Object with limit and offset for Sequelize
 */
const paginate = (page, limit) => {
  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  
  // Ensure minimum values
  const validPage = Math.max(1, pageNumber);
  const validLimit = Math.max(1, Math.min(100, limitNumber)); // Max 100 items per page
  
  const offset = (validPage - 1) * validLimit;
  
  return {
    limit: validLimit,
    offset: offset
  };
};

/**
 * Build pagination metadata for API responses
 * @param {number} page - Current page number
 * @param {number} limit - Items per page  
 * @param {number} total - Total number of items
 * @returns {object} Pagination metadata object
 */
const buildPaginationMeta = (page, limit, total) => {
  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const totalItems = parseInt(total) || 0;
  
  const totalPages = Math.ceil(totalItems / limitNumber);
  const hasNextPage = pageNumber < totalPages;
  const hasPrevPage = pageNumber > 1;
  
  return {
    currentPage: pageNumber,
    totalPages: totalPages,
    totalItems: totalItems,
    itemsPerPage: limitNumber,
    hasNextPage: hasNextPage,
    hasPrevPage: hasPrevPage,
    nextPage: hasNextPage ? pageNumber + 1 : null,
    prevPage: hasPrevPage ? pageNumber - 1 : null
  };
};

/**
 * Generate a random access code
 * @param {number} length - Length of the code
 * @returns {string} Random access code
 */
const generateAccessCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate a unique exam code based on subject and timestamp
 * @param {string} subjectName - Name of the subject
 * @returns {string} Unique exam code
 */
const generateExamCode = (subjectName) => {
  const prefix = subjectName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 3);
  
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${prefix}${timestamp}${random}`;
};

/**
 * Validate and sanitize pagination parameters
 * @param {object} query - Query parameters object
 * @returns {object} Sanitized pagination parameters
 */
const sanitizePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10));
  
  return { page, limit };
};

/**
 * Calculate time difference in human readable format
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (default: now)
 * @returns {string} Human readable time difference
 */
const getTimeDifference = (startDate, endDate = new Date()) => {
  const diff = endDate - startDate;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
};

/**
 * Format duration in milliseconds to readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
const formatDuration = (duration) => {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Generate secure random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize string for safe database storage
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

module.exports = {
  paginate,
  buildPaginationMeta,
  generateAccessCode,
  shuffleArray,
  generateExamCode,
  sanitizePaginationParams,
  getTimeDifference,
  formatDuration,
  generateSecureToken,
  isValidEmail,
  sanitizeString,
  isEmpty
};