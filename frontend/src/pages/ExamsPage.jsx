import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ExamList from '../components/Exams/ExamList'
import ExamGenerator from '../components/Exams/ExamGenerator'
import ConfirmationModal from '../components/Common/ConfirmationModal'
import { examService } from '../services/exam'
import { subjectService } from '../services/subject'
import { showOperationToast } from '../components/Common/Toast'

const ExamsPage = () => {
  const location = useLocation()
  const queryClient = useQueryClient()
  
  const [showExamGenerator, setShowExamGenerator] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    subjectId: ''
  })

  // Check for subjectId parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const subjectId = urlParams.get('subjectId')
    
    if (subjectId) {
      setSelectedSubjectId(subjectId)
      setFilters(prev => ({ ...prev, subjectId }))
      setShowExamGenerator(true)
    }
  }, [location.search])

  // Fetch exams
  const {
    data: examsData,
    isLoading: examsLoading,
    error: examsError
  } = useQuery({
    queryKey: ['exams', { page: currentPage, ...filters }],
    queryFn: () => examService.getExams({
      page: currentPage,
      limit: 10,
      ...filters
    }),
    keepPreviousData: true
  })

  // Fetch subjects for filter
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getSubjects({ limit: 100 }),
    select: (data) => data.data?.subjects || []
  })

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: examService.deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries(['exams'])
      showOperationToast.deleted('Prova')
      setShowDeleteConfirm(false)
      setSelectedExam(null)
    },
    onError: (error) => {
      showOperationToast.error('exclusão da prova')
    }
  })

  const handleExamGenerated = (newExam) => {
    queryClient.invalidateQueries(['exams'])
    setShowExamGenerator(false)
    setSelectedSubjectId(null)
    showOperationToast.created('Prova')
  }

  const handleDeleteExam = (exam) => {
    setSelectedExam(exam)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (selectedExam) {
      deleteExamMutation.mutate(selectedExam.id)
    }
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const exams = examsData?.data?.exams || []
  const pagination = examsData?.data?.pagination || {}

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie suas provas e acompanhe o desempenho dos alunos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowExamGenerator(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Prova
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {exams.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Provas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pagination.total || exams.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Publicadas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.filter(exam => exam.isPublished).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Rascunhos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.filter(exam => !exam.isPublished).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Variações
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.reduce((acc, exam) => acc + (exam.totalVariations || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam List */}
      <ExamList
        exams={exams}
        subjects={subjects}
        loading={examsLoading}
        error={examsError}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onDeleteExam={handleDeleteExam}
        onCreateExam={() => setShowExamGenerator(true)}
      />

      {/* Exam Generator Modal */}
      <ExamGenerator
        isOpen={showExamGenerator}
        onClose={() => {
          setShowExamGenerator(false)
          setSelectedSubjectId(null)
        }}
        onExamGenerated={handleExamGenerated}
        preSelectedSubjectId={selectedSubjectId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Prova"
        message={
          selectedExam
            ? `Tem certeza que deseja excluir a prova "${selectedExam.title}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta prova?'
        }
        confirmText="Excluir"
        loading={deleteExamMutation.isLoading}
        confirmVariant="danger"
      />

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Dicas para criar provas eficazes
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Distribua questões entre diferentes níveis de dificuldade</li>
                <li>Defina um tempo adequado baseado no número de questões</li>
                <li>Use o recurso de embaralhamento para evitar cola</li>
                <li>Configure QR Codes para facilitar o acesso dos alunos</li>
                <li>Ative a correção automática para resultados imediatos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamsPage