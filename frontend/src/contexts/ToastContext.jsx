import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

// Toast reducer
const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.payload];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload);
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
};

// Toast configuration
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-500',
    textColor: 'text-white',
    duration: 4000,
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    duration: 6000,
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500',
    textColor: 'text-white',
    duration: 5000,
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    duration: 4000,
  },
};

// Individual Toast Component
function ToastItem({ toast, onRemove }) {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;

  React.useEffect(() => {
    if (!toast.persistent) {
      const duration = toast.duration || config.duration;
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, toast.persistent, config.duration, onRemove]);

  return (
    <div
      className={`
        ${config.bgColor} ${config.textColor}
        w-full max-w-sm rounded-lg shadow-lg pointer-events-auto
        border-0 select-none
      `}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Icon */}
            <Icon size={20} className="flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="font-medium text-sm leading-5 truncate">
                  {toast.title}
                </p>
              )}
              {toast.message && (
                <p className={`text-sm leading-5 ${toast.title ? 'mt-1 opacity-95' : ''}`}>
                  {toast.message}
                </p>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => onRemove(toast.id)}
            className="
              flex-shrink-0 ml-4 p-1 rounded
              hover:bg-black hover:bg-opacity-10
              active:bg-black active:bg-opacity-20
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
            "
          >
            <X size={16} />
          </button>
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
      aria-live="polite"
      aria-label="Notificações"
      className="
        fixed top-4 right-4 z-50
        flex flex-col gap-3
        max-w-sm w-full
        pointer-events-none
      "
      style={{
        maxHeight: 'calc(100vh - 2rem)',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {toasts.slice(-4).map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>,
    document.body
  );
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const recentToasts = useRef(new Map()); // Track recent toasts to prevent duplicates

  // Clean up old entries in recentToasts
  const cleanupRecentToasts = useCallback(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentToasts.current.entries()) {
      if (now - timestamp > 1000) { // Remove entries older than 1 second
        recentToasts.current.delete(key);
      }
    }
  }, []);

  const addToast = useCallback((options) => {
    // Create a key to detect duplicates based on message and type
    const duplicateKey = `${options.type}-${options.message}-${options.title || ''}`;
    const now = Date.now();

    // Check if this exact toast was shown recently (within 500ms)
    if (recentToasts.current.has(duplicateKey)) {
      const lastShown = recentToasts.current.get(duplicateKey);
      if (now - lastShown < 500) {
        return; // Skip duplicate toast
      }
    }

    // Record this toast
    recentToasts.current.set(duplicateKey, now);

    // Clean up old entries periodically
    cleanupRecentToasts();

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const toast = {
      id,
      persistent: false,
      ...options,
    };

    dispatch({ type: 'ADD_TOAST', payload: toast });
    return id;
  }, [cleanupRecentToasts]);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearAllToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    recentToasts.current.clear();
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
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
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

  // Promise handler for async operations
  const promise = useCallback(async (promiseOrFn, options = {}) => {
    const {
      loading = 'Carregando...',
      success: successMessage = 'Concluído!',
      error: errorMessage = 'Erro!',
    } = options;

    // Show loading toast
    const loadingId = addToast({
      type: 'info',
      message: loading,
      persistent: true,
    });

    try {
      const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
      const result = await promise;

      // Remove loading toast
      removeToast(loadingId);

      // Show success toast
      success(typeof successMessage === 'function' ? successMessage(result) : successMessage);

      return result;
    } catch (err) {
      // Remove loading toast
      removeToast(loadingId);

      // Show error toast
      const message = typeof errorMessage === 'function' ? errorMessage(err) : errorMessage;
      error(message);

      throw err;
    }
  }, [addToast, removeToast, success, error]);

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    promise,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}

export default ToastContext;