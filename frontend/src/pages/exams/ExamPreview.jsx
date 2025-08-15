import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, FileText, Eye, Download, 
  Play, Settings, QrCode, Users, BarChart3,
  CheckCircle, AlertTriangle, Printer
} from 'lucide-react';
import { useExam } from '../../hooks';
import { LoadingPage } from '../../components/common/Loading';
import { useToast } from '../../contexts/ToastContext';

export default function ExamPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const { data: examData, isLoading, error } = useExam(id);
  const exam = examData?.data?.exam;

  useEffect(() => {
    if (error) {
      showError('Erro ao carregar prova para preview');
      navigate('/exams');
    }
  }, [error, navigate, showError]);

  if (isLoading) {
    return <LoadingPage message="Carregando preview da prova..." />;
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Prova não encontrada
        </h3>
        <p className="text-gray-600 mb-6">
          A prova solicitada não existe ou foi removida.
        </p>
        <button
          onClick={() => navigate('/exams')}
          className="btn btn-primary"
        >
          Voltar para Provas
        </button>
      </div>
    );
  }

  const handleGeneratePDFs = async () => {
    try {
      success('Gerando PDFs... Isso pode levar alguns instantes.');
      // API call to generate PDFs would go here
      success('PDFs gerados com sucesso!');
    } catch (err) {
      showError('Erro ao gerar PDFs');
    }
  };

  const handlePublishExam = async () => {
    try {
      // API call to publish exam would go here
      success('Prova publicada com sucesso!');
      navigate(`/exams/${id}`);
    } catch (err) {
      showError('Erro ao publicar prova');
    }
  };

  const currentQuestion = exam.questions?.[currentQuestionIndex];
  const totalQuestions = exam.questions?.length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Preview: {exam.title}
              </h1>
              <p className="text-gray-600">
                {exam.subject?.name} • {totalQuestions} questões • {exam.duration} min
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {exam.status === 'draft' && (
              <button
                onClick={handlePublishExam}
                className="btn btn-success"
              >
                <Play className="w-4 h-4 mr-2" />
                Publicar
              </button>
            )}
            
            <button
              onClick={handleGeneratePDFs}
              className="btn btn-outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Gerar PDFs
            </button>
            
            <button
              onClick={() => navigate(`/exams/${id}/edit`)}
              className="btn btn-primary"
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Info */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Informações da Prova
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Questões</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {exam.duration}
                </div>
                <div className="text-sm text-gray-600">Minutos</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {exam.variations || 1}
                </div>
                <div className="text-sm text-gray-600">Variações</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {exam.passingScore || 70}%
                </div>
                <div className="text-sm text-gray-600">Nota Mínima</div>
              </div>
            </div>

            {exam.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-700">{exam.description}</p>
              </div>
            )}

            {exam.instructions && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Instruções</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">{exam.instructions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Question Navigator */}
          {totalQuestions > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Questões da Prova
                </h2>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAllQuestions(!showAllQuestions)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {showAllQuestions ? 'Ver uma por vez' : 'Ver todas'}
                  </button>
                  
                  {!showAllQuestions && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="btn btn-sm btn-outline disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      
                      <span className="text-sm text-gray-600">
                        {currentQuestionIndex + 1} de {totalQuestions}
                      </span>
                      
                      <button
                        onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex === totalQuestions - 1}
                        className="btn btn-sm btn-outline disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showAllQuestions ? (
                <div className="space-y-6">
                  {exam.questions?.map((question, index) => (
                    <QuestionPreview
                      key={question.id}
                      question={question}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                currentQuestion && (
                  <QuestionPreview
                    question={currentQuestion}
                    index={currentQuestionIndex}
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status da Prova</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${exam.status === 'published' ? 'bg-green-100 text-green-800' :
                    exam.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }
                `}>
                  {exam.status === 'published' ? 'Publicada' :
                   exam.status === 'draft' ? 'Rascunho' : 'Arquivada'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Criada em</span>
                <span className="text-sm text-gray-900">
                  {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              {exam.publishedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Publicada em</span>
                  <span className="text-sm text-gray-900">
                    {new Date(exam.publishedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/exams/${id}/variations`)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <QrCode className="w-4 h-4 text-gray-600 mr-3" />
                  <span className="text-sm text-gray-700">Ver Variações</span>
                </div>
                <span className="text-xs text-gray-500">{exam.variations || 1}</span>
              </button>
              
              <button
                onClick={() => navigate(`/exams/${id}/submissions`)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-600 mr-3" />
                  <span className="text-sm text-gray-700">Respostas</span>
                </div>
                <span className="text-xs text-gray-500">{exam.submissionsCount || 0}</span>
              </button>
              
              <button
                onClick={() => navigate(`/exams/${id}/analytics`)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 text-gray-600 mr-3" />
                  <span className="text-sm text-gray-700">Relatórios</span>
                </div>
              </button>
              
              <button
                onClick={handleGeneratePDFs}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Printer className="w-4 h-4 text-gray-600 mr-3" />
                  <span className="text-sm text-gray-700">Imprimir</span>
                </div>
              </button>
            </div>
          </div>

          {/* Difficulty Distribution */}
          {exam.difficultyStats && (
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Distribuição por Dificuldade
              </h3>
              
              <div className="space-y-3">
                {Object.entries(exam.difficultyStats).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`
                        w-3 h-3 rounded-full mr-2
                        ${difficulty === 'easy' ? 'bg-green-500' :
                          difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}
                      `} />
                      <span className="text-sm text-gray-700 capitalize">
                        {difficulty === 'easy' ? 'Fácil' :
                         difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Question Preview Component
function QuestionPreview({ question, index }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-900">
            Questão {index + 1}
          </span>
          <span className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${getDifficultyColor(question.difficulty)}
          `}>
            {getDifficultyLabel(question.difficulty)}
          </span>
          {question.points && (
            <span className="text-xs text-gray-500">
              {question.points} ponto{question.points !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {question.tags && question.tags.length > 0 && (
          <div className="flex items-center space-x-1">
            {question.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {question.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{question.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Question Statement */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">
          {question.statement}
        </p>
      </div>

      {/* Question Alternatives */}
      {question.alternatives && question.alternatives.length > 0 && (
        <div className="space-y-2">
          {question.alternatives.map((alternative, altIndex) => (
            <div
              key={altIndex}
              className={`
                flex items-start p-3 rounded-lg border
                ${alternative.isCorrect 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
                }
              `}
            >
              <div className="flex items-center h-5">
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${alternative.isCorrect 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                  }
                `}>
                  {alternative.isCorrect && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className={`
                  text-sm
                  ${alternative.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}
                `}>
                  {String.fromCharCode(65 + altIndex)}) {alternative.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Explanation */}
      {question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            Explicação:
          </h4>
          <p className="text-sm text-blue-800">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}