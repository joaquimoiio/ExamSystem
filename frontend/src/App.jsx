// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Páginas principais
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Dashboard real (não temporário)
import Dashboard from './pages/dashboard/Dashboard';

// Criar QueryClient para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente de rota protegida
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, mostrar conteúdo
  return children;
}

// Componente para redirecionar usuários logados das páginas públicas
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se já autenticado, redirecionar para dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se não autenticado, mostrar página pública
  return children;
}

// Componente para redirecionamento inteligente da rota raiz
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando aplicação...</p>
        </div>
      </div>
    );
  }

  // Se autenticado, vai para dashboard. Se não, vai para login
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

// Rotas da aplicação
function AppRoutes() {
  return (
    <Routes>
      {/* Rota raiz - redirecionamento inteligente */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Páginas de autenticação - só para usuários não logados */}
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
      
      {/* Landing page pública */}
      <Route path="/home" element={<LandingPage />} />
      
      {/* Dashboard protegido - usando o dashboard real */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Futuras rotas protegidas do sistema */}
      <Route path="/subjects" element={
        <ProtectedRoute>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Disciplinas</h1>
            <p className="text-gray-600 mt-2">Em desenvolvimento</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/questions" element={
        <ProtectedRoute>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Questões</h1>
            <p className="text-gray-600 mt-2">Em desenvolvimento</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/exams" element={
        <ProtectedRoute>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Provas</h1>
            <p className="text-gray-600 mt-2">Em desenvolvimento</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Páginas de erro */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

// Componente principal da aplicação
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;