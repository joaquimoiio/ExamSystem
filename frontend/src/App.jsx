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