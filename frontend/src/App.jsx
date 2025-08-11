import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import HomePage from './pages/HomePage'
import SubjectsPage from './pages/SubjectsPage'
import QuestionsPage from './pages/QuestionsPage'
import ExamsPage from './pages/ExamsPage'
import ReportsPage from './pages/ReportsPage'
import CorrectionPage from './pages/CorrectionPage'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
        {/* Public Correction Routes for Students */}
        <Route path="/correction/:examId/:variationId" element={<CorrectionPage />} />
        <Route path="/scan/:examId/:variationId" element={<CorrectionPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<HomePage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId/questions" element={<QuestionsPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="corrections" element={<CorrectionPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </div>
  )
}

export default App