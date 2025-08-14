import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Save, Eye, Settings, Plus, Minus, AlertCircle, 
  BookOpen, FileText, Clock, Users, Shuffle, 
  BarChart3, CheckCircle, Target, ArrowLeft
} from 'lucide-react';
import { useSubjects, useQuestions, useCreateExam } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingButton } from '../../components/common/Loading';

function DifficultyDistribution({ config, onChange, questionsAvailable }) {
  const handleChange = (difficulty, value) => {
    const newConfig = { ...config, [difficulty]: Math.max(0, parseInt(value) || 0) };
    onChange(newConfig);
  };

  const total = config.easy + config.medium + config.hard;
  const maxQuestions = Math.min(questionsAvailable.total, 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Distribuição de Dificuldade</h3>
        <div className="text-sm text-gray-500">
          Total: {total} / {maxQuestions} questões
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Easy Questions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-green-800">Fácil</label>
            <span className="text-xs text-green-600">
              {questionsAvailable.easy} disponíveis
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleChange('easy', config.easy - 1)}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              disabled={config.easy <= 0}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={config.easy}
              onChange={(e) => handleChange('easy', e.target.value)}
              className="w-16 text-center border border-green-300 rounded px-2 py-1 text-sm"
              min="0"
              max={questionsAvailable.easy}
            />
            <button
              type="button"
              onClick={() => handleChange('easy', config.easy + 1)}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              disabled={config.easy >= questionsAvailable.easy}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-green-600">
            {config.easy > 0 && `${Math.round((config.easy / total) * 100) || 0}% do total`}
          </div>
        </div>

        {/* Medium Questions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-yellow-800">Médio</label>
            <span className="text-xs text-yellow-600">
              {questionsAvailable.medium} disponíveis
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleChange('medium', config.medium - 1)}
              className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
              disabled={config.medium <= 0}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={config.medium}
              onChange={(e) => handleChange('medium', e.target.value)}
              className="w-16 text-center border border-yellow-300 rounded px-2 py-1 text-sm"
              min="0"
              max={questionsAvailable.medium}
            />
            <button
              type="button"
              onClick={() => handleChange('medium', config.medium + 1)}
              className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
              disabled={config.medium >= questionsAvailable.medium}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-yellow-600">
            {config.medium > 0 && `${Math.round((config.medium / total) * 100) || 0}% do total`}
          </div>
        </div>

        {/* Hard Questions */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-red-800">Difícil</label>
            <span className="text-xs text-red-600">
              {questionsAvailable.hard} disponíveis
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleChange('hard', config.hard - 1)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              disabled={config.hard <= 0}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={config.hard}
              onChange={(e) => handleChange('hard', e.target.value)}
              className="w-16 text-center border border-red-300 rounded px-2 py-1 text-sm"
              min="0"
              max={questionsAvailable.hard}
            />
            <button
              type="button"
              onClick={() => handleChange('hard', config.hard + 1)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              disabled={config.hard >= questionsAvailable.hard}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-red-600">
            {config.hard > 0 && `${Math.round((config.hard / total) * 100) || 0}% do total`}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ easy: 8, medium: 8, hard: 4 })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          disabled={questionsAvailable.easy < 8 || questionsAvailable.medium < 8 || questionsAvailable.hard < 4}
        >
          Balanceado (20q)
        </button>
        <button
          type="button"
          onClick={() => onChange({ easy: 12, medium: 6, hard: 2 })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          disabled={questionsAvailable.easy < 12 || questionsAvailable.medium < 6 || questionsAvailable.hard < 2}
        >
          Fácil (20q)
        </button>
        <button
          type="button"
          onClick={() => onChange({ easy: 4, medium: 8, hard: 8 })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          disabled={questionsAvailable.easy < 4 || questionsAvailable.medium < 8 || questionsAvailable.hard < 8}
        >
          Difícil (20q)
        </button>
      </div>

      {/* Validation Messages */}
      {total === 0 && (
        <div className="flex items-center space-x-2 text-yellow-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Selecione pelo menos uma questão</span>
        </div>
      )}
      
      {total > maxQuestions && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Máximo de {maxQuestions} questões permitidas</span>
        </div>
      )}
    </div>
  );
}

function QuestionPreview({ questions, selectedSubject }) {
  const [showPreview, setShowPreview] = useState(false);

  if (!selectedSubject || questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Selecione uma disciplina para ver as questões disponíveis</p>
      </div>
    );
  }

  const questionsByDifficulty = {
    easy: questions.filter(q => q.difficulty === 'easy'),
    medium: questions.filter(q => q.difficulty === 'medium'),
    hard: questions.filter(q => q.difficulty === 'hard'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Preview das Questões</h3>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <Eye className="w-4 h-4" />
          <span>{showPreview ? 'Ocultar' : 'Mostrar'} Preview</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{questionsByDifficulty.easy.length}</div>
          <div className="text-sm text-green-800">Fáceis</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">{questionsByDifficulty.medium.length}</div>
          <div className="text-sm text-yellow-800">Médias</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{questionsByDifficulty.hard.length}</div>
          <div className="text-sm text-red-800">Difíceis</div>
        </div>
      </div>

      {/* Detailed Preview */}
      {showPreview && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(questionsByDifficulty).map(([difficulty, questionsGroup]) => (
            <div key={difficulty}>
              <h4 className="font-medium text-gray-900 mb-2 capitalize">
                {difficulty === 'easy' ? 'Fáceis' : difficulty === 'medium' ? 'Médias' : 'Difíceis'}
                <span className="ml-2 text-sm text-gray-500">({questionsGroup.length})</span>
              </h4>
              <div className="space-y-2">
                {questionsGroup.slice(0, 3).map((question) => (
                  <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 font-medium line-clamp-2">
                      {question.statement}
                    </p>
                    <div className="mt-1 text-xs text-gray-500">
                      {question.alternatives?.length || 0} alternativas • {question.points} pontos
                    </div>
                  </div>
                ))}
                {questionsGroup.length > 3 && (
                  <div className="text-center text-sm text-gray-500">
                    +{questionsGroup.length - 3} questões adicionais
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExamCreate() {
  const [difficultyConfig, setDifficultyConfig] = useState({
    easy: 8,
    medium: 8,
    hard: 4,
  });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questionsAvailable, setQuestionsAvailable] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/exams')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Prova</h1>
          <p className="text-gray-600">Configure e crie uma nova prova com múltiplas variações</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título da Prova *
              </label>
              <input
                id="title"
                type="text"
                {...register('title', {
                  required: 'Título é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'Título deve ter pelo menos 3 caracteres',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Matemática - Prova do 1º Bimestre"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Descrição opcional da prova..."
              />
            </div>

            <div>
              <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700 mb-2">
                Disciplina *
              </label>
              <Controller
                name="subjectId"
                control={control}
                rules={{ required: 'Disciplina é obrigatória' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma disciplina</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.subjectId && (
                <p className="mt-1 text-sm text-red-600">{errors.subjectId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duração (minutos)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="duration"
                  type="number"
                  min="15"
                  max="300"
                  {...register('duration', {
                    required: 'Duração é obrigatória',
                    min: { value: 15, message: 'Duração mínima de 15 minutos' },
                    max: { value: 300, message: 'Duração máxima de 300 minutos' },
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="variations" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Variações
              </label>
              <div className="relative">
                <Shuffle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="variations"
                  type="number"
                  min="1"
                  max="50"
                  {...register('variations', {
                    required: 'Número de variações é obrigatório',
                    min: { value: 1, message: 'Mínimo de 1 variação' },
                    max: { value: 50, message: 'Máximo de 50 variações' },
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {errors.variations && (
                <p className="mt-1 text-sm text-red-600">{errors.variations.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Question Distribution */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <DifficultyDistribution
            config={difficultyConfig}
            onChange={setDifficultyConfig}
            questionsAvailable={questionsAvailable}
          />
        </div>

        {/* Question Preview */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <QuestionPreview
            questions={questions}
            selectedSubject={selectedSubject}
          />
        </div>

        {/* Advanced Settings */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações Avançadas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="shuffleQuestions"
                  type="checkbox"
                  {...register('shuffleQuestions')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="shuffleQuestions" className="ml-2 text-sm text-gray-700">
                  Embaralhar ordem das questões
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="shuffleAlternatives"
                  type="checkbox"
                  {...register('shuffleAlternatives')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="shuffleAlternatives" className="ml-2 text-sm text-gray-700">
                  Embaralhar alternativas
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="showResults"
                  type="checkbox"
                  {...register('showResults')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="showResults" className="ml-2 text-sm text-gray-700">
                  Mostrar resultados após submissão
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="allowReview"
                  type="checkbox"
                  {...register('allowReview')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="allowReview" className="ml-2 text-sm text-gray-700">
                  Permitir revisão antes da submissão
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex space-x-3">
            <LoadingButton
              type="button"
              variant="outline"
              onClick={() => {
                // TODO: Save as draft
                showError('Função de rascunho em desenvolvimento');
              }}
              className="px-6 py-2"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </LoadingButton>

            <LoadingButton
              type="submit"
              loading={isSubmitting || createExamMutation.isPending}
              className="px-6 py-2"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Criar Prova
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  );
}