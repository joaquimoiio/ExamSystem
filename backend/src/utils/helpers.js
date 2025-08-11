const crypto = require('crypto');

/**
 * Generate a random string of specified length
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random password
 */
const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

/**
 * Format date to Brazilian format
 */
const formatDateBR = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate time difference in minutes
 */
const getTimeDifferenceInMinutes = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return Math.floor((endTime - startTime) / (1000 * 60));
};

/**
 * Format duration from seconds to human readable
 */
const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let formatted = '';
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m `;
  if (remainingSeconds > 0 || formatted === '') formatted += `${remainingSeconds}s`;
  
  return formatted.trim();
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePasswordStrength = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const score = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  ].filter(Boolean).length;
  
  return {
    isValid: password.length >= minLength,
    score,
    strength: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong',
    suggestions: [
      password.length < minLength ? `Use at least ${minLength} characters` : null,
      !hasUpperCase ? 'Add uppercase letters' : null,
      !hasLowerCase ? 'Add lowercase letters' : null,
      !hasNumbers ? 'Add numbers' : null,
      !hasSpecialChar ? 'Add special characters' : null
    ].filter(Boolean)
  };
};

/**
 * Sanitize string for filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
};

/**
 * Generate slug from text
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Calculate percentage with precision
 */
const calculatePercentage = (value, total, precision = 2) => {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(precision));
};

/**
 * Get grade letter from percentage
 */
const getGradeLetter = (percentage) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

/**
 * Paginate array
 */
const paginateArray = (array, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const paginatedItems = array.slice(offset, offset + limit);
  
  return {
    data: paginatedItems,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: array.length,
      pages: Math.ceil(array.length / limit)
    }
  };
};

/**
 * Group array by key
 */
const groupBy = (array, key) => {
  return array.reduce((grouped, item) => {
    const group = item[key];
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(item);
    return grouped;
  }, {});
};

/**
 * Remove duplicates from array
 */
const removeDuplicates = (array, key = null) => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Capitalize first letter of string
 */
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert camelCase to snake_case
 */
const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Validate UUID format
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Safe JSON parse
 */
const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

/**
 * Debounce function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

module.exports = {
  generateRandomString,
  generateSecurePassword,
  formatDateBR,
  getTimeDifferenceInMinutes,
  formatDuration,
  isValidEmail,
  validatePasswordStrength,
  sanitizeFilename,
  generateSlug,
  deepClone,
  calculatePercentage,
  getGradeLetter,
  paginateArray,
  groupBy,
  removeDuplicates,
  retryWithBackoff,
  capitalize,
  camelToSnake,
  snakeToCamel,
  isValidUUID,
  safeJsonParse,
  debounce,
  throttle
};