import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, MoreVertical,
  FileText, BookOpen, Tag, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { useQuestions, useSubjects, useDeleteQuestion } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingCard, SkeletonCard } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';
import { SearchInput, Select } from '../../components/ui/Input';

const difficultyConfig = {
  easy: { label: 'Fácil', color: 'green' },
  medium: { label: 'Médio', color: 'yellow' },
  hard: { label: 'Difícil', color: 'red' },
};

const typeConfig = {
  multiple_choice: { label: 'Múltipla Escolha', icon: CheckCircle },
  true_false: { label: 'Verdadeiro/Falso', icon: AlertCircle },
  essay: { label: 'Dissertativa', icon: FileText },
};

function QuestionCard({ question, onEdit, onDelete, onView }) {
  const [showActions, setShowActions] = useState(false);
  const difficultyStyle = difficultyConfig[question.difficulty];
  const typeInfo = typeConfig[question.type];
  const TypeIcon = typeInfo?.icon || FileText;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-200 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${difficultyStyle.color === 'green' ? 'bg-green-100 text-green-800' :
                  difficultyStyle.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {difficultyStyle.label}
              </span>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeInfo?.label}
              </span>

              <span className="text-xs text-gray-500">
                {question.points} pt{question.points !== 1 ? 's' : ''}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
              {question.statement}
            </h3>
            
            {question.subject && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: question.subject.color }}
                />
                <span>{question.subject.name}</span>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onView(question);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </button>
                  <button
                    onClick={() => {
                      onEdit(question);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onDelete(question);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Alternatives Preview */}
        <div className="space-y-2 mb-4">
          {question.alternatives?.slice(0, 2).map((alternative, index) => (
            <div key={index} className="text-sm text-gray-600 flex items-start">
              <span className="text-gray-400 mr-2 flex-shrink-0">
                {String.fromCharCode(65 + index)})
              </span>
              <span className="line-clamp-1">{alternative.text}</span>
              {alternative.isCorrect && (
                <CheckCircle className="w-4 h-4 ml-2 text-green-500 flex-shrink-0" />
              )}
            </div>
          ))}
          {question.alternatives?.length > 2 && (
            <div className="text-xs text-gray-500">
              +{question.alternatives.length - 2} alternativas
            </div>
          )}
        </div>

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {question.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {question.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{question.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(question.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          {question.usageCount !== undefined && (
            <span>Usado {question.usageCount} vez{question.usageCount !== 1 ? 'es' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreateQuestion, hasFilters }) {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasFilters ? 'Nenhuma questão encontrada' : 'Nenhuma questão cadastrada'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        {hasFilters 
          ? 'Tente ajustar os filtros ou termo de busca para encontrar questões.'
          : 'Comece criando sua primeira questão para alimentar o banco de dados.'
        }
      </p>
      {!hasFilters && (
        <button
          onClick={onCreateQuestion}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar primeira questão
        </button>
      )}
    </div>
  );
}

export default function QuestionList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteQuestionId, setDeleteQuestionId] = useState(null);

  // Get filter values from URL params
  const searchTerm = searchParams.get('search') || '';
  const subjectFilter = searchParams.get('subject') || 'all';
  const difficultyFilter = searchParams.get('difficulty') || 'all';
  const typeFilter = searchParams.get('type') || 'all';
  const sortBy = searchParams.get('sort') || 'created';

  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  // Build query parameters for API
  const queryParams = {
    search: searchTerm || undefined,
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
    difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    sort: sortBy,
    limit: 50,
  };

  const { data: questionsData, isLoading, error } = useQuestions(queryParams);
  const { data: subjectsData } = useSubjects();
  const deleteQuestionMutation = useDeleteQuestion();

  const questions = questionsData?.data?.questions || [];
  const subjects = subjectsData?.data?.subjects || [];

  const hasFilters = searchTerm || subjectFilter !== 'all' || difficultyFilter !== 'all' || typeFilter !== 'all';

  // Update URL params when filters change
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleCreateQuestion = () => {
    navigate('/questions/new');
  };

  const handleEditQuestion = (question) => {
    navigate(`/questions/${question.id}`);
  };

  const handleViewQuestion = (question) => {
    navigate(`/questions/${question.id}`);
  };

  const handleDeleteQuestion = (question) => {
    setDeleteQuestionId(question.id);
  };

  const confirmDelete = async () => {
    if (!deleteQuestionId) return;

    try {
      await deleteQuestionMutation.mutateAsync(deleteQuestionId);
      setDeleteQuestionId(null);
    } catch (error) {
      showError(error.message || 'Erro ao excluir questão');
    }
  };

  const handleSearch = (term) => {
    updateFilter('search', term);
  };

  const handleClearSearch = () => {
    updateFilter('search', '');
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erro ao carregar questões
        </h3>
        <p className="text-gray-600 mb-6">
          {error.message || 'Ocorreu um erro inesperado'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questões</h1>
          <p className="mt-2 text-gray-600">
            Gerencie seu banco de questões e organize por disciplina
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateQuestion}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Questão
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <SearchInput
              placeholder="Buscar questões..."
              value={searchTerm}
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
          </div>

          {/* Subject Filter */}
          <div>
            <Select
              value={subjectFilter}
              onChange={(e) => updateFilter('subject', e.target.value)}
              options={[
                { value: 'all', label: 'Todas as disciplinas' },
                ...subjects.map(subject => ({
                  value: subject.id,
                  label: subject.name,
                }))
              ]}
            />
          </div>

          {/* Difficulty Filter */}
          <div>
            <Select
              value={difficultyFilter}
              onChange={(e) => updateFilter('difficulty', e.target.value)}
              options={[
                { value: 'all', label: 'Todas as dificuldades' },
                { value: 'easy', label: 'Fácil' },
                { value: 'medium', label: 'Médio' },
                { value: 'hard', label: 'Difícil' },
              ]}
            />
          </div>

          {/* Sort */}
          <div>
            <Select
              value={sortBy}
              onChange={(e) => updateFilter('sort', e.target.value)}
              options={[
                { value: 'created', label: 'Mais recentes' },
                { value: 'name', label: 'Alfabética' },
                { value: 'difficulty', label: 'Dificuldade' },
                { value: 'usage', label: 'Mais usadas' },