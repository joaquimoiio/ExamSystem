import { apiClient } from './api'

export const authService = {
  // Login user
  login: (credentials) => {
    return apiClient.post('/auth/login', credentials)
  },

  // Register user
  register: (userData) => {
    return apiClient.post('/auth/register', userData)
  },

  // Logout user
  logout: () => {
    return apiClient.post('/auth/logout')
  },

  // Get user profile
  getProfile: () => {
    return apiClient.get('/auth/profile')
  },

  // Update user profile
  updateProfile: (profileData) => {
    return apiClient.put('/auth/profile', profileData)
  },

  // Change password
  changePassword: (passwordData) => {
    return apiClient.post('/auth/change-password', passwordData)
  },

  // Forgot password
  forgotPassword: (email) => {
    return apiClient.post('/auth/forgot-password', { email })
  },

  // Reset password
  resetPassword: (resetData) => {
    return apiClient.post('/auth/reset-password', resetData)
  },

  // Refresh token
  refreshToken: (refreshToken) => {
    return apiClient.post('/auth/refresh-token', { refreshToken })
  },

  // Get user statistics
  getUserStats: () => {
    return apiClient.get('/auth/stats')
  },

  // Deactivate account
  deactivateAccount: () => {
    return apiClient.post('/auth/deactivate')
  }
}