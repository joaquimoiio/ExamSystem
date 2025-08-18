// frontend/src/contexts/AuthContext.jsx - VERSÃO REAL COM API
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
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      const response = await apiService.login(credentials);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Salvar dados no localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Atualizar token no serviço da API
        apiService.setToken(token);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Erro no login');
      }
    } catch (error) {
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
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Tentar fazer logout no backend
      await apiService.logout();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Sempre limpar dados locais
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      apiService.setToken(null);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await apiService.updateProfile(userData);
      
      if (response.success) {
        const updatedUser = response.data.user;
        
        // Atualizar localStorage
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        
        return { success: true, data: { user: updatedUser } };
      } else {
        throw new Error(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro ao atualizar perfil';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiService.request('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword
        }
      });
      
      if (response.success) {
        return { success: true, message: response.message || 'Senha alterada com sucesso' };
      } else {
        throw new Error(response.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      throw new Error(error.message || 'Erro ao alterar senha');
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await apiService.request('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      
      if (response.success) {
        return { success: true, message: response.message || 'Email enviado com sucesso' };
      } else {
        throw new Error(response.message || 'Erro ao enviar email');
      }
    } catch (error) {
      throw new Error(error.message || 'Erro ao enviar email de recuperação');
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await apiService.request('/auth/reset-password', {
        method: 'POST',
        body: { token, password }
      });
      
      if (response.success) {
        return { success: true, message: response.message || 'Senha redefinida com sucesso' };
      } else {
        throw new Error(response.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      throw new Error(error.message || 'Erro ao redefinir senha');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;