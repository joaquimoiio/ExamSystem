import React, { useState } from 'react'
import QuestionCard from './QuestionCard'
import Button from '../Common/Button'
import Loading from '../Common/Loading'

const QuestionList = ({
  questions,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  loading,
  currentPage,
  filters,
  onFilterChange
}) => {
  const [viewMode, setViewMode] = useState('card') // 'card' or 'compact'

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  if (loading && questions.length === 0) {
    return <Loading message="Carregando questões..." />
  }

  return (
    <div className="space-y-6">
      {/* Filters and View Options */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Difficulty Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dificuldade
              </label>
              <select
                value={filters.difficulty || ''}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.active !== undefined ? filters.active.toString() : ''}
                onChange={(e) => handleFilterChange('active', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tag
              </label>
              <input
                type="text"
                value={filters.tag || ''}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                placeholder="Filtrar por tag..."
                className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Clear Filters */}
            {(filters.difficulty || filters.active !== undefined || filters.tag) && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange({})}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Visualização:</span>
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`relative inline-flex items-center px-3 py-1.5 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  viewMode === 'card'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`relative inline-flex items-center px-3 py-1.5 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  viewMode === 'compact'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.difficulty || filters.active !== undefined || filters.tag) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-700">Filtros ativos:</span>
            {filters.difficulty && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Dificuldade: {filters.difficulty === 'easy' ? 'Fácil' : filters.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                <button
                  type="button"
                  onClick={() => handleFilterChange('difficulty', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.active !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.active ? 'Ativas' : 'Inativas'}
                <button
                  type="button"
                  onClick={() => handleFilterChange('active', undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.tag && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Tag: {filters.tag}
                <button
                  type="button"
                  onClick={() => handleFilterChange('tag', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Questions Grid/List */}
      <div className={
        viewMode === 'card' 
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
          : 'space-y-4'
      }>
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleActive={onToggleActive}
            compact={viewMode === 'compact'}
          />
        ))}
      </div>

      {/* Loading More */}
      {loading && questions.length > 0 && (
        <div className="text-center py-4">
          <Loading size="sm" message="Carregando mais questões..." />
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pagination.pages}
            >
              Próxima
            </Button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {((currentPage - 1) * pagination.limit) + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                questões
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {/* Previous button */}
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                  const showPage = page === 1 || 
                                 page === pagination.pages || 
                                 Math.abs(page - currentPage) <= 1

                  if (!showPage && page !== 2 && page !== pagination.pages - 1) {
                    if (page === 3 && currentPage > 4) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      )
                    }
                    if (page === pagination.pages - 2 && currentPage < pagination.pages - 3) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}

                {/* Next button */}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próxima</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {questions.length === 0 && !loading && (
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
            {Object.keys(filters).length > 0 
              ? 'Tente ajustar os filtros ou limpar a busca.'
              : 'Comece criando uma nova questão para esta disciplina.'
            }
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {questions.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-gray-900">{pagination.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-green-600">
                {questions.filter(q => q.difficulty === 'easy').length}
              </div>
              <div className="text-sm text-gray-500">Fáceis</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-yellow-600">
                {questions.filter(q => q.difficulty === 'medium').length}
              </div>
              <div className="text-sm text-gray-500">Médias</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-600">
                {questions.filter(q => q.difficulty === 'hard').length}
              </div>
              <div className="text-sm text-gray-500">Difíceis</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionList