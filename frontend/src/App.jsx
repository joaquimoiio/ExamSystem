// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contexts (comentados os que dependem de React Query)
// import { AuthProvider } from './contexts/AuthContext';
// import { ToastProvider } from './contexts/ToastContext';
// import { AppProvider } from './contexts/AppContext';

// Components básicos
// import ErrorBoundary from './components/common/ErrorBoundary';
// import Layout from './components/common/Layout';

// Páginas básicas para testar
// import LandingPage from './pages/LandingPage';
// import Login from './pages/auth/Login';
// import Register from './pages/auth/Register';
// import Dashboard from './pages/dashboard/Dashboard';
// import NotFound from './pages/NotFound';

// Componente temporário para teste
function WelcomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">ExamSystem</h1>
          <p className="text-gray-600 mb-6">Sistema de Provas Online</p>
          <div className="space-y-4">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Fazer Login
            </button>
            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
              Registrar-se
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Para funcionalidade completa, instale as dependências:
        </p>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
          npm install @tanstack/react-query @tanstack/react-query-devtools html5-qrcode
        </code>
      </div>
    </div>
  );
}

// Componente de rota protegida simplificado
function ProtectedRoute({ children }) {
  // Temporariamente sempre permite acesso
  // Em produção, verificaria autenticação
  return children;
}

// Rotas da aplicação
function AppRoutes() {
  return (
    <Routes>
      {/* Página inicial temporária */}
      <Route path="/" element={<WelcomePage />} />
      
      {/* Rotas comentadas até instalar dependências */}
      {/*
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      */}
      
      {/* Redireciona rotas não encontradas para home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Componente principal da aplicação
function App() {
  return (
    <Router>
      <div className="App">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;