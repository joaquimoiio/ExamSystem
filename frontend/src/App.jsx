// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Páginas principais
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';
import Dashboard from './pages/dashboard/Dashboard';

// Componente de rota protegida simplificado
function ProtectedRoute({ children }) {
  // Temporariamente sempre permite acesso
  // Em produção, verificaria autenticação
  return children;
}

// Componente Dashboard temporário (caso o arquivo Dashboard.jsx não exista)
function TemporaryDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard Temporário
          </h1>
          <p className="text-gray-600 mb-6">
            Bem-vindo ao sistema! O dashboard completo está em desenvolvimento.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Disciplinas
              </h3>
              <p className="text-blue-700">Gerencie suas matérias</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Questões
              </h3>
              <p className="text-green-700">Cadastre questões</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Provas
              </h3>
              <p className="text-purple-700">Crie provas em PDF</p>
            </div>
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
      
      {/* Dashboard - usa o Dashboard completo se existir, senão usa o temporário */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
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