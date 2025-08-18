// frontend/src/App.jsx - VERSÃO CORRIGIDA
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas principais
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Componente Dashboard temporário seguro
function TemporaryDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              ✅ Dashboard Funcionando!
            </h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Olá {user?.name || user?.email}! Você está logado e chegou ao dashboard.
          </p>
          
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-green-800">
              🎉 Login realizado com sucesso! O sistema está funcionando.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Disciplinas</h3>
              <p className="text-blue-700">Gerencie suas disciplinas</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Questões</h3>
              <p className="text-green-700">Cadastre questões</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Provas</h3>
              <p className="text-purple-700">Gere provas em PDF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de rota protegida CORRIGIDO
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

// Componente para redirecionar usuários logados
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

// Rotas da aplicação
function AppRoutes() {
  return (
    <Routes>
      {/* Rota padrão redireciona para login ou dashboard dependendo do status de auth */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
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
      
      {/* Dashboard protegido - só para usuários logados */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <TemporaryDashboard />
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
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;