import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle, AlertCircle, Info, XCircle, X, 
  AlertTriangle 
} from 'lucide-react';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast types
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    iconClassName: 'text-green-600 dark:text-green-400'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    iconClassName: 'text-red-600 dark:text-red-400'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
    iconClassName: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    iconClassName: 'text-blue-600 dark:text-blue-400'
  }
};

// Individual Toast Component
function Toast({ toast, onRemove }) {
  const { type, title, message, duration, persistent } = toast;
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  React.useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, persistent, onRemove]);

  return (
    <div
      className={`
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto 
        border transform transition-all duration-300 ease-in-out
        ${config.className}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconClassName}`} />
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium">
                {title}
              </p>
            )}
            {message && (
              <p className={`text-sm ${title ? 'mt-1' : ''}`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`
                inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                ${config.iconClassName.replace('text-', 'hover:text-').replace('-600', '-500')}
                focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400
              `}
              onClick={() => onRemove(toast.id)}
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast Container
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      duration: 5000,
      persistent: false,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 8000, // Errors stay longer
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      duration: 6000,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options,
    });
  }, [addToast]);

  // Promise-based toasts for async operations
  const promise = useCallback((promise, options = {}) => {
    const {
      loading = 'Carregando...',
      success: successMessage = 'Operação concluída!',
      error: errorMessage = 'Algo deu errado!'
    } = options;

    // Show loading toast
    const loadingId = addToast({
      type: 'info',
      message: loading,
      persistent: true,
    });

    return promise
      .then((result) => {
        removeToast(loadingId);
        success(typeof successMessage === 'function' ? successMessage(result) : successMessage);
        return result;
      })
      .catch((err) => {
        removeToast(loadingId);
        error(typeof errorMessage === 'function' ? errorMessage(err) : errorMessage);
        throw err;
      });
  }, [addToast, removeToast, success, error]);

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
    promise,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook for toast notifications
export const useToastNotifications = () => {
  const { success, error, warning, info, promise } = useToast();

  // API response handler
  const handleApiResponse = useCallback((response, options = {}) => {
    const {
      successMessage = 'Operação realizada com sucesso!',
      errorMessage = 'Erro ao realizar operação',
      showSuccess = true
    } = options;

    if (response.success) {
      if (showSuccess) {
        success(response.message || successMessage);
      }
    } else {
      error(response.message || errorMessage);
    }

    return response;
  }, [success, error]);

  // Form submission handler
  const handleFormSubmission = useCallback(async (submitFn, options = {}) => {
    const {
      loadingMessage = 'Salvando...',
      successMessage = 'Dados salvos com sucesso!',
      errorMessage = 'Erro ao salvar dados'
    } = options;

    return promise(submitFn(), {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage
    });
  }, [promise]);

  // Network error handler
  const handleNetworkError = useCallback((err) => {
    if (err.name === 'NetworkError' || !navigator.onLine) {
      warning('Sem conexão com a internet. Tente novamente mais tarde.');
    } else if (err.response?.status === 401) {
      error('Sessão expirada. Faça login novamente.');
    } else if (err.response?.status === 403) {
      error('Você não tem permissão para realizar esta ação.');
    } else if (err.response?.status === 404) {
      error('Recurso não encontrado.');
    } else if (err.response?.status >= 500) {
      error('Erro interno do servidor. Tente novamente mais tarde.');
    } else {
      error(err.message || 'Erro desconhecido');
    }
  }, [warning, error]);

  return {
    success,
    error,
    warning,
    info,
    promise,
    handleApiResponse,
    handleFormSubmission,
    handleNetworkError,
  };
};

// Custom hook for toast with auto-dismiss
export const useToastWithAutoClose = () => {
  const { addToast, removeToast } = useToast();

  const showToastWithAutoClose = useCallback((message, type = 'info', duration = 3000) => {
    const id = addToast({
      type,
      message,
      duration,
    });

    // Return function to manually close if needed
    return () => removeToast(id);
  }, [addToast, removeToast]);

  return showToastWithAutoClose;
};

export default ToastProvider;