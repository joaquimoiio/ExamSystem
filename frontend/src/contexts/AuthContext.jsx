// frontend/src/contexts/AuthContext.jsx - CORREÇÃO COMPLETA

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

// Estados do contexto
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Actions
const authActions = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case authActions.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case authActions.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case authActions.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case authActions.CLEAR_ERROR:
      return { ...state, error: null };
    
    case authActions.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Inicialização - verificar se usuário já está logado
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Inicializando autenticação...');

      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        console.log('🔍 Verificando dados salvos:', {
          hasToken: !!token,
          hasUserData: !!userData
        });

        if (token && userData) {
          try {
            const user = JSON.parse(userData);

            // Definir token no serviço da API
            apiService.setToken(token);

            // Verificar se token ainda é válido fazendo uma requisição de teste
            try {
              console.log('🔐 Verificando validade do token...');
              const response = await apiService.get('/auth/profile');

              if (response.success && response.data?.user) {
                console.log('✅ Token válido - usuário autenticado:', response.data.user.email);
                // Usar dados atualizados do servidor
                dispatch({ type: authActions.LOGIN_SUCCESS, payload: response.data.user });
              } else {
                throw new Error('Resposta inválida do servidor');
              }

            } catch (profileError) {
              console.log('❌ Token inválido ou expirado:', profileError.message);
              // Token inválido, limpar dados
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              apiService.setToken(null);
              dispatch({ type: authActions.LOGOUT });
            }

          } catch (parseError) {
            console.error('❌ Erro ao fazer parse dos dados do usuário:', parseError);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            apiService.setToken(null);
            dispatch({ type: authActions.LOGOUT });
          }
        } else {
          console.log('ℹ️ Nenhum token encontrado - usuário não autenticado');
          // Limpar qualquer token que possa existir
          apiService.setToken(null);
          dispatch({ type: authActions.LOGOUT });
        }

      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        apiService.setToken(null);
        dispatch({ type: authActions.LOGOUT });
      } finally {
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Função de login
  const login = async (credentials) => {
    console.log('🔐 AuthContext.login iniciado');
    console.log('📧 Email:', credentials.email);
    console.log('🔑 Senha fornecida:', !!credentials.password);
    
    dispatch({ type: authActions.SET_LOADING, payload: true });
    dispatch({ type: authActions.CLEAR_ERROR });
    
    try {
      console.log('🔄 Chamando apiService.login...');
      const response = await apiService.login(credentials);
      
      console.log('📥 Resposta recebida no AuthContext:', {
        success: response?.success,
        hasData: !!response?.data,
        hasUser: !!response?.data?.user,
        hasToken: !!response?.data?.token,
        message: response?.message
      });
      
      if (response?.success && response?.data) {
        const { user, token } = response.data;
        
        if (!token) {
          console.error('❌ Token não fornecido na resposta');
          throw new Error('Token não fornecido pela API');
        }
        
        if (!user) {
          console.error('❌ Dados do usuário não fornecidos na resposta');
          throw new Error('Dados do usuário não fornecidos pela API');
        }
        
        // Salvar dados no localStorage (já feito no apiService, mas garantindo)
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Atualizar token no serviço da API (já feito no apiService, mas garantindo)
        apiService.setToken(token);
        
        console.log('✅ Login bem-sucedido no AuthContext:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        });
        
        dispatch({ type: authActions.LOGIN_SUCCESS, payload: user });
        
        return { success: true, data: response.data };
        
      } else {
        const errorMessage = response?.message || 'Resposta inválida do servidor';
        console.error('❌ Login falhou:', errorMessage);
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Erro no AuthContext.login:', error);
      const errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
      dispatch({ type: authActions.LOGIN_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Função de registro
  const register = async (userData) => {
    console.log('📝 AuthContext.register iniciado');
    console.log('📧 Email:', userData.email);
    
    dispatch({ type: authActions.SET_LOADING, payload: true });
    dispatch({ type: authActions.CLEAR_ERROR });
    
    try {
      console.log('🔄 Chamando apiService.register...');
      const response = await apiService.register(userData);
      
      console.log('📥 Resposta do registro:', {
        success: response?.success,
        message: response?.message
      });
      
      if (response?.success) {
        console.log('✅ Registro bem-sucedido');
        dispatch({ type: authActions.SET_LOADING, payload: false });
        
        return { 
          success: true, 
          message: response.message || 'Conta criada com sucesso! Faça login para continuar.'
        };
      } else {
        const errorMessage = response?.message || 'Erro ao criar conta';
        console.error('❌ Registro falhou:', errorMessage);
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Erro no AuthContext.register:', error);
      const errorMessage = error.message || 'Erro ao criar conta. Tente novamente.';
      dispatch({ type: authActions.LOGIN_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Função de logout
  const logout = async () => {
    console.log('🚪 AuthContext.logout iniciado');
    
    dispatch({ type: authActions.SET_LOADING, payload: true });
    
    try {
      await apiService.logout();
      console.log('✅ Logout concluído');
    } catch (error) {
      console.warn('⚠️ Erro no logout (continuando):', error.message);
    } finally {
      dispatch({ type: authActions.LOGOUT });
    }
  };

  // Função para limpar erros
  const clearError = () => {
    dispatch({ type: authActions.CLEAR_ERROR });
  };

  // Função para atualizar dados do usuário
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    dispatch({ type: authActions.UPDATE_USER, payload: userData });
  };

  // Função para verificar se usuário tem permissão específica
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    const userRole = state.user.role;
    
    // Admin tem todas as permissões
    if (userRole === 'admin') return true;
    
    // Verificar permissões específicas baseadas no papel
    const permissions = {
      teacher: ['create_exam', 'view_exam', 'edit_exam', 'view_results'],
      student: ['take_exam', 'view_my_results'],
      user: ['basic_access']
    };
    
    return permissions[userRole]?.includes(permission) || false;
  };

  // Verificar se é admin
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  // Verificar se é professor
  const isTeacher = () => {
    return state.user?.role === 'teacher' || state.user?.role === 'admin';
  };

  // Verificar se é estudante
  const isStudent = () => {
    return state.user?.role === 'student';
  };

  const contextValue = {
    // Estado
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Funções
    login,
    register,
    logout,
    clearError,
    updateUser,
    
    // Verificações de permissão
    hasPermission,
    isAdmin,
    isTeacher,
    isStudent,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

export default AuthContext;