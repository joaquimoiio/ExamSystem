// frontend/src/components/Subjects/SubjectList.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, Users, FileText } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import SubjectForm from './SubjectForm';
import SubjectCard from './SubjectCard';
import SubjectModal from './SubjectModal';
import { Button, Input, Pagination, LoadingSpinner, EmptyState } from '../Common';
import { toast } from 'react-toastify';

const SubjectsList = () => {
  // Estados locais
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Hook de API
  const { useApiQuery, useApiMutation } = useApi();

  // Buscar disciplinas
  const { data: subjectsData, isLoading, refetch, error } = useApiQuery(
    ['subjects', currentPage, searchTerm, statusFilter],
    () => apiClient.get('/subjects', {
      params: {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      }
    }),
    {
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
      onError: (error) => {
        console.error('Erro ao carregar disciplinas:', error);
      }
    }
  );

  // Mutation para criar disciplina
  const createSubjectMutation = useApiMutation(
    (subjectData) => {
      console.log('Criando disciplina com dados:', subjectData);
      return apiClient.post('/subjects', subjectData);
    },
    {
      successMessage: 'Disciplina criada com sucesso!',
      invalidateQueries: [{ queryKey: ['subjects'] }],
      onSuccess: (data) => {
        console.log('Disciplina criada com sucesso:', data);
        setShowForm(false);
        setSelectedSubject(null);
        setTimeout(() => {
          refetch();
        }, 100);
      },
      onError: (error) => {
        console.error('Erro ao criar disciplina:', error);
      }
    }
  );

  // Mutation para atualizar disciplina
  const updateSubjectMutation = useApiMutation(
    ({ id, ...data }) => {
      console.log('Atualizando disciplina:', id, 'com dados:', data);
      return apiClient.put(`/subjects/${id}`, data);
    },
    {
      successMessage: 'Disciplina atualizada com sucesso!',
      invalidateQueries: [{ queryKey: ['subjects'] }],
      onSuccess: () => {
        setShowForm(false);
        setSelectedSubject(null);
        setTimeout(() => {
          refetch();
        }, 100);
      },
      onError: (error) => {
        console.error('Erro ao atualizar disciplina:', error);
      }
    }
  );

  // Mutation para excluir disciplina
  const deleteSubjectMutation = useApiMutation(
    (id) => apiClient.delete(`/subjects/${id}`),
    {
      successMessage: 'Disciplina excluída com sucesso!',
      invalidateQueries: [{ queryKey: ['subjects'] }],
      onSuccess: () => {
        setShowModal(false);
        setSelectedSubject(null);
        setTimeout(() => {
          refetch();
        }, 100);
      },
      onError: (error) => {
        console.error('Erro ao excluir disciplina:', error);
      }
    }
  );

  // Efeito para recarregar quando filtros mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset para primeira página
      refetch();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Extrair dados
  const subjects = subjectsData?.data?.subjects || [];
  const pagination = subjectsData?.data?.pagination || {};

  // Handlers
  const handleCreateSubject = (data) => {
    // Garantir que todos os campos obrigatórios estão presentes
    const formattedData = {
      name: data.name,
      description: data.description || '',
      color: data.color,
      code: data.code || '',
      credits: data.credits || 1,
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    console.log('Dados enviados:', formattedData);
    createSubjectMutation.mutate(formattedData);
  };

  const handleUpdateSubject = (data) => {
    if (!selectedSubject) return;
    
    const formattedData = {
      id: selectedSubject.id,
      name: data.name,
      description: data.description || '',
      color: data.color,
      code: data.code || '',
      credits: data.credits || 1,
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    
    updateSubjectMutation.mutate(formattedData);
  };

  const handleDeleteSubject = () => {
    if (selectedSubject) {
      deleteSubjectMutation.mutate(selectedSubject.id);
    }
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setShowForm(true);
  };

  const handleViewSubject = (subject) => {
    setSelectedSubject(subject);
    setShowModal(true);
  };

  const handleNewSubject = () => {
    setSelectedSubject(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedSubject(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSubject(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Loading state
  if (isLoading && !subjects.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Carregando disciplinas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinas</h1>
          <p className="text-gray-600">
            Gerencie suas disciplinas e organize seu conteúdo
          </p>
        </div>
        <Button
          onClick={handleNewSubject}
          className="flex items-center gap-2"
          disabled={createSubjectMutation.isLoading}
        >
          <Plus size={20} />
          Nova Disciplina
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar disciplinas..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtro de Status */}
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <BookOpen className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-700">
                  {pagination.total || subjects.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-green-600 font-medium">Ativas</p>
                <p className="text-2xl font-bold text-green-700">
                  {subjects.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-orange-600 font-medium">Com Questões</p>
                <p className="text-2xl font-bold text-orange-700">
                  {subjects.filter(s => s.questionsCount > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Disciplinas */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Erro ao carregar disciplinas</p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              loading={deleteSubjectMutation.isLoading && selectedSubject?.id === subject.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma disciplina encontrada"
          description={
            searchTerm
              ? `Nenhuma disciplina encontrada para "${searchTerm}"`
              : "Você ainda não criou nenhuma disciplina. Comece criando sua primeira disciplina."
          }
          actionLabel="Nova Disciplina"
          onAction={handleNewSubject}
        />
      )}

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page || currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && subjects.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center">
            <LoadingSpinner />
            <span className="ml-3 text-gray-600">Carregando...</span>
          </div>
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SubjectForm
                subject={selectedSubject}
                onSubmit={selectedSubject ? handleUpdateSubject : handleCreateSubject}
                onCancel={handleCancelForm}
                loading={createSubjectMutation.isLoading || updateSubjectMutation.isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização/Ações */}
      {showModal && selectedSubject && (
        <SubjectModal
          subject={selectedSubject}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
          onClose={handleCloseModal}
          loading={deleteSubjectMutation.isLoading}
        />
      )}
    </div>
  );
};

export default SubjectsList;