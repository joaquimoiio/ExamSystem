// frontend/src/pages/auth/Login.jsx - VERSÃO FINAL ATUALIZADA
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFormValidation, validationRules } from '../../hooks';

// Regras de validação para login
const loginValidationRules = {
  email: [
    validationRules.required('Email é obrigatório'),
    validationRules.email('Email inválido')
  ],
  password: [
    validationRules.required('Senha é obrigatória')
  ]
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Hook de validação
  const {
    errors,
    validateForm,
    clearError,
    setGeneralError
  } = useFormValidation(loginValidationRules);

  // URL de redirecionamento após login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erro quando usuário começar a digitar
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
      await login({
        email: formData.email.trim(),
        password: formData.password
      });
      
      // Login bem-sucedido - navegar para destino
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Erro no login:', error);
      setGeneralError(error.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
           >
             crie uma conta gratuita
           </Link>
         </p>
       </div>

       {/* Form */}
       <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
         {/* Erro geral */}
         {errors.general && (
           <div className="bg-red-50 border border-red-200 rounded-md p-4">
             <div className="flex items-center">
               <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
               <p className="text-sm text-red-700">{errors.general}</p>
             </div>
           </div>
         )}

         {/* Email */}
         <div>
           <label htmlFor="email" className="block text-sm font-medium text-gray-700">
             Email
           </label>
           <div className="mt-1 relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Mail className="h-5 w-5 text-gray-400" />
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
               } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
               placeholder="seu.email@exemplo.com"
             />
           </div>
           {errors.email && (
             <p className="mt-1 text-sm text-red-600">{errors.email}</p>
           )}
         </div>

         {/* Senha */}
         <div>
           <label htmlFor="password" className="block text-sm font-medium text-gray-700">
             Senha
           </label>
           <div className="mt-1 relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Lock className="h-5 w-5 text-gray-400" />
             </div>
             <input
               id="password"
               name="password"
               type={showPassword ? 'text' : 'password'}
               autoComplete="current-password"
               value={formData.password}
               onChange={handleInputChange}
               className={`appearance-none relative block w-full pl-10 pr-10 px-3 py-2 border ${
                 errors.password ? 'border-red-300' : 'border-gray-300'
               } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
               placeholder="Sua senha"
             />
             <button
               type="button"
               className="absolute inset-y-0 right-0 pr-3 flex items-center"
               onClick={() => setShowPassword(!showPassword)}
             >
               {showPassword ? (
                 <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
               ) : (
                 <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
               )}
             </button>
           </div>
           {errors.password && (
             <p className="mt-1 text-sm text-red-600">{errors.password}</p>
           )}
         </div>

         {/* Lembrar de mim e esqueci senha */}
         <div className="flex items-center justify-between">
           <div className="flex items-center">
             <input
               id="rememberMe"
               name="rememberMe"
               type="checkbox"
               checked={formData.rememberMe}
               onChange={handleInputChange}
               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
             />
             <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
               Lembrar de mim
             </label>
           </div>

           <div className="text-sm">
             <Link
               to="/forgot-password"
               className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
             >
               Esqueceu sua senha?
             </Link>
           </div>
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
               Entrando...
             </>
           ) : (
             'Entrar'
           )}
         </button>
       </form>
     </div>
   </div>
 );
}