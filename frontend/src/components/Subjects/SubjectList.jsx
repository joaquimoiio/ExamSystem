// frontend/src/components/Subjects/SubjectsList.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, Users, FileText } from 'lucide-react';
import useSubjects from '../../hooks/useSubjects';
import SubjectForm from './SubjectForm';
import SubjectCard from './SubjectCard';
import SubjectModal from './SubjectModal';
import Pagination from '../Common/Pagination';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import { Button, Input } from '../Common';
import { toast } from 'react-hot-toast';

const SubjectsList = () => {
  // Estados locais
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Hook customizado para disciplinas
  const {
    subjects,
    loading,
    error,
    pagination,
    createSubject,
    updateSubject,
    deleteSubject,
    reload,
    creating,
    updating,
    deleting
  } = useSubjects({
    autoLoad: true,
    page: currentPage,
    limit: 12,
    search: searchTerm,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
  });

  // Efeito para recarregar quando filtros mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset para primeira página
      reload({
        page: 1,
        search: searchTerm,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, reload]);

  // Efeito para carregar página específica
  useEffect(() => {
    if (currentPage > 1) {
      reload({
        page: currentPage,
        search: searchTerm,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      });
    }
  }, [currentPage]);

  // Handlers
  const handleCreateSubject = async (subjectData) => {
    try {
      console.log('📝 Criando nova disciplina:', subjectData);
      await createSubject(subjectData);
      setShowForm(false);
      // Recarregar dados para mostrar a nova disciplina
      await reload({ page: 1 });
      setCurrentPage(1);
    } catch (error) {
      console.error('❌ Erro ao criar disciplina:', error);
    }
  };

  const handleUpdateSubject = async (id, subjectData) => {
    try {
      console.log('✏️ Atualizando disciplina:', { id, data: subjectData });
      await updateSubject(id, subjectData);
      setShowForm(false);
      setSelectedSubject(null);
      // Recarregar dados para mostrar as atualizações
      await reload();
    } catch (error) {
      console.error('❌ Erro ao atualizar disciplina:', error);
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      console.log('🗑️ Excluindo disciplina:', id);
      await deleteSubject(id);
      setShowModal(false);
      setSelectedSubject(null);
      // Recarregar dados para refletir a exclusão
      await reload();
    } catch (error) {
      console.error('❌ Erro ao excluir disciplina:', error);
    }
  };

  const handleEditSubject = (subject) => {
    console.log('✏️ Editando disciplina:', subject);
    setSelectedSubject(subject);
    setShowForm(true);
  };

  const handleViewSubject = (subject) => {
    console.log('👁️ Visualizando disciplina:', subject);
    setSelectedSubject(subject);
    setShowModal(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRefresh = async () => {
    console.log('🔄 Recarregando disciplinas...');
    try {
      await reload();
      toast.success('Dados atualizados!');
    } catch (error) {
      console.error('❌ Erro ao recarregar:', error);
    }
  };

  // Estados de loading específicos
  const isOperating = creating || updating || deleting;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Disciplinas
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas disciplinas e organize seu conteúdo
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading || isOperating}
            className="flex items-center gap-2"
          >
            <svg 
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Atualizar
          </Button>
          
          <Button
            onClick={() => setShowForm(true)}
            disabled={isOperating}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Disciplina
          </Button>
        </div>
      </div>

      {/* Stats */}
      {pagination.totalItems > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {pagination.totalItems}
              </div>
              <div className="text-sm text-blue-600">
                Total de Disciplinas
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {subjects.filter(s => s.isActive).length}
              </div>
              <div className="text-sm text-green-600">
                Disciplinas Ativas
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {subjects.reduce((total, s) => total + (s.questionsCount || 0), 0)}
              </div>
              <div className="text-sm text-purple-600">
                Total de Questões
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Buscar disciplinas..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
              icon={Search}
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todas as disciplinas</option>
              <option value="active">Apenas ativas</option>
              <option value="inactive">Apenas inativas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !subjects.length && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-medium mb-2">
            Erro ao carregar disciplinas
          </div>
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar Novamente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && subjects.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? "Nenhuma disciplina encontrada" : "Nenhuma disciplina cadastrada"}
          description={
            searchTerm 
              ? `Não encontramos disciplinas que correspondam a "${searchTerm}"`
              : "Comece criando sua primeira disciplina para organizar suas questões e provas"
          }
          action={
            !searchTerm && (
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeira Disciplina
              </Button>
            )
          }
        />
      )}

      {/* Grid de Disciplinas */}
      {!loading && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEditSubject}
              onView={handleViewSubject}
              onDelete={(subject) => {
                setSelectedSubject(subject);
                setShowModal(true);
              }}
              loading={isOperating}
            />
          ))}
        </div>
      )}

      {/* Loading overlay para operações */}
      {isOperating && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <LoadingSpinner />
            <span className="text-gray-600">
              {creating && 'Criando disciplina...'}
              {updating && 'Atualizando disciplina...'}
              {deleting && 'Excluindo disciplina...'}
            </span>
          </div>
        </div>
      )}

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            disabled={loading || isOperating}
          />
        </div>
      )}

      {/* Formulário Modal */}
      {showForm && (
        <SubjectForm
          subject={selectedSubject}
          onSubmit={selectedSubject ? handleUpdateSubject : handleCreateSubject}
          onCancel={() => {
            setShowForm(false);
            setSelectedSubject(null);
          }}
          loading={selectedSubject ? updating : creating}
        />
      )}

      {/* Modal de Visualização */}
      {showModal && selectedSubject && (
        <SubjectModal
          subject={selectedSubject}
          onEdit={() => {
            setShowModal(false);
            handleEditSubject(selectedSubject);
          }}
          onDelete={() => handleDeleteSubject(selectedSubject.id)}
          onClose={() => {
            setShowModal(false);
            setSelectedSubject(null);
          }}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default SubjectsList;