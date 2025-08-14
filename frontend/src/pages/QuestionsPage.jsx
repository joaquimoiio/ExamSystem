import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { apiClient } from '../services/api'
import Button from '../components/Common/Button'
import QuestionList from '../components/Questions/QuestionList'
import QuestionForm from '../components/Questions/QuestionForm'
import QuestionModal from '../components/Questions/QuestionModal'
import { ConfirmationModal } from '../components/Common/Modal'
import Loading from '../components/Common/Loading'
import { showOperationToast } from '../components/Common/Toast'

const QuestionsPage = () => {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  const { useApiQuery, useApiMutation } = useApi()

  // Fetch subject details
  const { data: subjectData, isLoading: subjectLoading } = useApiQuery(
    ['subject', subjectId],
    () => apiClient.get(`/subjects/${subjectId}`),
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10 // 10 minutos
    }
  )

  // Fetch questions
  const { data: questionsData, isLoading: questionsLoading, refetch } = useApiQuery(
    ['questions', subjectId, currentPage, filters, searchTerm],
    () => apiClient.get(`/subjects/${subjectId}/questions`, {
      params: {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        ...filters
      }
    }),
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5 // 5 minutos
    }
  )

  // Create question mutation
  const createQuestionMutation = useApiMutation(
    (questionData) => apiClient.post(`/subjects/${subjectId}/questions`, questionData),
    {
      successMessage: 'Questão criada com sucesso!',
      invalidateQueries: [{ queryKey: ['questions', subjectId] }],
      onSuccess: () => {
        setShowForm(false)
        setTimeout(() => {
          refetch()
        }, 100)
      }
    }
  )

  // Update question mutation
  const updateQuestionMutation = useApiMutation(
    ({ id, ...data }) => apiClient.put(`/questions/${id}`, data),
    {
      successMessage: 'Questão atualizada com sucesso!',
      invalidateQueries: [{ queryKey: ['questions', subjectId] }],
      onSuccess: () => {
        setShowForm(false)
        setSelectedQuestion(null)
        setTimeout(() => {
          refetch()
        }, 100)
      }
    }
  )

  // Delete question mutation
  const deleteQuestionMutation = useApiMutation(
    (id) => apiClient.delete(`/questions/${id}`),
    {
      successMessage: 'Questão excluída com sucesso!',
      invalidateQueries: [{ queryKey: ['questions', subjectId] }],
      onSuccess: () => {
        setShowModal(false)
        setShowDeleteConfirm(false)
        setSelectedQuestion(null)
        setTimeout(() => {
          refetch()
        }, 100)
      }
    }
  )

  // Duplicate question mutation
  const duplicateQuestionMutation = useApiMutation(
    (id) => apiClient.post(`/questions/${id}/duplicate`),
    {
      successMessage: 'Questão duplicada com sucesso!',
      invalidateQueries: [{ queryKey: ['questions', subjectId] }],
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 100)
      }
    }
  )

  // Toggle active question mutation
  const toggleActiveQuestionMutation = useApiMutation(
    ({ id, active }) => apiClient.patch(`/questions/${id}`, { active }),
    {
      successMessage: (data, { active }) => 
        `Questão ${active ? 'ativada' : 'desativada'} com sucesso!`,
      invalidateQueries: [{ queryKey: ['questions', subjectId] }],
      onSuccess: () => {
        setTimeout(() => {
          refetch()
        }, 100)
      }
    }
  )

  const subject = subjectData?.data?.subject
  const questions = questionsData?.data?.questions || []
  const pagination = questionsData?.data?.pagination || {}

  const handleCreateQuestion = (data) => {
    createQuestionMutation.mutate(data)
  }

  const handleUpdateQuestion = (data) => {
    updateQuestionMutation.mutate({ id: selectedQuestion.id, ...data })
  }

  const handleDeleteQuestion = () => {
    if (selectedQuestion) {
      deleteQuestionMutation.mutate(selectedQuestion.id)
    }
  }

  const handleDuplicateQuestion = (question) => {
    duplicateQuestionMutation.mutate(question.id)
  }

  const handleToggleActiveQuestion = (question) => {
    toggleActiveQuestionMutation.mutate({
      id: question.id,
      active: !question.active
    })
  }

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question)
    setShowModal(true)
  }

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question)
    setShowForm(true)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSearchChange = (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Show loading state
  if ((subjectLoading || questionsLoading) && !subject) {
    return <Loading message="Carregando questões..." />
  }

  // Show error if subject not found
  if (!subjectLoading && !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Disciplina não encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">A disciplina que você está procurando não existe.</p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => navigate('/subjects')}
            >
              Voltar para Disciplinas
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <div>
              <Link to="/subjects" className="text-gray-400 hover:text-gray-500">
                <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.636 10.05A1 1 0 014.95 8.636L8 11.686V2a1 1 0 112 0v9.686l3.05-3.05a1 1 0 111.414 1.414l-4.657 4.657z" clipRule="evenodd" />
                </svg>
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link to="/subjects" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Disciplinas
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">
                {subject?.name || 'Questões'}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Questões - {subject?.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as questões desta disciplina
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Nova Questão
          </Button>
        </div>
      </div>

      {/* Question List */}
      <QuestionList
        questions={questions}
        pagination={pagination}
        filters={filters}
        searchTerm={searchTerm}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onView={handleViewQuestion}
        onEdit={handleEditQuestion}
        onDuplicate={handleDuplicateQuestion}
        onToggleActive={handleToggleActiveQuestion}
        loading={questionsLoading}
        currentPage={currentPage}
      />

      {/* Empty State */}
      {questions.length === 0 && !questionsLoading && (
        <div className="text-center bg-white shadow rounded-lg p-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma questão encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.keys(filters).length > 0
              ? 'Tente ajustar os filtros ou termos de busca.'
              : 'Comece criando uma nova questão para esta disciplina.'
            }
          </p>
          <div className="mt-6">
            {searchTerm || Object.keys(filters).length > 0 ? (
              <Button
                variant="secondary"
                onClick={() => {
                  handleSearchChange('')
                  handleFilterChange({})
                }}
              >
                Limpar filtros
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Criar primeira questão
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <QuestionForm
          question={selectedQuestion}
          subjectId={subjectId}
          onSubmit={selectedQuestion ? handleUpdateQuestion : handleCreateQuestion}
          onCancel={() => {
            setShowForm(false)
            setSelectedQuestion(null)
          }}
          loading={createQuestionMutation.isLoading || updateQuestionMutation.isLoading}
        />
      )}

      {/* View Question Modal */}
      {showModal && selectedQuestion && (
        <QuestionModal
          question={selectedQuestion}
          onClose={() => {
            setShowModal(false)
            setSelectedQuestion(null)
          }}
          onEdit={() => {
            setShowModal(false)
            setShowForm(true)
          }}
          onDelete={() => {
            setShowModal(false)
            setShowDeleteConfirm(true)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedQuestion && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteQuestion}
          title="Excluir Questão"
          message={`Tem certeza que deseja excluir a questão "${selectedQuestion.title || selectedQuestion.text?.substring(0, 50)}..."?`}
          confirmText="Excluir"
          confirmVariant="danger"
          loading={deleteQuestionMutation.isLoading}
        />
      )}
    </div>
  )
}

export default QuestionsPage