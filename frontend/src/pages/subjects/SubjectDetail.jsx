import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Edit, Eye, Plus } from 'lucide-react';
import { useSubject, useUpdateSubject, useDeleteSubject, useCreateSubject } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import SubjectForm from '../../components/forms/SubjectForm';
import { ConfirmationModal } from '../../components/ui/Modal';

export default function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [isEditing, setIsEditing] = useState(!id); // New subject if no ID
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Hooks
  const { data: subjectData, isLoading, error } = useSubject(id);
  const updateSubjectMutation = useUpdateSubject();
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const subject = subjectData?.data?.subject;
  const isNewSubject = !id;

  const handleSubmit = async (data) => {
    try {
      if (isNewSubject) {
        const response = await createSubjectMutation.mutateAsync(data);
        success('Disciplina criada com sucesso!');
        navigate(`/subjects/${response.data.subject.id}`);
      } else {
        await updateSubjectMutation.mutateAsync({ id, data });
        setIsEditing(false);
        success('Disciplina atualizada com sucesso!');
      }
    } catch (error) {
      showError(error.message || 'Erro ao salvar disciplina');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubjectMutation.mutateAsync(id);
      success('Disciplina excluída com sucesso!');
      navigate('/subjects');
    } catch (error) {
      showError(error.message || 'Erro ao excluir disciplina');
    }
  };

  const handleCancel = () => {
    if (isNewSubject) {
      navigate('/subjects');
    } else {
      setIsEditing(false);
    }
  };

  // Loading state
  if (isLoading && !isNewSubject) {
    return <LoadingPage title="Carregando disciplina..." />;
  }

  // Error state
  if (error && !isNewSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar disciplina
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'Disciplina não encontrada'}
          </p>
          <button
            onClick={() => navigate('/subjects')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Voltar às disciplinas
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
            onClick={() => navigate('/subjects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNewSubject ? 'Nova Disciplina' : subject?.name || 'Disciplina'}
            </h1>
            <p className="text-gray-600">
              {isNewSubject 
                ? 'Crie uma nova disciplina para organizar suas questões'
                : 'Gerencie as informações e conteúdo da disciplina'
              }
            </p>
          </div>
        </div>

        {!isNewSubject && !isEditing && (
          <div className="flex items-center space-x-3">
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
      {isEditing || isNewSubject ? (
        <SubjectForm
          subject={subject}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createSubjectMutation.isPending || updateSubjectMutation.isPending}
        />
      ) : (
        <div className="space-y-6">
          {/* Subject Info */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: subject.color }}
                >
                  <span className="text-white text-xl font-bold">
                    {subject.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
                  <p className="text-gray-600">{subject.description || 'Sem descrição'}</p>
                </div>
              </div>
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${subject.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
                }
              `}>
                {subject.isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{subject.questionsCount || 0}</div>
                <div className="text-sm text-gray-500">Questões</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{subject.examsCount || 0}</div>
                <div className="text-sm text-gray-500">Provas</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{subject.credits}</div>
                <div className="text-sm text-gray-500">Créditos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {subject.createdAt ? new Date(subject.createdAt).getFullYear() : '-'}
                </div>
                <div className="text-sm text-gray-500">Ano de criação</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Questions Section */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Questões</h3>
                <button
                  onClick={() => navigate(`/questions/new?subject=${subject.id}`)}
                  className="flex items-center px-3 py-2 text-sm bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nova
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fáceis:</span>
                  <span className="font-medium">{subject.easyQuestions || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Médias:</span>
                  <span className="font-medium">{subject.mediumQuestions || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Difíceis:</span>
                  <span className="font-medium">{subject.hardQuestions || 0}</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/questions?subject=${subject.id}`)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ver todas as questões
              </button>
            </div>

            {/* Exams Section */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Provas</h3>
                <button
                  onClick={() => navigate(`/exams/new?subject=${subject.id}`)}
                  className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nova
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rascunhos:</span>
                  <span className="font-medium">{subject.draftExams || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Publicadas:</span>
                  <span className="font-medium">{subject.publishedExams || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Arquivadas:</span>
                  <span className="font-medium">{subject.archivedExams || 0}</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/exams?subject=${subject.id}`)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ver todas as provas
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
            
            {subject.recentActivity && subject.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {subject.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma atividade recente</p>
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
        title="Excluir Disciplina"
        message={`Tem certeza que deseja excluir a disciplina "${subject?.name}"? Esta ação não pode ser desfeita e todas as questões e provas associadas também serão removidas.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="error"
        loading={deleteSubjectMutation.isPending}
      />
    </div>
  );
}