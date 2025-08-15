import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, AlertCircle, CheckCircle, Send, ArrowLeft, 
  ArrowRight, Flag, Eye, User, BookOpen, FileText,
  Wifi, WifiOff, Save, RotateCcw, HelpCircle, List,
  Monitor, Smartphone, ChevronLeft, ChevronRight,
  Home, LogOut, AlertTriangle, Check, X
} from 'lucide-react';

// This component will integrate with real API data when used in the actual application

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
      bg-white rounded-lg border-2 p-4 text-center shadow-lg
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
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Navegação das Questões</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((_, index) => {
          const isAnswered = answers[index] !== undefined;
          const isCurrent = index === currentQuestion;
          
          return (
            <button
              key={index}
              onClick={() => onQuestionSelect(index)}
              className={`
                h-10 w-10 rounded-lg border-2 font-medium text-sm transition-all
                ${isCurrent 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : isAnswered 
                    ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {index + 1}
              {isAnswered && !isCurrent && (
                <Check className="w-3 h-3 ml-1 inline" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Respondida</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Atual</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>Não respondida</span>
          </div>
        </div>
        <span>
          {Object.keys(answers).length}/{questions.length} respondidas
        </span>
      </div>
    </div>
  );
}

function QuestionCard({ question, questionIndex, selectedAnswer, onAnswerSelect }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Questão {questionIndex + 1}
          </span>
          <span className="text-xs text-gray-500">
            {question.points} ponto{question.points !== 1 ? 's' : ''}
          </span>
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
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
              }
            `}
          >
            <input
              type="radio"
              name={`question-${questionIndex}`}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => onAnswerSelect(index)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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

function ExamHeader({ examData, studentInfo, onExit }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{examData.title}</h1>
              <p className="text-sm text-gray-500">{examData.subject.name} • Variação {examData.variation.number}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{studentInfo.name}</span>
            </div>
            <p className="text-xs text-gray-500">ID: {studentInfo.studentId}</p>
          </div>
          
          <button
            onClick={onExit}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title="Sair da prova"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitModal({ isOpen, onClose, onConfirm, answeredCount, totalQuestions, isSubmitting }) {
  const unansweredCount = totalQuestions - answeredCount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Finalizar Prova</h3>
            <p className="text-sm text-gray-500">Confirme antes de enviar suas respostas</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Questões respondidas:</span>
            <span className="font-medium text-green-600">{answeredCount}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Questões não respondidas:</span>
            <span className="font-medium text-red-600">{unansweredCount}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Total:</span>
              <span className="font-medium text-gray-900">{totalQuestions}</span>
            </div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Atenção!</p>
                <p>Você ainda tem {unansweredCount} questão{unansweredCount !== 1 ? 'ões' : ''} não respondida{unansweredCount !== 1 ? 's' : ''}. Tem certeza que deseja finalizar?</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-6">
          Após confirmar, suas respostas serão enviadas e você não poderá mais alterá-las.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Revisar Respostas
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Finalizar Prova
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus({ isOnline }) {
  return (
    <div className={`
      fixed top-4 right-4 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium z-40
      ${isOnline 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
      }
    `}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

function AutoSaveIndicator({ isAutoSaving }) {
  if (!isAutoSaving) return null;

  return (
    <div className="fixed bottom-4 right-4 flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm z-40">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span>Salvando...</span>
    </div>
  );
}

export default function ExamTaking() {
  // These would come from props or URL params in real implementation:
  // const { examId, variationId } = useParams();
  // const location = useLocation();
  // const studentInfo = location.state?.studentInfo;
  
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showExitModal, setShowExitModal] = useState(false);

  // These would come from real data in actual implementation
  const studentInfo = null; // Will come from props/context
  
  // Load exam data effect would be replaced with real API call:
  // useEffect(() => {
  //   const loadExamData = async () => {
  //     try {
  //       const response = await apiService.scanQR(examId, variationId);
  //       setExamData(response.data);
  //       // Load saved answers if any...
  //     } catch (error) {
  //       // Handle error
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadExamData();
  // }, [examId, variationId]);

  useEffect(() => {
    // This simulates loading - remove in real implementation
    setLoading(false);
  }, []);

  // Auto-save answers
  useEffect(() => {
    if (Object.keys(answers).length > 0 && examData) {
      setAutoSaving(true);
      const timeoutId = setTimeout(() => {
        // Simulate auto-save
        console.log('Auto-saving answers:', answers);
        setAutoSaving(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [answers, examData]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Prevent page reload/navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = (e) => {
      e.preventDefault();
      if (window.confirm('Tem certeza que deseja sair? Seu progresso pode ser perdido.')) {
        // Allow navigation
        return;
      }
      // Prevent navigation
      window.history.pushState(null, '', window.location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Add initial state to prevent back navigation
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleQuestionNavigation = (direction) => {
    if (!examData?.questions) return;
    
    if (direction === 'next' && currentQuestion < examData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleQuestionSelect = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  const handleTimeUp = () => {
    setShowSubmitModal(true);
    // Auto-submit after a delay
    setTimeout(() => {
      handleSubmitExam();
    }, 5000);
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    
    try {
      // This would be replaced with real API call:
      // await apiService.submitAnswers(examData.id, examData.variation.id, answers);
      console.log('Submitting exam with answers:', answers);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Prova enviada com sucesso!');
      setShowSubmitModal(false);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Erro ao enviar prova. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitExam = () => {
    if (window.confirm('Tem certeza que deseja sair da prova? Seu progresso será perdido.')) {
      // Navigate away
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando prova...</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Prova não encontrada</h3>
          <p className="text-gray-600 mb-6">
            Não foi possível carregar os dados da prova. Verifique o QR Code e tente novamente.
          </p>
          <button
            onClick={() => window.location.href = '/scan'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Scanner
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = examData?.questions?.[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = examData?.questions ? (answeredCount / examData.questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection Status */}
      <ConnectionStatus isOnline={isOnline} />
      
      {/* Auto-save Indicator */}
      <AutoSaveIndicator isAutoSaving={autoSaving} />

      {/* Header */}
      <ExamHeader 
        examData={examData} 
        studentInfo={studentInfo} 
        onExit={handleExitExam}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timer */}
            {examData?.timeLimit && (
              <Timer 
                duration={examData.timeLimit} 
                onTimeUp={handleTimeUp}
                isPaused={showSubmitModal}
              />
            )}

            {/* Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Progresso</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {answeredCount} de {examData?.questions?.length || 0} questões respondidas
              </p>
            </div>

            {/* Question Navigation */}
            {examData?.questions && (
              <QuestionNavigation
                questions={examData.questions}
                currentQuestion={currentQuestion}
                answers={answers}
                onQuestionSelect={handleQuestionSelect}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentQuestionData ? (
              <div className="space-y-6">
                {/* Current Question */}
                <QuestionCard
                  question={currentQuestionData}
                  questionIndex={currentQuestion}
                  selectedAnswer={answers[currentQuestion]}
                  onAnswerSelect={(answerIndex) => handleAnswerSelect(currentQuestion, answerIndex)}
                />

                {/* Navigation Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleQuestionNavigation('prev')}
                    disabled={currentQuestion === 0}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </button>

                  <span className="text-sm text-gray-500">
                    Questão {currentQuestion + 1} de {examData?.questions?.length || 0}
                  </span>

                  <div className="flex space-x-3">
                    {currentQuestion === (examData?.questions?.length || 1) - 1 ? (
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Finalizar Prova
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuestionNavigation('next')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma questão disponível</h3>
                <p className="text-gray-600">
                  Não há questões para exibir nesta prova.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {examData && (
        <SubmitModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={handleSubmitExam}
          answeredCount={answeredCount}
          totalQuestions={examData.questions?.length || 0}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}