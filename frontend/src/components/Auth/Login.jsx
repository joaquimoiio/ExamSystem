// Login.jsx - Versão corrigida
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import Button from '../Common/Button'
import Input from '../Common/Input'

const Login = () => {
  const navigate = useNavigate()
  const { login, loading, user, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors
  } = useForm({
    mode: 'onChange'
  })

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user && !loading) {
      navigate('/')
    }
  }, [user, loading, navigate])

  // Limpar erros quando o usuário começar a digitar
  useEffect(() => {
    if (error) {
      clearErrors()
    }
  }, [error, clearErrors])

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      clearErrors()
      
      console.log('Tentando fazer login com:', { email: data.email })
      
      const result = await login(data)
      
      console.log('Login bem-sucedido:', result)
      
      // O navigate será feito pelo useEffect quando user for atualizado
    } catch (error) {
      console.error('Erro no login:', error)
      
      // Se o erro vier do backend, mostrar mensagem específica
      if (error.response?.data?.message) {
        setError('root', {
          message: error.response.data.message
        })
      } else if (error.message) {
        setError('root', {
          message: error.message
        })
      } else {
        setError('root', {
          message: 'Erro desconhecido. Tente novamente.'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Provas Online
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login em sua conta
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Mostrar erros gerais */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido'
                }
              })}
              error={errors.email?.message}
              placeholder="seu@email.com"
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 1,
                    message: 'Senha é obrigatória'
                  }
                })}
                error={errors.password?.message}
                placeholder="Sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting || loading}
            disabled={!isValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Cadastre-se
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login