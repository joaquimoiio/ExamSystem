// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Páginas principais
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Componente de rota protegida simplificado
function ProtectedRoute({ children }) {
  // Temporariamente sempre permite acesso
  // Em produção, verificaria autenticação
  return children;
}

// Componente temporário para dashboard (até instalar dependências)
function TemporaryDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-6">Dashboard temporário - aguardando instalação das dependências</p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Para funcionalidade completa, instale as dependências:
            </p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
              npm install @tanstack/react-query @tanstack/react-query-devtools html5-qrcode
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rotas da aplicação
function AppRoutes() {
  return (
    <Routes>
      {/* Página inicial - Landing Page completa */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Rotas de autenticação */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Dashboard temporário */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <TemporaryDashboard />
        </ProtectedRoute>
      } />
      
      {/* Página 404 */}
      <Route path="/404" element={<NotFound />} />
      
      {/* Redireciona rotas não encontradas para 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
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