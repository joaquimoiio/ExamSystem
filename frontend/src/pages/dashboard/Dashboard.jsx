import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, FileText, BarChart3, Users, TrendingUp, 
  Clock, CheckCircle, AlertCircle, Plus, Eye, Edit,
  Calendar, Award, Target, Activity
} from 'lucide-react';
import { useSubjects, useQuestions, useExams } from '../../hooks';
import { LoadingCard, SkeletonCard } from '../../components/common/Loading';

function StatsCard({ title, value, subtitle, icon: Icon, color = 'primary', trend, loading = false }) {
  const colorClasses = {
    primary: 'bg-primary-500 text-primary-50',
    success: 'bg-green-500 text-green-50',
    warning: 'bg-yellow-500 text-yellow-50',
    error: 'bg-red-500 text-red-50',
    info: 'bg-blue-500 text-blue-50',
  };

  if (loading) {
    return <SkeletonCard lines={2} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 hover:shadow-medium transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, onClick, color = 'primary' }) {
  const colorClasses = {
    primary: 'border-primary-200 hover:border-primary-300 hover:bg-primary-50',
    success: 'border-green-200 hover:border-green-300 hover:bg-green-50',
    warning: 'border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50',
    info: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
  };

  const iconColors = {
    primary: 'text-primary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-6 border-2 border-dashed rounded-xl text-left
        transition-all duration-200 hover:shadow-soft
        ${colorClasses[color]}
      `}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-lg bg-white ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}

function RecentActivityItem({ action, item, time, icon: Icon, color }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {action} <span className="font-normal">"{item}"</span>
        </p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects();
  const { data: questionsData, isLoading: questionsLoading } = useQuestions();
  const { data: examsData, isLoading: examsLoading } = useExams();

  const subjects = subjectsData?.data?.subjects || [];
  const questions = questionsData?.data?.questions || [];
  const exams = examsData?.data?.exams || [];

  // Calculate stats
  const totalSubjects = subjects.length;
  const totalQuestions = questions.length;
  const totalExams = exams.length;
  const activeExams = exams.filter(exam => exam.status === 'published').length;

  // Mock recent activity (in a real app, this would come from an API)
  const recentActivity = [
    { action: 'Criou prova', item: 'Matemática - Prova Final', time: '2 horas atrás', icon: BarChart3, color: 'primary' },
    { action: 'Adicionou questão', item: 'Trigonometria básica', time: '4 horas atrás', icon: FileText, color: 'success' },
    { action: 'Publicou prova', item: 'Física - 1º Bimestre', time: '1 dia atrás', icon: CheckCircle, color: 'info' },
    { action: 'Criou disciplina', item: 'Química Orgânica', time: '2 dias atrás', icon: BookOpen, color: 'warning' },
  ];

  const quickActions = [
    {
      title: 'Nova Disciplina',
      description: 'Criar uma nova disciplina para organizar suas questões',
      icon: BookOpen,
      color: 'primary',
      onClick: () => window.location.href = '/subjects/new'
    },
    {
      title: 'Nova Questão',
      description: 'Adicionar questões ao banco de dados',
      icon: FileText,
      color: 'success',
      onClick: () => window.location.href = '/questions/new'
    },
    {
      title: 'Nova Prova',
      description: 'Gerar uma nova prova com múltiplas variações',
      icon: BarChart3,
      color: 'warning',
      onClick: () => window.location.href = '/exams/new'
    },
    {
      title: 'Ver Relatórios',
      description: 'Analisar estatísticas e desempenho',
      icon: TrendingUp,
      color: 'info',
      onClick: () => window.location.href = '/reports'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Bem-vindo ao sistema de provas. Aqui você pode gerenciar suas disciplinas, questões e provas.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Disciplinas"
          value={totalSubjects}
          subtitle="Total cadastradas"
          icon={BookOpen}
          color="primary"
          loading={subjectsLoading}
        />
        <StatsCard
          title="Questões"
          value={totalQuestions}
          subtitle="No banco de dados"
          icon={FileText}
          color="success"
          loading={questionsLoading}
        />
        <StatsCard
          title="Provas"
          value={totalExams}
          subtitle="Total criadas"
          icon={BarChart3}
          color="warning"
          loading={examsLoading}
        />
        <StatsCard
          title="Provas Ativas"
          value={activeExams}
          subtitle="Publicadas"
          icon={Activity}
          color="info"
          loading={examsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <QuickActionCard key={index} {...action} />
              ))}
            </div>
          </div>

          {/* Recent Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Itens Recentes</h2>
              <Link 
                to="/recent" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todos
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              {/* Recent Subjects */}
              {subjects.slice(0, 3).map((subject) => (
                <Link
                  key={subject.id}
                  to={`/subjects/${subject.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-primary-600">
                        {subject.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {subject.questionsCount || 0} questões
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </Link>
              ))}

              {subjects.length === 0 && !subjectsLoading && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma disciplina cadastrada</p>
                  <Link 
                    to="/subjects/new"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Criar primeira disciplina
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividade Recente</h2>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <RecentActivityItem key={index} {...activity} />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estatísticas</h2>
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Questões por dificuldade:</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Fácil</span>
                  <span className="font-medium">
                    {questions.filter(q => q.difficulty === 'easy').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-600">Médio</span>
                  <span className="font-medium">
                    {questions.filter(q => q.difficulty === 'medium').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Difícil</span>
                  <span className="font-medium">
                    {questions.filter(q => q.difficulty === 'hard').length}
                  </span>
                </div>
              </div>

              <hr />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Provas por status:</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rascunho</span>
                  <span className="font-medium">
                    {exams.filter(e => e.status === 'draft').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Publicadas</span>
                  <span className="font-medium">
                    {exams.filter(e => e.status === 'published').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Arquivadas</span>
                  <span className="font-medium">
                    {exams.filter(e => e.status === 'archived').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-500 p-2 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Dica do Sistema</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Para criar provas mais eficazes, certifique-se de ter questões 
                  balanceadas por dificuldade. O ideal é 40% fáceis, 40% médias e 20% difíceis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}