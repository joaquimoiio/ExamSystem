import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-lg',
    xlarge: 'max-w-xl',
    '2xlarge': 'max-w-2xl',
    '3xlarge': 'max-w-3xl',
    '4xlarge': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      
      // Return focus to previous element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && closeOnEscape && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      onClose?.();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-screen overflow-y-auto w-full
          ${sizeClasses[size]} ${className}
          animate-bounce-in focus:outline-none
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        <div className={title || showCloseButton ? 'p-6' : 'p-6'}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Confirmation Modal Component
export function ConfirmationModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  loading = false,
}) {
  const icons = {
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const iconColors = {
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    error: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  };

  const buttonVariants = {
    warning: 'warning',
    error: 'error',
    success: 'success',
    info: 'primary',
  };

  const Icon = icons[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconColors[variant]} mb-4`}>
          <Icon className="h-6 w-6" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        
        <div className="flex space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Alert Modal Component
export function AlertModal({
  isOpen = false,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'OK',
}) {
  const icons = {
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const iconColors = {
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    error: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  };

  const Icon = icons[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconColors[variant]} mb-4`}>
          <Icon className="h-6 w-6" />
        </div>
        
        {title && (
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
        )}
        
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        
        <Button onClick={onClose} className="w-full">
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
}

// Form Modal Component
export function FormModal({
  isOpen = false,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  loading = false,
  submitDisabled = false,
  size = 'medium',
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 mb-6">
          {children}
        </div>
        
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={submitDisabled}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Drawer Modal Component (slides from side)
export function DrawerModal({
  isOpen = false,
  onClose,
  title,
  children,
  position = 'right',
  size = 'medium',
  className = '',
}) {
  const positionClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };

  const sizeClasses = {
    small: position === 'left' || position === 'right' ? 'w-80' : 'h-80',
    medium: position === 'left' || position === 'right' ? 'w-96' : 'h-96',
    large: position === 'left' || position === 'right' ? 'w-1/2' : 'h-1/2',
    full: position === 'left' || position === 'right' ? 'w-full' : 'h-full',
  };

  const animationClasses = {
    left: 'animate-slide-in-left',
    right: 'animate-slide-in-right', 
    top: 'animate-slide-in-top',
    bottom: 'animate-slide-in-bottom',
  };

  if (!isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in">
      <div
        className={`
          fixed bg-white dark:bg-gray-800 shadow-xl overflow-y-auto
          ${positionClasses[position]}
          ${sizeClasses[size]}
          ${animationClasses[position]}
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
    </div>
  );

  return createPortal(drawerContent, document.body);
}

// Bottom Sheet Modal (mobile-friendly)
export function BottomSheetModal({
  isOpen = false,
  onClose,
  title,
  children,
  height = 'auto',
  className = '',
}) {
  const heightClasses = {
    auto: 'max-h-96',
    small: 'h-64',
    medium: 'h-96',
    large: 'h-2/3',
    full: 'h-full',
  };

  if (!isOpen) return null;

  const sheetContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end animate-fade-in">
      <div
        className={`
          w-full bg-white dark:bg-gray-800 rounded-t-xl shadow-xl overflow-y-auto
          ${heightClasses[height]}
          ${className}
          animate-slide-in-bottom
        `}
      >
        {/* Handle */}
        <div className="flex justify-center p-2">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {title && (
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
    </div>
  );

  return createPortal(sheetContent, document.body);
}

export default Modal;