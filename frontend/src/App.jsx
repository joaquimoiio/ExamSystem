import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout
import Layout from './components/common/Layout';

// Componentes de proteção e navegação
import { ProtectedRoute, PublicRoute, RootRedirect } from './components/common/Loading';

// Páginas
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import NotFound from './pages/NotFound';

// Disciplinas
import SubjectList from './pages/subjects/SubjectList';
import SubjectDetail from './pages/subjects/SubjectDetail';
import SubjectCreate from './pages/subjects/SubjectCreate';

// Questões
import QuestionList from './pages/questions/QuestionList';
import QuestionDetail from './pages/questions/QuestionDetailSimple';
import QuestionCreate from './pages/questions/QuestionCreateSimple';

// Provas
import ExamList from './pages/exams/ExamList';
import ExamDetail from './pages/exams/ExamDetail';
import ExamCreate from './pages/exams/ExamCreate';
import ExamQuestions from './pages/exams/ExamQuestions';
import ExamCorrection from './pages/exams/ExamCorrection';

// Cabeçalhos de Prova
import ExamHeaderList from './pages/exams/ExamHeaderList';
import ExamHeaderForm from './pages/exams/ExamHeaderForm';

// Gabarito e QR Scanner
import AnswerSheet from './pages/exams/AnswerSheet';
import QRScanner from './pages/exams/QRScanner';

// Outras páginas
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      {/* Rota raiz */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Rotas públicas */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/home" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Rotas protegidas com Layout */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Disciplinas */}
      <Route 
        path="/subjects" 
        element={
          <ProtectedRoute>
            <Layout>
              <SubjectList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subjects/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <SubjectCreate />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subjects/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <SubjectDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Questões integradas às disciplinas */}
      <Route 
        path="/questions" 
        element={
          <ProtectedRoute>
            <Layout>
              <QuestionList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/questions/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <QuestionCreate />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/questions/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <QuestionDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Provas */}
      <Route 
        path="/exams" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exams/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamCreate />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exams/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exams/:id/edit" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamCreate mode="edit" />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exams/:id/questions" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamQuestions />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exams/:id/correction" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamCorrection />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exams/:id/gabarito" 
        element={
          <ProtectedRoute>
            <AnswerSheet />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/qr-scanner" 
        element={
          <ProtectedRoute>
            <Layout>
              <QRScanner />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Cabeçalhos de Prova */}
      <Route 
        path="/exam-headers" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamHeaderList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-headers/create" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamHeaderForm />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-headers/:id/edit" 
        element={
          <ProtectedRoute>
            <Layout>
              <ExamHeaderForm />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Outras páginas protegidas */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Rota 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppProvider>
              <Router>
                <div className="App">
                  <AppRoutes />
                </div>
              </Router>
            </AppProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}