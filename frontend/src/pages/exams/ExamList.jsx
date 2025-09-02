import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, MoreVertical,
  BarChart3, BookOpen, Users, Clock, Download, Share2,
  Play, Pause, Archive, Copy, FileText, AlertCircle
} from 'lucide-react';
import { useExams, useSubjects, useDeleteExam, usePublishExam, useGeneratePDFs } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonCard } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';
import { SearchInput, Select } from '../../components/ui/Input';

const statusConfig = {
  draft: { 
    label: 'Rascunho', 
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    icon: Edit
  },
  published: { 
    label: 'Publicada', 
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    icon: Play
  },
  archived: { 
    label: 'Arquivada', 
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    icon: Archive
  },
};

function ExamCard({ exam, onEdit, onDelete, onView, onPublish, onGeneratePDFs, onDuplicate }) {
  const [showActions, setShowActions] = useState(false);
  const statusInfo = statusConfig[exam.status] || statusConfig.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 hover:shadow-medium transition-all duration-200 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
              {exam.title}
            </h3>
            
            {exam.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                {exam.description}
              </p>
            )}
            
            {exam.subject && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: exam.subject.color }}
                />
                <span>{exam.subject.name}</span>
              </div>
            )}
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
                      onView(exam);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </button>
                  
                  <button
                    onClick={() => {
                      onEdit(exam);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>

                  <button
                    onClick={() => {
                      onDuplicate(exam);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </button>

                  {exam.status === 'draft' && (
                    <button
                      onClick={() => {
                        onPublish(exam);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Publicar
                    </button>
                  )}

                  {exam.status === 'published' && (
                    <button
                      onClick={() => {
                        onGeneratePDFs(exam);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Gerar PDFs
                    </button>
                  )}

                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onDelete(exam);
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
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {exam.totalQuestions || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Questões</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {exam.variationsCount || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Variações</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {exam.submissionsCount || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Respostas</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          {exam.publishedAt && (
            <span>
              Publicada em {new Date(exam.publishedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            to={`/exams/${exam.id}`}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Gerenciar →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreateExam, hasFilters }) {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full inline-block mb-4">
        <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {hasFilters ? 'Nenhuma prova encontrada' : 'Nenhuma prova criada'}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm mx-auto">
        {hasFilters 
          ? 'Tente ajustar os filtros ou termo de busca para encontrar provas.'
          : 'Comece criando sua primeira prova com múltiplas variações.'
        }
      </p>
      {!hasFilters && (
        <button
          onClick={onCreateExam}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar primeira prova
        </button>
      )}
    </div>
  );
}

export default function ExamList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteExamId, setDeleteExamId] = useState(null);
  const [publishExamId, setPublishExamId] = useState(null);

  // Get filter values from URL params
  const searchTerm = searchParams.get('search') || '';
  const subjectFilter = searchParams.get('subject') || 'all';
  const statusFilter = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sort') || 'created';

  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  // Build query parameters for API
  const queryParams = {
    search: searchTerm || undefined,
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sort: sortBy,
    limit: 50,
  };

  const { data: examsData, isLoading, error } = useExams(queryParams);
  const { data: subjectsData } = useSubjects();
  const deleteExamMutation = useDeleteExam();
  const publishExamMutation = usePublishExam();
  const generatePDFsMutation = useGeneratePDFs();

  const exams = examsData?.data?.exams || [];
  const subjects = subjectsData?.data?.subjects || [];

  const hasFilters = searchTerm || subjectFilter !== 'all' || statusFilter !== 'all';

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

  const handleCreateExam = () => {
    navigate('/exams/new');
  };

  const handleEditExam = (exam) => {
    navigate(`/exams/${exam.id}`);
  };

  const handleViewExam = (exam) => {
    navigate(`/exams/${exam.id}`);
  };

  const handleDeleteExam = (exam) => {
    setDeleteExamId(exam.id);
  };

  const handlePublishExam = (exam) => {
    setPublishExamId(exam.id);
  };

  const handleDuplicateExam = async (exam) => {
    try {
      // Logic to duplicate exam would go here
      success('Funcionalidade de duplicação em desenvolvimento');
    } catch (error) {
      showError(error.message || 'Erro ao duplicar prova');
    }
  };

  const handleGeneratePDFs = async (exam) => {
    try {
      await generatePDFsMutation.mutateAsync(exam.id);
    } catch (error) {
      showError(error.message || 'Erro ao gerar PDFs');
    }
  };

  const confirmDelete = async () => {
    if (!deleteExamId) return;

    try {
      await deleteExamMutation.mutateAsync(deleteExamId);
      setDeleteExamId(null);
    } catch (error) {
      showError(error.message || 'Erro ao excluir prova');
    }
  };

  const confirmPublish = async () => {
    if (!publishExamId) return;

    try {
      await publishExamMutation.mutateAsync(publishExamId);
      setPublishExamId(null);
    } catch (error) {
      showError(error.message || 'Erro ao publicar prova');
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
        <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full inline-block mb-4">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Erro ao carregar provas
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Provas</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Gerencie suas provas e acompanhe os resultados
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateExam}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Prova
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <SearchInput
              placeholder="Buscar provas..."
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

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => updateFilter('status', e.target.value)}
              options={[
                { value: 'all', label: 'Todos os status' },
                { value: 'draft', label: 'Rascunhos' },
                { value: 'published', label: 'Publicadas' },
                { value: 'archived', label: 'Arquivadas' },
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
                { value: 'title', label: 'Alfabética' },
                { value: 'published', label: 'Recém publicadas' },
                { value: 'submissions', label: 'Mais respondidas' },
              ]}
            />
          </div>
        </div>

        {/* Results Info and Clear Filters */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>
            {isLoading ? 'Carregando...' : `${exams.length} prova${exams.length !== 1 ? 's' : ''} encontrada${exams.length !== 1 ? 's' : ''}`}
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
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} lines={4} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState 
          onCreateExam={handleCreateExam}
          hasFilters={hasFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onEdit={handleEditExam}
              onDelete={handleDeleteExam}
              onView={handleViewExam}
              onPublish={handlePublishExam}
              onGeneratePDFs={handleGeneratePDFs}
              onDuplicate={handleDuplicateExam}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteExamId}
        onClose={() => setDeleteExamId(null)}
        onConfirm={confirmDelete}
        title="Excluir Prova"
        message="Tem certeza que deseja excluir esta prova? Esta ação não pode ser desfeita e todos os dados de submissões serão perdidos."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="error"
        loading={deleteExamMutation.isPending}
      />

      {/* Publish Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!publishExamId}
        onClose={() => setPublishExamId(null)}
        onConfirm={confirmPublish}
        title="Publicar Prova"  
        message="Tem certeza que deseja publicar esta prova? Após a publicação, ela ficará disponível para os estudantes e não poderá ser editada."
        confirmText="Publicar"
        cancelText="Cancelar"
        variant="success"
        loading={publishExamMutation.isPending}
      />
    </div>
  );
}