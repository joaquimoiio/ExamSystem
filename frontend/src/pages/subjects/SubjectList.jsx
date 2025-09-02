import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, MoreVertical,
  BookOpen, Users, FileText, Settings, AlertCircle
} from 'lucide-react';
import { useSubjects, useDeleteSubject } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonCard } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/Input';

function SubjectCard({ subject, onEdit, onDelete, onView }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 hover:shadow-medium transition-all duration-200 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: subject.color }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {subject.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {subject.description || 'Sem descrição'}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      onView(subject);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </button>
                  <button
                    onClick={() => {
                      onEdit(subject);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onDelete(subject);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {subject.questionsCount || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Questões</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {subject.examsCount || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Provas</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${subject.isActive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }
          `}>
            {subject.isActive ? 'Ativa' : 'Inativa'}
          </span>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Criada em {new Date(subject.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            to={`/questions?subject=${subject.id}`}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Ver questões
          </Link>
          <Link
            to={`/subjects/${subject.id}`}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Gerenciar →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreateSubject }) {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full inline-block mb-4">
        <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Nenhuma disciplina encontrada
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        Comece criando sua primeira disciplina para organizar suas questões e provas.
      </p>
      <button
        onClick={onCreateSubject}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Criar primeira disciplina
      </button>
    </div>
  );
}

export default function SubjectList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);

  const navigate = useNavigate();
  const { error: showError } = useToast();
  
  const { data: subjectsData, isLoading, error } = useSubjects();
  const deleteSubjectMutation = useDeleteSubject();

  const subjects = subjectsData?.data?.subjects || [];

  // Filter and sort subjects
  const filteredSubjects = subjects
    .filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           subject.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && subject.isActive) ||
                           (filterStatus === 'inactive' && !subject.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'questions':
          return (b.questionsCount || 0) - (a.questionsCount || 0);
        case 'exams':
          return (b.examsCount || 0) - (a.examsCount || 0);
        default:
          return 0;
      }
    });

  const handleCreateSubject = () => {
    navigate('/subjects/new');
  };

  const handleEditSubject = (subject) => {
    navigate(`/subjects/${subject.id}`);
  };

  const handleViewSubject = (subject) => {
    navigate(`/subjects/${subject.id}`);
  };

  const handleDeleteSubject = (subject) => {
    setDeleteSubjectId(subject.id);
  };

  const confirmDelete = async () => {
    if (!deleteSubjectId) return;

    try {
      await deleteSubjectMutation.mutateAsync(deleteSubjectId);
      setDeleteSubjectId(null);
    } catch (error) {
      showError(error.message || 'Erro ao excluir disciplina');
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-block mb-4">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Erro ao carregar disciplinas
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disciplinas</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gerencie suas disciplinas e organize o conteúdo por matéria
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateSubject}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Disciplina
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <SearchInput
              placeholder="Buscar disciplinas..."
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="active">Apenas ativas</option>
              <option value="inactive">Apenas inativas</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="name">Ordenar por nome</option>
              <option value="created">Mais recentes</option>
              <option value="questions">Mais questões</option>
              <option value="exams">Mais provas</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {isLoading ? 'Carregando...' : `${filteredSubjects.length} disciplina${filteredSubjects.length !== 1 ? 's' : ''} encontrada${filteredSubjects.length !== 1 ? 's' : ''}`}
          </span>
          {searchTerm && (
            <span>
              Buscando por: <strong>"{searchTerm}"</strong>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        searchTerm || filterStatus !== 'all' ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full inline-block mb-4">
              <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma disciplina encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tente ajustar os filtros ou termo de busca.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <EmptyState onCreateSubject={handleCreateSubject} />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEditSubject}
              onDelete={handleDeleteSubject}
              onView={handleViewSubject}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteSubjectId}
        onClose={() => setDeleteSubjectId(null)}
        onConfirm={confirmDelete}
        title="Excluir Disciplina"
        message="Tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita e todas as questões associadas também serão removidas."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="error"
        loading={deleteSubjectMutation.isPending}
      />
    </div>
  );
}