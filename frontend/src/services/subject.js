import { apiClient } from './api'

export const subjectService = {
  // Get all subjects
  getSubjects: (params = {}) => {
    return apiClient.get('/subjects', { params })
  },

  // Get subject by ID
  getSubject: (id) => {
    return apiClient.get(`/subjects/${id}`)
  },

  // Create new subject
  createSubject: (subjectData) => {
    return apiClient.post('/subjects', subjectData)
  },

  // Update subject
  updateSubject: (id, subjectData) => {
    return apiClient.put(`/subjects/${id}`, subjectData)
  },

  // Delete subject
  deleteSubject: (id) => {
    return apiClient.delete(`/subjects/${id}`)
  },

  // Duplicate subject
  duplicateSubject: (id, newName) => {
    return apiClient.post(`/subjects/${id}/duplicate`, { name: newName })
  },

  // Get subject questions
  getSubjectQuestions: (id, params = {}) => {
    return apiClient.get(`/subjects/${id}/questions`, { params })
  },

  // Add question to subject
  addQuestionToSubject: (subjectId, questionData) => {
    return apiClient.post(`/subjects/${subjectId}/questions`, questionData)
  },

  // Get subject statistics
  getSubjectStats: (id) => {
    return apiClient.get(`/subjects/${id}/stats`)
  },

  // Export subject with questions
  exportSubject: (id, format = 'json') => {
    return apiClient.download(`/subjects/${id}/export`, {
      params: { format }
    })
  },

  // Import subject from file
  importSubject: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload('/subjects/import', formData)
  },

  // Bulk operations
  bulkUpdate: (ids, updateData) => {
    return apiClient.patch('/subjects/bulk', {
      ids,
      data: updateData
    })
  },

  bulkDelete: (ids) => {
    return apiClient.delete('/subjects/bulk', {
      data: { ids }
    })
  },

  // Search subjects
  searchSubjects: (query, filters = {}) => {
    return apiClient.get('/subjects/search', {
      params: {
        q: query,
        ...filters
      }
    })
  },

  // Get subjects by user
  getSubjectsByUser: (userId, params = {}) => {
    return apiClient.get(`/users/${userId}/subjects`, { params })
  },

  // Share subject
  shareSubject: (id, shareData) => {
    return apiClient.post(`/subjects/${id}/share`, shareData)
  },

  // Get shared subjects
  getSharedSubjects: (params = {}) => {
    return apiClient.get('/subjects/shared', { params })
  },

  // Archive/Unarchive subject
  archiveSubject: (id) => {
    return apiClient.patch(`/subjects/${id}/archive`)
  },

  unarchiveSubject: (id) => {
    return apiClient.patch(`/subjects/${id}/unarchive`)
  },

  // Get archived subjects
  getArchivedSubjects: (params = {}) => {
    return apiClient.get('/subjects/archived', { params })
  },

  // Subject templates
  getSubjectTemplates: () => {
    return apiClient.get('/subjects/templates')
  },

  createSubjectFromTemplate: (templateId, subjectData) => {
    return apiClient.post(`/subjects/templates/${templateId}/create`, subjectData)
  },

  // Subject collaborators
  getSubjectCollaborators: (id) => {
    return apiClient.get(`/subjects/${id}/collaborators`)
  },

  addCollaborator: (id, collaboratorData) => {
    return apiClient.post(`/subjects/${id}/collaborators`, collaboratorData)
  },

  removeCollaborator: (id, collaboratorId) => {
    return apiClient.delete(`/subjects/${id}/collaborators/${collaboratorId}`)
  },

  updateCollaboratorRole: (id, collaboratorId, role) => {
    return apiClient.patch(`/subjects/${id}/collaborators/${collaboratorId}`, { role })
  },

  // Subject activity
  getSubjectActivity: (id, params = {}) => {
    return apiClient.get(`/subjects/${id}/activity`, { params })
  },

  // Subject backup
  backupSubject: (id) => {
    return apiClient.post(`/subjects/${id}/backup`)
  },

  restoreSubject: (id, backupId) => {
    return apiClient.post(`/subjects/${id}/restore`, { backupId })
  },

  getSubjectBackups: (id) => {
    return apiClient.get(`/subjects/${id}/backups`)
  }
}