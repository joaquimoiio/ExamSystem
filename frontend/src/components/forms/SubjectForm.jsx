import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { LoadingButton } from '../common/Loading';

const colorOptions = [
  { value: '#3B82F6', label: 'Azul', class: 'bg-blue-500' },
  { value: '#10B981', label: 'Verde', class: 'bg-green-500' },
  { value: '#F59E0B', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: '#EF4444', label: 'Vermelho', class: 'bg-red-500' },
  { value: '#8B5CF6', label: 'Roxo', class: 'bg-purple-500' },
  { value: '#F97316', label: 'Laranja', class: 'bg-orange-500' },
  { value: '#06B6D4', label: 'Ciano', class: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lima', class: 'bg-lime-500' },
  { value: '#EC4899', label: 'Rosa', class: 'bg-pink-500' },
  { value: '#6B7280', label: 'Cinza', class: 'bg-gray-500' },
];

export default function SubjectForm({ 
  subject = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: subject?.name || '',
      description: subject?.description || '',
      color: subject?.color || '#3B82F6',
      credits: subject?.credits || 1,
      isActive: subject?.isActive !== false,
    },
  });

  const selectedColor = watch('color');
  const isEditing = !!subject;

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Subject Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Disciplina *
          </label>
          <input
            id="name"
            type="text"
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
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              ${errors.name ? 'border-red-300' : 'border-gray-300'}
            `}
            placeholder="Ex: Matemática, Física, Química..."
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description', {
              maxLength: {
                value: 500,
                message: 'Descrição deve ter no máximo 500 caracteres',
              },
            })}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              ${errors.description ? 'border-red-300' : 'border-gray-300'}
            `}
            placeholder="Descrição opcional da disciplina..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cor da Disciplina
          </label>
          <div className="grid grid-cols-5 gap-3">
            {colorOptions.map((color) => (
              <label
                key={color.value}
                className={`
                  relative cursor-pointer rounded-lg p-3 flex items-center justify-center
                  border-2 transition-all duration-200
                  ${selectedColor === color.value 
                    ? 'border-gray-400 scale-110' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="radio"
                  value={color.value}
                  {...register('color')}
                  className="sr-only"
                />
                <div className={`w-8 h-8 rounded-full ${color.class}`} />
                {selectedColor === color.value && (
                  <div className="absolute inset-0 rounded-lg bg-black bg-opacity-10 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                )}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            A cor será usada para identificar a disciplina visualmente
          </p>
        </div>

        {/* Credits */}
        <div>
          <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-2">
            Carga Horária/Créditos
          </label>
          <input
            id="credits"
            type="number"
            min="1"
            max="20"
            {...register('credits', {
              required: 'Carga horária é obrigatória',
              min: {
                value: 1,
                message: 'Mínimo de 1 crédito',
              },
              max: {
                value: 20,
                message: 'Máximo de 20 créditos',
              },
            })}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              ${errors.credits ? 'border-red-300' : 'border-gray-300'}
            `}
            placeholder="Ex: 4"
          />
          {errors.credits && (
            <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Disciplina ativa
          </label>
          <p className="ml-2 text-xs text-gray-500">
            (Disciplinas inativas não aparecem na criação de provas)
          </p>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview:</h3>
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
            <div>
              <p className="font-medium text-gray-900">
                {watch('name') || 'Nome da disciplina'}
              </p>
              <p className="text-sm text-gray-500">
                {watch('description') || 'Sem descrição'}
              </p>
              <p className="text-xs text-gray-400">
                {watch('credits')} crédito{watch('credits') > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          
          <LoadingButton
            type="submit"
            loading={isSubmitting || loading}
            className="px-6 py-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Atualizar' : 'Criar'} Disciplina
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}