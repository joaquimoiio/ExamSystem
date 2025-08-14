import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Clock, AlertCircle, CheckCircle, Send, ArrowLeft, 
  ArrowRight, Flag, Eye, User, BookOpen, FileText,
  Wifi, WifiOff, Save, RotateCcw, HelpCircle
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';

function Timer({ duration, onTimeUp, isPaused = false }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPaused, timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / (duration * 60)) * 100;
  const isWarning = percentage <= 25;
  const isCritical = percentage <= 10;

  return (
    <div className={`
      bg-white rounded-lg border-2 p-4 text-center
      ${isCritical ? 'border-red-500 bg-red-50' : 
        isWarning ? 'border-yellow-500 bg-yellow-50' : 
        'border-gray-200'}
    `}>
      <div className="flex items-center justify-center space-x-2 mb-2">
        <Clock className={`w-5 h-5 ${
          isCritical ? 'text-red-600' : 
          isWarning ? 'text-yellow-600' : 
          'text-gray-600'
        }`} />
        <span className="text-sm font-medium text-gray-600">Tempo Restante</span>
      </div>
      
      <div className={`text-2xl font-bold ${
        isCritical ? 'text-red-600' : 
        isWarning ? 'text-yellow-600' : 
        'text-gray-900'
      }`}>
        {formatTime(timeLeft)}
      </div>
      
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            isCritical ? 'bg-red-500' : 
            isWarning ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isCritical && (
        <div className="mt-2 text-xs text-red-600 font-medium">
          ⚠️ Tempo quase esgotado!
        </div>
      )}
    </div>
  );
}

function QuestionNavigation({ questions, currentQuestion, answers, onQuestionSelect }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Navegação</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((_, index) => {
          const isAnswered = answers[index] !== undefined && answers[index] !== null;
          const isCurrent = currentQuestion === index;
          
          return (
            <button
              key={index}
              onClick={() => onQuestionSelect(index)}
              className={`
                w-10 h-10 rounded-lg text-sm font-medium transition-colors
                ${isCurrent 
                  ? 'bg-primary-600 text-white' 
                  : isAnswered 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span className="text-gray-600">Respondida</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-100 rounded"></div>
          <span className="text-gray-600">Não respondida</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary-600 rounded"></div>
          <span className="text-gray-600">Atual</span>
        </div>
      </div>
    </div>
  );
}

function Question({ question, questionIndex, selectedAnswer, onAnswerChange }) {
  if (!question) return null;

  const handleAnswerSelect = (alternativeIndex) => {
    onAnswerChange(questionIndex, alternativeIndex);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
            Questão {questionIndex + 1}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {question.difficulty === 'easy' ? 'Fácil' :
             question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {question.points} ponto{question.points !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
          {question.statement}
        </h3>
      </div>

      <div className="space-y-3">
        {question.alternatives?.map((alternative, index) => (
          <label
            key={index}
            className={`
              flex items-start space-x-3 p-4 border rounded-lg cursor-pointer
              transition-colors hover:bg-gray-50
              ${selectedAnswer === index 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200'
              }
            `}
          >
            <input
              type="radio"
              name={`question-${questionIndex}`}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => handleAnswerSelect(index)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="text-gray-900 leading-relaxed flex-1">
              {alternative.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ExamTaking() {
  const { examId, variationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { offline } = useApp();
  const { success, error: showError, warning } = useToast();

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const studentInfo = location.state?.studentInfo;

  // Load exam data
  useEffect(() => {
    const loadExamData = async () => {
      try {
        const response = await apiService.scanQR(examId, variationId);
        setExamData(response.data);
        
        // Load saved answers if any
        const savedAnswers = localStorage.getItem(`exam_answers_${examId}_${variationId}`);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
            warning('Respostas salvas anteriormente foram carregadas');
          } catch (error) {
            console.error('Error loading saved answers:', error);
          }
        }
      } catch (error) {
        showError(error.message || 'Erro ao carregar dados da prova');
        navigate('/scan');
      } finally {
        setLoading(false);
      }
    };

    if (!studentInfo) {
      navigate('/scan');
      return;
    }

    loadExamData();
  }, [examId, variationId, studentInfo, navigate, showError, warning]);

  // Auto-save answers
  useEffect(() => {
    if (Object.keys(answers).length > 0 && examData) {
      setAutoSaving(true);
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`exam_answers_${examId}_${variationId}`, JSON.stringify(answers));
        setAutoSaving(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [answers, examId, variationId, examData]);

  // Prevent page reload/navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = (e) => {
      e.preventDefault();
      if (window.confirm('Tem certeza que deseja sair? Suas respostas serão perdidas.')) {
        navigate('/scan');
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleTimeUp = () => {
    warning('Tempo esgotado! Submissão automática...');
    handleSubmit(true);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (offline && !autoSubmit) {
      showError('Submissão requer conexão com a internet');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await apiService.submitAnswers(examId, variationId, {
        answers,
        studentInfo,
        submittedAt: new Date().toISOString(),
      });

      // Clear saved answers
      localStorage.removeItem(`exam_answers_${examId}_${variationId}`);

      success('Prova submetida com sucesso!');
      navigate(`/results/${response.data.submissionId}`, {
        state: { 
          studentInfo,
          examData,
          answers 
        }
      });
    } catch (error) {
      showError(error.message || 'Erro ao submeter prova');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = examData?.questions?.length || 0;
  const allAnswered = answeredCount === totalQuestions;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando prova...</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar dados da prova</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">{examData.subject?.name}</span>
              </div>
              <div className="text-gray-400">•</div>
              <h1 className="font-semibold text-gray-900">{examData.title}</h1>
            </div>

            <div className="flex items