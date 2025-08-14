import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Html5QrcodeScanner } from 'html5-qrcode';
import apiService from '../services/api';
import { useToast } from '../contexts/ToastContext';

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

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// QR Scanner Hook
export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const { error: showError } = useToast();

  const startScanning = useCallback((elementId, config = {}) => {
    if (isScanning) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const scanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          ...config,
        },
        /* verbose= */ false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          setResult(decodedText);
          setIsScanning(false);
          scanner.clear();
        },
        (error) => {
          // Silent fail for scan failures, only log actual errors
          if (error.includes('NotFoundException')) {
            return; // Normal when no QR code is detected
          }
          console.warn('QR Scan Error:', error);
        }
      );
    } catch (err) {
      setError('Erro ao inicializar scanner: ' + err.message);
      showError('Erro ao inicializar câmera. Verifique as permissões.');
      setIsScanning(false);
    }
  }, [isScanning, showError]);

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

// API Query Hooks
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

// Mutation Hooks
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