import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useCreateQuestion, useSubjects } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';

export default function QuestionCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  
  const { success, error } = useToast();
  const createQuestionMutation = useCreateQuestion();
  const { data: subjectsData } = useSubjects();

  const handleSubmit = async (data) => {
    try {
      await createQuestionMutation.mutateAsync({
        ...data,
        subjectId: subjectId || data.subjectId
      });
      navigate('/questions');
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Error creating question:', error);
    }
  };

  const handleCancel = () => {
    if (subjectId) {
      navigate(`/subjects/${subjectId}`);
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

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Formulário de Questão
          </h3>
          <p className="text-gray-600 mb-6">
            O formulário completo de criação de questões será implementado em breve.
          </p>
          <div className="space-y-4">
            <div className="text-left max-w-md mx-auto space-y-3">
              <p className="text-sm text-gray-700">O formulário incluirá:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Enunciado da questão</li>
                <li>Tipo de questão (múltipla escolha, V/F, dissertativa)</li>
                <li>Nível de dificuldade</li>
                <li>Alternativas (para múltipla escolha)</li>
                <li>Resposta correta</li>
                <li>Tags e categorias</li>
                <li>Upload de imagens</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}