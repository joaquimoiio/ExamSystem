import { 
  GRADE_THRESHOLDS, 
  GRADE_LABELS, 
  DIFFICULTY_COLORS,
  EXAM_STATUS_COLORS,
  VALIDATION_RULES 
} from './constants';

// Date and Time Utilities
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Date(date).toLocaleDateString('pt-BR', defaultOptions);
};

export const formatDateTime = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Date(date).toLocaleDateString('pt-BR', defaultOptions);
};

export const formatTime = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Date(date).toLocaleTimeString('pt-BR', defaultOptions);
};

export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now - target) / 1000);
  
  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
  
  return formatDate(date);
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}min`;
};

export const formatCountdown = (seconds) => {
  if (!seconds || seconds <= 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// String Utilities
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
};

export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

export const removeHtmlTags = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

export const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Number Utilities
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '';
  
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  };
  
  return new Intl.NumberFormat('pt-BR', defaultOptions).format(number);
};

export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

export const formatCurrency = (amount, currency = 'BRL') => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const roundToDecimals = (value, decimals = 2) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const getPercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Array Utilities
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const unique = (array, key) => {
  if (!key) return [...new Set(array)];
  
  const seen = new Set();
  return array.filter(item => {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const paginate = (array, page, pageSize) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: array.slice(startIndex, endIndex),
    page,
    pageSize,
    total: array.length,
    totalPages: Math.ceil(array.length / pageSize),
    hasNext: endIndex < array.length,
    hasPrev: page > 1,
  };
};

// Object Utilities
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
};

export const omit = (obj, keys) => {
  const keysToOmit = Array.isArray(keys) ? keys : [keys];
  const result = {};
  
  for (const key in obj) {
    if (!keysToOmit.includes(key)) {
      result[key] = obj[key];
    }
  }
  
  return result;
};

export const pick = (obj, keys) => {
  const keysToPick = Array.isArray(keys) ? keys : [keys];
  const result = {};
  
  keysToPick.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  
  return result;
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const deepMerge = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

// Validation Utilities
export const validateEmail = (email) => {
  return VALIDATION_RULES.EMAIL.test(email);
};

export const validatePassword = (password) => {
  const rules = VALIDATION_RULES.PASSWORD;
  
  const checks = {
    length: password.length >= rules.MIN_LENGTH && password.length <= rules.MAX_LENGTH,
    lowercase: rules.REQUIRE_LOWERCASE ? /[a-z]/.test(password) : true,
    uppercase: rules.REQUIRE_UPPERCASE ? /[A-Z]/.test(password) : true,
    number: rules.REQUIRE_NUMBER ? /\d/.test(password) : true,
    special: rules.REQUIRE_SPECIAL ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true,
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const isValid = Object.values(checks).every(Boolean);
  
  return { isValid, score, checks };
};

export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
};

export const validateRequired = (value, fieldName = 'Campo') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} é obrigatório`;
  }
  return null;
};

export const validateMinLength = (value, min, fieldName = 'Campo') => {
  if (value && value.length < min) {
    return `${fieldName} deve ter pelo menos ${min} caracteres`;
  }
  return null;
};

export const validateMaxLength = (value, max, fieldName = 'Campo') => {
  if (value && value.length > max) {
    return `${fieldName} deve ter no máximo ${max} caracteres`;
  }
  return null;
};

// Grade and Score Utilities
export const calculateGrade = (score) => {
  if (score >= GRADE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= GRADE_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= GRADE_THRESHOLDS.AVERAGE) return 'AVERAGE';
  if (score >= GRADE_THRESHOLDS.BELOW_AVERAGE) return 'BELOW_AVERAGE';
  return 'POOR';
};

export const getGradeLabel = (score) => {
  const grade = calculateGrade(score);
  return GRADE_LABELS[grade];
};

export const calculateExamScore = (answers, questions) => {
  if (!answers || !questions || questions.length === 0) {
    return { score: 0, correct: 0, incorrect: 0, unanswered: 0 };
  }
  
  let correct = 0;
  let incorrect = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  
  questions.forEach((question, index) => {
    const userAnswer = answers[index];
    const correctAnswer = question.alternatives?.findIndex(alt => alt.isCorrect);
    
    totalPoints += question.points || 1;
    
    if (userAnswer !== undefined && userAnswer !== null) {
      if (userAnswer === correctAnswer) {
        correct++;
        earnedPoints += question.points || 1;
      } else {
        incorrect++;
      }
    }
  });
  
  const unanswered = questions.length - correct - incorrect;
  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  
  return {
    score: Math.round(score),
    correct,
    incorrect,
    unanswered,
    totalPoints,
    earnedPoints,
    percentage: Math.round(score),
  };
};

export const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getScoreBackground = (score) => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
};

// UI Utilities
export const getDifficultyStyle = (difficulty) => {
  return DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.medium;
};

export const getExamStatusStyle = (status) => {
  return EXAM_STATUS_COLORS[status] || EXAM_STATUS_COLORS.draft;
};

export const generateAvatarColor = (name) => {
  if (!name) return '#6B7280';
  
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

export const getContrastColor = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// File Utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isImageFile = (file) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return imageTypes.includes(file.type);
};

export const downloadFile = (data, filename, type = 'application/octet-stream') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// URL Utilities
export const buildUrl = (base, path, params = {}) => {
  const url = new URL(path, base);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

export const parseUrl = (url) => {
  try {
    const parsed = new URL(url);
    const params = {};
    
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      pathname: parsed.pathname,
      params,
    };
  } catch {
    return null;
  }
};

export const getQueryParam = (name, defaultValue = null) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name) || defaultValue;
};

export const setQueryParam = (name, value) => {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(name, value);
  } else {
    url.searchParams.delete(name);
  }
  window.history.replaceState({}, '', url);
};

// Local Storage Utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },

  getSize: () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  },
};

// Debounce and Throttle
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Device Detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTablet = () => {
  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
};

export const isDesktop = () => {
  return !isMobile() && !isTablet();
};

export const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

export const getScreenSize = () => {
  const width = window.innerWidth;
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
};

// Clipboard Utilities
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch {
    return false;
  }
};

// Quiz/Exam Specific Utilities
export const calculateExamDifficulty = (questions) => {
  if (!questions || questions.length === 0) return 'medium';
  
  const difficulties = questions.map(q => q.difficulty);
  const counts = {
    easy: difficulties.filter(d => d === 'easy').length,
    medium: difficulties.filter(d => d === 'medium').length,
    hard: difficulties.filter(d => d === 'hard').length,
  };
  
  const total = questions.length;
  const hardPercentage = (counts.hard / total) * 100;
  const easyPercentage = (counts.easy / total) * 100;
  
  if (hardPercentage >= 50) return 'hard';
  if (easyPercentage >= 50) return 'easy';
  return 'medium';
};


export const calculateTimeRemaining = (startTime, duration) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60000); // duration in minutes
  const remaining = end.getTime() - now.getTime();
  
  if (remaining <= 0) {
    return { minutes: 0, seconds: 0, total: 0, isExpired: true };
  }
  
  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return {
    minutes,
    seconds,
    total: totalSeconds,
    isExpired: false,
    formatted: formatCountdown(totalSeconds),
  };
};

export const calculateExamProgress = (answers, totalQuestions) => {
  const answeredCount = Object.keys(answers || {}).length;
  const percentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  return {
    answered: answeredCount,
    total: totalQuestions,
    remaining: totalQuestions - answeredCount,
    percentage: Math.round(percentage),
  };
};

// Form Utilities
export const createFormData = (data, files = {}) => {
  const formData = new FormData();
  
  // Add regular data
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });
  
  // Add files
  Object.entries(files).forEach(([key, file]) => {
    if (file) {
      formData.append(key, file);
    }
  });
  
  return formData;
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.entries(rules).forEach(([field, fieldRules]) => {
    const value = data[field];
    
    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = 'Este campo é obrigatório';
      return;
    }
    
    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `Mínimo de ${fieldRules.minLength} caracteres`;
      return;
    }
    
    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `Máximo de ${fieldRules.maxLength} caracteres`;
      return;
    }
    
    if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || 'Formato inválido';
      return;
    }
    
    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customError = fieldRules.custom(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Error Handling Utilities
export const createError = (message, code, details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  error.timestamp = new Date().toISOString();
  return error;
};

export const isNetworkError = (error) => {
  return !navigator.onLine || 
         error.message.includes('fetch') || 
         error.message.includes('network') ||
         error.code === 'NETWORK_ERROR';
};

export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.data?.message) return error.data.message;
  return 'Ocorreu um erro inesperado';
};

// Analytics Utilities
export const trackEvent = (eventName, properties = {}) => {
  // This would integrate with your analytics service
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, properties);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, properties);
  }
};

export const trackPageView = (pageName, properties = {}) => {
  trackEvent('page_view', { page_name: pageName, ...properties });
};

export const trackExamEvent = (eventType, examData, additionalData = {}) => {
  trackEvent(`exam_${eventType}`, {
    exam_id: examData?.id,
    exam_title: examData?.title,
    subject_id: examData?.subjectId,
    variation_id: examData?.variationId,
    ...additionalData,
  });
};

// Performance Utilities
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`);
  }
  return result;
};

export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Async Utilities
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await sleep(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

export const timeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
};

export const batchProcess = async (items, processFn, batchSize = 10, delay = 100) => {
  const results = [];
  const batches = chunk(items, batchSize);
  
  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
    
    if (delay > 0) {
      await sleep(delay);
    }
  }
  
  return results;
};

// Color Utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const lightenColor = (color, percent) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const factor = 1 + (percent / 100);
  const r = Math.min(255, Math.round(rgb.r * factor));
  const g = Math.min(255, Math.round(rgb.g * factor));
  const b = Math.min(255, Math.round(rgb.b * factor));
  
  return rgbToHex(r, g, b);
};

export const darkenColor = (color, percent) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const factor = 1 - (percent / 100);
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  
  return rgbToHex(r, g, b);
};

// Math Utilities
export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomFloat = (min, max, decimals = 2) => {
  const random = Math.random() * (max - min) + min;
  return parseFloat(random.toFixed(decimals));
};

export const average = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

export const median = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
};

export const standardDeviation = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const avg = average(numbers);
  const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
  const avgSquaredDiff = average(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
};

// Search and Filter Utilities
export const fuzzySearch = (query, items, keys = []) => {
  if (!query || !items) return items;
  
  const searchTerm = query.toLowerCase();
  
  return items.filter(item => {
    if (typeof item === 'string') {
      return item.toLowerCase().includes(searchTerm);
    }
    
    if (keys.length === 0) {
      return JSON.stringify(item).toLowerCase().includes(searchTerm);
    }
    
    return keys.some(key => {
      const value = typeof key === 'function' ? key(item) : item[key];
      return value && value.toString().toLowerCase().includes(searchTerm);
    });
  });
};

export const highlightText = (text, query) => {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const createSearchIndex = (items, fields) => {
  const index = new Map();
  
  items.forEach((item, itemIndex) => {
    fields.forEach(field => {
      const value = item[field];
      if (value) {
        const words = value.toString().toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (!index.has(word)) {
            index.set(word, new Set());
          }
          index.get(word).add(itemIndex);
        });
      }
    });
  });
  
  return index;
};

// Date Utilities
export const isToday = (date) => {
  const today = new Date();
  const target = new Date(date);
  
  return today.getFullYear() === target.getFullYear() &&
         today.getMonth() === target.getMonth() &&
         today.getDate() === target.getDate();
};

export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date);
  
  return yesterday.getFullYear() === target.getFullYear() &&
         yesterday.getMonth() === target.getMonth() &&
         yesterday.getDate() === target.getDate();
};

export const isThisWeek = (date) => {
  const today = new Date();
  const target = new Date(date);
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return target >= startOfWeek && target <= endOfWeek;
};

export const daysBetween = (date1, date2) => {
  const start = new Date(date1);
  const end = new Date(date2);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// Browser and Environment Utilities
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1];
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1];
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1];
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1];
  }
  
  return { browserName, browserVersion };
};

export const isOnline = () => {
  return navigator.onLine;
};

export const getConnectionType = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection ? connection.effectiveType : 'unknown';
};

export const supportsWebP = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

export const supportsLocalStorage = () => {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Notification Utilities
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }
  return null;
};

// Utility for creating compound keys
export const createCompoundKey = (...parts) => {
  return parts.filter(part => part !== undefined && part !== null).join('::');
};

// URL and routing utilities
export const createSearchParams = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  return searchParams;
};

export const parseSearchParams = (searchParams) => {
  const params = {};
  
  for (const [key, value] of searchParams) {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  }
  
  return params;
};

// Accessibility utilities
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const focusElement = (selector, options = {}) => {
  const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
  
  if (element) {
    element.focus(options);
    return true;
  }
  
  return false;
};

export const trapFocus = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

// Exam-specific advanced utilities
export const generateExamSummary = (exam, submissions = []) => {
  const totalSubmissions = submissions.length;
  
  if (totalSubmissions === 0) {
    return {
      totalSubmissions: 0,
      averageScore: 0,
      passRate: 0,
      averageTime: 0,
      difficultyAnalysis: {},
    };
  }
  
  const scores = submissions.map(s => s.score);
  const times = submissions.map(s => s.timeSpent).filter(t => t);
  const passRate = scores.filter(s => s >= 70).length / totalSubmissions * 100;
  
  return {
    totalSubmissions,
    averageScore: roundToDecimals(average(scores)),
    passRate: roundToDecimals(passRate),
    averageTime: times.length > 0 ? roundToDecimals(average(times)) : 0,
    medianScore: roundToDecimals(median(scores)),
    standardDeviation: roundToDecimals(standardDeviation(scores)),
    scoreDistribution: {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 80 && s < 90).length,
      average: scores.filter(s => s >= 70 && s < 80).length,
      belowAverage: scores.filter(s => s >= 60 && s < 70).length,
      poor: scores.filter(s => s < 60).length,
    },
  };
};

export const analyzeQuestionPerformance = (question, answers = []) => {
  if (answers.length === 0) {
    return {
      totalAnswers: 0,
      correctRate: 0,
      averageTime: 0,
      alternativeDistribution: {},
    };
  }
  
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const correctRate = (correctAnswers / answers.length) * 100;
  const times = answers.map(a => a.timeSpent).filter(t => t);
  
  const alternativeDistribution = {};
  if (question.alternatives) {
    question.alternatives.forEach((alt, index) => {
      alternativeDistribution[index] = answers.filter(a => a.selectedAnswer === index).length;
    });
  }
  
  return {
    totalAnswers: answers.length,
    correctRate: roundToDecimals(correctRate),
    averageTime: times.length > 0 ? roundToDecimals(average(times)) : 0,
    alternativeDistribution,
    difficulty: correctRate > 80 ? 'easy' : correctRate > 60 ? 'medium' : 'hard',
  };
};

export const validateExamConfiguration = (config) => {
  const errors = [];
  
  if (!config.title || config.title.trim().length < 3) {
    errors.push('Título deve ter pelo menos 3 caracteres');
  }
  
  if (!config.subjectId) {
    errors.push('Disciplina é obrigatória');
  }
  
  if (!config.duration || config.duration < 15 || config.duration > 300) {
    errors.push('Duração deve estar entre 15 e 300 minutos');
  }
  
  if (!config.variations || config.variations < 1 || config.variations > 50) {
    errors.push('Número de variações deve estar entre 1 e 50');
  }
  
  const totalQuestions = (config.difficultyDistribution?.easy || 0) + 
                        (config.difficultyDistribution?.medium || 0) + 
                        (config.difficultyDistribution?.hard || 0);
  
  if (totalQuestions === 0) {
    errors.push('Pelo menos uma questão deve ser selecionada');
  }
  
  if (totalQuestions > 50) {
    errors.push('Máximo de 50 questões por prova');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Export all utilities as a single object for easier importing
export default {
  // Date and Time
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,
  formatDuration,
  formatCountdown,
  isToday,
  isYesterday,
  isThisWeek,
  daysBetween,
  addDays,
  startOfDay,
  endOfDay,
  
  // String utilities
  capitalize,
  capitalizeWords,
  truncateText,
  slugify,
  generateId,
  removeHtmlTags,
  escapeHtml,
  
  // Number utilities
  formatNumber,
  formatPercentage,
  formatCurrency,
  clamp,
  roundToDecimals,
  getPercentage,
  
  // Array utilities
  shuffleArray,
  groupBy,
  sortBy,
  unique,
  chunk,
  paginate,
  
  // Object utilities
  deepClone,
  omit,
  pick,
  isEmpty,
  deepMerge,
  
  // Validation
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  
  // Exam utilities
  calculateExamScore,
  calculateGrade,
  getGradeLabel,
  getScoreColor,
  getScoreBackground,
  calculateExamDifficulty,
  calculateTimeRemaining,
  calculateExamProgress,
  generateExamSummary,
  analyzeQuestionPerformance,
  validateExamConfiguration,
  
  // UI utilities
  getDifficultyStyle,
  getExamStatusStyle,
  generateAvatarColor,
  getInitials,
  getContrastColor,
  
  // Storage
  storage,
  
  // Async utilities
  debounce,
  throttle,
  sleep,
  retry,
  timeout,
  batchProcess,
  
  // Device detection
  isMobile,
  isTablet,
  isDesktop,
  getDeviceType,
  getScreenSize,
  
  // Browser utilities
  getBrowserInfo,
  isOnline,
  getConnectionType,
  supportsWebP,
  supportsLocalStorage,
  copyToClipboard,
  
  // Search utilities
  fuzzySearch,
  highlightText,
  createSearchIndex,
  
  // Analytics
  trackEvent,
  trackPageView,
  trackExamEvent,
  
  // Performance
  measurePerformance,
  memoize,
  
  // Error handling
  createError,
  isNetworkError,
  getErrorMessage,
  
  // Math utilities
  randomBetween,
  randomFloat,
  average,
  median,
  standardDeviation,
  
  // Color utilities
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  
  // File utilities
  formatFileSize,
  getFileExtension,
  isImageFile,
  downloadFile,
  
  // URL utilities
  buildUrl,
  parseUrl,
  getQueryParam,
  setQueryParam,
  createSearchParams,
  parseSearchParams,
  
  // Form utilities
  createFormData,
  validateForm,
  
  // Accessibility
  announceToScreenReader,
  focusElement,
  trapFocus,
  
  // Notifications
  requestNotificationPermission,
  showNotification,
  
  // Utilities
  createCompoundKey,
};