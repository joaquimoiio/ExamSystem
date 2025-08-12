import React, { useState } from 'react'
import ExamCard from './ExamCard'
import Button from '../Common/Button'
import Loading from '../Common/Loading'
import { EXAM_STATUSES, EXAM_STATUS_LABELS } from '../../utils/constants'

const ExamList = ({
  exams,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onUnpublish,
  onArchive,
  onGeneratePDF,
  loading,
  currentPage,
  filters,
  onFilterChange
}) => {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  if (loading && exams.length === 0) {
    return <Loading message="Carregando provas..." />
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {Object.entries(EXAM_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Disciplina
              </label>
              <select
                value={filters.subjectId || ''}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {/* TODO: Add subjects from props or context */}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Data de Criação
              </label>
              <select
                value={filters.dateRange || ''}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                <option value="today">Hoje</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mês</option>
                <option value="quarter">Este trimestre</option>
              </select>
            </div>

            {/* Clear Filters */}
            {Object.keys(filters).some(key => filters[key]) && (
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
                onClick={() => setViewMode('grid')}
                className={`relative inline-flex items-center px-3 py-1.5 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  viewMode === 'grid'
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
                onClick={() => setViewMode('list')}
                className={`relative inline-flex items-center px-3 py-1.5 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  viewMode === 'list'
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
        {Object.keys(filters).some(key => filters[key]) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-700">Filtros ativos:</span>
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {EXAM_STATUS_LABELS[filters.status]}
                <button
                  type="button"
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.subjectId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Disciplina
                <button
                  type="button"
                  onClick={() => handleFilterChange('subjectId', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateRange && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Data: {filters.dateRange}
                <button
                  type="button"
                  onClick={() => handleFilterChange('dateRange', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Exams Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
          : 'space-y-4'
      }>
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onView={onView}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
            onArchive={onArchive}
            onGeneratePDF={onGeneratePDF}
            compact={viewMode === 'list'}
          />
        ))}
      </div>

      {/* Loading More */}
      {loading && exams.length > 0 && (
        <div className="text-center py-4">
          <Loading size="sm" message="Carregando mais provas..." />
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
                provas
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
      {exams.length === 0 && !loading && (
        <div className="text-center bg-white shadow rounded-lg p-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhuma prova encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {Object.keys(filters).some(key => filters[key])
              ? 'Tente ajustar os filtros ou limpar a busca.'
              : 'Comece criando uma nova prova.'
            }
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {exams.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-gray-900">{pagination.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-600">
                {exams.filter(e => e.status === EXAM_STATUSES.DRAFT).length}
              </div>
              <div className="text-sm text-gray-500">Rascunhos</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-blue-600">
                {exams.filter(e => e.status === EXAM_STATUSES.PUBLISHED).length}
              </div>
              <div className="text-sm text-gray-500">Publicadas</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-green-600">
                {exams.filter(e => e.status === EXAM_STATUSES.ACTIVE).length}
              </div>
              <div className="text-sm text-gray-500">Ativas</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-600">
                {exams.filter(e => e.status === EXAM_STATUSES.CLOSED).length}
              </div>
              <div className="text-sm text-gray-500">Encerradas</div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {exams.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ações em Lote
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // TODO: Implement bulk export
                console.log('Bulk export')
              }}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Exportar Todas
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // TODO: Implement bulk archive
                console.log('Bulk archive')
              }}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
                </svg>
              }
            >
              Arquivar Encerradas
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // TODO: Implement bulk statistics
                console.log('Bulk statistics')
              }}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              Relatório Geral
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamList 