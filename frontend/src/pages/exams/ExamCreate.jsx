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
import { Select, Input, TextArea, Switch } from '../../components/ui/Input';

export default function ExamCreate() {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [difficultyConfig, setDifficultyConfig] = useState({
    easy: 8,
    medium: 8,
    hard: 4,
  });
  const [questionsAvailable, setQuestionsAvailable] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [previewMode, setPreviewMode] = useState(false);

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
    const totalQuestions = difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;
    
    if (totalQuestions === 0) {
      showError('Selecione pelo menos uma questão');
      return;
    }

    if (totalQuestions > 50) {
      showError('Máximo de 50 questões por prova');
      return;
    }

    // Validate if we have enough questions
    if (difficultyConfig.easy > questionsAvailable.easy ||
        difficultyConfig.medium > questionsAvailable.medium ||
        difficultyConfig.hard > questionsAvailable.hard) {
      showError('Questões insuficientes para a distribuição selecionada');
      return;
    }

    try {
      const examData = {
        ...data,
        difficultyDistribution: difficultyConfig,
        totalQuestions,
      };

      const response = await createExamMutation.mutateAsync(examData);
      success('Prova criada com sucesso!');
      navigate(`/exams/${response.data.exam.id}`);
    } catch (error) {
      showError(error.message || 'Erro ao criar prova');
    }
  };

  const handleDifficultyChange = (difficulty, value) => {
    const numValue = Math.max(0, Math.min(value, questionsAvailable[difficulty]));
    setDifficultyConfig(prev => ({
      ...prev,
      [difficulty]: numValue,
    }));
  };

  const totalQuestions = difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;
  const canCreateExam = selectedSubject && totalQuestions > 0 && 
    difficultyConfig.easy <= questionsAvailable.easy &&
    difficultyConfig.medium <= questionsAvailable.medium &&
    difficultyConfig.hard <= questionsAvailable.hard;

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
          difficultyConfig={difficultyConfig}
          questions={questions}
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
                <TextArea
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

          {/* Question Distribution */}
          {selectedSubject && (
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Distribuição de Questões</h2>
                </div>
                <div className="text-sm text-gray-600">
                  Total: {totalQuestions} questões
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DifficultySelector
                  label="Fácil"
                  color="green"
                  value={difficultyConfig.easy}
                  available={questionsAvailable.easy}
                  onChange={(value) => handleDifficultyChange('easy', value)}
                />
                <DifficultySelector
                  label="Médio"
                  color="yellow"
                  value={difficultyConfig.medium}
                  available={questionsAvailable.medium}
                  onChange={(value) => handleDifficultyChange('medium', value)}
                />
                <DifficultySelector
                  label="Difícil"
                  color="red"
                  value={difficultyConfig.hard}
                  available={questionsAvailable.hard}
                  onChange={(value) => handleDifficultyChange('hard', value)}
                />
              </div>

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

// Component for Difficulty Selector
function DifficultySelector({ label, color, value, available, onChange }) {
  const colorClasses = {
    green: 'border-green-200 bg-green-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    red: 'border-red-200 bg-red-50',
  };

  const textColorClasses = {
    green: 'text-green-800',
    yellow: 'text-yellow-800',
    red: 'text-red-800',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-medium ${textColorClasses[color]}`}>{label}</h3>
        <span className="text-sm text-gray-600">{available} disponíveis</span>
      </div>
      
      <input
        type="number"
        min="0"
        max={available}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      
      {value > available && (
        <p className="text-sm text-red-600 mt-2">
          Insuficientes ({available} disponíveis)
        </p>
      )}
    </div>
  );
}

// Preview Component
function ExamPreview({ formData, difficultyConfig, questions, onBack }) {
  const totalQuestions = difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;

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
              {totalQuestions} questões
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
              <div className="text-2xl font-bold text-green-800">{difficultyConfig.easy}</div>
              <div className="text-sm text-green-600">Fácil</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-800">{difficultyConfig.medium}</div>
              <div className="text-sm text-yellow-600">Médio</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-800">{difficultyConfig.hard}</div>
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

        {/* Sample Questions */}
        {questions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Exemplo de Questões</h4>
            <div className="space-y-4">
              {questions.slice(0, 3).map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">
                      Questão {index + 1}
                    </span>
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
                        <span className="text-sm text-gray-600">{alt.text}</span>
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
              {questions.length > 3 && (
                <div className="text-center text-sm text-gray-500">
                  +{questions.length - 3} questões adicionais...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}