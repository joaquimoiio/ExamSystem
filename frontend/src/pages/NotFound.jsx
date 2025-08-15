import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl mb-6">
            <div className="relative">
              <div className="text-9xl font-bold text-primary-200 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileQuestion className="w-16 h-16 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Página não encontrada
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Oops! A página que você está procurando não existe ou pode ter sido movida. 
            Verifique o endereço ou volte para uma área segura.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Home className="w-5 h-5 mr-2" />
              Voltar ao Dashboard
            </Link>

            <button
              onClick={() => navigate(-1)}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Página Anterior
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Links úteis:
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link 
                to="/subjects" 
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                Disciplinas
              </Link>
              <Link 
                to="/questions" 
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                Questões
              </Link>
              <Link 
                to="/exams" 
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                Provas
              </Link>
              <Link 
                to="/settings" 
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                Configurações
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}