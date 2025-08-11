import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { apiClient } from '../services/api'
import Button from '../components/Common/Button'
import SubjectList from '../components/Subjects/SubjectList'
import SubjectForm from '../components/Subjects/SubjectForm'
import SubjectModal from '../components/Subjects/SubjectModal'
import Loading from '../components/Common/Loading'

const SubjectsPage = () => {
  const [showForm, setShowForm] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { useApiQuery, useApiMutation } = useApi()

  // Fetch subjects
  const { data: subjectsData, isLoading, refetch } = useApiQuery(
    ['subjects', currentPage, searchTerm],
    () => apiClient.get('/subjects', {
      params: {
        page: currentPage,
        limit: 10,
        search: searchTerm
      }
    })
  )

  // Create subject mutation
  const createSubjectMutation = useApiMutation(
    (subjectData) => apiClient.post('/subjects', subjectData),
    {
      successMessage: 'Disciplina criada com sucesso!',
      invalidateQueries: [['subjects']],
      onSuccess: () => {
        setShowForm(false)
        refetch()
      }
    }
  )

  // Update subject mutation
  const updateSubjectMutation = useApiMutation(
    ({ id, ...data }) => apiClient.put(`/subjects/${id}`, data),
    {
      successMessage: 'Disciplina atualizada com sucesso!',
      invalidateQueries: [['subjects']],
      onSuccess: () => {
        setShowForm(false)
        setSelectedSubject(null)
        refetch()
      }
    }
  )

  // Delete subject mutation
  const deleteSubjectMutation = useApiMutation(
    (id) => apiClient.delete(`/subjects/${id}`),
    {
      successMessage: 'Disciplina excluída com sucesso!',
      invalidateQueries: [['subjects']],
      onSuccess: () => {
        setShowModal(false)
        setSelectedSubject(null)
        refetch()
      }
    }
  )

  // Duplicate subject mutation
  const duplicateSubjectMutation = useApiMutation(
    ({ id, name }) => apiClient.post(`/subjects/${id}/duplicate`, { name }),
    {
      successMessage: 'Disciplina duplicada com sucesso!',
      invalidateQueries: [['subjects']],
      onSuccess: () => refetch()
    }
  )

  const subjects = subjectsData?.data?.subjects || []
  const pagination = subjectsData?.data?.pagination || {}

  const handleCreateSubject = (data) => {
    createSubjectMutation.mutate(data)
  }

  const handleUpdateSubject = (data) => {
    updateSubjectMutation.mutate({ id: selectedSubject.id, ...data })
  }

  const handleDeleteSubject = () => {
    if (selectedSubject) {
      deleteSubjectMutation.mutate(selectedSubject.id)
    }
  }

  const handleDuplicateSubject = (subject, newName) => {
    duplicateSubjectMutation.mutate({ id: subject.id, name: newName })
  }

  const handleViewSubject = (subject) => {
    setSelectedSubject(subject)
    setShowModal(true)
  }

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject)
    setShowForm(true)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  if (isLoading && subjects.length === 0) {
    return <Loading message="Carregando disciplinas..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Disciplinas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas disciplinas e organize suas questões
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Nova Disciplina
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Pesquisar disciplinas..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Subjects List */}
      <SubjectList
        subjects={subjects}
        pagination={pagination}
        onPageChange={handlePageChange}
        onView={handleViewSubject}
        onEdit={handleEditSubject}
        onDuplicate={handleDuplicateSubject}
        loading={isLoading}
        currentPage={currentPage}
      />

      {/* Empty State */}
      {subjects.length === 0 && !isLoading && (
        <div className="text-center bg-white shadow rounded-lg p-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma disciplina encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'Tente uma busca diferente ou limpe os filtros.'
              : 'Comece criando uma nova disciplina.'
            }
          </p>
          <div className="mt-6">
            {searchTerm ? (
              <Button
                variant="secondary"
                onClick={() => handleSearch('')}
              >
                Limpar busca
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Criar primeira disciplina
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <SubjectForm
          subject={selectedSubject}
          onSubmit={selectedSubject ? handleUpdateSubject : handleCreateSubject}
          onCancel={() => {
            setShowForm(false)
            setSelectedSubject(null)
          }}
          loading={createSubjectMutation.isLoading || updateSubjectMutation.isLoading}
        />
      )}

      {/* View Subject Modal */}
      {showModal && selectedSubject && (
        <SubjectModal
          subject={selectedSubject}
          onClose={() => {
            setShowModal(false)
            setSelectedSubject(null)
          }}
          onEdit={() => {
            setShowModal(false)
            setShowForm(true)
          }}
          onDelete={handleDeleteSubject}
          deleteLoading={deleteSubjectMutation.isLoading}
        />
      )}
    </div>
  )
}

export default SubjectsPage