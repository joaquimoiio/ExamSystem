import { 
  QUESTION_DIFFICULTY_LABELS, 
  QUESTION_DIFFICULTY_COLORS,
  DATE_FORMATS,
  ALTERNATIVE_LETTERS,
  SUBJECT_COLORS 
} from './constants'

// Date and Time Helpers
export const formatDate = (date, format = DATE_FORMATS.SHORT) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const options = {
    'dd/MM/yyyy': { day: '2-digit', month: '2-digit', year: 'numeric' },
    'dd MMM yyyy': { day: '2-digit', month: 'short', year: 'numeric' },
    'dd MMMM yyyy': { day: '2-digit', month: 'long', year: 'numeric' },
    'EEEE, dd MMMM yyyy': { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
    'HH:mm': { hour: '2-digit', minute: '2-digit' },
    'dd/MM/yyyy HH:mm': { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    }
  }

  return dateObj.toLocaleDateString('pt-BR', options[format] || options['dd/MM/yyyy'])
}

export const formatDateTime = (date) => {
  return formatDate(date, DATE_FORMATS.DATETIME)
}

export const formatTime = (date) => {
  return formatDate(date, DATE_FORMATS.TIME)
}

export const getRelativeTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now - targetDate
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return 'agora'
  if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
  if (diffInHours < 24) return `${diffInHours}h atrás`
  if (diffInDays < 7) return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`
  
  return formatDate(date)
}

export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 min'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

export const parseDuration = (durationString) => {
  if (!durationString) return 0
  
  const hourMatch = durationString.match(/(\d+)h/)
  const minMatch = durationString.match(/(\d+)min/)
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0
  const minutes = minMatch ? parseInt(minMatch[1]) : 0
  
  return hours * 60 + minutes
}

// String Helpers
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

export const capitalizeFirst = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const capitalizeWords = (text) => {
  if (!text) return ''
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ')
}

export const slugify = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-') // Remove leading/trailing hyphens
}

export const generateCode = (name, maxLength = 6) => {
  if (!name) return ''
  
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, maxLength)
}

export const searchText = (text, query) => {
  if (!text || !query) return false
  
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  return normalizedText.includes(normalizedQuery)
}

// Number Helpers
export const formatNumber = (number, decimals = 0) => {
  if (typeof number !== 'number') return '0'
  
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%'
  
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Array Helpers
export const shuffle = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {})
}

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aValue = typeof key === 'function' ? key(a) : a[key]
    const bValue = typeof key === 'function' ? key(b) : b[key]
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export const uniqueBy = (array, key) => {
  const seen = new Set()
  return array.filter(item => {
    const keyValue = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(keyValue)) {
      return false
    }
    seen.add(keyValue)
    return true
  })
}

export const chunk = (array, size) => {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Object Helpers
export const pick = (object, keys) => {
  const picked = {}
  keys.forEach(key => {
    if (key in object) {
      picked[key] = object[key]
    }
  })
  return picked
}

export const omit = (object, keys) => {
  const omitted = { ...object }
  keys.forEach(key => {
    delete omitted[key]
  })
  return omitted
}

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const cloned = {}
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key])
    })
    return cloned
  }
}

export const isEmpty = (value) => {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// Question Helpers
export const getDifficultyLabel = (difficulty) => {
  return QUESTION_DIFFICULTY_LABELS[difficulty] || difficulty
}

export const getDifficultyColor = (difficulty) => {
  const colors = QUESTION_DIFFICULTY_COLORS[difficulty]
  if (!colors) return 'bg-gray-100 text-gray-800 border-gray-200'
  return `${colors.bg} ${colors.text} ${colors.border}`
}

export const getAlternativeLetter = (index) => {
  return ALTERNATIVE_LETTERS[index] || String.fromCharCode(65 + index)
}

export const getCorrectAlternative = (alternatives) => {
  return alternatives?.find(alt => alt.isCorrect)
}

export const getCorrectAlternativeIndex = (alternatives) => {
  return alternatives?.findIndex(alt => alt.isCorrect) ?? -1
}

export const calculateScore = (answers, totalQuestions) => {
  if (!answers || !totalQuestions) return 0
  const correctAnswers = answers.filter(answer => answer.isCorrect).length
  return (correctAnswers / totalQuestions) * 100
}

// Subject Helpers
export const getSubjectColor = (colorValue) => {
  const color = SUBJECT_COLORS.find(c => c.value === colorValue)
  return color || SUBJECT_COLORS[0]
}

export const generateSubjectCode = (name) => {
  return generateCode(name, 6)
}

// Form Helpers
export const parseFormData = (formData) => {
  const data = {}
  for (const [key, value] of formData.entries()) {
    if (key.includes('[')) {
      // Handle array fields like alternatives[0][text]
      const keys = key.split(/[\[\]]+/).filter(Boolean)
      let current = data
      
      for (let i = 0; i < keys.length - 1; i++) {
        const currentKey = keys[i]
        if (!current[currentKey]) {
          current[currentKey] = isNaN(keys[i + 1]) ? {} : []
        }
        current = current[currentKey]
      }
      
      current[keys[keys.length - 1]] = value
    } else {
      data[key] = value
    }
  }
  return data
}

export const serializeForm = (form) => {
  const formData = new FormData(form)
  return parseFormData(formData)
}

// Validation Helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  return {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
}

export const getPasswordStrength = (password) => {
  const validation = validatePassword(password)
  const score = Object.values(validation).filter(Boolean).length
  
  if (score < 3) return { level: 'weak', color: 'red' }
  if (score < 4) return { level: 'medium', color: 'yellow' }
  return { level: 'strong', color: 'green' }
}

// URL Helpers
export const buildUrl = (base, params = {}) => {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.append(key, value)
    }
  })
  return url.toString()
}

export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

export const getQueryParam = (name, defaultValue = null) => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name) || defaultValue
}

// Storage Helpers
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Error setting localStorage:', error)
    return false
  }
}

export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error getting localStorage:', error)
    return defaultValue
  }
}

export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error removing localStorage:', error)
    return false
  }
}

export const clearLocalStorage = () => {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}

// Cookie Helpers
export const setCookie = (name, value, days = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

export const getCookie = (name) => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export const deleteCookie = (name) => {
  document.cookie = `${name}=; Max-Age=-99999999;`
}

// Device Detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isTablet = () => {
  return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent)
}

export const isDesktop = () => {
  return !isMobile() && !isTablet()
}

export const getDeviceType = () => {
  if (isMobile()) return 'mobile'
  if (isTablet()) return 'tablet'
  return 'desktop'
}

// Browser Detection
export const getBrowserInfo = () => {
  const ua = navigator.userAgent
  let browser = 'Unknown'
  
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'
  else if (ua.includes('Opera')) browser = 'Opera'
  
  return {
    name: browser,
    userAgent: ua,
    language: navigator.language,
    platform: navigator.platform
  }
}

// Color Helpers
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export const getContrastColor = (hexColor) => {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return '#000000'
  
  const brightness = Math.round(((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000)
  return brightness > 125 ? '#000000' : '#FFFFFF'
}

// File Helpers
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const getMimeType = (filename) => {
  const ext = getFileExtension(filename).toLowerCase()
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

export const isImageFile = (file) => {
  return file.type.startsWith('image/')
}

export const validateFileSize = (file, maxSizeInMB) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type)
}

// Download Helpers
export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadJSON = (data, filename = 'data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadFile(blob, filename)
}

export const downloadCSV = (data, filename = 'data.csv') => {
  const csvContent = Array.isArray(data) ? convertToCSV(data) : data
  const blob = new Blob([csvContent], { type: 'text/csv' })
  downloadFile(blob, filename)
}

export const convertToCSV = (array) => {
  if (!array.length) return ''
  
  const keys = Object.keys(array[0])
  const csvContent = [
    keys.join(','), // header
    ...array.map(item => 
      keys.map(key => {
        const value = item[key]
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}

// Performance Helpers
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const measurePerformance = (name, fn) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
  return result
}

// Error Helpers
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return 'Erro desconhecido'
}

export const formatErrorForUser = (error) => {
  const message = getErrorMessage(error)
  
  // Common error patterns
  if (message.includes('Network Error')) return 'Erro de conexão. Verifique sua internet.'
  if (message.includes('401')) return 'Sessão expirada. Faça login novamente.'
  if (message.includes('403')) return 'Você não tem permissão para esta ação.'
  if (message.includes('404')) return 'Recurso não encontrado.'
  if (message.includes('422')) return 'Dados inválidos. Verifique os campos.'
  if (message.includes('500')) return 'Erro interno do servidor. Tente novamente.'
  
  return message
}

// Math Helpers
export const roundToDecimals = (number, decimals = 2) => {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export const getAverage = (numbers) => {
  if (!numbers.length) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

export const getMedian = (numbers) => {
  if (!numbers.length) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  return sorted[middle]
}

export const getMode = (numbers) => {
  const frequency = {}
  let maxFreq = 0
  let mode = numbers[0]
  
  numbers.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num]
      mode = num
    }
  })
  
  return mode
}

export const getStandardDeviation = (numbers) => {
  const avg = getAverage(numbers)
  const squareDiffs = numbers.map(num => Math.pow(num - avg, 2))
  const avgSquareDiff = getAverage(squareDiffs)
  return Math.sqrt(avgSquareDiff)
}

// Export all helpers
export default {
  // Date and Time
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,
  formatDuration,
  parseDuration,
  
  // String
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  slugify,
  generateCode,
  searchText,
  
  // Number
  formatNumber,
  formatPercentage,
  formatFileSize,
  clamp,
  randomInt,
  
  // Array
  shuffle,
  groupBy,
  sortBy,
  uniqueBy,
  chunk,
  
  // Object
  pick,
  omit,
  deepClone,
  isEmpty,
  
  // Question
  getDifficultyLabel,
  getDifficultyColor,
  getAlternativeLetter,
  getCorrectAlternative,
  getCorrectAlternativeIndex,
  calculateScore,
  
  // Subject
  getSubjectColor,
  generateSubjectCode,
  
  // Form
  parseFormData,
  serializeForm,
  
  // Validation
  validateEmail,
  validatePassword,
  getPasswordStrength,
  
  // URL
  buildUrl,
  parseQueryString,
  getQueryParam,
  
  // Storage
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  setCookie,
  getCookie,
  deleteCookie,
  
  // Device
  isMobile,
  isTablet,
  isDesktop,
  getDeviceType,
  getBrowserInfo,
  
  // Color
  hexToRgb,
  rgbToHex,
  getContrastColor,
  
  // File
  getFileExtension,
  getMimeType,
  isImageFile,
  validateFileSize,
  validateFileType,
  
  // Download
  downloadFile,
  downloadJSON,
  downloadCSV,
  convertToCSV,
  
  // Performance
  debounce,
  throttle,
  measurePerformance,
  
  // Error
  getErrorMessage,
  formatErrorForUser,
  
  // Math
  roundToDecimals,
  getAverage,
  getMedian,
  getMode,
  getStandardDeviation
}