import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal, { ConfirmationModal } from '../Common/Modal'
import Button from '../Common/Button'

const SubjectModal = ({
  subject,
  onClose,
  onEdit,
  onDelete,
  deleteLoading = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!subject) return null

  const questionCounts = subject.questionCounts || {}
  const totalQuestions = questionCounts.total || 0

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil'
      case 'medium':
        return 'Médio'
      case 'hard':
        return 'Difícil'
      default:
        return difficulty
    }
  }

  const handleDelete = () => {
    onDelete()
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Detalhes da Disciplina"
        size="lg"
        footer={
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={onEdit}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              Editar
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={totalQuestions > 0}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Excluir
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start space-x-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{subject.name}</h3>
              {subject.code && (
                <p className="text-sm text-gray-500 mt-1">Código: {subject.code}</p>
              )}
              <div className="flex items-center mt-2 space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {subject.credits} crédito{subject.credits !== 1 ? 's' : ''}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subject.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {subject.active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          </div>

          {/* Descrição */}
          {subject.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Descrição</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {subject.description}
              </p>
            </div>
          )}

          {/* Estatísticas de Questões */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Questões</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  {totalQuestions} questão{totalQuestions !== 1 ? 'ões' : ''} cadastrada{totalQuestions !== 1 ? 's' : ''}
                </span>
                {totalQuestions > 0 && (
                  <Link
                    to={`/subjects/${subject.id}/questions`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver todas →
                  </Link>
                )}
              </div>

              {totalQuestions > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(questionCounts).map(([difficulty, count]) => {
                      if (difficulty === 'total') return null
                      return (
                        <div
                          key={difficulty}
                          className={`p-3 rounded-lg border ${getDifficultyColor(difficulty)}`}
                        >
                          <div className="text-center">
                            <div className="text-lg font-semibold">{count}</div>
                            <div className="text-xs">{getDifficultyLabel(difficulty)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Barra de progresso por dificuldade */}
                  <div className="space-y-2">
                    {Object.entries(questionCounts).map(([difficulty, count]) => {
                      if (difficulty === 'total') return null
                      const percentage = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0
                      return (
                        <div key={difficulty} className="flex items-center space-x-3">
                          <span className="text-xs font-medium text-gray-500 w-12">
                            {getDifficultyLabel(difficulty)}:
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                difficulty === 'easy' ? 'bg-green-500' :
                                difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Nenhuma questão cadastrada ainda
                  </p>
                  <Link
                    to={`/subjects/${subject.id}/questions`}
                    className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Adicionar primeira questão
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Criada em
              </h5>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(subject.createdAt).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {subject.updatedAt && subject.updatedAt !== subject.createdAt && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Última atualização
                </h5>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(subject.updatedAt).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Ações Rápidas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to={`/subjects/${subject.id}/questions`}
                className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gerenciar Questões
              </Link>
              <button
                onClick={() => {
                  // TODO: Implementar criação de prova
                  console.log('Criar prova para disciplina:', subject.id)
                }}
                className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
                disabled={totalQuestions === 0}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Criar Prova
              </button>
            </div>
            {totalQuestions === 0 && (
              <p className="mt-2 text-xs text-blue-700">
                Adicione questões à disciplina para poder criar provas
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Disciplina"
        message={
          totalQuestions > 0 
            ? `Não é possível excluir esta disciplina pois ela possui ${totalQuestions} questão${totalQuestions !== 1 ? 'ões' : ''} cadastrada${totalQuestions !== 1 ? 's' : ''}. Remova todas as questões primeiro.`
            : `Tem certeza que deseja excluir a disciplina "${subject.name}"? Esta ação não pode ser desfeita.`
        }
        confirmText={totalQuestions > 0 ? undefined : "Excluir"}
        loading={deleteLoading}
        confirmVariant="danger"
      />
    </>
  )
}

export default SubjectModal