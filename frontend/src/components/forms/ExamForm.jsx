import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Save, X, Clock, FileText, Settings, Eye, Plus, Trash2,
  BookOpen, Hash, Calendar, Users, AlertCircle, Info
} from 'lucide-react';
import { LoadingButton } from '../common/Loading';
import { useSubjects, useQuestions } from '../../hooks';

const difficultyLevels = [
  { value: 'easy', label: 'Fácil', color: 'green' },
  { value: 'medium', label: 'Médio', color: 'yellow' },
  { value: 'hard', label: 'Difícil', color: 'red' },
];

const statusOptions = [
  { value: 'draft', label: 'Rascunho', color: 'gray' },
  { value: 'published', label: 'Publicada', color: 'green' },
  { value: 'archived', label: 'Arquivada', color: 'yellow' },
];

export default function ExamForm({ 
  exam = null, 
  onSubmit, 
  onCancel, 
  loading = false,
  mode = 'create' // 'create' | 'edit'
}) {
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [difficultyConfig, setDifficultyConfig] = useState({
    easy: 0,
    medium: 0,
    hard: 0
  });

  const { data: subjectsData } = useSubjects();
  const { data: questionsData } = useQuestions();
  
  const subjects = subjectsData?.data?.subjects || [];
  const questions = questionsData?.data?.questions || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      title: exam?.title || '',
      description: exam?.description || '',
      subjectId: exam?.subjectId || '',
      duration: exam?.duration || 60,
      totalQuestions: exam?.totalQuestions || 10,
      variations: exam?.variations || 1,
      status: exam?.status || 'draft',
      instructions: exam?.instructions || '',
      showResults: exam?.showResults ?? true,
      allowReview: exam?.allowReview ?? true,
      shuffleQuestions: exam?.shuffleQuestions ?? true,
      shuffleAlternatives: exam?.shuffleAlternatives ?? true,
      passingScore: exam?.passingScore || 70,
      maxAttempts: exam?.maxAttempts || 1,
      availableFrom: exam?.availableFrom ? new Date(exam.availableFrom).toISOString().slice(0, 16) : '',
      availableTo: exam?.availableTo ? new Date(exam.availableTo).toISOString().slice(0, 16) : '',
    },
  });

  const watchedSubjectId = watch('subjectId');
  const watchedTotalQuestions = watch('totalQuestions');

  // Initialize difficulty configuration
  useEffect(() => {
    if (exam?.difficultyConfig) {
      setDifficultyConfig(exam.difficultyConfig);
    }
  }, [exam]);

  // Update difficulty distribution when total questions change
  useEffect(() => {
    const total = parseInt(watchedTotalQuestions) || 0;
    if (total > 0) {
      const easy = Math.floor(total * 0.5);
      const medium = Math.floor(total * 0.3);
      const hard = total - easy - medium;
      
      setDifficultyConfig({
        easy: Math.max(0, easy),
        medium: Math.max(0, medium),
        hard: Math.max(0, hard)
      });
    }
  }, [watchedTotalQuestions]);

  // Filter questions by subject
  const availableQuestions = questions.filter(q => 
    !watchedSubjectId || q.subjectId === watchedSubjectId
  );

  const handleFormSubmit = async (data) => {
    const formData = {
      ...data,
      difficultyConfig,
      selectedQuestions,
      totalQuestions: parseInt(data.totalQuestions),
      duration: parseInt(data.duration),
      variations: parseInt(data.variations),
      passingScore: parseInt(data.passingScore),
      maxAttempts: parseInt(data.maxAttempts),
      availableFrom: data.availableFrom ? new Date(data.availableFrom).toISOString() : null,
      availableTo: data.availableTo ? new Date(data.availableTo).toISOString() : null,
    };

    await onSubmit(formData);
  };

  const updateDifficultyConfig = (difficulty, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    const newConfig = { ...difficultyConfig, [difficulty]: newValue };
    
    // Ensure total doesn't exceed totalQuestions
    const total = Object.values(newConfig).reduce((sum, val) => sum + val, 0);
    const maxTotal = parseInt(watchedTotalQuestions) || 0;
    
    if (total <= maxTotal) {
      setDifficultyConfig(newConfig);
    }
  };

  const getQuestionsByDifficulty = (difficulty) => {
    return availableQuestions.filter(q => q.difficulty === difficulty);
  };

  const canGenerateExam = () => {
    const totalNeeded = Object.values(difficultyConfig).reduce((sum, val) => sum + val, 0);
    
    return difficultyLevels.every(level => {
      const needed = difficultyConfig[level.value];
      const available = getQuestionsByDifficulty(level.value).length;
      return needed <= available;
    }) && totalNeeded > 0;
  };

  if (previewMode) {
    return (
      <ExamPreview
        examData={{
          ...watch(),
          difficultyConfig,
          selectedQuestions
        }}
        onBack={() => setPreviewMode(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Nova Prova' : 'Editar Prova'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure as informações da prova e selecione as questões
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className="btn btn-outline"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <FileText className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informações Básicas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título da Prova *
              </label>
              <input
                type="text"
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Ex: Prova de Física - 1º Bimestre"
                {...register('title', {
                  required: 'Título é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'Título deve ter pelo menos 3 caracteres'
                  }
                })}
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                rows={3}
                className="input"
                placeholder="Descrição detalhada da prova..."
                {...register('description')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disciplina *
              </label>
              <Controller
                name="subjectId"
                control={control}
                rules={{ required: 'Disciplina é obrigatória' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`input ${errors.subjectId ? 'input-error' : ''}`}
                  >
                    <option value="">Selecione uma disciplina</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.subjectId && (
                <p className="text-red-600 text-sm mt-1">{errors.subjectId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select {...field} className="input">
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
        </div>

        {/* Exam Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <Settings className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configurações da Prova
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duração (minutos) *
              </label>
              <input
                type="number"
                min="1"
                max="300"
                className={`input ${errors.duration ? 'input-error' : ''}`}
                {...register('duration', {
                  required: 'Duração é obrigatória',
                  min: { value: 1, message: 'Mínimo 1 minuto' },
                  max: { value: 300, message: 'Máximo 300 minutos' }
                })}
              />
              {errors.duration && (
                <p className="text-red-600 text-sm mt-1">{errors.duration.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total de Questões *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                className={`input ${errors.totalQuestions ? 'input-error' : ''}`}
                {...register('totalQuestions', {
                  required: 'Total de questões é obrigatório',
                  min: { value: 1, message: 'Mínimo 1 questão' },
                  max: { value: 100, message: 'Máximo 100 questões' }
                })}
              />
              {errors.totalQuestions && (
                <p className="text-red-600 text-sm mt-1">{errors.totalQuestions.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variações
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="input"
                {...register('variations', {
                  min: { value: 1, message: 'Mínimo 1 variação' },
                  max: { value: 50, message: 'Máximo 50 variações' }
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nota de Aprovação (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                {...register('passingScore')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tentativas Máximas
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="input"
                {...register('maxAttempts')}
              />
            </div>
          </div>

          {/* Options */}
          <div className="mt-6 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('shuffleQuestions')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Embaralhar questões</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('shuffleAlternatives')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Embaralhar alternativas</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('showResults')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Mostrar resultados após envio</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('allowReview')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Permitir revisão das respostas</span>
            </label>
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <Hash className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribuição por Dificuldade
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {difficultyLevels.map(level => {
              const available = getQuestionsByDifficulty(level.value).length;
              const needed = difficultyConfig[level.value];
              const isValid = needed <= available;

              return (
                <div key={level.value} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {level.label}
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {available} disponíveis
                    </span>
                  </div>
                  
                  <input
                    type="number"
                    min="0"
                    max={available}
                    value={needed}
                    onChange={(e) => updateDifficultyConfig(level.value, e.target.value)}
                    className={`input ${!isValid ? 'input-error' : ''}`}
                  />
                  
                  {!isValid && (
                    <div className="flex items-center text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Insuficientes (máx: {available})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Info className="w-4 h-4 mr-2" />
              Total configurado: {Object.values(difficultyConfig).reduce((sum, val) => sum + val, 0)} questões
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <Calendar className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agendamento (Opcional)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disponível a partir de
              </label>
              <input
                type="datetime-local"
                className="input"
                {...register('availableFrom')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disponível até
              </label>
              <input
                type="datetime-local"
                className="input"
                {...register('availableTo')}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <FileText className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Instruções para os Alunos
            </h2>
          </div>

          <textarea
            rows={4}
            className="input"
            placeholder="Instruções que aparecerão antes do início da prova..."
            {...register('instructions')}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            {!canGenerateExam() && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                Questões insuficientes para gerar a prova
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            
            <LoadingButton
              type="submit"
              loading={loading || isSubmitting}
              disabled={!canGenerateExam()}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Criar Prova' : 'Salvar Alterações'}
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  );
}

// Preview Component
function ExamPreview({ examData, onBack }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preview da Prova</h1>
          <button
            onClick={onBack}
            className="btn btn-outline"
          >
            <X className="w-4 h-4 mr-2" />
            Voltar
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {examData.title}
            </h2>
            {examData.description && (
              <p className="text-gray-600 dark:text-gray-400">{examData.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {examData.totalQuestions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Questões</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {examData.duration}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Minutos</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {examData.variations}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Variações</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {examData.passingScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Nota Mínima</div>
            </div>
          </div>

          {examData.instructions && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instruções</h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">{examData.instructions}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}