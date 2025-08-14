// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Sem conexão com o servidor. Verifique sua internet.');
      }
      throw error;
    }
  }

  // Auth methods
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    this.setToken(response.data.token);
    return response;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: userData,
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    this.setToken(null);
  }

  // Subject methods
  async getSubjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/subjects${queryString ? `?${queryString}` : ''}`);
  }

  async getSubjectById(id) {
    return this.request(`/subjects/${id}`);
  }

  async createSubject(subjectData) {
    return this.request('/subjects', {
      method: 'POST',
      body: subjectData,
    });
  }

  async updateSubject(id, subjectData) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: subjectData,
    });
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // Question methods
  async getQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/questions${queryString ? `?${queryString}` : ''}`);
  }

  async getQuestionById(id) {
    return this.request(`/questions/${id}`);
  }

  async createQuestion(questionData) {
    return this.request('/questions', {
      method: 'POST',
      body: questionData,
    });
  }

  async updateQuestion(id, questionData) {
    return this.request(`/questions/${id}`, {
      method: 'PUT',
      body: questionData,
    });
  }

  async deleteQuestion(id) {
    return this.request(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateQuestions(questionsData) {
    return this.request('/questions/bulk', {
      method: 'POST',
      body: questionsData,
    });
  }

  // Exam methods
  async getExams(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/exams${queryString ? `?${queryString}` : ''}`);
  }

  async getExamById(id) {
    return this.request(`/exams/${id}`);
  }

  async createExam(examData) {
    return this.request('/exams', {
      method: 'POST',
      body: examData,
    });
  }

  async updateExam(id, examData) {
    return this.request(`/exams/${id}`, {
      method: 'PUT',
      body: examData,
    });
  }

  async deleteExam(id) {
    return this.request(`/exams/${id}`, {
      method: 'DELETE',
    });
  }

  async publishExam(id) {
    return this.request(`/exams/${id}/publish`, {
      method: 'POST',
    });
  }

  async generatePDFs(id) {
    return this.request(`/exams/${id}/generate-pdfs`, {
      method: 'POST',
    });
  }

  async getExamStatistics(id) {
    return this.request(`/exams/${id}/statistics`);
  }

  // Correction methods
  async getSubmissions(examId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/corrections/exams/${examId}/submissions${queryString ? `?${queryString}` : ''}`);
  }

  async getExamCorrections(examId) {
    return this.request(`/corrections/exams/${examId}/statistics`);
  }

  // Public methods (for students)
  async validateQR(qrData) {
    return this.request('/public/validate-qr', {
      method: 'POST',
      body: { qrData },
    });
  }

  async scanQR(examId, variationId) {
    return this.request(`/public/scan/${examId}/${variationId}`);
  }

  async submitAnswers(examId, variationId, answers) {
    return this.request(`/public/submit/${examId}/${variationId}`, {
      method: 'POST',
      body: { answers },
    });
  }

  // File upload methods
  async uploadFile(file, type = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      headers: {
        // Remove Content-Type to let browser set boundary for FormData
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();