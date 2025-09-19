class ApiService {
  constructor() {
    // CORREÇÃO: URL correta do backend
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.timeout = 10000;
    this.token = null;
    
    // Recuperar token do localStorage
    this.token = localStorage.getItem('authToken');
    
    console.log('🚀 ApiService inicializado');
    console.log('📍 Base URL:', this.baseURL);
    console.log('🔑 Token inicial:', this.token ? 'Presente' : 'Ausente');
  }

  setToken(token) {
    this.token = token;
    console.log('🔑 Token atualizado:', token ? 'Definido' : 'Removido');
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    if (options.data && config.method !== 'GET') {
      config.body = JSON.stringify(options.data);
    }

    console.log(`🌐 Fazendo requisição: ${config.method} ${url}`);
    console.log('📋 Dados:', options.data);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
      console.log(`📍 Resposta recebida: ${JSON.stringify({status: response.status, statusText: response.statusText, ok: response.ok})}`);

      let data;
      try {
        data = await response.json();
        console.log('📋 Dados da resposta:', data);
      } catch (jsonError) {
        console.error('❌ Erro ao fazer parse JSON:', jsonError);
        data = { success: false, message: 'Resposta inválida do servidor' };
      }

      if (!response.ok) {
        console.error(`❌ Erro na requisição: ${data.message || response.statusText}`);
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Requisição bem-sucedida');
      return data;

    } catch (error) {
      console.error(`❌ Erro na requisição: ${error.message}`);
      
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite excedido. Tente novamente.');
      }
      
      if (error.message) {
        throw error;
      }
      
      throw new Error('Erro de conexão. Verifique sua internet.');
    }
  }

  // Métodos HTTP
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'POST', 
      data 
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PUT', 
      data 
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Login específico
  async login(credentials) {
    console.log('🔐 Tentativa de login via ApiService');
    console.log('📧 Email:', credentials.email);
    
    try {
      const response = await this.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password
      });
      
      console.log('📥 Resposta do login:', response);
      
      if (response && response.success && response.data) {
        const { token, user } = response.data;
        
        if (token) {
          this.setToken(token);
          localStorage.setItem('authToken', token);
          console.log('✅ Token salvo');
        }
        
        if (user) {
          localStorage.setItem('userData', JSON.stringify(user));
          console.log('✅ Dados do usuário salvos');
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Erro no login (ApiService):', error.message);
      throw error;
    }
  }

  async register(userData) {
    console.log('📝 Tentativa de registro via ApiService');
    
    try {
      const response = await this.post('/auth/register', userData);
      console.log('📥 Resposta do registro:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro no registro (ApiService):', error.message);
      throw error;
    }
  }

  async logout() {
    console.log('🚪 Logout via ApiService');
    
    try {
      // Limpar dados locais
      this.setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      console.log('✅ Logout concluído');
    } catch (error) {
      console.warn('⚠️ Erro no logout:', error.message);
    }
  }

  // ================================
  // SUBJECTS API
  // ================================
  
  async getSubjects(params = {}) {
    console.log('📚 Buscando disciplinas');
    return this.get('/subjects', { params });
  }

  async getSubjectById(id) {
    console.log('📖 Buscando disciplina:', id);
    return this.get(`/subjects/${id}`);
  }

  async createSubject(data) {
    console.log('➕ Criando disciplina:', data);
    return this.post('/subjects', data);
  }

  async updateSubject(id, data) {
    console.log('✏️ Atualizando disciplina:', id, data);
    return this.put(`/subjects/${id}`, data);
  }

  async deleteSubject(id) {
    console.log('🗑️ Deletando disciplina:', id);
    return this.delete(`/subjects/${id}`);
  }

  async getSubjectsStats() {
    console.log('📊 Buscando estatísticas das disciplinas');
    return this.get('/subjects/stats');
  }

  // ================================
  // QUESTIONS API
  // ================================
  
  async getQuestions(params = {}) {
    console.log('❓ Buscando questões com params:', params);
    return this.get('/questions', { params });
  }

  async getQuestionById(id) {
    console.log('❓ Buscando questão:', id);
    return this.get(`/questions/${id}`);
  }

  async createQuestion(data) {
    console.log('➕ Criando questão:', data);
    return this.post('/questions', data);
  }

  async updateQuestion(id, data) {
    console.log('✏️ Atualizando questão:', id, data);
    return this.put(`/questions/${id}`, data);
  }

  async updateQuestionPoints(id, points) {
    console.log('🎯 Atualizando pontos da questão:', id, points);
    return this.put(`/questions/${id}/points`, { points });
  }

  async deleteQuestion(id) {
    console.log('🗑️ Deletando questão:', id);
    return this.delete(`/questions/${id}`);
  }

  async getQuestionsStats() {
    console.log('📊 Buscando estatísticas das questões');
    return this.get('/questions/stats');
  }

  async duplicateQuestion(id) {
    console.log('📋 Duplicando questão:', id);
    return this.post(`/questions/${id}/duplicate`);
  }

  // ================================
  // EXAMS API
  // ================================
  
  async getExams(params = {}) {
    console.log('📝 Buscando provas');
    return this.get('/exams', { params });
  }

  async getExamById(id) {
    console.log('📝 Buscando prova:', id);
    return this.get(`/exams/${id}`);
  }

  async createExam(data) {
    console.log('➕ Criando prova:', data);
    return this.post('/exams', data);
  }

  async updateExam(id, data) {
    console.log('✏️ Atualizando prova:', id, data);
    return this.put(`/exams/${id}`, data);
  }

  async deleteExam(id) {
    console.log('🗑️ Deletando prova:', id);
    return this.delete(`/exams/${id}`);
  }

  async publishExam(id) {
    console.log('🚀 Publicando prova:', id);
    return this.post(`/exams/${id}/publish`);
  }

  async regenerateVariations(id) {
    console.log('🔄 Regenerando variações da prova:', id);
    return this.post(`/exams/${id}/regenerate-variations`);
  }

  async generatePDFs(id) {
    console.log('📄 Gerando PDFs da prova:', id);
    return this.post(`/exams/${id}/generate-pdfs`);
  }

  async getExamsStats() {
    console.log('📊 Buscando estatísticas das provas');
    return this.get('/exams/stats');
  }

  async updateExamQuestions(id, data) {
    console.log('📝 Atualizando questões da prova:', id, data);
    return this.put(`/exams/${id}/questions`, data);
  }

  // ================================
  // DASHBOARD STATS
  // ================================
  
  async getDashboardStats() {
    console.log('📊 Buscando estatísticas do dashboard');
    try {
      const [subjectsRes, questionsRes, examsRes] = await Promise.all([
        this.get('/subjects/stats').catch(() => ({ data: { total: 0 } })),
        this.get('/questions/stats').catch(() => ({ data: { total: 0 } })),
        this.get('/exams/stats').catch(() => ({ data: { total: 0, published: 0 } }))
      ]);

      return {
        success: true,
        data: {
          subjects: subjectsRes.data?.total || 0,
          questions: questionsRes.data?.total || 0,
          exams: examsRes.data?.total || 0,
          publishedExams: examsRes.data?.published || 0
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
      return {
        success: true,
        data: {
          subjects: 0,
          questions: 0,
          exams: 0,
          publishedExams: 0
        }
      };
    }
  }

  async getRecentActivity() {
    console.log('📋 Buscando atividade recente');
    try {
      const response = await this.get('/activity/recent');
      console.log('✅ Atividades recentes carregadas:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar atividade recente:', error);
      return { success: true, data: [] };
    }
  }

  // ================================
  // EXAM HEADERS API
  // ================================
  
  async getExamHeaders(params = {}) {
    console.log('📋 Buscando cabeçalhos de prova');
    return this.get('/exam-headers', { params });
  }

  async getExamHeaderById(id) {
    console.log('📋 Buscando cabeçalho de prova:', id);
    return this.get(`/exam-headers/${id}`);
  }

  async createExamHeader(data) {
    console.log('➕ Criando cabeçalho de prova:', data);
    return this.post('/exam-headers', data);
  }

  async updateExamHeader(id, data) {
    console.log('✏️ Atualizando cabeçalho de prova:', id, data);
    return this.put(`/exam-headers/${id}`, data);
  }

  async deleteExamHeader(id) {
    console.log('🗑️ Deletando cabeçalho de prova:', id);
    return this.delete(`/exam-headers/${id}`);
  }

  async getDefaultExamHeader() {
    console.log('📋 Buscando cabeçalho padrão');
    return this.get('/exam-headers/default');
  }

  async setExamHeaderAsDefault(id) {
    console.log('⭐ Definindo cabeçalho como padrão:', id);
    return this.put(`/exam-headers/${id}/set-default`);
  }

  async generateAnswerSheet(id) {
    console.log('📋 Gerando gabarito para o exame:', id);
    return this.get(`/exams/${id}/answer-sheet`);
  }

  async generateAllVariationsPDF(id, layout = 'single') {
    console.log('📄 Gerando PDF com todas as variações:', id, 'Layout:', layout);
    // Para download de arquivo, precisamos fazer uma requisição especial
    const response = await fetch(`${this.baseURL}/exams/${id}/generate-all-variations-pdf?layout=${layout}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao gerar PDF das variações');
    }
    
    return response;
  }

  async generateSingleVariationPDF(examId, variationId) {
    console.log('📄 Gerando PDF da variação individual:', examId, variationId);
    // Para download de arquivo, precisamos fazer uma requisição especial
    const response = await fetch(`${this.baseURL}/exams/${examId}/variations/${variationId}/generate-pdf`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Erro ao gerar PDF da variação');
    }
    
    return response;
  }

  async getExamVariation(examId, variationId) {
    console.log('📋 Buscando variação do exame:', examId, variationId);
    return this.get(`/exams/${examId}/variations/${variationId}`);
  }

  // QR Code and Camera Correction API methods
  
  /**
   * Validate QR code answers (existing method)
   */
  async validateQRAnswers(qrData, studentAnswers, studentInfo) {
    console.log('🔍 Validando respostas via QR code');
    return this.post('/exams/validate-qr', {
      qrData,
      studentAnswers,
      studentInfo
    });
  }

  /**
   * Correct answers using camera detection
   */
  async correctAnswersFromCamera(qrData, detectedAnswers, studentInfo, confidence) {
    console.log('📷 Corrigindo respostas via detecção de câmera');
    return this.post('/exams/correct-camera', {
      qrData,
      detectedAnswers,
      studentInfo,
      confidence
    });
  }
}

// Instância única
const apiService = new ApiService();
export default apiService;