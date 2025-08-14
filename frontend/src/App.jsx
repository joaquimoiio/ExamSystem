import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppProvider } from './contexts/AppContext';

// Components
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/common/Layout';
import { LoadingPage } from './components/common/Loading';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import SubjectList from './pages/subjects/SubjectList';
import SubjectDetail from './pages/subjects/SubjectDetail';
import QuestionList from './pages/questions/QuestionList';
import QuestionDetail from './pages/questions/QuestionDetail';
import ExamList from './pages/exams/ExamList';
import ExamCreate from './pages/exams/ExamCreate';
import ExamDetail from './pages/exams/ExamDetail';
import ExamPreview from './pages/exams/ExamPreview';
import QRScanner from './pages/student/QRScanner';
import ExamTaking from './pages/student/ExamTaking';
import Results from './pages/student/Results';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';

// Hooks
import { useAuth } from './contexts/AuthContext';

// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          return false;
        }
        // Don't retry on network errors
        if (error?.message?.includes('Sem conexão')) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingPage title="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirects if already authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingPage title="Carregando..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Student Route Component (for QR scanner and exam taking)
function StudentRoute({ children }) {
  return children; // These routes are accessible without authentication
}

// App Routes Component
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Student Routes (Public) */}
      <Route path="/scan" element={
        <StudentRoute>
          <QRScanner />
        </StudentRoute>
      } />
      
      <Route path="/exam/:examId/:variationId" element={
        <StudentRoute>
          <ExamTaking />
        </StudentRoute>
      } />
      
      <Route path="/results/:submissionId" element={
        <StudentRoute>
          <Results />
        </StudentRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Subject Routes */}
      <Route path="/subjects" element={
        <ProtectedRoute>
          <Layout showFab={true} fabAction={() => window.location.href = '/subjects/new'}>
            <SubjectList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/subjects/new" element={
        <ProtectedRoute>
          <Layout>
            <SubjectDetail />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/subjects/:id" element={
        <ProtectedRoute>
          <Layout>
            <SubjectDetail />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Question Routes */}
      <Route path="/questions" element={
        <ProtectedRoute>
          <Layout showFab={true} fabAction={() => window.location.href = '/questions/new'}>
            <QuestionList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/questions/new" element={
        <ProtectedRoute>
          <Layout>
            <QuestionDetail />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/questions/:id" element={
        <ProtectedRoute>
          <Layout>
            <QuestionDetail />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Exam Routes */}
      <Route path="/exams" element={
        <ProtectedRoute>
          <Layout showFab={true} fabAction={() => window.location.href = '/exams/new'}>
            <ExamList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/exams/new" element={
        <ProtectedRoute>
          <Layout>
            <ExamCreate />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/exams/:id" element={
        <ProtectedRoute>
          <Layout>
            <ExamDetail />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/exams/:id/preview" element={
        <ProtectedRoute>
          <Layout>
            <ExamPreview />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Profile & Settings */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
        
        {/* React Query DevTools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;