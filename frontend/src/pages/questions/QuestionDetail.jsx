import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Eye, Copy, Save } from 'lucide-react';
import { useQuestion, useUpdateQuestion, useDeleteQuestion, useCreateQuestion } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import QuestionForm from '../../components/forms/QuestionForm';
import { ConfirmationModal } from '../../components/ui/Modal';

const difficultyConfig = {
  easy: { label: 'Fácil', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'Difícil', color: 'bg-red-100 text-red-800' },
};

const typeConfig = {
  multiple_choice: { label: 'Múltipla Escolha' },
  true_false: { label: 'Verdadeiro/Falso' },
  essay: { label: 'Dissertativa' },
};

function QuestionPreview({ question }) {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyConfig[question.difficulty]?.color}`}>
            {difficultyConfig[question.difficulty]?.label}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {typeConfig[question.type]?.label}
          </span>
          <span className="text-sm text-gray-600">
            {question.points} ponto{question.points !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Subject */}
        {question.subject && (
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: question.subject.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {question.subject.name}
            </span>
          </div>
        )}

        {/* Statement */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">
            {question.statement}
          </h3>
        </div>

        {/* Alternatives */}
        {question.alternatives && question.alternatives.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Alternativas:</h4>
            {question.alternatives.map((alternative, index) => (
              <div
                key={index}
                className={`
                  flex items-start space-x-3 p-4 border rounded-lg
                  ${alternative.isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                  }
                `}
              >
                <span className="font-medium text-gray-700 mt-0.5">
                  {String.fromCharCode(65 + index)})
                </span>
                <span className="text-gray-900 leading-relaxed flex-1">
                  {alternative.text}
                </span>
                {alternative.isCorrect && (
                  <span className="text-green-600 text-sm font-medium">
                    Correta
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Explicação:</h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              {question.explanation}
            </p>
          </div>
        )}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Criada em:</span><br />
              {new Date(question.createdAt).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div>
              <span className="font-medium">Última atualização:</span><br />
              {new Date(question.updatedAt).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [isEditing, setIsEditing] = useState(!id); // New question if no ID
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Hooks
  const { data: questionData, isLoading, error } = useQuestion(id);
  const updateQuestionMutation = useUpdateQuestion();
  const createQuestionMutation = useCreateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const question = questionData?.data?.question;
  const isNewQuestion = !id;

  const handleSubmit = async (data) => {
    try {
      if (isNewQuestion) {
        const response = await createQuestionMutation.mutateAsync(data);
        success('Questão criada com sucesso!');
        navigate(`/questions/${response.data.question.id}`);
      } else {
        await updateQuestionMutation.mutateAsync({ id, data });
        setIsEditing(false);
        success('Questão atualizada com sucesso!');
      }
    } catch (error) {
      showError(error.message || 'Erro ao salvar questão');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuestionMutation.mutateAsync(id);
      success('Questão excluída com sucesso!');
      navigate('/questions');
    } catch (error) {
      showError(error.message || 'Erro ao excluir questão');
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicateData = {
        ...question,
        statement: `${question.statement} (Cópia)`,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      
      const response = await createQuestionMutation.mutateAsync(duplicateData);
      success('Questão duplicada com sucesso!');
      navigate(`/questions/${response.data.question.id}`);
    } catch (error) {
      showError(error.message || 'Erro ao duplicar questão');
    }
  };

  const handleCancel = () => {
    if (isNewQuestion) {
      navigate('/questions');
    } else {
      setIsEditing(false);
    }
  };

  // Loading state
  if (isLoading && !isNewQuestion) {
    return <LoadingPage title="Carregando questão..." />;
  }

  // Error state
  if (error && !isNewQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar questão
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'Questão não encontrada'}
          </p>
          <button
            onClick={() => navigate('/questions')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Voltar às questões
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/questions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNewQuestion ? 'Nova Questão' : 'Questão'}
            </h1>
            <p className="text-gray-600">
              {isNewQuestion 
                ? 'Crie uma nova questão para seu banco de dados'
                : 'Visualize e edite os detalhes da questão'
              }
            </p>
          </div>
        </div>

        {!isNewQuestion && !isEditing && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDuplicate}
              disabled={createQuestionMutation.isPending}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </button>
            
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </button>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing || isNewQuestion ? (
        <QuestionForm
          question={question}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createQuestionMutation.isPending || updateQuestionMutation.isPending}
        />
      ) : (
        <div className="space-y-6">
          <QuestionPreview question={question} />
          
          {/* Usage Statistics */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estatísticas de Uso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {question.usageCount || 0}
                </div>
                <div className="text-sm text-gray-500">Vezes usada</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {question.correctRate ? `${Math.round(question.correctRate * 100)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Taxa de acerto</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {question.avgTime ? `${Math.round(question.avgTime)}s` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Tempo médio</div>
              </div>
            </div>
          </div>

          {/* Recent Usage */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Uso Recente
            </h3>
            
            {question.recentUsage && question.recentUsage.length > 0 ? (
              <div className="space-y-3">
                {question.recentUsage.map((usage, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{usage.examTitle}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(usage.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-sm text-gray-600">
                      {usage.responseCount} resposta{usage.responseCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Esta questão ainda não foi utilizada em nenhuma prova</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Questão"
        message="Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="error"
        loading={deleteQuestionMutation.isPending}
      />
    </div>
  );
}