import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { 
  ArrowLeft, Save, Eye, AlertCircle, CheckCircle, 
  Settings, FileText, Clock, Shuffle, BarChart3,
  X, EyeOff, Award, Hash, BookOpen
} from 'lucide-react';
import { useSubjects, useQuestions, useCreateExam } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import { Select, Input, Textarea, Switch } from '../../components/ui/Input';

export default function ExamCreate() {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionsAvailable, setQuestionsAvailable] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { data: subjectsData } = useSubjects();
  const { data: questionsData } = useQuestions({
    subjectId: selectedSubject,
    limit: 1000, // Get all questions for preview
  });
  const createExamMutation = useCreateExam();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      subjectId: '',
      duration: 60,
      variations: 5,
      shuffleQuestions: true,
      shuffleAlternatives: true,
      showResults: true,
      allowReview: false,
      timeLimit: true,
      showTimer: true,
      preventCopy: true,
      randomizeOrder: true,
    },
  });

  const subjects = subjectsData?.data?.subjects || [];
  const questions = questionsData?.data?.questions || [];
  const watchedSubject = watch('subjectId');

  // Update selected subject and calculate available questions
  useEffect(() => {
    setSelectedSubject(watchedSubject);
    
    if (watchedSubject && questions.length > 0) {
      const available = {
        total: questions.length,
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length,
      };
      setQuestionsAvailable(available);
    } else {
      setQuestionsAvailable({ total: 0, easy: 0, medium: 0, hard: 0 });
    }
  }, [watchedSubject, questions]);

  const onSubmit = async (data) => {
    if (selectedQuestions.length === 0) {
      showError('Selecione pelo menos uma questão');
      return;
    }

    if (selectedQuestions.length > 50) {
      showError('Máximo de 50 questões por prova');
      return;
    }

    try {
      const examData = {
        ...data,
        questions: selectedQuestions.map(q => ({
          id: q.id,
          points: q.examPoints || 1.0
        })),
        totalQuestions: selectedQuestions.length,
      };

      const response = await createExamMutation.mutateAsync(examData);
      success('Prova criada com sucesso!');
      navigate(`/exams/${response.data.exam.id}`);
    } catch (error) {
      showError(error.message || 'Erro ao criar prova');
    }
  };

  const handleQuestionToggle = useCallback((question) => {
    console.log('=== handleQuestionToggle START ===');
    console.log('Question received:', question);
    
    if (!question || !question.id) {
      console.error('Invalid question data:', question);
      showError('Erro: dados da questão inválidos');
      return;
    }

    try {
      setSelectedQuestions(prev => {
        console.log('Previous selected questions:', prev);
        const isSelected = prev.find(q => q && q.id === question.id);
        console.log('Is question selected?', !!isSelected);
        
        let newSelection;
        if (isSelected) {
          console.log('Removing question:', question.id);
          newSelection = prev.filter(q => q && q.id !== question.id);
        } else {
          console.log('Adding question:', question.id);
          const questionWithPoints = { 
            ...question, 
            examPoints: parseFloat(question.points) || 1.0,
            // Garantir que temos todos os campos necessários
            text: question.text || question.title || '',
            difficulty: question.difficulty || 'medium',
            type: question.type || 'multiple_choice'
          };
          newSelection = [...prev, questionWithPoints];
        }
        
        console.log('New selection:', newSelection);
        console.log('New selection count:', newSelection.length);
        console.log('=== handleQuestionToggle END ===');
        return newSelection;
      });
    } catch (error) {
      console.error('Error in handleQuestionToggle:', error);
      showError('Erro ao selecionar questão');
    }
  }, [showError]);

  const handleQuestionPointsChange = (questionId, points) => {
    try {
      if (!questionId) {
        console.error('Invalid questionId:', questionId);
        return;
      }

      const numericPoints = parseFloat(points);
      if (isNaN(numericPoints) || numericPoints < 0.1 || numericPoints > 10) {
        console.warn('Invalid points value:', points);
        return;
      }

      setSelectedQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, examPoints: numericPoints }
            : q
        )
      );
    } catch (error) {
      console.error('Error in handleQuestionPointsChange:', error);
      showError('Erro ao atualizar pontos da questão');
    }
  };

  const totalQuestions = selectedQuestions.length;
  const totalPoints = selectedQuestions.reduce((sum, q) => {
    const points = parseFloat(q.examPoints) || 1.0;
    return sum + points;
  }, 0);
  const canCreateExam = selectedSubject && totalQuestions > 0;

  if (createExamMutation.isPending) {
    return <LoadingPage title="Criando prova..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova Prova</h1>
            <p className="text-gray-600">Configure sua prova com múltiplas variações</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Editar' : 'Preview'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <ExamPreview 
          formData={watch()}
          selectedQuestions={selectedQuestions}
          onBack={() => setPreviewMode(false)}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Título da Prova"
                  placeholder="Ex: Física - 1º Bimestre"
                  error={errors.title?.message}
                  {...register('title', {
                    required: 'Título é obrigatório',
                    minLength: {
                      value: 3,
                      message: 'Título deve ter pelo menos 3 caracteres',
                    },
                  })}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Descrição (opcional)"
                  placeholder="Descrição detalhada da prova..."
                  rows={3}
                  {...register('description')}
                />
              </div>

              <div>
                <Controller
                  name="subjectId"
                  control={control}
                  rules={{ required: 'Disciplina é obrigatória' }}
                  render={({ field }) => (
                    <Select
                      label="Disciplina"
                      placeholder="Selecione uma disciplina"
                      options={subjects.map(subject => ({
                        value: subject.id,
                        label: subject.name,
                      }))}
                      error={errors.subjectId?.message}
                      {...field}
                    />
                  )}
                />
              </div>

              <div>
                <Input
                  label="Duração (minutos)"
                  type="number"
                  min="15"
                  max="300"
                  error={errors.duration?.message}
                  {...register('duration', {
                    required: 'Duração é obrigatória',
                    min: {
                      value: 15,
                      message: 'Duração mínima de 15 minutos',
                    },
                    max: {
                      value: 300,
                      message: 'Duração máxima de 300 minutos',
                    },
                  })}
                />
              </div>
            </div>
          </div>

          {/* Question Selection */}
          {selectedSubject && (
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Seleção de Questões</h2>
                </div>
                <div className="text-sm text-gray-600">
                  {totalQuestions} questões • {(totalPoints || 0).toFixed(1)} pontos
                </div>
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                  className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                >
                  {showQuestionSelector ? 'Ocultar' : 'Selecionar'} Questões ({questionsAvailable.total} disponíveis)
                </button>
              </div>

              {/* Selected Questions Summary */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Questões Selecionadas ({selectedQuestions.length})
                  </h3>
                  {selectedQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedQuestions([])}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Limpar todas
                    </button>
                  )}
                </div>
                
                {selectedQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedQuestions.map((question, index) => {
                      // Validação extra para garantir que temos os dados da questão
                      if (!question || !question.id) {
                        console.warn('Questão inválida encontrada:', question);
                        return null;
                      }
                      
                      return (
                        <div key={`selected-${question.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">Questão {index + 1}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                question.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {question.difficulty === 'easy' ? 'Fácil' :
                                 question.difficulty === 'medium' ? 'Médio' : 
                                 question.difficulty === 'hard' ? 'Difícil' : 'N/A'}
                              </span>
                              <span className="text-xs text-gray-500">ID: {question.id}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate" title={question.text}>
                              {question.text || question.title || 'Texto da questão não disponível'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <label className="text-xs text-gray-600 whitespace-nowrap">Pontos:</label>
                            <input
                              type="number"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={question.examPoints || 1.0}
                              onChange={(e) => handleQuestionPointsChange(question.id, e.target.value)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuestionToggle(question)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remover questão"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Nenhuma questão selecionada</p>
                    <p className="text-xs text-gray-400">Clique no botão "Selecionar Questões" acima para começar</p>
                  </div>
                )}
              </div>

              {/* Question Selector */}
              {showQuestionSelector && (
                <QuestionSelector
                  questions={questions}
                  selectedQuestions={selectedQuestions}
                  onQuestionToggle={handleQuestionToggle}
                  onQuestionPreview={setPreviewQuestion}
                  onQuestionPointsChange={handleQuestionPointsChange}
                />
              )}

              {questionsAvailable.total === 0 && selectedSubject && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Nenhuma questão encontrada
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Esta disciplina ainda não possui questões cadastradas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Exam Settings */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <Settings className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Configurações da Prova</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Número de Variações"
                  type="number"
                  min="1"
                  max="20"
                  error={errors.variations?.message}
                  {...register('variations', {
                    required: 'Número de variações é obrigatório',
                    min: {
                      value: 1,
                      message: 'Mínimo de 1 variação',
                    },
                    max: {
                      value: 20,
                      message: 'Máximo de 20 variações',
                    },
                  })}
                />
              </div>

              <div className="space-y-4">
                <Controller
                  name="shuffleQuestions"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      label="Embaralhar questões"
                      description="Altera a ordem das questões em cada variação"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="shuffleAlternatives"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      label="Embaralhar alternativas"
                      description="Altera a ordem das alternativas"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="showResults"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      label="Mostrar resultados"
                      description="Permite que os alunos vejam suas notas"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="allowReview"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      label="Permitir revisão"
                      description="Alunos podem revisar respostas após finalizar"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {canCreateExam ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Pronto para criar
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Complete as informações acima
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => navigate('/exams')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canCreateExam || isSubmitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Criando...' : 'Criar Prova'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Question Preview Modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => {
            setPreviewQuestion(null);
            setShowCorrectAnswers(false);
          }}
          showCorrectAnswers={showCorrectAnswers}
          onToggleAnswers={() => setShowCorrectAnswers(!showCorrectAnswers)}
        />
      )}
    </div>
  );
}

// Simple Checkbox Component
function SimpleCheckbox({ checked, questionId, question, onToggle }) {
  const [isChecked, setIsChecked] = useState(checked);
  
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleClick = () => {
    console.log('SimpleCheckbox clicked for question:', questionId);
    console.log('Current checked state:', isChecked);
    
    try {
      onToggle(question);
    } catch (error) {
      console.error('Error in SimpleCheckbox onToggle:', error);
    }
  };

  return (
    <input
      type="checkbox"
      checked={isChecked}
      onChange={handleClick}
      className="w-6 h-6 text-primary-600 border-2 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
    />
  );
}

// Component for Question Selector
function QuestionSelector({ questions, selectedQuestions, onQuestionToggle, onQuestionPreview, onQuestionPointsChange }) {
  console.log('QuestionSelector rendered with:', {
    questionsCount: questions?.length || 0,
    selectedQuestionsCount: selectedQuestions?.length || 0,
    onQuestionToggle: typeof onQuestionToggle
  });

  // Add error handling and validation
  if (!questions || !Array.isArray(questions)) {
    console.error('QuestionSelector: Invalid questions data:', questions);
    return (
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
        Erro ao carregar questões. Dados inválidos.
      </div>
    );
  }

  if (!selectedQuestions || !Array.isArray(selectedQuestions)) {
    console.error('QuestionSelector: Invalid selectedQuestions data:', selectedQuestions);
    return (
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
        Erro ao carregar questões selecionadas. Dados inválidos.
      </div>
    );
  }

  const isQuestionSelected = (questionId) => {
    return selectedQuestions.find(q => q && q.id === questionId);
  };

  const getQuestionPoints = (questionId) => {
    const selectedQuestion = selectedQuestions.find(q => q && q.id === questionId);
    return selectedQuestion ? selectedQuestion.examPoints : (questions.find(q => q && q.id === questionId)?.points || 1.0);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Selecione as questões ({questions.length} disponíveis):
      </h3>
      <div className="space-y-4">
        {questions.filter(q => q && q.id).map((question, index) => {
          const isSelected = isQuestionSelected(question.id);
          const currentPoints = getQuestionPoints(question.id);
          
          return (
            <div
              key={question.id}
              className={`p-4 border rounded-lg transition-colors ${
                isSelected
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox maior */}
                <div className="flex-shrink-0 pt-1">
                  <SimpleCheckbox 
                    checked={!!isSelected} 
                    questionId={question.id}
                    question={question}
                    onToggle={onQuestionToggle}
                  />
                </div>
                
                {/* Conteúdo da questão */}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onQuestionPreview(question)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Questão {index + 1}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty === 'easy' ? 'Fácil' :
                         question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {question.points || 1} pts padrão
                      </span>
                    </div>
                    
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {question.text || question.title}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <div>
                      {question.alternatives && (
                        <span>{question.alternatives.length} alternativas</span>
                      )}
                      {question.type === 'essay' && <span>Questão dissertativa</span>}
                      {question.type === 'true_false' && <span>Verdadeiro/Falso</span>}
                    </div>
                  </div>
                </div>

                {/* Campo de pontuação */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="flex flex-col items-center space-y-2">
                      <label className="text-xs font-medium text-gray-600">
                        Pontos na Prova
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={currentPoints || 1.0}
                        onChange={(e) => {
                          e.stopPropagation();
                          try {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0.1 && value <= 10) {
                              onQuestionPointsChange(question.id, value);
                            }
                          } catch (error) {
                            console.error('Error updating points:', error);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="text-xs text-gray-500">pontos</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Linha adicional para mostrar pontos quando não selecionada */}
              {!isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Marque a caixa acima para selecionar esta questão</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {question.points || 1} pts (padrão)
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Preview Component
function ExamPreview({ formData, selectedQuestions, onBack }) {
  const totalQuestions = selectedQuestions.length;
  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.examPoints || 1.0), 0);
  
  const difficultyCount = {
    easy: selectedQuestions.filter(q => q.difficulty === 'easy').length,
    medium: selectedQuestions.filter(q => q.difficulty === 'medium').length,
    hard: selectedQuestions.filter(q => q.difficulty === 'hard').length,
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Preview da Prova</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Voltar para Edição
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{formData.title || 'Título da Prova'}</h3>
          {formData.description && (
            <p className="text-gray-600 mb-4">{formData.description}</p>
          )}
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formData.duration} minutos
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              {totalQuestions} questões • {totalPoints.toFixed(1)} pontos
            </div>
            <div className="flex items-center">
              <Shuffle className="w-4 h-4 mr-1" />
              {formData.variations} variações
            </div>
          </div>
        </div>

        {/* Question Distribution */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Distribuição por Dificuldade</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-800">{difficultyCount.easy}</div>
              <div className="text-sm text-green-600">Fácil</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-800">{difficultyCount.medium}</div>
              <div className="text-sm text-yellow-600">Médio</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-800">{difficultyCount.hard}</div>
              <div className="text-sm text-red-600">Difícil</div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Configurações</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Embaralhar questões</span>
              <span className={formData.shuffleQuestions ? 'text-green-600' : 'text-red-600'}>
                {formData.shuffleQuestions ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Embaralhar alternativas</span>
              <span className={formData.shuffleAlternatives ? 'text-green-600' : 'text-red-600'}>
                {formData.shuffleAlternatives ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Mostrar resultados</span>
              <span className={formData.showResults ? 'text-green-600' : 'text-red-600'}>
                {formData.showResults ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Permitir revisão</span>
              <span className={formData.allowReview ? 'text-green-600' : 'text-red-600'}>
                {formData.allowReview ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Questions with Points */}
        {selectedQuestions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Questões Selecionadas</h4>
            <div className="space-y-4">
              {selectedQuestions.slice(0, 3).map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        Questão {index + 1}
                      </span>
                      <span className="text-sm font-bold text-primary-600">
                        {question.examPoints || 1.0} pts
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty === 'easy' ? 'Fácil' :
                       question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{question.text}</p>
                  <div className="space-y-2">
                    {question.alternatives?.slice(0, 2).map((alt, altIndex) => (
                      <div key={altIndex} className="flex items-center space-x-2">
                        <div className="w-4 h-4 border border-gray-300 rounded" />
                        <span className="text-sm text-gray-600">{alt}</span>
                      </div>
                    ))}
                    {question.alternatives?.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{question.alternatives.length - 2} alternativas...
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {selectedQuestions.length > 3 && (
                <div className="text-center text-sm text-gray-500">
                  +{selectedQuestions.length - 3} questões adicionais...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Question Preview Modal Component
function QuestionPreviewModal({ question, onClose, showCorrectAnswers, onToggleAnswers }) {
  const difficultyConfig = {
    easy: { label: 'Fácil', color: 'bg-green-100 text-green-800', icon: '📗' },
    medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800', icon: '📙' },
    hard: { label: 'Difícil', color: 'bg-red-100 text-red-800', icon: '📕' },
  };

  const typeConfig = {
    multiple_choice: { label: 'Múltipla Escolha', icon: CheckCircle },
    true_false: { label: 'Verdadeiro/Falso', icon: AlertCircle },
    essay: { label: 'Dissertativa', icon: FileText },
  };

  const difficultyInfo = difficultyConfig[question.difficulty] || difficultyConfig.medium;
  const typeInfo = typeConfig[question.type] || typeConfig.multiple_choice;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">Preview da Questão</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${difficultyInfo.color}`}>
                {difficultyInfo.icon} {difficultyInfo.label}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggleAnswers}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm ${
                  showCorrectAnswers 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showCorrectAnswers ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ocultar Respostas
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar Respostas
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Question Info */}
          <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center">
              <TypeIcon className="w-4 h-4 mr-1" />
              {typeInfo.label}
            </div>
            <div className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              {question.points || 1} ponto{(question.points || 1) !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <Hash className="w-4 h-4 mr-1" />
              ID: {question.id.slice(-8)}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {question.title || 'Questão'}
            </h3>
            
            <div className="prose max-w-none">
              <p className="text-gray-900 leading-relaxed text-base">
                {question.text || question.title || 'Enunciado da questão não disponível'}
              </p>
            </div>

            {/* Question Image */}
            {question.image && (
              <div className="mt-4">
                <img 
                  src={question.image} 
                  alt="Imagem da questão" 
                  className="max-w-full h-auto rounded-lg shadow-sm border"
                />
              </div>
            )}
          </div>

          {/* Alternatives */}
          {question.type === 'multiple_choice' && question.alternatives && (
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Alternativas:</h4>
              {question.alternatives.map((alternative, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1 text-gray-900">
                    {alternative}
                  </div>
                  {showCorrectAnswers && index === question.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {question.type === 'true_false' && (
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Alternativas:</h4>
              {['Verdadeiro', 'Falso'].map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {index === 0 ? 'V' : 'F'}
                  </div>
                  <div className="flex-1 text-gray-900">{option}</div>
                  {showCorrectAnswers && index === question.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Essay */}
          {question.type === 'essay' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">Questão Dissertativa</span>
              </div>
              <p className="text-yellow-700 text-sm">
                Esta questão requer resposta escrita do aluno e será corrigida manualmente.
              </p>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Explicação
              </h4>
              <p className="text-blue-800 text-sm">{question.explanation}</p>
            </div>
          )}

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                <Hash className="w-4 h-4 mr-2" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Esta questão será incluída na prova com a pontuação definida pelo professor.
            </div>
            
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}