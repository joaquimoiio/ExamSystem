import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateQuestion } from '../../hooks';
import QuestionForm from '../../components/forms/QuestionForm';

export default function QuestionCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  
  const createQuestionMutation = useCreateQuestion();

  const handleSubmit = async (data) => {
    try {
      await createQuestionMutation.mutateAsync({
        ...data,
        subjectId: subjectId || data.subjectId
      });
      // Voltar para questões, mantendo filtro se criou questão para disciplina específica
      const url = subjectId ? `/questions?subjectId=${subjectId}` : '/questions';
      navigate(url);
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Error creating question:', error);
    }
  };

  const handleCancel = () => {
    if (subjectId) {
      navigate(`/questions?subjectId=${subjectId}`);
    } else {
      navigate('/questions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Questão</h1>
          <p className="text-gray-600 mt-1">
            Crie uma nova questão para o banco de questões
          </p>
        </div>
      </div>

      {/* Question Form */}
      <QuestionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={createQuestionMutation.isPending}
      />
    </div>
  );
}