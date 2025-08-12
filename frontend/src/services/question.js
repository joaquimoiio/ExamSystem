import { apiClient } from './api'

export const questionService = {
  // Get all questions
  getQuestions: (params = {}) => {
    return apiClient.get('/questions', { params })
  },

  // Get question by ID
  getQuestion: (id) => {
    return apiClient.get(`/questions/${id}`)
  },

  // Create new question
  createQuestion: (questionData) => {
    return apiClient.post('/questions', questionData)
  },

  // Update question
  updateQuestion: (id, questionData) => {
    return apiClient.put(`/questions/${id}`, questionData)
  },

  // Delete question
  deleteQuestion: (id) => {
    return apiClient.delete(`/questions/${id}`)
  },

  // Duplicate question
  duplicateQuestion: (id) => {
    return apiClient.post(`/questions/${id}/duplicate`)
  },

  // Toggle question active status
  toggleQuestionActive: (id, active) => {
    return apiClient.patch(`/questions/${id}`, { active })
  },

  // Get questions by subject
  getQuestionsBySubject: (subjectId, params = {}) => {
    return apiClient.get(`/subjects/${subjectId}/questions`, { params })
  },

  // Search questions
  searchQuestions: (query, filters = {}) => {
    return apiClient.get('/questions/search', {
      params: {
        q: query,
        ...filters
      }
    })
  },

  // Get questions by difficulty
  getQuestionsByDifficulty: (difficulty, params = {}) => {
    return apiClient.get('/questions/by-difficulty', {
      params: {
        difficulty,
        ...params
      }
    })
  },

  // Get questions by tags
  getQuestionsByTags: (tags, params = {}) => {
    return apiClient.get('/questions/by-tags', {
      params: {
        tags: Array.isArray(tags) ? tags.join(',') : tags,
        ...params
      }
    })
  },

  // Bulk operations
  bulkUpdate: (ids, updateData) => {
    return apiClient.patch('/questions/bulk', {
      ids,
      data: updateData
    })
  },

  bulkDelete: (ids) => {
    return apiClient.delete('/questions/bulk', {
      data: { ids }
    })
  },

  bulkMove: (ids, targetSubjectId) => {
    return apiClient.patch('/questions/bulk/move', {
      ids,
      subjectId: targetSubjectId
    })
  },

  bulkTag: (ids, tags) => {
    return apiClient.patch('/questions/bulk/tag', {
      ids,
      tags
    })
  },

  // Question statistics
  getQuestionStats: (id) => {
    return apiClient.get(`/questions/${id}/stats`)
  },

  getQuestionUsage: (id) => {
    return apiClient.get(`/questions/${id}/usage`)
  },

  // Question validation
  validateQuestion: (questionData) => {
    return apiClient.post('/questions/validate', questionData)
  },

  // Question preview
  previewQuestion: (questionData) => {
    return apiClient.post('/questions/preview', questionData)
  },

  // Import/Export
  exportQuestions: (filters = {}, format = 'json') => {
    return apiClient.download('/questions/export', {
      params: {
        ...filters,
        format
      }
    })
  },

  importQuestions: (file, subjectId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('subjectId', subjectId)
    return apiClient.upload('/questions/import', formData)
  },

  // Question templates
  getQuestionTemplates: () => {
    return apiClient.get('/questions/templates')
  },

  createQuestionFromTemplate: (templateId, questionData) => {
    return apiClient.post(`/questions/templates/${templateId}/create`, questionData)
  },

  // Question reviews
  getQuestionReviews: (id) => {
    return apiClient.get(`/questions/${id}/reviews`)
  },

  addQuestionReview: (id, reviewData) => {
    return apiClient.post(`/questions/${id}/reviews`, reviewData)
  },

  updateQuestionReview: (id, reviewId, reviewData) => {
    return apiClient.put(`/questions/${id}/reviews/${reviewId}`, reviewData)
  },

  deleteQuestionReview: (id, reviewId) => {
    return apiClient.delete(`/questions/${id}/reviews/${reviewId}`)
  },

  // Question comments
  getQuestionComments: (id) => {
    return apiClient.get(`/questions/${id}/comments`)
  },

  addQuestionComment: (id, commentData) => {
    return apiClient.post(`/questions/${id}/comments`, commentData)
  },

  updateQuestionComment: (id, commentId, commentData) => {
    return apiClient.put(`/questions/${id}/comments/${commentId}`, commentData)
  },

  deleteQuestionComment: (id, commentId) => {
    return apiClient.delete(`/questions/${id}/comments/${commentId}`)
  },

  // Question history
  getQuestionHistory: (id) => {
    return apiClient.get(`/questions/${id}/history`)
  },

  restoreQuestionVersion: (id, versionId) => {
    return apiClient.post(`/questions/${id}/restore`, { versionId })
  },

  // Question difficulty analysis
  analyzeQuestionDifficulty: (id) => {
    return apiClient.post(`/questions/${id}/analyze-difficulty`)
  },

  // Question similarity
  findSimilarQuestions: (id, threshold = 0.7) => {
    return apiClient.get(`/questions/${id}/similar`, {
      params: { threshold }
    })
  },

  // Question media
  uploadQuestionImage: (id, file) => {
    const formData = new FormData()
    formData.append('image', file)
    return apiClient.upload(`/questions/${id}/images`, formData)
  },

  deleteQuestionImage: (id, imageId) => {
    return apiClient.delete(`/questions/${id}/images/${imageId}`)
  },

  // Question tags management
  getAllTags: () => {
    return apiClient.get('/questions/tags')
  },

  getPopularTags: (limit = 20) => {
    return apiClient.get('/questions/tags/popular', {
      params: { limit }
    })
  },

  createTag: (tagData) => {
    return apiClient.post('/questions/tags', tagData)
  },

  updateTag: (id, tagData) => {
    return apiClient.put(`/questions/tags/${id}`, tagData)
  },

  deleteTag: (id) => {
    return apiClient.delete(`/questions/tags/${id}`)
  },

  // Question collections
  getQuestionCollections: () => {
    return apiClient.get('/questions/collections')
  },

  createQuestionCollection: (collectionData) => {
    return apiClient.post('/questions/collections', collectionData)
  },

  addQuestionToCollection: (collectionId, questionId) => {
    return apiClient.post(`/questions/collections/${collectionId}/questions`, {
      questionId
    })
  },

  removeQuestionFromCollection: (collectionId, questionId) => {
    return apiClient.delete(`/questions/collections/${collectionId}/questions/${questionId}`)
  },

  // Question recommendations
  getRecommendedQuestions: (subjectId, difficulty, limit = 10) => {
    return apiClient.get('/questions/recommendations', {
      params: {
        subjectId,
        difficulty,
        limit
      }
    })
  },

  // Question performance analytics
  getQuestionPerformance: (id, timeRange = '30d') => {
    return apiClient.get(`/questions/${id}/performance`, {
      params: { timeRange }
    })
  },

  getQuestionsPerformanceReport: (filters = {}) => {
    return apiClient.get('/questions/performance-report', {
      params: filters
    })
  }
}