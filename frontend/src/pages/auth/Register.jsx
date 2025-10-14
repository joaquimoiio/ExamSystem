// frontend/src/pages/auth/Register.jsx - VERSÃO FINAL ATUALIZADA
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, User, BookOpen, AlertCircle, Book, Library, ScrollText, NotebookPen, Bookmark, PenTool, GraduationCap } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useFormValidation, validationRules } from '../../hooks';

// Regras de validação para registro
const registerValidationRules = {
  name: [
    validationRules.required('Nome é obrigatório'),
    validationRules.minLength(2, 'Nome deve ter pelo menos 2 caracteres')
  ],
  email: [
    validationRules.required('Email é obrigatório'),
    validationRules.email('Email inválido')
  ],
  password: [
    validationRules.required('Senha é obrigatória'),
    validationRules.minLength(6, 'Senha deve ter pelo menos 6 caracteres')
  ],
  confirmPassword: [
    validationRules.required('Confirmação de senha é obrigatória'),
    validationRules.passwordMatch('password', 'Senhas não coincidem')
  ],
  acceptTerms: [
    validationRules.checked('Você deve aceitar os termos para continuar')
  ]
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  // Hook de validação
  const {
    errors,
    validateForm,
    clearError,
    setGeneralError
  } = useFormValidation(registerValidationRules);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erros quando usuário começar a digitar
    if (errors[name] || errors.general) {
      clearError(name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulário
    if (!validateForm(formData)) return;
    
    setIsSubmitting(true);
    
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      // Registro bem-sucedido - mostrar toast e redirecionar
      showSuccess(
        'Conta criada com sucesso! Redirecionando para o login...', 
        { 
          title: '🎉 Registro Concluído',
          duration: 3000
        }
      );
      
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
      });
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Erro no registro:', error);
      
      // Verificar tipos específicos de erro para mostrar mensagens mais claras
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.message.includes('já está em uso') || error.message.includes('already exists')) {
        errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
      } else if (error.message.includes('senha') || error.message.includes('password')) {
        errorMessage = 'Erro na senha. Verifique se ela atende aos requisitos.';
      } else if (error.message.includes('email') || error.message.includes('@')) {
        errorMessage = 'Email inválido. Verifique o formato do email.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage, { 
        title: '❌ Erro no Registro',
        duration: 6000 
      });
      
      setGeneralError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Educational Background Elements - Books and School Items */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Books */}
        <div className="absolute top-10 left-16 text-blue-400 dark:text-blue-400 opacity-20 dark:opacity-15 transform rotate-12">
          <BookOpen className="w-24 h-24" />
        </div>
        <div className="absolute top-32 right-20 text-emerald-400 dark:text-emerald-400 opacity-15 dark:opacity-10 transform -rotate-12">
          <Book className="w-20 h-20" />
        </div>
        <div className="absolute bottom-32 left-10 text-purple-400 dark:text-purple-400 opacity-20 dark:opacity-15 transform rotate-45">
          <Library className="w-28 h-28" />
        </div>

        {/* Medium Books */}
        <div className="absolute top-1/2 right-12 text-amber-400 dark:text-amber-400 opacity-18 dark:opacity-12 transform -rotate-45">
          <ScrollText className="w-16 h-16" />
        </div>
        <div className="absolute top-20 left-1/3 text-rose-400 dark:text-rose-400 opacity-15 dark:opacity-10 transform rotate-25">
          <NotebookPen className="w-14 h-14" />
        </div>
        <div className="absolute bottom-20 right-1/4 text-indigo-400 dark:text-indigo-400 opacity-18 dark:opacity-12 transform -rotate-30">
          <Bookmark className="w-12 h-12" />
        </div>

        {/* Small Educational Items */}
        <div className="absolute top-64 left-1/4 text-emerald-500 dark:text-emerald-500 opacity-15 dark:opacity-10">
          <PenTool className="w-10 h-10" />
        </div>
        <div className="absolute top-16 right-1/3 text-violet-500 dark:text-violet-500 opacity-18 dark:opacity-12 transform rotate-15">
          <GraduationCap className="w-14 h-14" />
        </div>

        {/* Stack of Books Effect */}
        <div className="absolute bottom-16 right-16 transform rotate-6 opacity-20 dark:opacity-15">
          <div className="relative">
            <Book className="w-18 h-18 text-blue-500 dark:text-blue-500" />
            <Book className="w-18 h-18 text-emerald-500 dark:text-emerald-500 absolute -top-1 -left-1 opacity-80" />
            <Book className="w-18 h-18 text-rose-500 dark:text-rose-500 absolute -top-2 -left-2 opacity-60" />
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
            <BookOpen className="h-7 w-7 text-white" />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Criar sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              entre com sua conta existente
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {/* Erro geral */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome completo
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full pl-10 px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Seu nome completo"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full pl-10 px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="seu.email@exemplo.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full pl-10 pr-10 px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Crie uma senha"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmar senha
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full pl-10 pr-10 px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Confirme sua senha"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Aceitar termos */}
          <div>
            <div className="flex items-center">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                  errors.acceptTerms ? 'border-red-300' : ''
                }`}
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Eu concordo com os{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                  Política de Privacidade
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
            )}
          </div>

          {/* Botão de submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}