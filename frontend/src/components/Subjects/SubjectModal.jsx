import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Modal from '../Common/Modal'
import ConfirmationModal from '../Common/ConfirmationModal'

const SubjectModal = ({ isOpen, onClose, subject, onEdit, onDelete }) => {
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  if (!subject) return null

  const totalQuestions = subject.questions?.length || 0

  const handleEdit = () => {
    onClose()
    onEdit(subject)
  }

  const handleDelete = async () => {
    try {
      setDeleteLoading(true)
      await onDelete(subject.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Erro ao deletar disciplina:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCreateExam = () => {
    onClose()
    navigate(`/exams/create?subjectId=${subject.id}`)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={subject.name}
        size="lg"
        footer={
          <div className="flex justify-between w-full">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Editar
            </button>
            <div className="flex space-x-3">
              {totalQuestions > 0 ? (
                <span className="inline-flex items-center px-3 py-2 text-sm text-red-600">
                  Remova as questões para excluir
                </span>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Excluir
                </button>
              )}
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Fechar
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Subject Info */}
          <div className="flex items-start space-x-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{subject.name}</h3>
              {subject.description && (
                <p className="mt-1 text-sm text-gray-600">{subject.description}</p>
              )}
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>{totalQuestions} questão{totalQuestions !== 1 ? 'ões' : ''}</span>
                <span>•</span>
                <span>Criada em {new Date(subject.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          {totalQuestions > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Estatísticas</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {subject.questions?.filter(q => q.difficulty === 'easy').length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Fáceis</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {subject.questions?.filter(q => q.difficulty === 'medium').length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Médias</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {subject.questions?.filter(q => q.difficulty === 'hard').length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Difíceis</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Ações</h4>
            <div className="flex flex-col sm:flex-row gap-3">
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
                onClick={handleCreateExam}
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