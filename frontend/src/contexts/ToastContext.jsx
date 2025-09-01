import React, { createContext, useContext, useReducer } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

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

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning', 
  info: 'toast-info',
};

function ToastContainer({ toasts, dispatch, removeToastWithAnimation }) {

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const Icon = toastIcons[toast.type];
        
        return (
          <div
            key={toast.id}
            data-toast-id={toast.id}
            className={`
              p-4 rounded-xl flex items-start space-x-3 
              transform transition-all duration-300 animate-slide-in
              ${toastStyles[toast.type]}
              ${toast.type === 'error' ? 'animate-shake' : ''}
              backdrop-blur-sm
            `}
          >
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold text-sm mb-1">{toast.title}</div>
              )}
              <div className="text-sm opacity-95">{toast.message}</div>
            </div>
            <button 
              onClick={() => removeToastWithAnimation(toast.id)}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-all duration-200 ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
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

  const removeToastWithAnimation = (toastId) => {
    const toastElement = document.querySelector(`[data-toast-id="${toastId}"]`);
    if (toastElement) {
      toastElement.classList.add('animate-slide-out');
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: toastId });
      }, 300);
    } else {
      dispatch({ type: 'REMOVE_TOAST', payload: toastId });
    }
  };

  const addToast = (message, type = 'info', options = {}) => {
    const toastId = Date.now() + Math.random();
    const toast = {
      message,
      type,
      title: options.title,
      duration: options.duration || 4000,
      persistent: options.persistent || false,
      id: toastId,
    };

    dispatch({ type: 'ADD_TOAST', payload: toast });

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        removeToastWithAnimation(toastId);
      }, toast.duration);
    }

    return toastId;
  };

  const removeToast = (id) => {
    removeToastWithAnimation(id);
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
      <ToastContainer toasts={toasts} dispatch={dispatch} removeToastWithAnimation={removeToastWithAnimation} />
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