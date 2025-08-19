import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, Save, Trash2, Edit, Eye, Plus, BookOpen,
  FileText, BarChart3, AlertTriangle, Clock, Palette
} from 'lucide-react';
import { useSubject, useUpdateSubject, useDeleteSubject, useCreateSubject } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';
import { Input, Textarea, ColorPicker } from '../../components/ui/Input';

const predefinedColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#374151'
];

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      color: predefinedColors[0],
      code: '',
    },
  });

  const watchedColor = watch('color');

  // Initialize form with subject data
  React.useEffect(() => {
    if (subject && !isNewSubject) {
      setValue('name', subject.name || '');
      setValue('description', subject.description || '');
      setValue('color', subject.color || predefinedColors[0]);
      setValue('code', subject.code || '');
    }
  }, [subject, setValue, isNewSubject]);

  const onSubmit = async (data) => {
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isNewSubject) {
      navigate('/subjects');
    } else {
      setIsEditing(false);
      // Reset form to original values
      if (subject) {
        setValue('name', subject.name || '');
        setValue('description', subject.description || '');
        setValue('color', subject.color || predefinedColors[0]);
        setValue('code', subject.code || '');
      }
    }
  };

  if (isLoading) {
    return <LoadingPage title="Carregando disciplina..." />;
  }

  if (error && !isNewSubject) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar disciplina</h3>
        <p className="text-gray-600 mb-4">A disciplina não foi encontrada ou ocorreu um erro.</p>
        <button
          onClick={() => navigate('/subjects')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Voltar para Disciplinas
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/subjects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            {!isEditing && watchedColor && (
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: watchedColor }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNewSubject ? 'Nova Disciplina' : (isEditing ? 'Editar Disciplina' : subject?.name)}
              </h1>
              <p className="text-gray-600">
                {isNewSubject 
                  ? 'Crie uma nova disciplina para organizar suas questões'
                  : isEditing 
                  ? 'Edite os detalhes da disciplina'
                  : 'Gerencie questões e configurações da disciplina'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isNewSubject && !isEditing && (
            <>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards (only for existing subjects) */}
      {!isNewSubject && !isEditing && subject && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Questões"
            value={subject.questionsCount || 0}
            icon={FileText}
            color="blue"
            description="Total de questões cadastradas"
          />
          <StatCard
            title="Provas"
            value={subject.examsCount || 0}
            icon={BarChart3}
            color="green"
            description="Provas que usam esta disciplina"
          />
          <StatCard
            title="Última Atividade"
            value={subject.lastActivity ? new Date(subject.lastActivity).toLocaleDateString('pt-BR') : 'Nunca'}
            icon={Clock}
            color="purple"
            description="Última questão adicionada"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100">
        {isEditing ? (
          // Edit Form
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="flex items-center mb-6">
              <BookOpen className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isNewSubject ? 'Informações da Nova Disciplina' : 'Editar Informações'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Nome da Disciplina"
                  placeholder="Ex: Matemática, Física, História..."
                  error={errors.name?.message}
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres',
                    },
                    maxLength: {
                      value: 100,
                      message: 'Nome deve ter no máximo 100 caracteres',
                    },
                  })}
                />
              </div>

              <div>
                <Input
                  label="Código (opcional)"
                  placeholder="Ex: MAT101, FIS201, HIS301..."
                  error={errors.code?.message}
                  {...register('code', {
                    maxLength: {
                      value: 20,
                      message: 'Código deve ter no máximo 20 caracteres',
                    },
                  })}
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Descrição (opcional)"
                placeholder="Descrição detalhada da disciplina..."
                rows={3}
                error={errors.description?.message}
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Descrição deve ter no máximo 500 caracteres',
                  },
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor da Disciplina
              </label>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-white shadow-md"
                  style={{ backgroundColor: watchedColor }}
                />
                <div className="flex-1">
                  <div className="grid grid-cols-10 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          watchedColor === color 
                            ? 'border-gray-400 scale-110' 
                            : 'border-gray-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {isDirty && (
                  <div className="flex items-center text-yellow-600">
                    <Clock className="w-4 h-4 mr-1" />
                    Alterações não salvas
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting 
                    ? (isNewSubject ? 'Criando...' : 'Salvando...') 
                    : (isNewSubject ? 'Criar Disciplina' : 'Salvar Alterações')
                  }
                </button>
              </div>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-6">
              <BookOpen className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Informações da Disciplina</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
                <p className="text-lg font-medium text-gray-900">{subject?.name}</p>
              </div>

              {subject?.code && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Código</label>
                  <p className="text-lg font-medium text-gray-900">{subject.code}</p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Cor</label>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white shadow-md"
                    style={{ backgroundColor: subject?.color }}
                  />
                  <span className="text-sm text-gray-600">{subject?.color}</span>
                </div>
              </div>

              {subject?.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                  <p className="text-gray-700">{subject.description}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate(`/questions/new?subjectId=${subject?.id}`)}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Nova Questão</h4>
                      <p className="text-sm text-gray-500">Adicionar questão a esta disciplina</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate(`/questions?subjectId=${subject?.id}`)}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Ver Questões</h4>
                      <p className="text-sm text-gray-500">Listar todas as questões desta disciplina</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-6 border-t border-gray-200 text-sm text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Criado em:</span> {' '}
                  {subject?.createdAt ? new Date(subject.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Última atualização:</span> {' '}
                  {subject?.updatedAt ? new Date(subject.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Disciplina"
        message="Tem certeza que deseja excluir esta disciplina? Todas as questões associadas também serão removidas. Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmVariant="danger"
        isLoading={deleteSubjectMutation.isPending}
      />
    </div>
  );
}

// Component for Statistics Cards
function StatCard({ title, value, icon: Icon, color, description }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}