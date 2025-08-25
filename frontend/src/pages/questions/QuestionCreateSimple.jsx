import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateQuestion } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import QuestionForm from '../../components/forms/QuestionForm';

export default function QuestionCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const { success, error } = useToast();
  
  const createQuestionMutation = useCreateQuestion();

  const handleSubmit = async (data) => {
    try {
      // Se há subjectId nos params, usar ele
      const formData = {
        ...data,
        subjectId: subjectId || data.subjectId
      };

      await createQuestionMutation.mutateAsync(formData);
      success('Questão criada com sucesso!');
      
      // Voltar para onde veio ou para questões da disciplina
      if (subjectId) {
        navigate(`/questions?subjectId=${subjectId}`);
      } else {
        navigate('/questions');
      }
    } catch (error) {
      console.error('Erro ao criar questão:', error);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Nova Questão
          </h1>
          <p className="text-gray-600">
            Preencha os dados para criar uma nova questão
          </p>
        </div>
      </div>

      <QuestionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={createQuestionMutation.isPending}
        defaultSubjectId={subjectId}
      />
    </div>
  );
}