// frontend/src/contexts/AuthContext.jsx - VERSÃO CORRIGIDA
import React, { createContext, useContext, useReducer, useEffect } from 'react';

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

  // Check for existing authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          // Simular verificação de token
          const user = JSON.parse(userData);
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Simular chamada de API (substitua pela sua API real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Para desenvolvimento - aceitar qualquer login válido
      if (credentials.email && credentials.password && credentials.password.length >= 6) {
        const userData = {
          id: 1,
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'teacher'
        };
        
        const token = 'fake-jwt-token-' + Date.now();
        
        // Salvar no localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        
        return { success: true, data: { user: userData, token } };
      } else {
        throw new Error('Email e senha são obrigatórios');
      }
      
      /* 
      // Versão para produção com API real:
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }
      
      // Salvar token e dados do usuário
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      return data;
      */
      
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Simular chamada de registro
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Para desenvolvimento - aceitar qualquer registro válido
      if (userData.email && userData.password && userData.name) {
        const userInfo = {
          id: Date.now(),
          email: userData.email,
          name: userData.name,
          role: 'teacher'
        };
        
        const token = 'fake-jwt-token-' + Date.now();
        
        // Salvar no localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userInfo));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: userInfo });
        
        return { success: true, data: { user: userInfo, token } };
      } else {
        throw new Error('Todos os campos são obrigatórios');
      }
      
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Limpar localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Simular chamada de logout para API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = async (userData) => {
    try {
      // Simular update do usuário
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      dispatch({ type: 'UPDATE_USER', payload: userData });
      return { success: true, data: { user: updatedUser } };
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      throw error;
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