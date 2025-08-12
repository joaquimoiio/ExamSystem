import React, { useState } from 'react'
import Modal from '../Common/Modal'
import Button from '../Common/Button'
import { ALTERNATIVE_LETTERS } from '../../utils/constants'
import { formatDate, formatDuration } from '../../utils/helpers'

const ExamPreview = ({
  exam,
  examVariation = null,
  isOpen,
  onClose,
  onEdit,
  onPublish,
  onGeneratePDF,
  showAnswers = false,
  readOnly = false
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(showAnswers)

  if (!exam) return null

  const questions = examVariation?.questions || exam.questions || []
  const currentQuestion = questions[currentQuestionIndex]

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const getExamStats = () => {
    const stats = {
      total: questions.length,
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
      totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0)
    }
    return stats
  }

  const handleNavigation = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index)
  }

  const stats = getExamStats()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${exam.title}`}
      size="full"
      footer={
        <div className="flex justify-between w-full">
          <div className="flex space-x-3">
            {onGeneratePDF && (
              <Button
                variant="secondary"
                onClick={() => onGeneratePDF(exam)}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Baixar PDF
              </Button>
            )}
            
            <Button
              variant="secondary"
              onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            >
              {showCorrectAnswers ? 'Ocultar' : 'Mostrar'} Gabarito
            </Button>
          </div>

          <div className="flex space-x-3">
            {onEdit && !readOnly && (
              <Button
                variant="primary"
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
            
            {onPublish && exam.status === 'draft' && (
              <Button
                variant="success"
                onClick={() => onPublish(exam)}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                Publicar
              </Button>
            )}
            
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com informações e navegação */}
          <div className="lg:col-span-1 space-y-6">
            {/* Informações da Prova */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Informações da Prova
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Título:</span>
                  <p className="text-gray-600 mt-1">{exam.title}</p>
                </div>
                
                {exam.description && (
                  <div>
                    <span className="font-medium text-gray-700">Descrição:</span>
                    <p className="text-gray-600 mt-1">{exam.description}</p>
                  </div>
                )}
                
                {exam.subject && (
                  <div>
                    <span className="font-medium text-gray-700">Disciplina:</span>
                    <div className="flex items-center mt-1">
                      <div 
                        className="w-3 h-3 rounded mr-2"
                        style={{ backgroundColor: exam.subject.color }}
                      />
                      <span className="text-gray-600">{exam.subject.name}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    exam.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    exam.status === 'published' ? 'bg-blue-100 text-blue-800' :
                    exam.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {exam.status === 'draft' ? 'Rascunho' :
                     exam.status === 'published' ? 'Publicada' :
                     exam.status === 'active' ? 'Ativa' : 'Encerrada'}
                  </span>
                </div>
                
                {exam.timeLimit && (
                  <div>
                    <span className="font-medium text-gray-700">Tempo limite:</span>
                    <span className="ml-2 text-gray-600">{formatDuration(exam.timeLimit)}</span>
                  </div>
                )}
                
                {exam.startDate && (
                  <div>
                    <span className="font-medium text-gray-700">Início:</span>
                    <span className="ml-2 text-gray-600">{formatDate(exam.startDate, 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
                
                {exam.endDate && (
                  <div>
                    <span className="font-medium text-gray-700">Fim:</span>
                    <span className="ml-2 text-gray-600">{formatDate(exam.endDate, 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Estatísticas
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de questões:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.total}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pontuação total:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalPoints} pts</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">Fáceis:</span>
                    <span className="text-sm font-medium text-green-600">{stats.easy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-yellow-600">Médias:</span>
                    <span className="text-sm font-medium text-yellow-600">{stats.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">Difíceis:</span>
                    <span className="text-sm font-medium text-red-600">{stats.hard}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navegação por questões */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Navegação
              </h3>
              
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors duration-200 ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conteúdo principal - Questão atual */}
          <div className="lg:col-span-3">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhuma questão encontrada
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Esta prova não possui questões cadastradas.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Cabeçalho da questão */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-800 text-lg font-medium">
                      {currentQuestionIndex + 1}
                    </span>
                    <div>
                      <p className="text-sm text-gray-500">
                        Questão {currentQuestionIndex + 1} de {questions.length}
                      </p>
                      {currentQuestion?.points && (
                        <p className="text-sm text-gray-500">
                          {currentQuestion.points} ponto{currentQuestion.points !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {currentQuestion?.difficulty && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {getDifficultyLabel(currentQuestion.difficulty)}
                    </span>
                  )}
                </div>

                {/* Enunciado */}
                <div className="mb-6">
                  <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {currentQuestion?.statement}
                  </p>
                </div>

                {/* Alternativas */}
                <div className="space-y-3 mb-6">
                  {currentQuestion?.alternatives?.map((alternative, altIndex) => {
                    const isCorrect = alternative.isCorrect
                    
                    return (
                      <div
                        key={altIndex}
                        className={`flex items-start p-4 rounded-lg border transition-colors duration-200 ${
                          showCorrectAnswers && isCorrect
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                          showCorrectAnswers && isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ALTERNATIVE_LETTERS[altIndex]}
                        </span>
                        <span className="text-gray-700 flex-1">
                          {alternative.text}
                        </span>
                        {showCorrectAnswers && isCorrect && (
                          <svg className="ml-2 h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Resposta correta (quando gabarito está visível) */}
                {showCorrectAnswers && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-green-900 mb-2">
                      Resposta Correta:
                    </h4>
                    {(() => {
                      const correctIndex = currentQuestion?.alternatives?.findIndex(alt => alt.isCorrect) ?? -1
                      return correctIndex >= 0 ? (
                        <p className="text-sm text-green-800">
                          <strong>{ALTERNATIVE_LETTERS[correctIndex]}</strong> - {currentQuestion.alternatives[correctIndex].text}
                        </p>
                      ) : (
                        <p className="text-sm text-red-800">Nenhuma alternativa correta definida</p>
                      )
                    })()}
                  </div>
                )}

                {/* Explicação */}
                {showCorrectAnswers && currentQuestion?.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Explicação:
                    </h4>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {currentQuestion?.tags && currentQuestion.tags.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navegação */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={() => handleNavigation('prev')}
                    disabled={currentQuestionIndex === 0}
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    }
                  >
                    Anterior
                  </Button>

                  <div className="text-sm text-gray-500">
                    {currentQuestionIndex + 1} / {questions.length}
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => handleNavigation('next')}
                    disabled={currentQuestionIndex === questions.length - 1}
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    }
                    iconPosition="right"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ExamPreview