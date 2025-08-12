import React from 'react'
import { toast } from 'react-toastify'

// Custom toast component with predefined styles
export const Toast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  },

  warning: (message, options = {}) => {
    return toast.warning(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  },

  info: (message, options = {}) => {
    return toast.info(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  },

  loading: (message = 'Carregando...', options = {}) => {
    return toast.loading(message, {
      position: "top-right",
      ...options
    })
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        pending: messages.pending || 'Processando...',
        success: messages.success || 'Sucesso!',
        error: messages.error || 'Erro!'
      },
      {
        position: "top-right",
        ...options
      }
    )
  },

  update: (toastId, options) => {
    return toast.update(toastId, options)
  },

  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }
}

// Custom toast notifications for specific actions
export const showSuccessToast = (message) => {
  return Toast.success(message)
}

export const showErrorToast = (message) => {
  return Toast.error(message)
}

export const showWarningToast = (message) => {
  return Toast.warning(message)
}

export const showInfoToast = (message) => {
  return Toast.info(message)
}

// Specialized toasts for common operations
export const showOperationToast = {
  created: (itemName = 'Item') => 
    Toast.success(`${itemName} criado com sucesso!`),
  
  updated: (itemName = 'Item') => 
    Toast.success(`${itemName} atualizado com sucesso!`),
  
  deleted: (itemName = 'Item') => 
    Toast.success(`${itemName} excluído com sucesso!`),
  
  duplicated: (itemName = 'Item') => 
    Toast.success(`${itemName} duplicado com sucesso!`),
  
  published: (itemName = 'Item') => 
    Toast.success(`${itemName} publicado com sucesso!`),
  
  unpublished: (itemName = 'Item') => 
    Toast.success(`${itemName} despublicado com sucesso!`),
  
  saved: () => 
    Toast.success('Salvo com sucesso!'),
  
  submitted: () => 
    Toast.success('Enviado com sucesso!'),
  
  uploaded: () => 
    Toast.success('Upload realizado com sucesso!'),
  
  downloaded: () => 
    Toast.success('Download concluído!'),
  
  copied: () => 
    Toast.success('Copiado para a área de transferência!'),
  
  loggedIn: () => 
    Toast.success('Login realizado com sucesso!'),
  
  loggedOut: () => 
    Toast.success('Logout realizado com sucesso!'),
  
  passwordChanged: () => 
    Toast.success('Senha alterada com sucesso!'),
  
  emailSent: () => 
    Toast.success('Email enviado com sucesso!'),
  
  error: (operation = 'operação') => 
    Toast.error(`Erro ao realizar ${operation}. Tente novamente.`),
  
  networkError: () => 
    Toast.error('Erro de conexão. Verifique sua internet.'),
  
  unauthorized: () => 
    Toast.error('Acesso negado. Faça login novamente.'),
  
  validationError: (field = 'campo') => 
    Toast.error(`${field} é obrigatório ou inválido.`),
  
  fileError: () => 
    Toast.error('Erro no arquivo. Verifique o formato e tamanho.'),
  
  timeoutError: () => 
    Toast.error('Operação expirou. Tente novamente.'),
  
  serverError: () => 
    Toast.error('Erro interno do servidor. Tente mais tarde.')
}

// Promise-based toasts for async operations
export const showAsyncToast = (promise, messages = {}) => {
  return Toast.promise(promise, {
    pending: messages.pending || 'Processando...',
    success: messages.success || 'Operação concluída!',
    error: messages.error || 'Erro na operação!'
  })
}

// Batch operations toasts
export const showBatchToast = {
  start: (operation, count) => {
    return Toast.loading(`${operation} ${count} itens...`)
  },
  
  success: (toastId, operation, count, successCount) => {
    Toast.update(toastId, {
      render: `${operation} concluída: ${successCount}/${count} itens processados`,
      type: "success",
      isLoading: false,
      autoClose: 4000
    })
  },
  
  error: (toastId, operation, count, errorCount) => {
    Toast.update(toastId, {
      render: `${operation} parcialmente concluída: ${errorCount}/${count} itens com erro`,
      type: "warning",
      isLoading: false,
      autoClose: 6000
    })
  }
}

// Custom toast for form validation errors
export const showValidationToast = (errors) => {
  if (Array.isArray(errors)) {
    const errorMessage = errors.join(', ')
    Toast.error(`Corrija os seguintes erros: ${errorMessage}`)
  } else if (typeof errors === 'object') {
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      const firstError = errors[errorFields[0]]
      Toast.error(firstError)
    }
  } else {
    Toast.error(errors || 'Erro de validação')
  }
}

// Network status toasts
export const showNetworkToast = {
  offline: () => Toast.warning('Você está offline. Algumas funcionalidades podem não funcionar.'),
  online: () => Toast.success('Conexão restaurada!'),
  slow: () => Toast.warning('Conexão lenta detectada.')
}

export default Toast