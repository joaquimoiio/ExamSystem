import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, MoreVertical,
  FileText, BookOpen, Tag, CheckCircle, AlertCircle, Clock,
  ArrowUpDown, Grid, List, Download, Upload, Copy,
  TrendingUp, Users, BarChart3, Archive, Star, ArrowLeft
} from 'lucide-react';
import { useQuestions, useSubjects, useSubject, useDeleteQuestion } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';

const difficultyConfig = {
  easy: { label: 'Fácil', color: 'green', icon: '📗' },
  medium: { label: 'Médio', color: 'yellow', icon: '📙' },
  hard: { label: 'Difícil', color: 'red', icon: '📕' },
};

const typeConfig = {
  multiple_choice: { label: 'Múltipla Escolha', icon: CheckCircle, color: 'blue' },
  true_false: { label: 'Verdadeiro/Falso', icon: AlertCircle, color: 'purple' },
  essay: { label: 'Dissertativa', icon: FileText, color: 'gray' },
};

const statusConfig = {
  active: { label: 'Ativa', color: 'green', icon: CheckCircle },
  draft: { label: 'Rascunho', color: 'gray', icon: Edit },
  archived: { label: 'Arquivada', color: 'yellow', icon: Archive },
};

// This component will integrate with real API hooks when used in the actual application

function QuestionCard({ question, onEdit, onDelete, onView, onDuplicate, viewMode = 'grid' }) {
  const [showActions, setShowActions] = useState(false);
  const difficultyStyle = difficultyConfig[question.difficulty];
  const typeInfo = typeConfig[question.type];
  const statusInfo = statusConfig[question.status || 'active'];
  const TypeIcon = typeInfo?.icon || FileText;
  const StatusIcon = statusInfo?.icon || CheckCircle;

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
    setShowActions(false);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200 group">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Question Preview */}
              <div className="flex-1 min-w-0">
                <p className="card-title card-title-sm line-clamp-1">
                  {question.text || question.title || 'Sem enunciado'}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {question.subject?.name || 'Sem disciplina'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Criada em {new Date(question.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center space-x-2">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${difficultyStyle.color === 'green' ? 'bg-green-100 text-green-800' :
                    difficultyStyle.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}
                `}>
                  {difficultyStyle.icon} {difficultyStyle.label}
                </span>
                
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${typeInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    typeInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}
                `}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {typeInfo?.label}
                </span>

              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => handleActionClick(e, () => onView(question.id))}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onEdit(question.id))}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onDuplicate(question.id))}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Duplicar"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onDelete(question.id))}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${difficultyStyle.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  difficultyStyle.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}
              `}>
                {difficultyStyle.icon} {difficultyStyle.label}
              </span>
              
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${typeInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                  typeInfo.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                  'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}
              `}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeInfo?.label}
              </span>

            </div>
            
            <h3 className="card-title card-title-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {question.text || question.title || 'Sem enunciado'}
            </h3>
          </div>

          <div className="relative ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <button
                  onClick={(e) => handleActionClick(e, () => onView(question.id))}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onEdit(question.id))}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onDuplicate(question.id))}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={(e) => handleActionClick(e, () => onDelete(question.id))}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {question.text || question.title || 'Questão sem enunciado definido'}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <BookOpen className="w-3 h-3 mr-1" />
              {question.subject?.name || 'Sem disciplina'}
            </span>
            {question.tags && question.tags.length > 0 && (
              <span className="flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                {question.tags.length} tag{question.tags.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(question.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* Usage Stats */}
        {question.usageCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                Usada {question.usageCount} vez{question.usageCount !== 1 ? 'es' : ''}
              </span>
              {question.averageScore && (
                <span className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {(question.averageScore * 100).toFixed(0)}% acertos
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onCreateQuestion, onClearFilters }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {hasFilters ? 'Nenhuma questão encontrada' : 'Nenhuma questão criada'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {hasFilters 
          ? 'Tente ajustar os filtros ou termo de busca para encontrar questões.'
          : 'Comece criando sua primeira questão para formar um banco de questões.'
        }
      </p>
      <div className="flex gap-4 justify-center">
        {!hasFilters && (
          <button
            onClick={onCreateQuestion}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira questão
          </button>
        )}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionStats({ questions, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
    multipleChoice: questions.filter(q => q.type === 'multiple_choice').length,
    trueFalse: questions.filter(q => q.type === 'true_false').length,
    essay: questions.filter(q => q.type === 'essay').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fáceis</p>
            <p className="text-2xl font-bold text-green-600">{stats.easy}</p>
          </div>
          <div className="text-2xl">📗</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Médias</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
          </div>
          <div className="text-2xl">📙</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Difíceis</p>
            <p className="text-2xl font-bold text-red-600">{stats.hard}</p>
          </div>
          <div className="text-2xl">📕</div>
        </div>
      </div>
    </div>
  );
}

function SearchInput({ placeholder, value, onSearch, onClear }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
        >
          ×
        </button>
      )}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Excluindo...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [deleteQuestionId, setDeleteQuestionId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Hooks
  const { success, error: showError } = useToast();

  // Real API hooks
  const queryParams = subjectId ? { subjectId } : {};
  console.log('🔍 QuestionList queryParams:', queryParams, 'subjectId from URL:', subjectId);
  const { data: questionsData, isLoading, error } = useQuestions(queryParams);
  const { data: subjectsData } = useSubjects();
  const { data: currentSubjectData } = useSubject(subjectId);
  const deleteQuestionMutation = useDeleteQuestion();
  
  const questions = questionsData?.data?.questions || [];
  const subjects = subjectsData?.data?.subjects || [];
  const currentSubject = currentSubjectData?.data?.subject;

  // Filter questions based on current filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = !searchTerm ||
      (question.title && question.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (question.text && question.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (question.subject?.name && question.subject.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Se temos subjectId na URL, confiar na API (já filtrada). Caso contrário, aplicar filtro local
    const matchesSubject = subjectId ? true : (subjectFilter === 'all' ||
      question.subject?.id.toString() === subjectFilter);

    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'all' || question.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || (question.status || 'active') === statusFilter;

    return matchesSearch && matchesSubject && matchesDifficulty && matchesType && matchesStatus;
  });

  // Sort questions
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.text || a.title || '').localeCompare(b.text || b.title || '');
      case 'difficulty':
        const diffOrder = { easy: 1, medium: 2, hard: 3 };
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      case 'usage':
        return (b.usageCount || 0) - (a.usageCount || 0);
      case 'recent':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Check if any filters are active
  const hasFilters = searchTerm || subjectFilter !== 'all' || difficultyFilter !== 'all' || 
                   typeFilter !== 'all' || statusFilter !== 'all';

  // Handle actions
  const handleView = (questionId) => {
    const url = subjectId
      ? `/questions/${questionId}?subjectId=${subjectId}`
      : `/questions/${questionId}`;
    navigate(url);
  };

  const handleEdit = (questionId) => {
    const url = subjectId
      ? `/questions/${questionId}?edit=true&subjectId=${subjectId}`
      : `/questions/${questionId}?edit=true`;
    navigate(url);
  };

  const handleDelete = async (questionId) => {
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      setDeleteQuestionId(null);
      success('Questão excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting question:', error);

      // Melhor tratamento de erro com mensagens específicas
      if (error.message.includes('Esta questão não pode ser excluída pois está sendo usada em exames') ||
          error.message.includes('Cannot delete question that is used in exams')) {
        showError('Esta questão não pode ser excluída pois está sendo usada em exames. Para excluí-la, primeiro remova-a dos exames onde está sendo utilizada.');
      } else if (error.message.includes('Question not found') || error.message.includes('não encontrada')) {
        showError('Questão não encontrada.');
      } else if (error.message.includes('Access denied') || error.message.includes('não tem permissão')) {
        showError('Você não tem permissão para excluir esta questão.');
      } else {
        showError('Erro ao excluir questão. Tente novamente.');
      }

      setDeleteQuestionId(null);
    }
  };

  const handleDuplicate = (questionId) => {
    console.log('Duplicating question:', questionId);
  };

  const handleCreateQuestion = () => {
    const url = subjectId ? `/questions/new?subjectId=${subjectId}` : '/questions/new';
    navigate(url);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSubjectFilter('all');
    setDifficultyFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {subjectId && (
            <button
              onClick={() => navigate('/subjects')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentSubject ? `Questões - ${currentSubject.name}` : 'Banco de Questões'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentSubject 
                ? `Gerencie questões da disciplina ${currentSubject.name}`
                : 'Gerencie suas questões e monte provas'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleViewMode}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Alterar para visualização ${viewMode === 'grid' ? 'em lista' : 'em grade'}`}
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
          <button
            onClick={handleCreateQuestion}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Questão
          </button>
        </div>
      </div>

      {/* Stats */}
      <QuestionStats questions={sortedQuestions} isLoading={false} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className={`grid grid-cols-1 md:grid-cols-2 ${subjectId ? 'lg:grid-cols-5' : 'lg:grid-cols-6'} gap-4`}>
          {/* Search */}
          <div className="md:col-span-2">
            <SearchInput
              placeholder="Buscar questões..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onClear={() => setSearchTerm('')}
            />
          </div>

          {/* Subject Filter - só mostrar se não há subjectId */}
          {!subjectId && (
            <div>
              <Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas as disciplinas' },
                  ...subjects.map(subject => ({
                    value: subject.id.toString(),
                    label: subject.name,
                  }))
                ]}
              />
            </div>
          )}

          {/* Difficulty Filter */}
          <div>
            <Select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todas as dificuldades' },
                { value: 'easy', label: 'Fácil' },
                { value: 'medium', label: 'Médio' },
                { value: 'hard', label: 'Difícil' },
              ]}
            />
          </div>

          {/* Type Filter */}
          <div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos os tipos' },
                { value: 'multiple_choice', label: 'Múltipla Escolha' },
                { value: 'true_false', label: 'Verdadeiro/Falso' },
                { value: 'essay', label: 'Dissertativa' },
              ]}
            />
          </div>

          {/* Sort */}
          <div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'recent', label: 'Mais recentes' },
                { value: 'title', label: 'Alfabética' },
                { value: 'difficulty', label: 'Dificuldade' },
                { value: 'usage', label: 'Mais usadas' },
              ]}
            />
          </div>
        </div>

        {/* Results Info and Clear Filters */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {isLoading ? 'Carregando...' : `${sortedQuestions.length} questão${sortedQuestions.length !== 1 ? 'ões' : ''} encontrada${sortedQuestions.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center space-x-4">
            {searchTerm && (
              <span>
                Buscando por: <strong>"{searchTerm}"</strong>
              </span>
            )}
            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
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
      ) : sortedQuestions.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onCreateQuestion={handleCreateQuestion}
          onClearFilters={clearAllFilters}
        />
      ) : (
        <div className={viewMode === 'grid' ? 
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
          "space-y-3"
        }>
          {sortedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteQuestionId(id)}
              onDuplicate={handleDuplicate}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteQuestionId !== null}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={() => handleDelete(deleteQuestionId)}
        title="Excluir Questão"
        message="Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        isLoading={false} // This would be: deleteQuestionMutation.isLoading
      />
    </div>
  );
}