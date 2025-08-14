import React, { createContext, useContext, useReducer } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, { ...action.payload, id: Date.now() + Math.random() }];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload);
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
};

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'bg-success-500 text-white border-success-600',
  error: 'bg-error-500 text-white border-error-600',
  warning: 'bg-warning-500 text-white border-warning-600',
  info: 'bg-primary-500 text-white border-primary-600',
};

function ToastContainer({ toasts, dispatch }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => {
        const Icon = toastIcons[toast.type];
        
        return (
          <div
            key={toast.id}
            className={`
              p-4 rounded-lg shadow-lg border flex items-start space-x-3 
              transform transition-all duration-300 animate-slide-in
              ${toastStyles[toast.type]}
            `}
          >
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold text-sm mb-1">{toast.title}</div>
              )}
              <div className="text-sm opacity-90">{toast.message}</div>
            </div>
            <button 
              onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors ml-2"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = (message, type = 'info', options = {}) => {
    const toast = {
      message,
      type,
      title: options.title,
      duration: options.duration || 4000,
      persistent: options.persistent || false,
    };

    dispatch({ type: 'ADD_TOAST', payload: toast });

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
      }, toast.duration);
    }

    return toast.id;
  };

  const removeToast = (id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  const clearAllToasts = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  // Convenience methods
  const success = (message, options) => addToast(message, 'success', options);
  const error = (message, options) => addToast(message, 'error', { duration: 6000, ...options });
  const warning = (message, options) => addToast(message, 'warning', options);
  const info = (message, options) => addToast(message, 'info', options);

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} dispatch={dispatch} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;