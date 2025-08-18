// frontend/src/components/common/Loading.jsx - VERSÃO ATUALIZADA COMPLETA
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ================================
// LOADING COMPONENTS
// ================================

export default function Loading({ 
  size = 'medium', 
  text = 'Carregando...', 
  className = '',
  showText = true 
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 mx-auto`} />
        {showText && (
          <p className="mt-2 text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  );
}

// Full page loading
export function LoadingPage({ text = 'Carregando página...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading size="large" text={text} />
    </div>
  );
}

// Skeleton Components
export function SkeletonLine({ width = 'full', height = '4', className = '' }) {
  const widthClasses = {
    '1/4': 'w-1/4',
    '1/2': 'w-1/2',
    '3/4': 'w-3/4',
    'full': 'w-full',
  };

  const heightClasses = {
    '3': 'h-3',
    '4': 'h-4',
    '5': 'h-5',
    '6': 'h-6',
  };

  return (
    <div 
      className={`
        bg-gray-200 rounded animate-pulse
        ${widthClasses[width]} ${heightClasses[height]} ${className}
      `} 
    />
  );
}

export function SkeletonCard({ lines = 3, showImage = true, className = '' }) {
  return (
    <div className={`bg-white p-6 rounded-lg border ${className}`}>
      {showImage && (
        <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse mb-4" />
      )}
      <div className="space-y-3">
        {[...Array(lines)].map((_, i) => (
          <SkeletonLine 
            key={i} 
            width={i === lines - 1 ? '3/4' : 'full'} 
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="border-b p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, i) => (
            <SkeletonLine key={i} width="3/4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-b-0 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <SkeletonLine 
                key={colIndex} 
                width={colIndex === 0 ? 'full' : '3/4'} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading Button
export function LoadingButton({ 
  children, 
  isLoading = false, 
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      {children}
    </button>
  );
}

// Loading states for specific components
export function LoadingSubjects() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} lines={2} showImage={false} />
      ))}
    </div>
  );
}

export function LoadingQuestions() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6">
          <SkeletonLine width="full" height="6" className="mb-4" />
          <div className="space-y-2">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <SkeletonLine width="3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingExams() {
  return <SkeletonTable rows={8} columns={5} />;
}

// Error state loading
export function LoadingError({ 
  title = 'Erro ao carregar', 
  message = 'Algo deu errado. Tente novamente.',
  onRetry,
  showRetry = true 
}) {
  return (
    <div className="text-center py-12">
      <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      {showRetry && onRetry && (
        <LoadingButton onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </LoadingButton>
      )}
    </div>
  );
}

// ================================
// ROUTE PROTECTION COMPONENTS
// ================================

// Componente de rota protegida
export function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <LoadingPage text="Verificando autenticação..." />;
  }

  // Se não autenticado, redirecionar para login com a localização atual
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar role se especificado
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <LoadingButton 
            onClick={() => window.history.back()}
            variant="outline"
          >
            Voltar
          </LoadingButton>
        </div>
      </div>
    );
  }

  // Se autenticado e com permissão, mostrar conteúdo
  return children;
}

// Componente para redirecionar usuários logados das páginas públicas
export function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingPage text="Verificando autenticação..." />;
  }

  // Se já autenticado, redirecionar para dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Componente para redirecionamento da rota raiz
export function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingPage text="Inicializando aplicação..." />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}