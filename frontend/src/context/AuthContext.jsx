// AuthContext.jsx - Versão corrigida
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/auth'
import { toast } from 'react-toastify'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null,
  isAuthenticated: false
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        isAuthenticated: true
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
        isAuthenticated: false
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Verificar se o token é válido fazendo uma requisição ao perfil
        const response = await authService.getProfile()
        
        if (response.data && response.data.user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              token
            }
          })
        } else {
          // Token inválido, limpar localStorage
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      // Se houver erro na verificação, limpar tokens
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const login = async (credentials) => {
    try {
      console.log('AuthContext: Iniciando login...', credentials)
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await authService.login(credentials)
      console.log('AuthContext: Resposta do login:', response)
      
      if (!response.data) {
        throw new Error('Resposta inválida do servidor')
      }

      const { token, refreshToken, user } = response.data
      
      if (!token || !user) {
        throw new Error('Token ou dados do usuário não recebidos')
      }
      
      // Salvar tokens no localStorage
      localStorage.setItem('token', token)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      
      // Atualizar estado
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      })
      
      toast.success('Login realizado com sucesso!')
      console.log('AuthContext: Login realizado com sucesso')
      
      return response.data
    } catch (error) {
      console.error('AuthContext: Erro no login:', error)
      
      let errorMessage = 'Erro ao fazer login'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      })
      
      toast.error(errorMessage)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      console.log('AuthContext: Iniciando registro...', userData)
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await authService.register(userData)
      console.log('AuthContext: Resposta do registro:', response)
      
      if (!response.data) {
        throw new Error('Resposta inválida do servidor')
      }

      const { token, refreshToken, user } = response.data
      
      if (!token || !user) {
        throw new Error('Token ou dados do usuário não recebidos')
      }
      
      // Salvar tokens no localStorage
      localStorage.setItem('token', token)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      
      // Atualizar estado
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      })
      
      toast.success('Conta criada com sucesso!')
      console.log('AuthContext: Registro realizado com sucesso')
      
      return response.data
    } catch (error) {
      console.error('AuthContext: Erro no registro:', error)
      
      let errorMessage = 'Erro ao criar conta'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      })
      
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('AuthContext: Iniciando logout...')
      await authService.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Sempre limpar o estado local, mesmo se a API falhar
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      dispatch({ type: 'LOGOUT' })
      toast.success('Logout realizado com sucesso!')
      console.log('AuthContext: Logout realizado')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData)
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      })
      toast.success('Perfil atualizado com sucesso!')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar perfil'
      toast.error(errorMessage)
      throw error
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData)
      toast.success('Senha alterada com sucesso!')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao alterar senha'
      toast.error(errorMessage)
      throw error
    }
  }

  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email)
      toast.success('Email de recuperação enviado!')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao enviar email'
      toast.error(errorMessage)
      throw error
    }
  }

  const resetPassword = async (resetData) => {
    try {
      await authService.resetPassword(resetData)
      toast.success('Senha redefinida com sucesso!')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao redefinir senha'
      toast.error(errorMessage)
      throw error
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}