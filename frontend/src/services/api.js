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
}

// Instância única
const apiService = new ApiService();
export default apiService;