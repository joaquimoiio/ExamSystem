import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Save, X, Plus, Trash2, Check, AlertCircle, Upload, Image } from 'lucide-react';
import { LoadingButton } from '../common/Loading';
import { useSubjects } from '../../hooks';

const difficultyOptions = [
  { value: 'easy', label: 'Fácil', color: 'green' },
  { value: 'medium', label: 'Médio', color: 'yellow' },
  { value: 'hard', label: 'Difícil', color: 'red' },
];

const typeOptions = [
  { value: 'multiple_choice', label: 'Múltipla Escolha' },
  { value: 'essay', label: 'Dissertativa' },
];

export default function QuestionForm({ 
  question = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [previewMode, setPreviewMode] = useState(false);
  const { data: subjectsData } = useSubjects();
  const subjects = subjectsData?.data?.subjects || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      statement: question?.text || question?.statement || '',
      type: question?.type || 'multiple_choice',
      difficulty: question?.difficulty || 'medium',
      points: question?.points || 1,
      subjectId: question?.subjectId || '',
      explanation: question?.explanation || '',
      images: question?.images || [],
      alternatives: question?.alternatives || [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
    },
  });

  const { fields: alternativeFields, append, remove } = useFieldArray({
    control,
    name: 'alternatives',
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: 'images',
  });

  const watchedType = watch('type');
  const watchedAlternatives = watch('alternatives');
  const watchedImages = watch('images');
  const isEditing = !!question;

  // Auto-configure for question types
  React.useEffect(() => {
    if (watchedType === 'essay') {
      // For essay questions, clear alternatives
      setValue('alternatives', []);
    } else if (watchedType === 'multiple_choice' && alternativeFields.length === 0) {
      // Reset to multiple choice alternatives
      setValue('alternatives', [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ]);
    }
  }, [watchedType, alternativeFields.length, setValue]);

  const onFormSubmit = async (data) => {
    // For multiple choice questions, validate alternatives
    if (data.type === 'multiple_choice') {
      // Validate that at least one alternative is correct
      const hasCorrectAnswer = data.alternatives.some(alt => alt.isCorrect);
      if (!hasCorrectAnswer) {
        alert('Pelo menos uma alternativa deve estar marcada como correta');
        return;
      }

      // Validate that all alternatives have text
      const emptyAlternatives = data.alternatives.some(alt => !alt.text.trim());
      if (emptyAlternatives) {
        alert('Todas as alternativas devem ter texto');
        return;
      }
    }

    // For essay questions, alternatives are optional/null
    if (data.type === 'essay') {
      data.alternatives = null;
      data.correctAnswer = null;
    }

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const addAlternative = () => {
    if (alternativeFields.length < 6) {
      append({ text: '', isCorrect: false });
    }
  };

  const removeAlternative = (index) => {
    if (alternativeFields.length > 2) {
      remove(index);
    }
  };

  const addImage = () => {
    appendImage({ url: '', description: '' });
  };

  const handleImageUpload = (index, file) => {
    // In a real implementation, you would upload the file to a server
    // For now, we'll just create a preview URL
    const imageUrl = URL.createObjectURL(file);
    setValue(`images.${index}.url`, imageUrl);
  };

  const toggleCorrectAnswer = (index) => {
    const newAlternatives = [...watchedAlternatives];
    
    if (watchedType === 'true_false') {
      // For true/false, only one can be correct
      newAlternatives.forEach((alt, i) => {
        alt.isCorrect = i === index;
      });
    } else {
      // For multiple choice, toggle the selected one
      newAlternatives[index].isCorrect = !newAlternatives[index].isCorrect;
    }
    
    setValue('alternatives', newAlternatives);
  };

  if (previewMode) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Preview da Questão</h2>
          <button
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Voltar ao Editor
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              watch('difficulty') === 'easy' ? 'bg-green-100 text-green-700' :
              watch('difficulty') === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {difficultyOptions.find(d => d.value === watch('difficulty'))?.label}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{watch('points')} ponto{watch('points') > 1 ? 's' : ''}</span>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
              {watch('statement') || 'Digite o enunciado da questão...'}
            </h3>
            
            {watchedImages && watchedImages.length > 0 && (
              <div className="space-y-3">
                {watchedImages.map((img, index) => (
                  img.url && (
                    <div key={index} className="border rounded-lg p-3">
                      <img src={img.url} alt={img.description || `Imagem ${index + 1}`} className="max-w-full h-auto rounded" />
                      {img.description && <p className="text-sm text-gray-600 mt-2">{img.description}</p>}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {watchedAlternatives.map((alternative, index) => (
              <div
                key={index}
                className={`
                  flex items-start space-x-3 p-4 border rounded-lg
                  ${alternative.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}
                `}
              >
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5
                  ${alternative.isCorrect 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                  }
                `}>
                  {alternative.isCorrect && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-gray-900 leading-relaxed flex-1">
                  {alternative.text || `Alternativa ${index + 1}`}
                </span>
              </div>
            ))}
          </div>

          {watch('explanation') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Explicação:</h4>
              <p className="text-blue-800 text-sm">{watch('explanation')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Questão' : 'Nova Questão'}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode(true)}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            Preview
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="statement" className="block text-sm font-medium text-gray-700 mb-2">
              Enunciado da Questão *
            </label>
            <textarea
              id="statement"
              rows={4}
              {...register('statement', {
                required: 'Enunciado é obrigatório',
                minLength: {
                  value: 10,
                  message: 'Enunciado deve ter pelo menos 10 caracteres',
                },
                maxLength: {
                  value: 2000,
                  message: 'Enunciado deve ter no máximo 2000 caracteres',
                },
              })}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${errors.statement ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Digite o enunciado da questão..."
            />
            {errors.statement && (
              <p className="mt-1 text-sm text-red-600">{errors.statement.message}</p>
            )}
          </div>

          {/* Images Section */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Imagens (Opcional)
              </label>
              <button
                type="button"
                onClick={addImage}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Imagem</span>
              </button>
            </div>
            
            {imageFields.length > 0 && (
              <div className="space-y-3">
                {imageFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Imagem {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">URL da Imagem</label>
                      <input
                        type="url"
                        {...register(`images.${index}.url`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descrição (Alt text)</label>
                      <input
                        type="text"
                        {...register(`images.${index}.description`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Descrição da imagem para acessibilidade"
                      />
                    </div>
                    
                    {/* Image Preview */}
                    {watch(`images.${index}.url`) && (
                      <div className="mt-2">
                        <img 
                          src={watch(`images.${index}.url`)} 
                          alt={watch(`images.${index}.description`) || `Preview ${index + 1}`}
                          className="max-w-full h-auto max-h-40 rounded border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              Adicione uma ou mais imagens para complementar a questão
            </p>
          </div>

          <div>
            <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700 mb-2">
              Disciplina *
            </label>
            <select
              id="subjectId"
              {...register('subjectId', { required: 'Disciplina é obrigatória' })}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${errors.subjectId ? 'border-red-300' : 'border-gray-300'}
              `}
            >
              <option value="">Selecione uma disciplina</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <p className="mt-1 text-sm text-red-600">{errors.subjectId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Questão
            </label>
            <select
              id="type"
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
              Dificuldade
            </label>
            <select
              id="difficulty"
              {...register('difficulty')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
              Pontuação
            </label>
            <input
              id="points"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              {...register('points', {
                required: 'Pontuação é obrigatória',
                min: { value: 0.1, message: 'Mínimo 0.1 pontos' },
                max: { value: 100, message: 'Máximo 100 pontos' },
              })}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${errors.points ? 'border-red-300' : 'border-gray-300'}
              `}
            />
            {errors.points && (
              <p className="mt-1 text-sm text-red-600">{errors.points.message}</p>
            )}
          </div>
        </div>

        {/* Alternatives */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Alternativas *
            </label>
            {watchedType === 'multiple_choice' && fields.length < 6 && (
              <button
                type="button"
                onClick={addAlternative}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start space-x-3">
                <button
                  type="button"
                  onClick={() => toggleCorrectAnswer(index)}
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2
                    transition-colors
                    ${watchedAlternatives[index]?.isCorrect 
                      ? 'border-green-500 bg-green-500 hover:bg-green-600' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {watchedAlternatives[index]?.isCorrect && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    {...register(`alternatives.${index}.text`, {
                      required: 'Texto da alternativa é obrigatório',
                      maxLength: {
                        value: 500,
                        message: 'Máximo 500 caracteres',
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Alternativa ${index + 1}`}
                    disabled={watchedType === 'true_false'}
                  />
                  {errors.alternatives?.[index]?.text && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.alternatives[index].text.message}
                    </p>
                  )}
                </div>

                {watchedType === 'multiple_choice' && fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAlternative(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-start space-x-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Clique no círculo ao lado da alternativa para marcá-la como correta. 
              {watchedType === 'true_false' 
                ? ' Apenas uma pode estar correta.' 
                : ' Múltiplas alternativas podem estar corretas.'
              }
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
            Explicação (Opcional)
          </label>
          <textarea
            id="explanation"
            rows={3}
            {...register('explanation', {
              maxLength: {
                value: 1000,
                message: 'Explicação deve ter no máximo 1000 caracteres',
              },
            })}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.explanation ? 'border-red-300' : 'border-gray-300'}
            `}
            placeholder="Explicação sobre a resposta correta (mostrada após a submissão)..."
          />
          {errors.explanation && (
            <p className="mt-1 text-sm text-red-600">{errors.explanation.message}</p>
          )}
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
            {isEditing ? 'Atualizar' : 'Criar'} Questão
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}