import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { 
  ArrowLeft, Save, Eye, AlertCircle, CheckCircle, 
  Settings, FileText, Clock, Shuffle, BarChart3
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

  const handleQuestionToggle = (question) => {
    setSelectedQuestions(prev => {
      const isSelected = prev.find(q => q.id === question.id);
      if (isSelected) {
        return prev.filter(q => q.id !== question.id);
      } else {
        return [...prev, { ...question, examPoints: question.points || 1.0 }];
      }
    });
  };

  const handleQuestionPointsChange = (questionId, points) => {
    setSelectedQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, examPoints: parseFloat(points) || 1.0 }
          : q
      )
    );
  };

  const totalQuestions = selectedQuestions.length;
  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.examPoints || 1.0), 0);
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
                  {totalQuestions} questões • {totalPoints.toFixed(1)} pontos
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
              {selectedQuestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Questões Selecionadas:</h3>
                  <div className="space-y-3">
                    {selectedQuestions.map((question, index) => (
                      <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">Questão {index + 1}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {question.difficulty === 'easy' ? 'Fácil' :
                               question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{question.text}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <label className="text-sm text-gray-600">Pontos:</label>
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={question.examPoints}
                            onChange={(e) => handleQuestionPointsChange(question.id, e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuestionToggle(question)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Selector */}
              {showQuestionSelector && (
                <QuestionSelector
                  questions={questions}
                  selectedQuestions={selectedQuestions}
                  onQuestionToggle={handleQuestionToggle}
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
    </div>
  );
}

// Component for Question Selector
function QuestionSelector({ questions, selectedQuestions, onQuestionToggle }) {
  const isQuestionSelected = (questionId) => {
    return selectedQuestions.find(q => q.id === questionId);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Selecione as questões ({questions.length} disponíveis):
      </h3>
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              isQuestionSelected(question.id)
                ? 'border-primary-300 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onQuestionToggle(question)}
          >
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={isQuestionSelected(question.id)}
                onChange={() => onQuestionToggle(question)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">Questão {index + 1}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {question.difficulty === 'easy' ? 'Fácil' :
                     question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {question.points || 1} ponto(s) padrão
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{question.text}</p>
                {question.alternatives && (
                  <div className="mt-2 text-xs text-gray-500">
                    {question.alternatives.length} alternativas
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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