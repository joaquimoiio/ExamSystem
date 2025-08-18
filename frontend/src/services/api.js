// frontend/src/services/api.js - VERSÃO ATUALIZADA
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
      
      // Se a resposta não for JSON, tratar como erro
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Resposta inválida do servidor (Status: ${response.status})`);
      }

      // Se não foi bem-sucedido, lançar erro com a mensagem do servidor
      if (!response.ok) {
        // Se token expirou, limpar dados de auth
        if (response.status === 401) {
          this.setToken(null);
          localStorage.removeItem('userData');
        }
        
        throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Tratar diferentes tipos de erro
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
      }
      
      if (error.name === 'AbortError') {
        throw new Error('Requisição cancelada por timeout.');
      }
      
      // Re-lançar o erro original se já for uma mensagem customizada
      throw error;
    }
  }

  // Auth methods
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    
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
    } finally {
      this.setToken(null);
    }
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
}

export default new ApiService();