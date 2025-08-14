import React, { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { apiClient } from '../services/api'
import { showOperationToast } from '../components/Common/Toast'
import Button from '../components/Common/Button'
import Loading from '../components/Common/Loading'
import { ConfirmationModal } from '../components/Common/Modal'

const ExamsPage = () => {
  const [filters, setFilters] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedExam, setSelectedExam] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExamGenerator, setShowExamGenerator] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)

  const { useApiQuery, useApiMutation } = useApi()

  // Fetch exams
  const { data: examsData, isLoading, refetch } = useApiQuery(
    ['exams', currentPage, filters],
    () => apiClient.get('/exams', {
      params: {
        page: currentPage,
        limit: 10,
        ...filters
      }
    }),
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5 // 5 minutos
    }
  )

  // Delete exam mutation
  const deleteExamMutation = useApiMutation(
    (examId) => apiClient.delete(`/exams/${examId}`),
    {
      successMessage: 'Prova excluída com sucesso!',
      invalidateQueries: [{ queryKey: ['exams'] }],
      onSuccess: () => {
        setShowDeleteConfirm(false)
        setSelectedExam(null)
        setTimeout(() => {
          refetch()
        }, 100)
      },
      onError: (error) => {
        console.error('Erro ao excluir prova:', error)
      }
    }
  )

  // Create exam mutation
  const createExamMutation = useApiMutation(
    (examData) => apiClient.post('/exams', examData),
    {
      successMessage: 'Prova criada com sucesso!',
      invalidateQueries: [{ queryKey: ['exams'] }],
      onSuccess: (data) => {
        setShowExamGenerator(false)
        setSelectedSubjectId(null)
        setTimeout(() => {
          refetch()
        }, 100)
      },
      onError: (error) => {
        console.error('Erro ao criar prova:', error)
      }
    }
  )

  // Update exam mutation
  const updateExamMutation = useApiMutation(
    ({ id, ...data }) => apiClient.put(`/exams/${id}`, data),
    {
      successMessage: 'Prova atualizada com sucesso!',
      invalidateQueries: [{ queryKey: ['exams'] }],
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 100)
      },
      onError: (error) => {
        console.error('Erro ao atualizar prova:', error)
      }
    }
  )

  const handleExamGenerated = (newExam) => {
    createExamMutation.mutate(newExam)
  }

  const handleDeleteExam = (exam) => {
    setSelectedExam(exam)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (selectedExam) {
      deleteExamMutation.mutate(selectedExam.id)
    }
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const exams = examsData?.data?.exams || []
  const pagination = examsData?.data?.pagination || {}

  // Show loading state
  if (isLoading && exams.length === 0) {
    return <Loading message="Carregando provas..." />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie suas provas e acompanhe o desempenho dos alunos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setShowExamGenerator(true)}
            variant="primary"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Nova Prova
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por disciplina
            </label>
            <select
              value={filters.subjectId || ''}
              onChange={(e) => handleFiltersChange({ 
                ...filters, 
                subjectId: e.target.value || undefined 
              })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todas as disciplinas</option>
              {/* Aqui você pode mapear as disciplinas disponíveis */}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFiltersChange({ 
                ...filters, 
                status: e.target.value || undefined 
              })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="published">Publicada</option>
              <option value="completed">Finalizada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de criação
            </label>
            <input
              type="date"
              value={filters.createdAt || ''}
              onChange={(e) => handleFiltersChange({ 
                ...filters, 
                createdAt: e.target.value || undefined 
              })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {exams.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma prova encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.keys(filters).length > 0
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando uma nova prova.'
                }
              </p>
              <div className="mt-6">
                {Object.keys(filters).length > 0 ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleFiltersChange({})}
                  >
                    Limpar filtros
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setShowExamGenerator(true)}
                    icon={
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  >
                    Criar primeira prova
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {exam.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {exam.questionsCount || 0} questões
                        </span>
                        <span>
                          <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {exam.duration || 'Sem limite'} min
                        </span>
                        <span>
                          <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4m4-4v4a1 1 0 102 0V3a1 1 0 112 0v4m-6 4h6m-6 0V7m6 4v10a1 1 0 01-1 1H9a1 1 0 01-1-1V11" />
                          </svg>
                          {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exam.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : exam.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exam.status === 'published' ? 'Publicada' : 
                         exam.status === 'completed' ? 'Finalizada' : 'Rascunho'}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Implementar visualização
                          }}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Implementar edição
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteExam(exam)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage === pagination.totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Próximo
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> até{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, pagination.total)}
                </span>{' '}
                de <span className="font-medium">{pagination.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {/* Implementar botões de paginação */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Exam Generator Modal */}
      {showExamGenerator && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Gerar Nova Prova
                </h3>
                {/* Aqui você pode adicionar o formulário de geração de prova */}
                <p className="text-sm text-gray-500">
                  Funcionalidade de geração de prova será implementada aqui.
                </p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="primary"
                  onClick={() => {
                    // Implementar geração de prova
                    setShowExamGenerator(false)
                  }}
                  className="ml-3"
                >
                  Gerar Prova
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowExamGenerator(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedExam && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title="Excluir Prova"
          message={`Tem certeza que deseja excluir a prova "${selectedExam.title}"?`}
          confirmText="Excluir"
          confirmVariant="danger"
          loading={deleteExamMutation.isLoading}
        />
      )}
    </div>
  )
}

export default ExamsPage