// frontend/src/hooks/index.js - VERSÃO ATUALIZADA COMPLETA
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';
import apiService from '../services/api';

// ================================
// FORM VALIDATION HOOKS
// ================================

// Hook para validação de formulários
export function useFormValidation(validationRules) {
  const [errors, setErrors] = useState({});

  const validateField = useCallback((name, value, formData = {}) => {
    const fieldRules = validationRules[name];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const error = rule(value, formData);
      if (error) return error;
    }
    return null;
  }, [validationRules]);

  const validateForm = useCallback((formData) => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName], formData);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationRules, validateField]);

  const clearError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      delete newErrors.general; // Limpar erro geral também
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const setGeneralError = useCallback((error) => {
    setErrors(prev => ({ ...prev, general: error }));
  }, []);

  return {
    errors,
    validateForm,
    validateField,
    clearError,
    clearAllErrors,
    setErrors,
    setFieldError,
    setGeneralError
  };
}

// Regras de validação reutilizáveis
export const validationRules = {
  required: (message = 'Campo obrigatório') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  email: (message = 'Email inválido') => (value) => {
    if (value && !/\S+@\S+\.\S+/.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Deve ter pelo menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Deve ter no máximo ${max} caracteres`;
    }
    return null;
  },

  passwordMatch: (passwordField, message = 'Senhas não coincidem') => (value, formData) => {
    if (value && formData && value !== formData[passwordField]) {
      return message;
    }
    return null;
  },

  checked: (message = 'Deve ser marcado') => (value) => {
    if (!value) {
      return message;
    }
    return null;
  },

  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },

  strongPassword: (message = 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número') => (value) => {
    if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return message;
    }
    return null;
  }
};

// ================================
// QR CODE SCANNER HOOK
// ================================

export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      setIsScanning(true);

      // Verificar se há suporte à câmera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste dispositivo');
      }

      // Simular scanner QR - substituir por implementação real
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resultado simulado
      setResult({
        text: 'https://example.com/exam/123/variation/1',
        examId: '123',
        variationId: '1'
      });

    } catch (err) {
      console.error('QR Scanner error:', err);
      setError(err.message || 'Erro ao acessar a câmera. Verifique as permissões.');
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  return {
    isScanning,
    result,
    error,
    startScanning,
    stopScanning,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
  };
}

// ================================
// UTILITY HOOKS
// ================================

// Debounce Hook
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Media Query Hook
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Window Size Hook
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Previous Value Hook
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Local Storage Hook
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// ================================
// API QUERY HOOKS
// ================================

export function useSubjects(params = {}) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: () => apiService.getSubjects(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSubject(id) {
  return useQuery({
    queryKey: ['subjects', id],
    queryFn: () => apiService.getSubjectById(id),
    enabled: !!id,
  });
}

export function useQuestions(params = {}) {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: () => apiService.getQuestions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useQuestion(id) {
  return useQuery({
    queryKey: ['questions', id],
    queryFn: () => apiService.getQuestionById(id),
    enabled: !!id,
  });
}

export function useExams(params = {}) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => apiService.getExams(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExam(id) {
  return useQuery({
    queryKey: ['exams', id],
    queryFn: () => apiService.getExamById(id),
    enabled: !!id,
  });
}

// ================================
// MUTATION HOOKS
// ================================

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      success('Disciplina criada com sucesso!');
    },
    onError: (err) => {
      error('Erro ao criar disciplina: ' + err.message);
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateSubject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects', id] });
      success('Disciplina atualizada com sucesso!');
    },
    onError: (err) => {
      error('Erro ao atualizar disciplina: ' + err.message);
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      success('Disciplina excluída com sucesso!');
    },
    onError: (err) => {
      error('Erro ao excluir disciplina: ' + err.message);
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      success('Questão criada com sucesso!');
    },
    onError: (err) => {
      error('Erro ao criar questão: ' + err.message);
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateQuestion(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions', id] });
      success('Questão atualizada com sucesso!');
    },
    onError: (err) => {
      error('Erro ao atualizar questão: ' + err.message);
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      success('Questão excluída com sucesso!');
    },
    onError: (err) => {
      error('Erro ao excluir questão: ' + err.message);
    },
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      success('Prova criada com sucesso!');
    },
    onError: (err) => {
      error('Erro ao criar prova: ' + err.message);
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateExam(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', id] });
      success('Prova atualizada com sucesso!');
    },
    onError: (err) => {
      error('Erro ao atualizar prova: ' + err.message);
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      success('Prova excluída com sucesso!');
    },
    onError: (err) => {
      error('Erro ao excluir prova: ' + err.message);
    },
  });
}

export function usePublishExam() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.publishExam,
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', examId] });
      success('Prova publicada com sucesso!');
    },
    onError: (err) => {
      error('Erro ao publicar prova: ' + err.message);
    },
  });
}

export function useGeneratePDFs() {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: apiService.generatePDFs,
    onSuccess: () => {
      success('PDFs gerados com sucesso!');
    },
    onError: (err) => {
      error('Erro ao gerar PDFs: ' + err.message);
    },
  });
}