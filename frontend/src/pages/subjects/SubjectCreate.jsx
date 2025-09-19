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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/subjects')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Disciplina</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Crie uma nova disciplina para organizar suas questões e provas
              </p>
            </div>
          </div>

          {/* Form - Centralized */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <SubjectForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={createSubjectMutation.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}