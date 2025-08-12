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
    () => apiClient.get(`/subjects/${subjectId}`)
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
    })
  )

  // Create question mutation
  const createQuestionMutation = useApiMutation(
    (questionData) => apiClient.post(`/subjects/${subjectId}/questions`, questionData),
    {
      successMessage: 'Questão criada com sucesso!',
      invalidateQueries: [['questions', subjectId]],
      onSuccess: () => {
        setShowForm(false)
        refetch()
      }
    }
  )

  // Update question mutation
  const updateQuestionMutation = useApiMutation(
    ({ id, ...data }) => apiClient.put(`/questions/${id}`, data),
    {
      successMessage: 'Questão atualizada com sucesso!',
      invalidateQueries: [['questions', subjectId]],
      onSuccess: () => {
        setShowForm(false)
        setSelectedQuestion(null)
        refetch()
      }
    }
  )

  // Delete question mutation
  const deleteQuestionMutation = useApiMutation(
    (id) => apiClient.delete(`/questions/${id}`),
    {
      successMessage: 'Questão excluída com sucesso!',
      invalidateQueries: [['questions', subjectId]],
      onSuccess: () => {
        setShowModal(false)
        setShowDeleteConfirm(false)
        setSelectedQuestion(null)
        refetch()
      }
    }
  )

  // Duplicate question mutation
  const duplicateQuestionMutation = useApiMutation(
    (id) => apiClient.post(`/questions/${id}/duplicate`),
    {
      successMessage: 'Questão duplicada com sucesso!',
      invalidateQueries: [['questions', subjectId]],
      onSuccess: () => refetch()
    }
  )

  // Toggle active question mutation
  const toggleActiveQuestionMutation = useApiMutation(
    ({ id, active }) => apiClient.patch(`/questions/${id}`, { active }),
    {
      successMessage: (data, { active }) => 
        `Questão ${active ? 'ativada' : 'desativada'} com sucesso!`,
      invalidateQueries: [['questions', subjectId]],
      onSuccess: () => refetch()
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

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleImportQuestions = () => {
    // TODO: Implementar importação de questões
    showOperationToast.info('Funcionalidade em desenvolvimento')
  }

  const handleExportQuestions = () => {
    // TODO: Implementar exportação de questões
    showOperationToast.info('Funcionalidade em desenvolvimento')
  }

  // Redirect if subject not found
  useEffect(() => {
    if (!subjectLoading && !subject) {
      navigate('/subjects')
      showOperationToast.error('Disciplina não encontrada')
    }
  }, [subject, subjectLoading, navigate])

  if (subjectLoading) {
    return <Loading message="Carregando disciplina..." />
  }

  if (!subject) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <Link
              to="/subjects"
              className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>

            {/* Subject Info */}
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: subject.color }}
              >
                {subject.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Questões - {subject.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {subject.code && `${subject.code} • `}
                  {questions.length} questão{questions.length !== 1 ? 'ões' : ''} cadastrada{questions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImportQuestions}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                }
              >
                Importar
              </Button>

              {questions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportQuestions}
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  }
                >
                  Exportar
                </Button>
              )}
            </div>

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
            placeholder="Pesquisar questões por enunciado, tags ou dificuldade..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Questions List */}
      <QuestionList
        questions={questions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={handleEditQuestion}
        onDelete={(question) => {
          setSelectedQuestion(question)
          setShowDeleteConfirm(true)
        }}
        onDuplicate={handleDuplicateQuestion}
        onToggleActive={handleToggleActiveQuestion}
        loading={questionsLoading}
        currentPage={currentPage}
        filters={filters}
        onFilterChange={handleFilterChange}
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhuma questão encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.keys(filters).length > 0
              ? 'Tente ajustar os filtros ou limpar a busca.'
              : 'Comece criando uma nova questão para esta disciplina.'
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
          onDuplicate={handleDuplicateQuestion}
          onToggleActive={handleToggleActiveQuestion}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setSelectedQuestion(null)
        }}
        onConfirm={handleDeleteQuestion}
        title="Excluir Questão"
        message={
          selectedQuestion
            ? `Tem certeza que deseja excluir a questão "${selectedQuestion.statement.substring(0, 50)}..."? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta questão?'
        }
        confirmText="Excluir"
        loading={deleteQuestionMutation.isLoading}
        confirmVariant="danger"
      />

      {/* Quick Stats */}
      {questions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas Rápidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{questions.length}</div>
              <div className="text-sm text-gray-500">Total de Questões</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {questions.filter(q => q.difficulty === 'easy').length}
              </div>
              <div className="text-sm text-gray-500">Fáceis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-yellow-600">
                {questions.filter(q => q.difficulty === 'medium').length}
              </div>
              <div className="text-sm text-gray-500">Médias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">
                {questions.filter(q => q.difficulty === 'hard').length}
              </div>
              <div className="text-sm text-gray-500">Difíceis</div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Dicas para criar questões
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use enunciados claros e objetivos</li>
                <li>Adicione tags para facilitar a organização</li>
                <li>Distribua as questões entre diferentes níveis de dificuldade</li>
                <li>Inclua explicações para ajudar no aprendizado</li>
                <li>Revise as alternativas para evitar ambiguidades</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionsPage