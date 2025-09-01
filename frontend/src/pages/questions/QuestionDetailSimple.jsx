import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Copy, Eye, EyeOff, 
  FileText, Clock, User, Tag, BookOpen, 
  CheckCircle, AlertCircle, MoreVertical, 
  Star, BarChart3, Award, Hash
} from 'lucide-react';
import { useQuestion, useDeleteQuestion, useUpdateQuestionPoints, useUpdateQuestion } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';
import QuestionForm from '../../components/forms/QuestionForm';

const difficultyConfig = {
  easy: { label: 'Fácil', color: 'bg-green-100 text-green-800', icon: '📗' },
  medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800', icon: '📙' },
  hard: { label: 'Difícil', color: 'bg-red-100 text-red-800', icon: '📕' },
};

const typeConfig = {
  multiple_choice: { label: 'Múltipla Escolha', icon: CheckCircle, color: 'blue' },
  true_false: { label: 'Verdadeiro/Falso', icon: AlertCircle, color: 'purple' },
  essay: { label: 'Dissertativa', icon: FileText, color: 'gray' },
};

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  
  const { success, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [points, setPoints] = useState(1.0);
  const [showPointsEditor, setShowPointsEditor] = useState(false);
  
  // Hooks
  const { data: questionData, isLoading, error } = useQuestion(id);
  const deleteQuestionMutation = useDeleteQuestion();
  const updatePointsMutation = useUpdateQuestionPoints();
  const updateQuestionMutation = useUpdateQuestion();
  
  const question = questionData?.data?.question;
  
  React.useEffect(() => {
    if (question && question.points) {
      setPoints(question.points);
    }
  }, [question]);

  const handleDelete = async () => {
    try {
      await deleteQuestionMutation.mutateAsync(id);
      success('Questão excluída com sucesso!');
      navigate('/questions');
    } catch (error) {
      showError(error.message || 'Erro ao excluir questão');
    }
  };

  const handleEdit = () => {
    navigate(`/questions/${id}?edit=true`);
  };

  const handleDuplicate = () => {
    navigate(`/questions/new?duplicate=${id}`);
  };

  const handleSavePoints = async () => {
    try {
      await updatePointsMutation.mutateAsync({ id, points });
      setShowPointsEditor(false);
    } catch (error) {
      showError(error.message || 'Erro ao salvar pontuação');
    }
  };

  const handleUpdateQuestion = async (data) => {
    try {
      await updateQuestionMutation.mutateAsync({ id, data });
      success('Questão atualizada com sucesso!');
      navigate(`/questions/${id}`); // Remove edit mode
    } catch (error) {
      showError(error.message || 'Erro ao atualizar questão');
    }
  };

  const handleCancelEdit = () => {
    navigate(`/questions/${id}`); // Remove edit mode
  };

  if (isLoading) {
    return <LoadingPage title="Carregando questão..." />;
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar questão</h3>
        <p className="text-gray-600 mb-4">A questão não foi encontrada ou ocorreu um erro.</p>
        <button
          onClick={() => navigate('/questions')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar para Questões
        </button>
      </div>
    );
  }

  const difficultyInfo = difficultyConfig[question.difficulty] || difficultyConfig.medium;
  const typeInfo = typeConfig[question.type] || typeConfig.multiple_choice;
  const TypeIcon = typeInfo.icon;

  // Render edit mode
  if (isEditMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Questão</h1>
          </div>
        </div>
        
        <QuestionForm
          question={question}
          onSubmit={handleUpdateQuestion}
          onCancel={handleCancelEdit}
          loading={updateQuestionMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Preview da Questão</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${difficultyInfo.color}`}>
                {difficultyInfo.icon} {difficultyInfo.label}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <TypeIcon className="w-4 h-4 mr-1" />
                {typeInfo.label}
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                {question.subject?.name || 'Sem disciplina'}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(question.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Points Editor */}
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Pontuação:</span>
              {showPointsEditor ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={points}
                    onChange={(e) => setPoints(parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">
                    ponto{points !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={handleSavePoints}
                    disabled={updatePointsMutation.isPending}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatePointsMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPointsEditor(false);
                      setPoints(question.points || 1.0);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPointsEditor(true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="font-medium">{points}</span>
                  <span>ponto{points !== 1 ? 's' : ''}</span>
                  <Edit className="w-3 h-3 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
              showCorrectAnswers 
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showCorrectAnswers ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Ocultar Respostas
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Mostrar Respostas
              </>
            )}
          </button>
          
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </button>
          
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Question Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {question.title || 'Questão sem título'}
            </h2>
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-mono">ID: {question.id.slice(-8)}</span>
            </div>
          </div>
        </div>

        {/* Question Text */}
        <div className="px-6 py-6">
          <div className="prose max-w-none mb-6">
            <div className="text-lg text-gray-900 leading-relaxed">
              {question.text || question.title || 'Enunciado da questão não disponível'}
            </div>
          </div>

          {/* Question Image */}
          {question.image && (
            <div className="mb-6">
              <img 
                src={question.image} 
                alt="Imagem da questão" 
                className="max-w-full h-auto rounded-lg shadow-sm border"
              />
            </div>
          )}

          {/* Alternatives */}
          {question.type === 'multiple_choice' && question.alternatives && (
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Alternativas:</h3>
              {question.alternatives.map((alternative, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1 text-gray-900">
                    {alternative}
                  </div>
                  {showCorrectAnswers && index === question.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {question.type === 'true_false' && (
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Alternativas:</h3>
              {['Verdadeiro', 'Falso'].map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    showCorrectAnswers && index === question.correctAnswer
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {index === 0 ? 'V' : 'F'}
                  </div>
                  <div className="flex-1 text-gray-900">{option}</div>
                  {showCorrectAnswers && index === question.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Essay */}
          {question.type === 'essay' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">Questão Dissertativa</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Esta questão requer resposta escrita do aluno e será corrigida manualmente.
              </p>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Explicação
              </h4>
              <p className="text-blue-800 text-sm">{question.explanation}</p>
            </div>
          )}

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question Stats */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {question.timesUsed || 0}
              </div>
              <div className="text-sm text-gray-500">Vezes usada</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {question.averageScore ? `${question.averageScore}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Taxa de acertos</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {points}
              </div>
              <div className="text-sm text-gray-500">Ponto{points !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                QR-{question.id.slice(-6).toUpperCase()}
              </div>
              <div className="text-sm text-gray-500">Código QR</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={handleDuplicate}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicar Questão
          </button>
        </div>
        
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir Questão
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Questão"
        message="Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="error"
        loading={deleteQuestionMutation.isPending}
      />
    </div>
  );
}