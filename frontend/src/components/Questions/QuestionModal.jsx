import React, { useState } from 'react'
import Modal, { ConfirmationModal } from '../Common/Modal'
import Button from '../Common/Button'
import { ALTERNATIVE_LETTERS } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'

const QuestionModal = ({
  question,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  deleteLoading = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  if (!question) return null

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

  const correctAlternativeIndex = question.alternatives?.findIndex(alt => alt.isCorrect) ?? -1

  const handleDelete = () => {
    onDelete()
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Detalhes da Questão"
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
              variant="secondary"
              onClick={onDuplicate}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            >
              Duplicar
            </Button>
            <Button
              variant={question.active ? "warning" : "success"}
              onClick={onToggleActive}
              icon={
                question.active ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )
              }
            >
              {question.active ? 'Desativar' : 'Ativar'}
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
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
          {/* Header com informações básicas */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(question.difficulty)}`}>
                {getDifficultyLabel(question.difficulty)}
              </div>
              <span className="text-sm text-gray-500">
                {question.points} ponto{question.points !== 1 ? 's' : ''}
              </span>
              {!question.active && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inativa
                </span>
              )}
            </div>
          </div>

          {/* Enunciado */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Enunciado
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {question.statement}
              </p>
            </div>
          </div>

          {/* Alternativas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Alternativas
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnswer(!showAnswer)}
                icon={
                  showAnswer ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )
                }
              >
                {showAnswer ? 'Ocultar' : 'Mostrar'} Gabarito
              </Button>
            </div>

            <div className="space-y-3">
              {question.alternatives?.map((alternative, index) => (
                <div
                  key={index}
                  className={`flex items-start p-4 rounded-lg border transition-colors duration-200 ${
                    showAnswer && alternative.isCorrect
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                    showAnswer && alternative.isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ALTERNATIVE_LETTERS[index]}
                  </span>
                  <span className="text-gray-700 flex-1">
                    {alternative.text}
                  </span>
                  {showAnswer && alternative.isCorrect && (
                    <svg className="ml-2 h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {showAnswer && correctAlternativeIndex >= 0 && (
              <div className="mt-3 text-sm">
                <span className="font-medium text-green-700">
                  Resposta correta: {ALTERNATIVE_LETTERS[correctAlternativeIndex]}
                </span>
              </div>
            )}
          </div>

          {/* Explicação */}
          {question.explanation && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Explicação
              </h3>
              <div className={`rounded-lg p-4 border ${
                showAnswer ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`whitespace-pre-wrap leading-relaxed ${
                  showAnswer ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  {question.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Estatísticas de uso */}
          {question.usageStats && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Estatísticas de Uso
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {question.usageStats.timesUsed || 0}
                    </div>
                    <div className="text-sm text-gray-500">Vezes usada</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {question.usageStats.correctRate ? `${question.usageStats.correctRate.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Taxa de acerto</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {question.usageStats.averageTime ? `${question.usageStats.averageTime}s` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Tempo médio</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {question.usageStats.difficulty ? question.usageStats.difficulty.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Dificuldade real</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informações de metadados */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Informações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Criada em:</span>
                <span className="ml-2 text-gray-600">
                  {formatDate(question.createdAt, 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              
              {question.updatedAt && question.updatedAt !== question.createdAt && (
                <div>
                  <span className="font-medium text-gray-700">Última atualização:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(question.updatedAt, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              )}
              
              {question.author && (
                <div>
                  <span className="font-medium text-gray-700">Autor:</span>
                  <span className="ml-2 text-gray-600">{question.author.name}</span>
                </div>
              )}
              
              {question.subject && (
                <div>
                  <span className="font-medium text-gray-700">Disciplina:</span>
                  <div className="flex items-center mt-1">
                    <div 
                      className="w-3 h-3 rounded mr-2"
                      style={{ backgroundColor: question.subject.color }}
                    />
                    <span className="text-gray-600">{question.subject.name}</span>
                    {question.subject.code && (
                      <span className="ml-1 text-gray-400">({question.subject.code})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-3">
              Ações Rápidas
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // TODO: Implementar preview
                  console.log('Preview question')
                }}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              >
                Visualizar como Aluno
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // TODO: Implementar adição à prova
                  console.log('Add to exam')
                }}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Adicionar à Prova
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // TODO: Implementar histórico
                  console.log('View history')
                }}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Ver Histórico
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // TODO: Implementar exportação
                  console.log('Export question')
                }}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Questão"
        message={`Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        loading={deleteLoading}
        confirmVariant="danger"
      />
    </>
  )
}

export default QuestionModal