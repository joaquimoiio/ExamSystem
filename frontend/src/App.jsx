import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Páginas principais
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Componente Dashboard temporário seguro
function TemporaryDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ✅ Dashboard Funcionando!
          </h1>
          <p className="text-gray-600 mb-6">
            Você chegou aqui! A navegação está funcionando.
          </p>
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-green-800">
              🎉 Login realizado com sucesso! O sistema está funcionando.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de rota protegida simplificado
function ProtectedRoute({ children }) {
  return children; // Sem verificação de auth por enquanto
}

// Rotas da aplicação
function AppRoutes() {
  return (
    <Routes>
      {/* 🔥 ALTERAÇÃO: Rota padrão "/" agora vai para Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Páginas de autenticação */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Landing page também disponível em /home (opcional) */}
      <Route path="/home" element={<LandingPage />} />
      
      {/* Dashboard protegido */}
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
    <Router>
      <div className="App">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;