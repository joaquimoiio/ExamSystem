import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../Common/Button'

const SubjectCard = ({ subject, onView, onEdit, onDuplicate }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [duplicateName, setDuplicateName] = useState('')
  const [showDuplicateForm, setShowDuplicateForm] = useState(false)

  const questionCounts = subject.questionCounts || {}
  const totalQuestions = questionCounts.total || 0

  const handleDuplicate = (e) => {
    e.preventDefault()
    if (duplicateName.trim()) {
      onDuplicate(subject, duplicateName.trim())
      setShowDuplicateForm(false)
      setDuplicateName('')
      setShowMenu(false)
    }
  }

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

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg card-hover">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {subject.name}
              </h3>
              <p className="text-sm text-gray-500">
                {totalQuestions} questão{totalQuestions !== 1 ? 'ões' : ''}
              </p>
            </div>
          </div>

          {/* Menu */}
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
                        onView(subject)
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Ver detalhes
                    </button>
                    <button
                      onClick={() => {
                        onEdit(subject)
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setShowDuplicateForm(true)
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Duplicar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {subject.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {subject.description}
          </p>
        )}

        {/* Question Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Distribuição por dificuldade:</span>
          </div>
          <div className="flex space-x-2">
            {Object.entries(questionCounts).map(([difficulty, count]) => {
              if (difficulty === 'total') return null
              return (
                <span
                  key={difficulty}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}
                >
                  {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Médio' : 'Difícil'}: {count}
                </span>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link
            to={`/subjects/${subject.id}/questions`}
            className="flex-1"
          >
            <Button variant="primary" size="sm" className="w-full">
              Ver Questões
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onView(subject)}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
        </div>

        {/* Created date */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Criada em {new Date(subject.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Duplicate Form Modal */}
      {showDuplicateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleDuplicate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Duplicar Disciplina
                      </h3>
                      <div className="mt-4">
                        <label htmlFor="duplicate-name" className="block text-sm font-medium text-gray-700">
                          Nome da nova disciplina
                        </label>
                        <input
                          type="text"
                          id="duplicate-name"
                          value={duplicateName}
                          onChange={(e) => setDuplicateName(e.target.value)}
                          placeholder={`${subject.name} (Cópia)`}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto sm:ml-3"
                  >
                    Duplicar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowDuplicateForm(false)
                      setDuplicateName('')
                    }}
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubjectCard