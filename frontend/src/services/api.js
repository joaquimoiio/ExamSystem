// frontend/src/services/api.js
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.token = null;
    this.timeout = 30000; // 30 segundos
    
    // Carregar token do localStorage na inicialização
    this.token = localStorage.getItem('authToken');
    
    console.log('🔧 ApiService inicializado:', {
      baseURL: this.baseURL,
      hasToken: !!this.token
    });
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('✅ Token definido no ApiService');
    } else {
      localStorage.removeItem('authToken');
      console.log('🗑️ Token removido do ApiService');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const currentToken = this.getToken();
    
    console.log('📡 Fazendo requisição:', {
      method: options.method || 'GET',
      url,
      hasToken: !!currentToken,
      hasBody: !!options.body
    });

    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    // Adicionar token de autorização se disponível
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }

    // Adicionar body se fornecido
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn('⚠️ Resposta não é JSON:', text);
        data = { message: text };
      }

      // Log da resposta para debug
      console.log('📋 Dados da resposta:', data);

      if (!response.ok) {
        // Tratamento específico para diferentes códigos de erro
        const errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          // Token inválido ou expirado
          console.warn('🔒 Token inválido, removendo...');
          this.setToken(null);
          
          // Se não for uma tentativa de login, rejeitar com erro de autenticação
          if (!endpoint.includes('/auth/login')) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      
      // Tratamento de diferentes tipos de erro
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
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
    console.log('🔑 Tentando login via API...');
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
      console.log('✅ Token salvo após login bem-sucedido');
    }
    
    return response;
  }

  async register(userData) {
    console.log('📝 Registrando novo usuário via API...');
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async getProfile() {
    console.log('👤 Buscando perfil do usuário...');
    return this.request('/auth/profile');
  }

  async updateProfile(userData) {
    console.log('✏️ Atualizando perfil do usuário...');
    return this.request('/auth/profile', {
      method: 'PUT',
      body: userData,
    });
  }

  async logout() {
    console.log('👋 Fazendo logout...');
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('⚠️ Erro no logout (backend):', error.message);
    } finally {
      this.setToken(null);
      console.log('✅ Logout local concluído');
    }
  }

  async changePassword(passwordData) {
    console.log('🔑 Alterando senha...');
    return this.request('/auth/change-password', {
      method: 'POST',
      body: passwordData,
    });
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

  async unpublishExam(id) {
    return this.request(`/exams/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      return {
        success: false,
        message: 'Serviço indisponível',
        error: error.message
      };
    }
  }

  // Test connection
  async testConnection() {
    console.log('🔍 Testando conexão com a API...');
    try {
      const response = await this.healthCheck();
      console.log('✅ Conexão com a API OK:', response);
      return response;
    } catch (error) {
      console.error('❌ Falha na conexão com a API:', error);
      throw error;
    }
  }
}

// Criar instância única
const apiService = new ApiService();

export default apiService;