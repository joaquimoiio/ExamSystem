// frontend/src/contexts/AuthContext.jsx - VERSÃO CORRIGIDA
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        loading: false,
        error: null 
      };
    case 'LOGIN_ERROR':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: action.payload 
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: null 
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticação existente ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          // Verificar se o token ainda é válido fazendo uma chamada para o backend
          try {
            const response = await apiService.getProfile();
            if (response.success) {
              dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
              return;
            }
          } catch (error) {
            // Token inválido, limpar storage
            console.warn('Token inválido, fazendo logout:', error.message);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            apiService.setToken(null);
          }
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        apiService.setToken(null);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    console.log('🔐 AuthContext.login chamado com:', {
      email: credentials.email,
      passwordLength: credentials.password?.length
    });
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      console.log('🔄 Chamando apiService.login...');
      const response = await apiService.login(credentials);
      
      console.log('📥 Resposta do login:', {
        success: response.success,
        hasUser: !!response.data?.user,
        hasToken: !!response.data?.token,
        message: response.message
      });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        if (!token) {
          throw new Error('Token não fornecido pela API');
        }
        
        if (!user) {
          throw new Error('Dados do usuário não fornecidos pela API');
        }
        
        // Salvar dados no localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Atualizar token no serviço da API
        apiService.setToken(token);
        
        console.log('✅ Login bem-sucedido para:', user.email, '- Role:', user.role);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        
        return { success: true, data: response.data };
      } else {
        const errorMessage = response.message || 'Credenciais inválidas';
        console.log('❌ Login falhou:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Erro no AuthContext.login:', error);
      const errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { 
          success: true, 
          message: response.message || 'Conta criada com sucesso! Faça login para continuar.',
          data: response.data 
        };
      } else {
        throw new Error(response.message || 'Erro ao criar conta');
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro ao criar conta. Tente novamente.';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Tentar notificar o backend sobre o logout
      await apiService.logout();
    } catch (error) {
      console.warn('Erro ao fazer logout no backend:', error);
    } finally {
      // Sempre limpar dados locais
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      apiService.setToken(null);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    
    // Atualizar dados no localStorage
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}