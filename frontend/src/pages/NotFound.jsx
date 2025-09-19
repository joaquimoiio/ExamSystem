import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full inline-block mb-4">
            <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-400" />
          </div>
          
          {/* Error Code */}
          <div className="text-8xl font-bold text-gray-900 dark:text-white mb-2">404</div>
          <div className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Página não encontrada
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            A página que você está procurando não existe ou pode ter sido movida. 
            Verifique o endereço ou volte para uma área segura.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Home className="w-5 h-5 mr-2" />
              Voltar ao Dashboard
            </Link>

            <button
              onClick={() => navigate(-1)}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Página Anterior
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}