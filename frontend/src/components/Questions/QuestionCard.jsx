import React, { useState } from 'react'
import Button from '../Common/Button'

const ALTERNATIVE_LETTERS = ['A', 'B', 'C', 'D', 'E']

const QuestionCard = ({ 
  question, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onToggleActive,
  showActions = true,
  compact = false 
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

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

  const truncateText = (text, length = 150) => {
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
  }

  const correctAlternativeIndex = question.alternatives?.findIndex(alt => alt.isCorrect) ?? -1

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${compact ? 'p-4' : 'p-5'} card-hover`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
            {getDifficultyLabel(question.difficulty)}
          </div>
          <span className="text-xs text-gray-500">
            {question.points} pt{question.points !== 1 ? 's' : ''}
          </span>
          {!question.active && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Inativa
            </span>
          )}
        </div>

        {showActions && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        onEdit(question)
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDuplicate(question)
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Duplicar
                    </button>
                    <button
                      onClick={() => {
                        onToggleActive(question)
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {question.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          onDelete(question)
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

      {/* Question Statement */}
      <div className="mb-4">
        <p className={`text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
          {compact ? truncateText(question.statement, 100) : question.statement}
        </p>
      </div>

      {/* Alternatives */}
      <div className="space-y-2 mb-4">
        {question.alternatives?.map((alternative, index) => (
          <div
            key={index}
            className={`flex items-start p-2 rounded border transition-colors duration-200 ${
              showAnswer && alternative.isCorrect
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
              showAnswer && alternative.isCorrect
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {ALTERNATIVE_LETTERS[index]}
            </span>
            <span className={`text-sm ${compact ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>
              {compact ? truncateText(alternative.text, 60) : alternative.text}
            </span>
            {showAnswer && alternative.isCorrect && (
              <svg className="ml-2 h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Show Answer Button */}
      <div className="flex items-center justify-between mb-4">
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
          {showAnswer ? 'Ocultar' : 'Ver'} Gabarito
        </Button>

        {showAnswer && correctAlternativeIndex >= 0 && (
          <span className="text-sm text-green-600 font-medium">
            Resposta: {ALTERNATIVE_LETTERS[correctAlternativeIndex]}
          </span>
        )}
      </div>

      {/* Explanation (shown when answer is visible) */}
      {showAnswer && question.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <h5 className="text-sm font-medium text-blue-900 mb-1">Explicação:</h5>
          <p className="text-sm text-blue-800">{question.explanation}</p>
        </div>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Criada em {new Date(question.createdAt).toLocaleDateString('pt-BR')}
          </span>
          {question.updatedAt && question.updatedAt !== question.createdAt && (
            <span>
              Atualizada em {new Date(question.updatedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions (when compact) */}
      {compact && showActions && (
        <div className="flex space-x-2 mt-3">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onEdit(question)}
            icon={
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDuplicate(question)}
            icon={
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          >
            Duplicar
          </Button>
        </div>
      )}
    </div>
  )
}

export default QuestionCard