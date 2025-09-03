import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, FileText, BarChart3, Users, Clock,
  TrendingUp, CheckCircle, AlertCircle, Plus,
  ArrowRight, Calendar, Target, Award, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats, useRecentActivity } from '../../hooks';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Buscar dados reais da API
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: activityData, isLoading: activityLoading } = useRecentActivity();

  // Extrair dados ou usar valores padrão
  const stats = statsData?.data || {
    subjects: 0,
    questions: 0,
    exams: 0,
    publishedExams: 0,
  };

  const recentActivity = activityData?.data || [];

  const quickActions = [
    {
      title: 'Nova Disciplina',
      description: 'Criar uma nova disciplina para organizar suas questões',
      icon: BookOpen,
      color: 'primary',
      to: '/subjects/new'
    },
    {
      title: 'Nova Questão',
      description: 'Adicionar questões ao banco de dados',
      icon: FileText,
      color: 'success',
      to: '/questions/new'
    },
    {
      title: 'Nova Prova',
      description: 'Gerar uma nova prova com múltiplas variações',
      icon: BarChart3,
      color: 'warning',
      to: '/exams/new'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Bem-vindo de volta, {user?.name || user?.email || 'Professor'}! Aqui está um resumo das suas atividades.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                to="/exams/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Prova
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Statistics Cards - Removed as requested */}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Atividade Recente</h2>
                    <Link
                      to="/activity"
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Ver todas
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {activityLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <ActivityItem key={index} activity={activity} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade recente</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Suas ações aparecerão aqui quando você começar a usar o sistema
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ações Rápidas</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {quickActions.map((action, index) => (
                      <QuickActionItem key={index} action={action} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Dica do Dia</h3>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                    Use tags para facilitar a busca e categorização das suas questões.
                  </p>
                  <Link
                    to="/help"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                  >
                    Ver mais dicas
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Statistics Cards
function StatCard({ title, value, icon: Icon, color, to, isLoading }) {
  const colorClasses = {
    primary: 'bg-blue-50 border-blue-200 text-blue-600',
    success: 'bg-green-50 border-green-200 text-green-600',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    info: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  if (isLoading) {
    return (
      <div className={`block p-6 rounded-xl border ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="w-16 h-8 bg-white/50 rounded animate-pulse"></div>
          </div>
          <div className="p-3 rounded-lg bg-white/50">
            <Icon className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`block p-6 rounded-xl border hover:shadow-md transition-all duration-200 group ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-white/50 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  );
}

// Component for Activity Items
function ActivityItem({ activity }) {
  const IconComponent = activity.icon;
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-lg flex-shrink-0 ${colorClasses[activity.color]}`}>
        <IconComponent className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          <span className="font-medium">{activity.action}</span>
          {' '}
          <span className="text-gray-600 dark:text-gray-300">{activity.item}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
      </div>
    </div>
  );
}

// Component for Quick Action Items
function QuickActionItem({ action }) {
  const IconComponent = action.icon;
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-purple-100 text-purple-600',
  };

  return (
    <Link
      to={action.to}
      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
    >
      <div className={`p-2 rounded-lg flex-shrink-0 ${colorClasses[action.color]}`}>
        <IconComponent className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {action.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {action.description}
        </p>
      </div>
    </Link>
  );
}