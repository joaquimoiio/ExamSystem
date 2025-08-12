import { apiClient } from './api'

export const examService = {
  // Basic CRUD operations
  getExams: (params = {}) => {
    return apiClient.get('/exams', { params })
  },

  getExam: (id) => {
    return apiClient.get(`/exams/${id}`)
  },

  createExam: (examData) => {
    return apiClient.post('/exams', examData)
  },

  updateExam: (id, examData) => {
    return apiClient.put(`/exams/${id}`, examData)
  },

  deleteExam: (id) => {
    return apiClient.delete(`/exams/${id}`)
  },

  duplicateExam: (id, newTitle) => {
    return apiClient.post(`/exams/${id}/duplicate`, { title: newTitle })
  },

  // Exam status management
  publishExam: (id) => {
    return apiClient.patch(`/exams/${id}/publish`)
  },

  unpublishExam: (id) => {
    return apiClient.patch(`/exams/${id}/unpublish`)
  },

  activateExam: (id) => {
    return apiClient.patch(`/exams/${id}/activate`)
  },

  closeExam: (id) => {
    return apiClient.patch(`/exams/${id}/close`)
  },

  archiveExam: (id) => {
    return apiClient.patch(`/exams/${id}/archive`)
  },

  // Exam generation
  generateExam: (examConfig) => {
    return apiClient.post('/exams/generate', examConfig)
  },

  generateExamVariations: (id, variationCount = 1) => {
    return apiClient.post(`/exams/${id}/variations`, { count: variationCount })
  },

  getExamVariations: (id) => {
    return apiClient.get(`/exams/${id}/variations`)
  },

  // PDF generation
  generateExamPDF: (id, options = {}) => {
    return apiClient.download(`/exams/${id}/pdf`, {
      params: options,
      responseType: 'blob'
    })
  },

  generateAnswerKeyPDF: (id, options = {}) => {
    return apiClient.download(`/exams/${id}/answer-key`, {
      params: options,
      responseType: 'blob'
    })
  },

  // QR Code management
  getExamQRCode: (id, format = 'png') => {
    return apiClient.get(`/exams/${id}/qr-code`, {
      params: { format },
      responseType: 'blob'
    })
  },

  generateExamQRCode: (id, options = {}) => {
    return apiClient.post(`/exams/${id}/qr-code`, options)
  },

  // Public exam access
  getPublicExam: (id, accessCode = null) => {
    return apiClient.get(`/public/exams/${id}`, {
      params: accessCode ? { code: accessCode } : {}
    })
  },

  validateExamAccess: (id, accessData) => {
    return apiClient.post(`/public/exams/${id}/validate`, accessData)
  },

  // Student submissions
  submitExamAnswers: (examId, submissionData) => {
    return apiClient.post(`/public/exams/${examId}/submit`, submissionData)
  },

  getSubmissionResult: (submissionId) => {
    return apiClient.get(`/submissions/${submissionId}/result`)
  },

  // Exam submissions management
  getExamSubmissions: (id, params = {}) => {
    return apiClient.get(`/exams/${id}/submissions`, { params })
  },

  getSubmission: (examId, submissionId) => {
    return apiClient.get(`/exams/${examId}/submissions/${submissionId}`)
  },

  gradeSubmission: (examId, submissionId, gradeData) => {
    return apiClient.post(`/exams/${examId}/submissions/${submissionId}/grade`, gradeData)
  },

  updateSubmissionGrade: (examId, submissionId, gradeData) => {
    return apiClient.put(`/exams/${examId}/submissions/${submissionId}/grade`, gradeData)
  },

  addSubmissionFeedback: (examId, submissionId, feedback) => {
    return apiClient.post(`/exams/${examId}/submissions/${submissionId}/feedback`, feedback)
  },

  // Bulk grading
  bulkGradeSubmissions: (examId, gradingData) => {
    return apiClient.post(`/exams/${examId}/submissions/bulk-grade`, gradingData)
  },

  autoGradeSubmissions: (examId) => {
    return apiClient.post(`/exams/${examId}/submissions/auto-grade`)
  },

  // Exam statistics and analytics
  getExamStats: (id) => {
    return apiClient.get(`/exams/${id}/stats`)
  },

  getExamAnalytics: (id, timeRange = '30d') => {
    return apiClient.get(`/exams/${id}/analytics`, {
      params: { timeRange }
    })
  },

  getQuestionAnalytics: (examId, questionId) => {
    return apiClient.get(`/exams/${examId}/questions/${questionId}/analytics`)
  },

  // Reports
  generateExamReport: (id, reportType = 'detailed') => {
    return apiClient.download(`/exams/${id}/reports/${reportType}`, {
      responseType: 'blob'
    })
  },

  getExamPerformanceReport: (id) => {
    return apiClient.get(`/exams/${id}/performance-report`)
  },

  exportExamResults: (id, format = 'xlsx') => {
    return apiClient.download(`/exams/${id}/export-results`, {
      params: { format },
      responseType: 'blob'
    })
  },

  // Exam scheduling
  scheduleExam: (id, scheduleData) => {
    return apiClient.post(`/exams/${id}/schedule`, scheduleData)
  },

  updateExamSchedule: (id, scheduleData) => {
    return apiClient.put(`/exams/${id}/schedule`, scheduleData)
  },

  cancelExamSchedule: (id) => {
    return apiClient.delete(`/exams/${id}/schedule`)
  },

  // Exam monitoring
  getExamSession: (examId, sessionId) => {
    return apiClient.get(`/exams/${examId}/sessions/${sessionId}`)
  },

  getActiveExamSessions: (id) => {
    return apiClient.get(`/exams/${id}/sessions/active`)
  },

  flagSuspiciousActivity: (examId, sessionId, activityData) => {
    return apiClient.post(`/exams/${examId}/sessions/${sessionId}/flag`, activityData)
  },

  // Exam templates
  getExamTemplates: () => {
    return apiClient.get('/exam-templates')
  },

  createExamTemplate: (templateData) => {
    return apiClient.post('/exam-templates', templateData)
  },

  createExamFromTemplate: (templateId, examData) => {
    return apiClient.post(`/exam-templates/${templateId}/create-exam`, examData)
  },

  // Exam sharing and collaboration
  shareExam: (id, shareData) => {
    return apiClient.post(`/exams/${id}/share`, shareData)
  },

  getSharedExams: (params = {}) => {
    return apiClient.get('/exams/shared', { params })
  },

  // Exam access control
  updateExamAccess: (id, accessData) => {
    return apiClient.put(`/exams/${id}/access`, accessData)
  },

  getExamAccessLogs: (id, params = {}) => {
    return apiClient.get(`/exams/${id}/access-logs`, { params })
  },

  // Question randomization
  updateQuestionOrder: (id, questionOrder) => {
    return apiClient.put(`/exams/${id}/question-order`, { order: questionOrder })
  },

  randomizeQuestions: (id) => {
    return apiClient.post(`/exams/${id}/randomize-questions`)
  },

  // Exam proctoring
  enableProctoring: (id, proctoringSettings) => {
    return apiClient.post(`/exams/${id}/proctoring`, proctoringSettings)
  },

  disableProctoring: (id) => {
    return apiClient.delete(`/exams/${id}/proctoring`)
  },

  getProctoringEvents: (examId, sessionId) => {
    return apiClient.get(`/exams/${examId}/sessions/${sessionId}/proctoring-events`)
  },

  // Exam backup and restore
  backupExam: (id) => {
    return apiClient.post(`/exams/${id}/backup`)
  },

  restoreExam: (id, backupId) => {
    return apiClient.post(`/exams/${id}/restore`, { backupId })
  },

  getExamBackups: (id) => {
    return apiClient.get(`/exams/${id}/backups`)
  },

  // Search and filtering
  searchExams: (query, filters = {}) => {
    return apiClient.get('/exams/search', {
      params: {
        q: query,
        ...filters
      }
    })
  },

  getExamsBySubject: (subjectId, params = {}) => {
    return apiClient.get(`/subjects/${subjectId}/exams`, { params })
  },

  getExamsByStatus: (status, params = {}) => {
    return apiClient.get('/exams/by-status', {
      params: {
        status,
        ...params
      }
    })
  },

  // Exam validation
  validateExamStructure: (examData) => {
    return apiClient.post('/exams/validate', examData)
  },

  checkExamReadiness: (id) => {
    return apiClient.get(`/exams/${id}/readiness-check`)
  },

  // Exam notifications
  sendExamNotification: (id, notificationData) => {
    return apiClient.post(`/exams/${id}/notifications`, notificationData)
  },

  getExamNotifications: (id) => {
    return apiClient.get(`/exams/${id}/notifications`)
  }
}