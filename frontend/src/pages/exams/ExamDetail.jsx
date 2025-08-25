import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Download, Share2, Eye,
  Play, Pause, Archive, Copy, Settings, BarChart3,
  FileText, Clock, Users, QrCode, CheckCircle,
  AlertTriangle, MoreVertical
} from 'lucide-react';
import { useExam, useUpdateExam, useDeleteExam, usePublishExam, useGeneratePDFs } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';

const statusConfig = {
  draft: { 
    label: 'Rascunho', 
    color: 'bg-gray-100 text-gray-800',
    icon: Edit,
    description: 'Prova em desenvolvimento'
  },
  published: { 
    label: 'Publicada', 
    color: 'bg-green-100 text-green-800',
    icon: Play,
    description: 'Prova disponível para alunos'
  },
  archived: { 
    label: 'Arquivada', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Archive,
    description: 'Prova finalizada'
  },
};

export default function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Hooks
  const { data: examData, isLoading, error } = useExam(id);
  const updateExamMutation = useUpdateExam();
  const deleteExamMutation = useDeleteExam();
  const publishExamMutation = usePublishExam();
  const generatePDFsMutation = useGeneratePDFs();

  const exam = examData?.data?.exam;

  const handleDelete = async () => {
    try {
      await deleteExamMutation.mutateAsync(id);
      success('Prova excluída com sucesso!');
      navigate('/exams');
    } catch (error) {
      showError(error.message || 'Erro ao excluir prova');
    }
  };

  const handlePublish = async () => {
    try {
      await publishExamMutation.mutateAsync(id);
      success('Prova publicada com sucesso!');
      setShowPublishModal(false);
    } catch (error) {
      showError(error.message || 'Erro ao publicar prova');
    }
  };

  const handleGeneratePDFs = async () => {
    try {
      await generatePDFsMutation.mutateAsync(id);
      success('PDFs gerados com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao gerar PDFs');
    }
  };

  const handleDuplicate = () => {
    navigate(`/exams/new?duplicate=${id}`);
  };

  const handleArchive = async () => {
    try {
      await updateExamMutation.mutateAsync({
        id,
        data: { status: 'archived' }
      });
      success('Prova arquivada com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao arquivar prova');
    }
  };

  if (isLoading) {
    return <LoadingPage title="Carregando prova..." />;
  }

  if (error || !exam) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar prova</h3>
        <p className="text-gray-600 mb-4">A prova não foi encontrada ou ocorreu um erro.</p>
        <button
          onClick={() => navigate('/exams')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Voltar para Provas
        </button>
      </div>
    );
  }

  const statusInfo = statusConfig[exam.status] || statusConfig.draft;
  const StatusIcon = statusInfo.icon;

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'questions', label: 'Questões', icon: FileText },
    { id: 'variations', label: 'Variações', icon: Copy },
    { id: 'submissions', label: 'Respostas', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const actionMenuItems = [
    {
      label: 'Editar',
      icon: Edit,
      onClick: () => navigate(`/exams/${id}/edit`),
    },
    {
      label: 'Duplicar',
      icon: Copy,
      onClick: handleDuplicate,
    },
    {
      label: 'Gerar PDFs',
      icon: Download,
      onClick: handleGeneratePDFs,
      disabled: generatePDFsMutation.isPending,
    },
    {
      label: 'Arquivar',
      icon: Archive,
      onClick: handleArchive,
      disabled: exam.status === 'archived',
    },
    {
      type: 'divider'
    },
    {
      label: 'Excluir',
      icon: Trash2,
      onClick: () => setShowDeleteModal(true),
      danger: true,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusInfo.label}
              </span>
            </div>
            
            {exam.description && (
              <p className="text-gray-600 mb-3">{exam.description}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {exam.questionsCount || 0} questões
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {exam.duration} minutos
              </div>
              <div className="flex items-center">
                <Copy className="w-4 h-4 mr-1" />
                {(exam.variations?.length || exam.variationsCount || 0)} variações
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {exam.submissionsCount || 0} respostas
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {exam.status === 'draft' && (
            <button
              onClick={() => setShowPublishModal(true)}
              disabled={publishExamMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              {publishExamMutation.isPending ? 'Publicando...' : 'Publicar'}
            </button>
          )}
          
          <Link
            to={`/exams/${id}/preview`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Link>

          <div className="relative">
            <button 
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showActionMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActionMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {actionMenuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        item.onClick();
                        setShowActionMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Questões"
          value={exam.questionsCount || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Variações Geradas"
          value={exam.variations?.length || exam.variationsCount || 0}
          icon={Copy}
          color="purple"
        />
        <StatCard
          title="Respostas Recebidas"
          value={exam.submissionsCount || 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${exam.completionRate || 0}%`}
          icon={CheckCircle}
          color="yellow"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab exam={exam} />}
          {activeTab === 'questions' && <QuestionsTab exam={exam} />}
          {activeTab === 'variations' && <VariationsTab exam={exam} />}
          {activeTab === 'submissions' && <SubmissionsTab exam={exam} />}
          {activeTab === 'settings' && <SettingsTab exam={exam} />}
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Prova"
        message="Tem certeza que deseja excluir esta prova? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmVariant="danger"
        isLoading={deleteExamMutation.isPending}
      />

      <ConfirmationModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublish}
        title="Publicar Prova"
        message="Tem certeza que deseja publicar esta prova? Após a publicação, ela ficará disponível para os alunos."
        confirmText="Publicar"
        confirmVariant="success"
        isLoading={publishExamMutation.isPending}
      />
    </div>
  );
}

// Component for Statistics Cards
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ exam }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Gerais</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Disciplina</dt>
              <dd className="text-sm text-gray-900">{exam.subject?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Criado em</dt>
              <dd className="text-sm text-gray-900">
                {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            {exam.publishedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Publicado em</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(exam.publishedAt).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Última atualização</dt>
              <dd className="text-sm text-gray-900">
                {new Date(exam.updatedAt).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Embaralhar questões</dt>
              <dd className="text-sm text-gray-900">
                {exam.shuffleQuestions ? 'Sim' : 'Não'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Embaralhar alternativas</dt>
              <dd className="text-sm text-gray-900">
                {exam.shuffleAlternatives ? 'Sim' : 'Não'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mostrar resultados</dt>
              <dd className="text-sm text-gray-900">
                {exam.showResults ? 'Sim' : 'Não'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Permitir revisão</dt>
              <dd className="text-sm text-gray-900">
                {exam.allowReview ? 'Sim' : 'Não'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Question Distribution */}
      {exam.difficultyDistribution && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Dificuldade</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-800">
                {exam.difficultyDistribution.easy || 0}
              </div>
              <div className="text-sm text-green-600">Fácil</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-800">
                {exam.difficultyDistribution.medium || 0}
              </div>
              <div className="text-sm text-yellow-600">Médio</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-800">
                {exam.difficultyDistribution.hard || 0}
              </div>
              <div className="text-sm text-red-600">Difícil</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ exam }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Questões da Prova ({exam.questions?.length || 0})
        </h3>
        <Link
          to={`/exams/${exam.id}/questions`}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          Gerenciar questões
        </Link>
      </div>

      {exam.questions && exam.questions.length > 0 ? (
        <div className="space-y-4">
          {exam.questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-900">
                  Questão {index + 1}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {question.difficulty === 'easy' ? 'Fácil' :
                   question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                </span>
              </div>
              <p className="text-gray-700 line-clamp-2">{question.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma questão encontrada</p>
        </div>
      )}
    </div>
  );
}

function VariationsTab({ exam }) {
  const variations = exam.variations || [];
  const variationsCount = variations.length || exam.variationsCount || 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Variações ({variationsCount})
        </h3>
        <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
          Regenerar variações
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variations.length > 0 ? (
          variations.map((variation) => (
            <div key={variation.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Variação {variation.variationNumber}</h4>
                <QrCode className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>ID: {variation.id}</div>
                <div>Número: {variation.variationNumber}</div>
                <div>QR Code disponível</div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="text-xs text-primary-600 hover:text-primary-700">
                  Ver QR
                </button>
                <button className="text-xs text-primary-600 hover:text-primary-700">
                  Download PDF
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <Copy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma variação encontrada</p>
            <p className="text-sm text-gray-400 mt-2">
              As variações serão geradas automaticamente ao criar a prova
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionsTab({ exam }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Respostas Recebidas ({exam.submissionsCount || 0})
        </h3>
        <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
          Exportar resultados
        </button>
      </div>

      {exam.submissions && exam.submissions.length > 0 ? (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aluno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exam.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.studentName || 'Anônimo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Variação {submission.variationNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      submission.score >= 7 ? 'bg-green-100 text-green-800' :
                      submission.score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {submission.score?.toFixed(1) || '0.0'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.timeSpent || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/submissions/${submission.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma resposta recebida ainda</p>
          {exam.status === 'published' && (
            <p className="text-sm text-gray-400 mt-2">
              Compartilhe o QR code da prova para que os alunos possam responder
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ exam }) {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteExamMutation = useDeleteExam();

  const handleDelete = async () => {
    try {
      await deleteExamMutation.mutateAsync(exam.id);
      success('Prova excluída com sucesso!');
      navigate('/exams');
    } catch (error) {
      showError(error.message || 'Erro ao excluir prova');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações da Prova</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            Para editar as configurações, use o botão "Editar" no cabeçalho da página.
          </p>
          
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Duração</dt>
              <dd className="text-sm text-gray-900">{exam.duration} minutos</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Número de variações</dt>
              <dd className="text-sm text-gray-900">{exam.variations?.length || exam.variationsCount || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Embaralhar questões</dt>
              <dd className="text-sm text-gray-900">
                {exam.shuffleQuestions ? 'Ativado' : 'Desativado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Embaralhar alternativas</dt>
              <dd className="text-sm text-gray-900">
                {exam.shuffleAlternatives ? 'Ativado' : 'Desativado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mostrar resultados</dt>
              <dd className="text-sm text-gray-900">
                {exam.showResults ? 'Ativado' : 'Desativado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Permitir revisão</dt>
              <dd className="text-sm text-gray-900">
                {exam.allowReview ? 'Ativado' : 'Desativado'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Avançadas</h3>
        <div className="space-y-3">
          <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Regenerar Variações</h4>
                <p className="text-sm text-gray-500">Criar novas variações com embaralhamento diferente</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 transform rotate-180" />
            </div>
          </button>

          <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Exportar Dados</h4>
                <p className="text-sm text-gray-500">Baixar todas as respostas em formato CSV</p>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Análise Estatística</h4>
                <p className="text-sm text-gray-500">Ver relatório detalhado de desempenho</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      </div>

      {/* Ações Perigosas */}
      <div>
        <h3 className="text-lg font-semibold text-red-700 mb-4">Zona de Perigo</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-800">Excluir Prova</h4>
              <p className="text-sm text-red-600 mt-1">
                Esta ação não pode ser desfeita. A prova e todas as respostas serão permanentemente removidas.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteExamMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteExamMutation.isPending ? 'Excluindo...' : 'Excluir Prova'}
            </button>
          </div>
        </div>
      </div>

      {exam.status === 'published' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">Prova Publicada</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Esta prova está publicada e disponível para os alunos. 
                Algumas configurações não podem mais ser alteradas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Prova"
        message="Tem certeza que deseja excluir esta prova? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmVariant="danger"
        isLoading={deleteExamMutation.isPending}
      />
    </div>
  );
}