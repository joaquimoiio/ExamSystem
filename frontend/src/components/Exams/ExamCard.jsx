import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../Common/Button'
import { formatDate, formatDuration } from '../../utils/helpers'
import { EXAM_STATUS_COLORS } from '../../utils/constants'

const ExamCard = ({ 
  exam, 
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete,
  onPublish,
  onUnpublish,
  onArchive,
  onGeneratePDF,
  showActions = true 
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)

  const getStatusColor = (status) => {
    const colors = EXAM_STATUS_COLORS[status]
    return colors ? `${colors.bg} ${colors.text}` : 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Rascunho',
      published: 'Publicada',
      active: 'Ativa',
      closed: 'Encerrada',
      archived: 'Arquivada'
    }
    return labels[status] || status
  }

  const canEdit = ['draft', 'published'].includes(exam.status)
  const canPublish = exam.status === 'draft'
  const canUnpublish = exam.status === 'published'
  const canArchive = ['closed'].includes(exam.status)
  const isActive = exam.status === 'active'

  const examUrl = exam.publicUrl || `${window.location.origin}/exam/${exam.id}`

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(examUrl)
    // TODO: Show toast notification
  }

  const handleCopyQRCode = () => {
    // TODO: Implement QR code copy functionality
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg card-hover">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {exam.title}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                {getStatusLabel(exam.status)}
              </span>
            </div>
            
            {/* Subject */}
            {exam.subject && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <div 
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: exam.subject.color }}
                />
                <span>{exam.subject.name}</span>
                {exam.subject.code && (
                  <span className="ml-1 text-gray-400">({exam.subject.code})</span>
                )}
              </div>
            )}
          </div>

          {/* Menu */}
          {showActions && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onView(exam)
                          setShowMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Ver detalhes
                      </button>
                      
                      {canEdit && (
                        <button
                          onClick={() => {
                            onEdit(exam)
                            setShowMenu(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Editar
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onDuplicate(exam)
                          setShowMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Duplicar
                      </button>

                      <button
                        onClick={() => {
                          onGeneratePDF(exam)
                          setShowMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Baixar PDF
                      </button>

                      <div className="border-t border-gray-100">
                        {canPublish && (
                          <button
                            onClick={() => {
                              onPublish(exam)
                              setShowMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                          >
                            Publicar
                          </button>
                        )}

                        {canUnpublish && (
                          <button
                            onClick={() => {
                              onUnpublish(exam)
                              setShowMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
                          >
                            Despublicar
                          </button>
                        )}

                        {canArchive && (
                          <button
                            onClick={() => {
                              onArchive(exam)
                              setShowMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                          >
                            Arquivar
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onDelete(exam)
                            setShowMenu(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {exam.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {exam.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Questões</div>
            <div className="text-lg font-semibold text-gray-900">
              {exam.totalQuestions || exam.questions?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Tempo</div>
            <div className="text-lg font-semibold text-gray-900">
              {exam.timeLimit ? formatDuration(exam.timeLimit) : 'Sem limite'}
            </div>
          </div>
        </div>

        {/* Submission Stats */}
        {exam.submissionStats && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {exam.submissionStats.total || 0}
                </div>
                <div className="text-xs text-gray-500">Submissões</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {exam.submissionStats.average ? `${exam.submissionStats.average.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Média</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {exam.submissionStats.pending || 0}
                </div>
                <div className="text-xs text-gray-500">Pendentes</div>
              </div>
            </div>
          </div>
        )}

        {/* Date Information */}
        <div className="text-xs text-gray-500 space-y-1 mb-4">
          <div>Criada em {formatDate(exam.createdAt)}</div>
          {exam.startDate && (
            <div>Início: {formatDate(exam.startDate, 'dd/MM/yyyy HH:mm')}</div>
          )}
          {exam.endDate && (
            <div>Fim: {formatDate(exam.endDate, 'dd/MM/yyyy HH:mm')}</div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex space-x-2">
            {isActive && (
              <Link
                to={`/corrections/exam/${exam.id}`}
                className="flex-1"
              >
                <Button variant="primary" size="sm" className="w-full">
                  Ver Submissões
                </Button>
              </Link>
            )}
            
            {(exam.status === 'published' || isActive) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowQRCode(!showQRCode)}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h5v5H4V4zm11 11h5v5h-5v-5zM4 15h5v5H4v-5z" />
                  </svg>
                }
              >
                QR Code
              </Button>
            )}
          </div>

          {/* QR Code Section */}
          {showQRCode && (exam.status === 'published' || isActive) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-900">
                  QR Code da Prova
                </h4>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* QR Code Display */}
              <div className="text-center mb-3">
                <div className="inline-block p-4 bg-white rounded-lg border">
                  {/* QR Code would be generated here */}
                  <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h5v5H4V4zm11 11h5v5h-5v-5zM4 15h5v5H4v-5z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* URL Display */}
              <div className="bg-white rounded border p-2 mb-3">
                <div className="text-xs text-gray-600 mb-1">Link da prova:</div>
                <div className="text-sm font-mono text-gray-900 break-all">
                  {examUrl}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={handleCopyUrl}
                  className="flex-1"
                  icon={
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  Copiar Link
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={handleCopyQRCode}
                  className="flex-1"
                  icon={
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                >
                  Baixar QR
                </Button>
              </div>
              
              <p className="text-xs text-blue-700 mt-2">
                Compartilhe este QR Code ou link com os alunos para que possam acessar a prova.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(exam)}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            >
              Ver
            </Button>

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(exam)}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
              >
                Editar
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGeneratePDF(exam)}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamCard