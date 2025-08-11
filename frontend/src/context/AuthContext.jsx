import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/auth'
import { toast } from 'react-toastify'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null
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
        error: null
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
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
        const response = await authService.getProfile()
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token
          }
        })
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authService.login(credentials)
      
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data
      })
      
      toast.success('Login realizado com sucesso!')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login'
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
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authService.register(userData)
      
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data
      })
      
      toast.success('Conta criada com sucesso!')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar conta'
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
      await authService.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      dispatch({ type: 'LOGOUT' })
      toast.success('Logout realizado com sucesso!')
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