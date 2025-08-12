import React, { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { examService } from '../services/exam'
import Button from '../components/Common/Button'
import ExamList from '../components/Exams/ExamList'
import ExamGenerator from '../components/Exams/ExamGenerator'
import ExamPreview from '../components/Exams/ExamPreview'
import { ConfirmationModal } from '../components/Common/Modal'
import Loading from '../components/Common/Loading'
import { showOperationToast } from '../components/Common/Toast'

const ExamsPage = () => {
  const [showGenerator, setShowGenerator] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  const { useApiQuery, useApiMutation } = useApi()

  // Fetch exams
  const { data: examsData, isLoading, refetch } = useApiQuery(
    ['exams', currentPage, filters, searchTerm],
    () => examService.getExams({
      page: currentPage,
      limit: 12,
      search: searchTerm,
      ...filters
    })
  )

  // Create exam mutation
  const createExamMutation = useApiMutation(
    (examData) => {
      if (examData.generationType === 'automatic') {
        return examService.generateExam(examData)
      } else {
        return examService.createExam(examData)
      }
    },
    {
      successMessage: 'Prova criada com sucesso!',
      invalidateQueries: [['exams']],
      onSuccess: (data) => {
        setShowGenerator(false)
        refetch()
        
        // Automatically preview the created exam
        if (data.data?.exam) {
          setSelectedExam(data.data.exam)
          setShowPreview(true)
        }
      }
    }
  )

  // Update exam mutation
  const updateExamMutation = useApiMutation(
    ({ id, ...data }) => examService.updateExam(id, data),
    {
      successMessage: 'Prova atualizada com sucesso!',
      invalidateQueries: [['exams']],
      onSuccess: () => {
        setShowPreview(false)
        setSelectedExam(null)
        refetch()
      }
    }
  )

  // Delete exam mutation
  const deleteExamMutation = useApiMutation(
    (id) => examService.deleteExam(id),
    {
      successMessage: 'Prova excluída com sucesso!',
      invalidateQueries: [['exams']],
      onSuccess: () => {
        setShowDeleteConfirm(false)
        setSelectedExam(null)
        refetch()
      }
    }
  )

  // Duplicate exam mutation
  const duplicateExamMutation = useApiMutation(
    ({ id, title }) => examService.duplicateExam(id, title),
    {
      successMessage: 'Prova duplicada com sucesso!',
      invalidateQueries: [['exams']],
      onSuccess: () => refetch()
    }
  )

  // Publish exam mutation
  const publishExamMutation = useApiMutation(
    (id) => examService.publishExam(id),
    {
      successMessage: 'Prova publicada com sucesso!',
      invalidateQueries: [['exams']],
      onSuccess: () => refetch()
    }
  )

  // Unpublish exam mutation
  const unpublishExamMutation = useApiMutation(
    (id) => examService.unpublishExam(id),
    {
      successMessage: 'Prova despublicada com sucesso!',
      invalidateQueries: [['exams']],
      onSuccess: () => refetch()
    }
  )

  // Archive exam mutation
  const archiveExamMutation = useApiMutation(
    (id) => examService.archiveExam(id),
    {
      successMessage: 'Prova arquivada com sucesso!',
      invalidateQueries: [['exams']],
      onSuccess: () => refetch()
    }
  )

  const exams = examsData?.data?.exams || []
  const pagination = examsData?.data?.pagination || {}

  const handleCreateExam = (examData) => {
    createExamMutation.mutate(examData)
  }

  const handleViewExam = (exam) => {
    setSelectedExam(exam)
    setShowPreview(true)
  }

  const handleEditExam = (exam) => {
    // TODO: Implement edit functionality
    showOperationToast.info('Edição de prova em desenvolvimento')
  }

  const handleDuplicateExam = (exam) => {
    const newTitle = `${exam.title} (Cópia)`
    duplicateExamMutation.mutate({ id: exam.id, title: newTitle })
  }

  const handleDeleteExam = () => {
    if (selectedExam) {
      deleteExamMutation.mutate(selectedExam.id)
    }
  }

  const handlePublishExam = (exam) => {
    publishExamMutation.mutate(exam.id)
  }

  const handleUnpublishExam = (exam) => {
    unpublishExamMutation.mutate(exam.id)
  }

  const handleArchiveExam = (exam) => {
    archiveExamMutation.mutate(exam.id)
  }

  const handleGeneratePDF = async (exam) => {
    try {
      const response = await examService.generateExamPDF(exam.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${exam.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showOperationToast.downloaded()
    } catch (error) {
      showOperationToast.error('Erro ao gerar PDF')
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleBulkExport = () => {
    // TODO: Implement bulk export
    showOperationToast.info('Exportação em lote em desenvolvimento')
  }

  const handleBulkArchive = () => {
    // TODO: Implement bulk archive
    showOperationToast.info('Arquivamento em lote em desenvolvimento')
  }

  if (isLoading && exams.length === 0) {
    return <Loading message="Carregando provas..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Provas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Crie, gerencie e publique suas provas online
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <Button
            variant="secondary"
            onClick={() => {
              // TODO: Import exams
              showOperationToast.info('Importação em desenvolvimento')
            }}
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            }
          >
            Importar
          </Button>
          <Button
            onClick={() => setShowGenerator(true)}
            variant="primary"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Nova Prova
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Pesquisar provas por título, disciplina ou status..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Stats */}
      {exams.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Provas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pagination.total || exams.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ativas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.filter(e => e.status === 'active').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Rascunhos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.filter(e => e.status === 'draft').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Submissões
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.reduce((sum, exam) => sum + (exam.submissionStats?.total || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exams List */}
      <ExamList
        exams={exams}
        pagination={pagination}
        onPageChange={handlePageChange}
        onView={handleViewExam}
        onEdit={handleEditExam}
        onDuplicate={handleDuplicateExam}
        onDelete={(exam) => {
          setSelectedExam(exam)
          setShowDeleteConfirm(true)
        }}
        onPublish={handlePublishExam}
        onUnpublish={handleUnpublishExam}
        onArchive={handleArchiveExam}
        onGeneratePDF={handleGeneratePDF}
        loading={isLoading}
        currentPage={currentPage}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Empty State */}
      {exams.length === 0 && !isLoading && (
        <div className="text-center bg-white shadow rounded-lg p-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhuma prova encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.keys(filters).length > 0
              ? 'Tente ajustar os filtros ou limpar a busca.'
              : 'Comece criando sua primeira prova.'
            }
          </p>
          <div className="mt-6">
            {searchTerm || Object.keys(filters).length > 0 ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({})
                }}
              >
                Limpar filtros
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowGenerator(true)}
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Criar primeira prova
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Exam Generator Modal */}
      <ExamGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onExamGenerated={handleCreateExam}
        loading={createExamMutation.isLoading}
      />

      {/* Exam Preview Modal */}
      {showPreview && selectedExam && (
        <ExamPreview
          exam={selectedExam}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setSelectedExam(null)
          }}
          onEdit={handleEditExam}
          onPublish={handlePublishExam}
          onGeneratePDF={handleGeneratePDF}
          showAnswers={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setSelectedExam(null)
        }}
        onConfirm={handleDeleteExam}
        title="Excluir Prova"
        message={
          selectedExam
            ? `Tem certeza que deseja excluir a prova "${selectedExam.title}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta prova?'
        }
        confirmText="Excluir"
        loading={deleteExamMutation.isLoading}
        confirmVariant="danger"
      />

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Dicas para criar provas eficazes
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Distribua questões entre diferentes níveis de dificuldade</li>
                <li>Defina um tempo adequado baseado no número de questões</li>
                <li>Use o recurso de embaralhamento para evitar cola</li>
                <li>Configure QR Codes para facilitar o acesso dos alunos</li>
                <li>Ative a correção automática para resultados imediatos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamsPage