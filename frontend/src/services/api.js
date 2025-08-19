// frontend/src/services/api.js - CORREÇÃO COMPLETA

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    this.timeout = 10000; // 10 segundos
    this.token = null;
    
    // Recuperar token do localStorage na inicialização
    this.token = localStorage.getItem('authToken');
    
    console.log('🚀 ApiService inicializado');
    console.log('📍 Base URL:', this.baseURL);
    console.log('🔑 Token inicial:', this.token ? 'Presente' : 'Ausente');
  }

  setToken(token) {
    this.token = token;
    console.log('🔑 Token atualizado:', token ? '✅ Definido' : '❌ Removido');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    console.log('🗑️ Token removido do ApiService');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 ${options.method || 'GET'} ${url}`);
    
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Adicionar token de autenticação se disponível
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
      console.log('🔐 Token adicionado à requisição');
    }

    // Adicionar body se fornecido
    if (options.data) {
      config.body = JSON.stringify(options.data);
      console.log('📤 Dados enviados:', options.data);
    }

    try {
      console.log('⏳ Fazendo requisição...');
      
      // Controller para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
      console.log(`📍 Resposta recebida: {status: ${response.status}, statusText: '${response.statusText}', ok: ${response.ok}}`);
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📋 Dados da resposta:', data);
      } else {
        const text = await response.text();
        console.log('📄 Resposta em texto:', text);
        data = { message: text };
      }

      // Se não autenticado, limpar token
      if (response.status === 401) {
        console.log('🔒 Token inválido, removendo...');
        this.removeToken();
        
        // Se a resposta não tem dados estruturados, criar estrutura padrão
        if (!data || typeof data !== 'object') {
          data = {
            success: false,
            message: 'Credenciais inválidas'
          };
        }
      }

      // Se a resposta não é ok, mas temos dados estruturados, retornar os dados
      if (!response.ok) {
        if (data && typeof data === 'object' && data.message) {
          console.log('❌ Erro na requisição:', data.message);
          throw new Error(data.message);
        } else {
          const errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
          console.log('❌ Erro na requisição:', errorMessage);
          throw new Error(errorMessage);
        }
      }

      return data;

    } catch (error) {
      console.log('❌ Erro na requisição:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou. Tente novamente.');
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

  // Métodos de autenticação específicos
  async login(credentials) {
    console.log('🔐 Tentativa de login via ApiService');
    console.log('📧 Email:', credentials.email);
    console.log('🔑 Senha length:', credentials.password?.length);
    
    try {
      const response = await this.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password
      });
      
      console.log('📥 Resposta do login recebida:', {
        success: response?.success,
        hasData: !!response?.data,
        hasUser: !!response?.data?.user,
        hasToken: !!response?.data?.token,
        message: response?.message
      });
      
      // Validar estrutura da resposta
      if (response && response.success && response.data) {
        const { token, user } = response.data;
        
        if (token) {
          this.setToken(token);
          localStorage.setItem('authToken', token);
          console.log('✅ Token salvo com sucesso');
        } else {
          console.warn('⚠️ Token não fornecido na resposta');
        }
        
        if (user) {
          localStorage.setItem('userData', JSON.stringify(user));
          console.log('✅ Dados do usuário salvos');
        } else {
          console.warn('⚠️ Dados do usuário não fornecidos');
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
    console.log('📧 Email:', userData.email);
    
    try {
      const response = await this.post('/auth/register', {
        name: userData.name.trim(),
        email: userData.email.trim(),
        password: userData.password,
        confirmPassword: userData.confirmPassword
      });
      
      console.log('📥 Resposta do registro:', {
        success: response?.success,
        message: response?.message
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Erro no registro (ApiService):', error.message);
      throw error;
    }
  }

  async logout() {
    console.log('🚪 Fazendo logout...');
    
    try {
      if (this.token) {
        await this.post('/auth/logout');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao fazer logout no servidor:', error.message);
    } finally {
      this.removeToken();
      localStorage.removeItem('userData');
      console.log('✅ Logout local concluído');
    }
  }

  async refreshToken() {
    console.log('🔄 Tentando renovar token...');
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('Refresh token não disponível');
      }
      
      const response = await this.post('/auth/refresh', { refreshToken });
      
      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
        localStorage.setItem('authToken', response.data.token);
        console.log('✅ Token renovado com sucesso');
        return response.data.token;
      }
      
      throw new Error('Falha ao renovar token');
      
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error.message);
      this.removeToken();
      throw error;
    }
  }

  // Método para verificar saúde da API
  async healthCheck() {
    try {
      const response = await this.get('/health');
      console.log('💚 API está funcionando:', response);
      return true;
    } catch (error) {
      console.error('❤️‍🩹 API não está respondendo:', error.message);
      return false;
    }
  }
}

// Criar instância única
const apiService = new ApiService();

export default apiService;