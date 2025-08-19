import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SubjectForm from '../../components/forms/SubjectForm';
import { useCreateSubject } from '../../hooks';

export default function SubjectCreate() {
  const navigate = useNavigate();
  const createSubjectMutation = useCreateSubject();

  const handleSubmit = async (data) => {
    try {
      await createSubjectMutation.mutateAsync(data);
      navigate('/subjects');
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Error creating subject:', error);
    }
  };

  const handleCancel = () => {
    navigate('/subjects');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/subjects')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Disciplina</h1>
          <p className="text-gray-600 mt-1">
            Crie uma nova disciplina para organizar suas questões e provas
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <SubjectForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createSubjectMutation.isPending}
        />
      </div>
    </div>
  );
}