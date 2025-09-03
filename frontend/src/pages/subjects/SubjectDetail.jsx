import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, Save, Trash2, Edit, Eye, Plus, BookOpen,
  FileText, BarChart3, AlertTriangle, Clock, Palette,
  Search, Filter, MoreVertical, Copy, Grid, List,
  CheckCircle, Tag, TrendingUp
} from 'lucide-react';
import { useSubject, useUpdateSubject, useDeleteSubject, useCreateSubject, useQuestions, useDeleteQuestion } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';
import { Input, Textarea, ColorPicker } from '../../components/ui/Input';

const predefinedColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#374151'
];

const difficultyConfig = {
  easy: { label: 'Fácil', color: 'green', icon: '📗' },
  medium: { label: 'Médio', color: 'yellow', icon: '📙' },
  hard: { label: 'Difícil', color: 'red', icon: '📕' },
};

const typeConfig = {
  multiple_choice: { label: 'Múltipla Escolha', icon: CheckCircle, color: 'blue' },
  true_false: { label: 'Verdadeiro/Falso', icon: AlertTriangle, color: 'purple' },
  essay: { label: 'Dissertativa', icon: FileText, color: 'gray' },
};

export default function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [isEditing, setIsEditing] = useState(!id); // New subject if no ID
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'questions'
  
  // Questions state
  const [questionsViewMode, setQuestionsViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteQuestionId, setDeleteQuestionId] = useState(null);

  // Hooks
  const { data: subjectData, isLoading, error } = useSubject(id);
  const updateSubjectMutation = useUpdateSubject();
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const subject = subjectData?.data?.subject;
  const isNewSubject = !id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      color: predefinedColors[0],
      code: '',
    },
  });

  const watchedColor = watch('color');

  // Initialize form with subject data
  React.useEffect(() => {
    if (subject && !isNewSubject) {
      setValue('name', subject.name || '');
      setValue('description', subject.description || '');
      setValue('color', subject.color || predefinedColors[0]);
      setValue('code', subject.code || '');
    }
  }, [subject, setValue, isNewSubject]);

  const onSubmit = async (data) => {
    try {
      if (isNewSubject) {
        const response = await createSubjectMutation.mutateAsync(data);
        success('Disciplina criada com sucesso!');
        navigate(`/subjects/${response.data.subject.id}`);
      } else {
        await updateSubjectMutation.mutateAsync({ id, data });
        setIsEditing(false);
        success('Disciplina atualizada com sucesso!');
      }
    } catch (error) {
      showError(error.message || 'Erro ao salvar disciplina');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubjectMutation.mutateAsync(id);
      success('Disciplina excluída com sucesso!');
      navigate('/subjects');
    } catch (error) {
      showError(error.message || 'Erro ao excluir disciplina');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isNewSubject) {
      navigate('/subjects');
    } else {
      setIsEditing(false);
      // Reset form to original values
      if (subject) {
        setValue('name', subject.name || '');
        setValue('description', subject.description || '');
        setValue('color', subject.color || predefinedColors[0]);
        setValue('code', subject.code || '');
      }
    }
  };

  if (isLoading) {
    return <LoadingPage title="Carregando disciplina..." />;
  }

  if (error && !isNewSubject) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar disciplina</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">A disciplina não foi encontrada ou ocorreu um erro.</p>
        <button
          onClick={() => navigate('/subjects')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Voltar para Disciplinas
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/subjects')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            {!isEditing && watchedColor && (
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: watchedColor }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isNewSubject ? 'Nova Disciplina' : (isEditing ? 'Editar Disciplina' : subject?.name)}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isNewSubject 
                  ? 'Crie uma nova disciplina para organizar suas questões'
                  : isEditing 
                  ? 'Edite os detalhes da disciplina'
                  : 'Gerencie questões e configurações da disciplina'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isNewSubject && !isEditing && (
            <>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards (only for existing subjects) */}
      {!isNewSubject && !isEditing && subject && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Questões"
            value={subject.questionsCount || 0}
            icon={FileText}
            color="blue"
            description="Total de questões cadastradas"
          />
          <StatCard
            title="Provas"
            value={subject.examsCount || 0}
            icon={BarChart3}
            color="green"
            description="Provas que usam esta disciplina"
          />
          <StatCard
            title="Última Atividade"
            value={subject.lastActivity ? new Date(subject.lastActivity).toLocaleDateString('pt-BR') : 'Nunca'}
            icon={Clock}
            color="purple"
            description="Última questão adicionada"
          />
        </div>
      )}

      {/* Tabs (only for existing subjects not in edit mode) */}
      {!isNewSubject && !isEditing && subject && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Informações
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Questões ({subject.questionsCount || 0})
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700">
        {isEditing ? (
          // Edit Form
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="flex items-center mb-6">
              <BookOpen className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isNewSubject ? 'Informações da Nova Disciplina' : 'Editar Informações'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Nome da Disciplina"
                  placeholder="Ex: Matemática, Física, História..."
                  error={errors.name?.message}
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres',
                    },
                    maxLength: {
                      value: 100,
                      message: 'Nome deve ter no máximo 100 caracteres',
                    },
                  })}
                />
              </div>

              <div>
                <Input
                  label="Código (opcional)"
                  placeholder="Ex: MAT101, FIS201, HIS301..."
                  error={errors.code?.message}
                  {...register('code', {
                    maxLength: {
                      value: 20,
                      message: 'Código deve ter no máximo 20 caracteres',
                    },
                  })}
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Descrição (opcional)"
                placeholder="Descrição detalhada da disciplina..."
                rows={3}
                error={errors.description?.message}
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Descrição deve ter no máximo 500 caracteres',
                  },
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Cor da Disciplina
              </label>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-white shadow-md"
                  style={{ backgroundColor: watchedColor }}
                />
                <div className="flex-1">
                  <div className="grid grid-cols-10 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          watchedColor === color 
                            ? 'border-gray-400 scale-110' 
                            : 'border-gray-200 dark:border-gray-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600">
                {isDirty && (
                  <div className="flex items-center text-yellow-600">
                    <Clock className="w-4 h-4 mr-1" />
                    Alterações não salvas
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting 
                    ? (isNewSubject ? 'Criando...' : 'Salvando...') 
                    : (isNewSubject ? 'Criar Disciplina' : 'Salvar Alterações')
                  }
                </button>
              </div>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="p-6 space-y-6">
            {activeTab === 'info' ? (
              // Subject Information Tab
              <div>
                <div className="flex items-center mb-6">
                  <BookOpen className="w-5 h-5 text-primary-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informações da Disciplina</h2>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{subject?.name}</p>
              </div>

              {subject?.code && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Código</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{subject.code}</p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Cor</label>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white shadow-md"
                    style={{ backgroundColor: subject?.color }}
                  />
                  <span className="text-sm text-gray-600">{subject?.color}</span>
                </div>
              </div>

              {subject?.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição</label>
                  <p className="text-gray-700 dark:text-gray-300">{subject.description}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate(`/questions/new?subjectId=${subject?.id}`)}
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Nova Questão</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Adicionar questão a esta disciplina</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate(`/questions?subjectId=${subject?.id}`)}
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Ver Questões</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Listar todas as questões desta disciplina</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

                {/* Metadata */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Criado em:</span> {' '}
                      {subject?.createdAt ? new Date(subject.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Última atualização:</span> {' '}
                      {subject?.updatedAt ? new Date(subject.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Questions Tab
              <QuestionsTab 
                subjectId={id}
                subject={subject}
                viewMode={questionsViewMode}
                setViewMode={setQuestionsViewMode}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                difficultyFilter={difficultyFilter}
                setDifficultyFilter={setDifficultyFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                deleteQuestionId={deleteQuestionId}
                setDeleteQuestionId={setDeleteQuestionId}
                navigate={navigate}
              />
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Disciplina"
        message="Tem certeza que deseja excluir esta disciplina? Todas as questões associadas também serão removidas. Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmVariant="danger"
        isLoading={deleteSubjectMutation.isPending}
      />
    </div>
  );
}

// Component for Questions Tab
function QuestionsTab({ 
  subjectId, 
  subject, 
  viewMode, 
  setViewMode, 
  searchTerm, 
  setSearchTerm,
  difficultyFilter,
  setDifficultyFilter,
  typeFilter,
  setTypeFilter,
  deleteQuestionId,
  setDeleteQuestionId,
  navigate
}) {
  // Fetch questions for this subject
  const { data: questionsData, isLoading } = useQuestions({ subjectId });
  const deleteQuestionMutation = useDeleteQuestion();
  const questions = questionsData?.data?.questions || [];

  // Filter questions
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = !searchTerm || 
      question.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'all' || question.type === typeFilter;
    
    return matchesSearch && matchesDifficulty && matchesType;
  });

  const handleCreateQuestion = () => {
    navigate(`/questions/new?subjectId=${subjectId}`);
  };

  const handleViewQuestion = (questionId) => {
    navigate(`/questions/${questionId}`);
  };

  const handleEditQuestion = (questionId) => {
    navigate(`/questions/${questionId}?edit=true`);
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      setDeleteQuestionId(null);
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDifficultyFilter('all');
    setTypeFilter('all');
  };

  const hasFilters = searchTerm || difficultyFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Questões da Disciplina</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={`Alterar para visualização ${viewMode === 'grid' ? 'em lista' : 'em grade'}`}
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
          <button
            onClick={handleCreateQuestion}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Questão
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar questões..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={difficultyFilter || 'all'}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todas as dificuldades</option>
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter || 'all'}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos os tipos</option>
              <option value="multiple_choice">Múltipla Escolha</option>
              <option value="true_false">Verdadeiro/Falso</option>
              <option value="essay">Dissertativa</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {isLoading ? 'Carregando...' : `${filteredQuestions.length} questão${filteredQuestions.length !== 1 ? 'ões' : ''} encontrada${filteredQuestions.length !== 1 ? 's' : ''}`}
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
          "space-y-3"
        }>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {hasFilters ? 'Nenhuma questão encontrada' : 'Nenhuma questão criada'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            {hasFilters 
              ? 'Tente ajustar os filtros para encontrar questões.'
              : `Comece criando questões para a disciplina ${subject?.name}.`
            }
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleCreateQuestion}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {hasFilters ? 'Nova Questão' : 'Criar primeira questão'}
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
          "space-y-3"
        }>
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onView={handleViewQuestion}
              onEdit={handleEditQuestion}
              onDelete={(id) => setDeleteQuestionId(id)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteQuestionId !== null}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={() => handleDeleteQuestion(deleteQuestionId)}
        title="Excluir Questão"
        message="Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmVariant="danger"
        isLoading={deleteQuestionMutation.isPending}
      />
    </div>
  );
}

// Component for Question Card
function QuestionCard({ question, onEdit, onDelete, onView, viewMode = 'grid' }) {
  const difficultyStyle = difficultyConfig[question.difficulty] || difficultyConfig.easy;
  const typeInfo = typeConfig[question.type] || typeConfig.multiple_choice;
  const TypeIcon = typeInfo?.icon || FileText;

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200 group">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {question.title || question.text || 'Sem título'}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Criada em {new Date(question.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${difficultyStyle.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                    difficultyStyle.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}
                `}>
                  {difficultyStyle.icon} {difficultyStyle.label}
                </span>
                
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${typeInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                    typeInfo.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' :
                    'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}
                `}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {typeInfo?.label}
                </span>

                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {question.points || 1} pt{(question.points || 1) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onView(question.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(question.id)}
                  className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(question.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-1"
         onClick={() => onView(question.id)}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${difficultyStyle.color === 'green' ? 'bg-green-100 text-green-800' :
                  difficultyStyle.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {difficultyStyle.icon} {difficultyStyle.label}
              </span>
              
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${typeInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  typeInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'}
              `}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeInfo?.label}
              </span>

              <span className="text-xs text-gray-500 font-medium">
                {question.points || 1} pt{(question.points || 1) !== 1 ? 's' : ''}
              </span>
            </div>
            
            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {question.title || question.text || 'Sem título'}
            </h3>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {question.text || 'Questão sem texto definido'}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(question.createdAt).toLocaleDateString('pt-BR')}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(question.id);
              }}
              className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
              title="Editar"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(question.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Statistics Cards
function StatCard({ title, value, icon: Icon, color, description }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}