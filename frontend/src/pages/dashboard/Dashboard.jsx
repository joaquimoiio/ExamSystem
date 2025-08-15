import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, FileText, BarChart3, Users, Clock, 
  TrendingUp, CheckCircle, AlertCircle, Plus,
  ArrowRight, Calendar, Target, Award
} from 'lucide-react';
import { useSubjects, useQuestions, useExams } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingCard, SkeletonCard } from '../../components/common/Loading';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch data for dashboard statistics
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({ limit: 1000 });
  const { data: questionsData, isLoading: questionsLoading } = useQuestions({ limit: 1000 });
  const { data: examsData, isLoading: examsLoading } = useExams({ limit: 1000 });

  const subjects = subjectsData?.data?.subjects || [];
  const questions = questionsData?.data?.questions || [];
  const exams = examsData?.data?.exams || [];

  // Calculate statistics
  const stats = {
    subjects: subjects.length,
    questions: questions.length,
    exams: exams.length,
    publishedExams: exams.filter(exam => exam.status === 'published').length,
  };

  const recentActivity = [
    { action: 'Criou questão', item: 'Trigonometria básica', time: '4 horas atrás', icon: FileText, color: 'success' },
    { action: 'Publicou prova', item: 'Física - 1º Bimestre', time: '1 dia atrás', icon: CheckCircle, color: 'info' },
    { action: 'Criou disciplina', item: 'Química Orgânica', time: '2 dias atrás', icon: BookOpen, color: 'warning' },
    { action: 'Atualizou questão', item: 'Equações de 2º grau', time: '3 dias atrás', icon: FileText, color: 'primary' },
  ];

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
    {
      title: 'Ver Relatórios',
      description: 'Analisar estatísticas e desempenho',
      icon: TrendingUp,
      color: 'info',
      to: '/reports'
    },
  ];

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const iconColorClasses = {
    primary: 'text-primary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  if (subjectsLoading || questionsLoading || examsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard lines={6} />
          </div>
          <SkeletonCard lines={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Bem-vindo de volta, {user?.name || 'Professor'}! Aqui está um resumo das suas atividades.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/exams/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Prova
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Disciplinas"
          value={stats.subjects}
          icon={BookOpen}
          color="primary"
          to="/subjects"
        />
        <StatCard
          title="Questões"
          value={stats.questions}
          icon={FileText}
          color="success"
          to="/questions"
        />
        <StatCard
          title="Provas Criadas"
          value={stats.exams}
          icon={BarChart3}
          color="warning"
          to="/exams"
        />
        <StatCard
          title="Provas Publicadas"
          value={stats.publishedExams}
          icon={CheckCircle}
          color="info"
          to="/exams?status=published"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-soft border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
                <Link
                  to="/activity"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todas
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <QuickActionItem key={index} action={action} />
                ))}
              </div>
            </div>
          </div>

          {/* Recent Subjects */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Disciplinas Recentes</h2>
                <Link
                  to="/subjects"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todas
                </Link>
              </div>
            </div>
            <div className="p-6">
              {subjects.length > 0 ? (
                <div className="space-y-3">
                  {subjects.slice(0, 3).map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.color || '#6366f1' }}
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/subjects/${subject.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                        >
                          {subject.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {subject.questionsCount || 0} questões
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma disciplina criada</p>
                  <Link
                    to="/subjects/new"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Criar primeira disciplina
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dica do Dia
            </h3>
            <p className="text-gray-700 mb-4">
              Organize suas questões por dificuldade e assunto para criar provas mais equilibradas. 
              Use tags para facilitar a busca e categorização.
            </p>
            <Link
              to="/help"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Ver mais dicas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Statistics Cards
function StatCard({ title, value, icon: Icon, color, to }) {
  const colorClass = {
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }[color];

  const iconColorClass = {
    primary: 'text-primary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }[color];

  return (
    <Link
      to={to}
      className={`block p-6 rounded-xl border ${colorClass} hover:shadow-medium transition-all duration-200 group`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-white/50 ${iconColorClass} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  );
}

// Component for Activity Items
function ActivityItem({ activity }) {
  const IconComponent = activity.icon;
  const colorClass = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-blue-100 text-blue-600',
  }[activity.color];

  return (
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
        <IconComponent className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.action}</span>
          {' '}
          <span className="text-gray-600">"{activity.item}"</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
      </div>
    </div>
  );
}

// Component for Quick Action Items
function QuickActionItem({ action }) {
  const IconComponent = action.icon;
  const iconColorClass = {
    primary: 'text-primary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }[action.color];

  return (
    <Link
      to={action.to}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className={`${iconColorClass} group-hover:scale-110 transition-transform`}>
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{action.title}</p>
        <p className="text-xs text-gray-500">{action.description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </Link>
  );
}