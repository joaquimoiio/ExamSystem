import React from 'react';
import { Loader2, BookOpen, FileText, Users, Settings } from 'lucide-react';

// Main Loading Component
export function Loading({ 
  size = 'medium', 
  text = 'Carregando...', 
  fullScreen = false,
  variant = 'default',
  className = '' 
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  const variants = {
    default: 'text-primary-600',
    light: 'text-white',
    dark: 'text-gray-900',
    muted: 'text-gray-500'
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} ${variants[variant]} animate-spin`} />
      {text && (
        <p className={`${textSizeClasses[size]} ${variants[variant]} font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton Loading Components
export function SkeletonLine({ width = 'full', height = '4', className = '' }) {
  return (
    <div 
      className={`bg-gray-200 rounded animate-pulse h-${height} w-${width} ${className}`}
    />
  );
}

export function SkeletonCard({ lines = 3, showImage = false, className = '' }) {
  return (
    <div className={`bg-white rounded-lg border p-4 space-y-3 ${className}`}>
      {showImage && (
        <div className="bg-gray-200 rounded h-32 w-full animate-pulse" />
      )}
      <div className="space-y-2">
        <SkeletonLine width="3/4" height="6" />
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLine 
            key={index} 
            width={index === lines - 1 ? '1/2' : 'full'} 
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <SkeletonLine key={index} width="3/4" height="5" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonLine 
                  key={colIndex} 
                  width={colIndex === 0 ? 'full' : '2/3'} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Specialized Loading Components
export function LoadingButton({ 
  children, 
  loading = false, 
  disabled = false,
  size = 'medium',
  variant = 'primary',
  className = '',
  ...props
}) {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-primary-600 hover:bg-primary-50'
  };

  const iconSize = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <button
      disabled={loading || disabled}
      className={`
        relative inline-flex items-center justify-center font-medium rounded-lg
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${variantClasses[variant]} ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 className={`${iconSize[size]} mr-2 animate-spin`} />
      )}
      {children}
    </button>
  );
}

export function LoadingPage({ 
  title = 'Carregando', 
  subtitle = 'Aguarde enquanto carregamos o conteúdo...',
  icon: Icon = BookOpen,
  variant = 'default'
}) {
  const variants = {
    default: 'bg-white',
    dark: 'bg-gray-900 text-white',
    transparent: 'bg-transparent'
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${variants[variant]}`}>
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-100 p-4 rounded-full">
            <Icon className="w-12 h-12 text-primary-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{subtitle}</p>
        
        <Loading size="large" text="" />
        
        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingCard({ 
  title = 'Carregando...', 
  className = '',
  size = 'medium' 
}) {
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  return (
    <div className={`bg-white rounded-lg border ${sizeClasses[size]} ${className}`}>
      <div className="text-center">
        <Loading size={size} text={title} />
      </div>
    </div>
  );
}

export function LoadingOverlay({ 
  loading = false, 
  text = 'Carregando...', 
  children,
  blur = true 
}) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className={`
          absolute inset-0 flex items-center justify-center
          bg-white bg-opacity-80 z-10 rounded-lg
          ${blur ? 'backdrop-blur-sm' : ''}
        `}>
          <Loading text={text} />
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ 
  progress = 0, 
  label = '', 
  showPercentage = true,
  variant = 'primary',
  size = 'medium',
  className = '' 
}) {
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const variantClasses = {
    primary: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>{label}</span>
          {showPercentage && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className={`bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[variant]} ${sizeClasses[size]} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

export function SpinnerDots({ size = 'medium', variant = 'primary' }) {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const variantClasses = {
    primary: 'bg-primary-600',
    light: 'bg-white',
    dark: 'bg-gray-900'
  };

  return (
    <div className="flex space-x-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function PulseLoader({ size = 'medium', variant = 'primary' }) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'bg-primary-600',
    light: 'bg-white',
    dark: 'bg-gray-900'
  };

  return (
    <div className="relative flex justify-center items-center">
      <div className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-ping absolute`} />
      <div className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-pulse`} />
    </div>
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
          Tentar Novamente
        </LoadingButton>
      )}
    </div>
  );
}

export default Loading;