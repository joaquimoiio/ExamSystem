import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Download, Share2, Eye,
  Play, Pause, Archive, Copy, Settings, BarChart3,
  FileText, Clock, Users, QrCode, CheckCircle,
  AlertTriangle, MoreVertical, Calculator, BookOpen
} from 'lucide-react';
import { useExam, useUpdateExam, useDeleteExam, usePublishExam, useGeneratePDFs } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import apiService from '../../services/api';
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

  const handleGenerateAllVariationsPDF = async () => {
    try {
      const response = await apiService.generateAllVariationsPDF(exam.id);
      
      // Criar download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prova_${exam.title}_todas_variacoes.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success('PDF com todas as variações gerado com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao gerar PDF das variações');
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
            
            {exam.subject?.name && (
              <div className="flex items-center mb-2">
                <BookOpen className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-600 font-medium">{exam.subject.name}</span>
              </div>
            )}
            
            {exam.description && (
              <p className="text-gray-600 mb-3">{exam.description}</p>
            )}
            
            {/* Métricas removidas conforme solicitado */}
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

          <Link
            to={`/exams/${id}/correction`}
            className="inline-flex items-center px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Corrigir Prova
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
                  {actionMenuItems.map((item, index) => {
                    if (item.type === 'divider') {
                      return <div key={index} className="border-t border-gray-200 my-1" />;
                    }
                    
                    return (
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
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats - Removed as requested */}

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
  const totalPoints = exam.questions?.reduce((sum, question) => {
    const points = parseFloat(question.ExamQuestion?.points || question.points || 1);
    return sum + (isNaN(points) ? 1 : points);
  }, 0) || 0;


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Questões da Prova
          </h3>
        </div>
        <Link
          to={`/exams/${exam.id}/questions`}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          Gerenciar questões
        </Link>
      </div>

      {exam.questions && exam.questions.length > 0 ? (
        <div className="space-y-4">
          {exam.questions.map((question, index) => {
            const questionPoints = parseFloat(question.ExamQuestion?.points || question.points || 1);
            const alternativesCount = question.alternatives?.length || 0;
            
            return (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      Questão {index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      question.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {question.difficulty === 'easy' ? 'Fácil' :
                       question.difficulty === 'medium' ? 'Médio' : 
                       question.difficulty === 'hard' ? 'Difícil' : 'N/A'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {questionPoints} {questionPoints === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {question.id}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {question.title || 'Sem título'}
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {question.text || 'Texto da questão não disponível'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {question.type === 'multiple_choice' ? 'Múltipla Escolha' :
                       question.type === 'true_false' ? 'Verdadeiro/Falso' :
                       question.type === 'essay' ? 'Dissertativa' : 'N/A'}
                    </span>
                    {alternativesCount > 0 && (
                      <span className="flex items-center">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        {alternativesCount} alternativas
                      </span>
                    )}
                  </div>
                  {question.ExamQuestion?.questionOrder && (
                    <span>Ordem: {question.ExamQuestion.questionOrder}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma questão encontrada</h3>
          <p className="text-gray-500 mb-4">Esta prova ainda não possui questões cadastradas.</p>
          <Link
            to={`/exams/${exam.id}/questions`}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Adicionar Questões
          </Link>
        </div>
      )}
    </div>
  );
}



function VariationsTab({ exam }) {
  const variations = exam.variations || [];
  const { success, error: showError } = useToast();

  const handleGenerateAllVariationsPDF = async () => {
    try {
      const response = await apiService.generateAllVariationsPDF(exam.id);
      
      // Criar download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prova_${exam.title}_todas_variacoes.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success('PDF com todas as variações gerado com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao gerar PDF das variações');
    }
  };

  const handleDownloadVariationPDF = async (variation) => {
    try {
      const response = await apiService.generateSingleVariationPDF(exam.id, variation.id);
      
      // Criar download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prova_${exam.title}_variacao_${variation.variationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success(`PDF da variação ${variation.variationNumber} gerado com sucesso!`);
    } catch (error) {
      showError(error.message || 'Erro ao gerar PDF da variação');
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Variações da Prova
        </h3>
        <div className="flex items-center space-x-3">
          {variations.length > 0 && (
            <button
              onClick={handleGenerateAllVariationsPDF}
              className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF Todas
            </button>
          )}
          <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            Regenerar variações
          </button>
        </div>
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
                <button 
                  onClick={() => handleDownloadVariationPDF(variation)}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
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

  const handleGenerateAllVariationsPDF = async () => {
    try {
      const response = await apiService.generateAllVariationsPDF(exam.id);
      
      // Criar download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prova_${exam.title}_todas_variacoes.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success('PDF com todas as variações gerado com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao gerar PDF das variações');
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

          <button 
            onClick={() => window.open(`/exams/${exam.id}/gabarito`, '_blank')}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Gerar Gabarito</h4>
                <p className="text-sm text-gray-500">Folha de respostas para preenchimento</p>
              </div>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button 
            onClick={handleGenerateAllVariationsPDF}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">PDF Todas as Variações</h4>
                <p className="text-sm text-gray-500">Baixar PDF com todas as variações da prova</p>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
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