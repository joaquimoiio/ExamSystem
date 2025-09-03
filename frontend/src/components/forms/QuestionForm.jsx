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
  loading = false,
  defaultSubjectId = null
}) {
  const { data: subjectsData } = useSubjects();
  const subjects = subjectsData?.data?.subjects || [];

  // Convert backend alternatives format to form format
  const getFormattedAlternatives = () => {
    if (question?.alternatives && Array.isArray(question.alternatives)) {
      // Convert from backend format (array of strings + correctAnswer index) to form format
      return question.alternatives.map((text, index) => ({
        text,
        isCorrect: index === question.correctAnswer
      }));
    }
    // Default alternatives for new questions
    return [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ];
  };

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
      subjectId: question?.subjectId || defaultSubjectId || '',
      explanation: question?.explanation || '',
      images: question?.images || [],
      alternatives: getFormattedAlternatives(),
      tags: question?.tags || [],
      title: question?.title || '',
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

    // Convert form alternatives format back to backend format
    if (data.type === 'multiple_choice' && data.alternatives) {
      // Extract text array and find correct answer index
      const alternativeTexts = data.alternatives.map(alt => alt.text);
      const correctAnswerIndex = data.alternatives.findIndex(alt => alt.isCorrect);
      
      data.alternatives = alternativeTexts;
      data.correctAnswer = correctAnswerIndex >= 0 ? correctAnswerIndex : 0;
    }

    // For essay questions, alternatives are optional/null
    if (data.type === 'essay') {
      data.alternatives = null;
      data.correctAnswer = null;
    }

    // Map statement to text field for backend compatibility
    const formattedData = {
      ...data,
      text: data.statement,
      title: data.statement.substring(0, 100) + (data.statement.length > 100 ? '...' : ''), // Auto-generate title from statement
    };

    // Remove empty images
    if (formattedData.images) {
      formattedData.images = formattedData.images.filter(img => img.url && img.url.trim());
    }

    try {
      await onSubmit(formattedData);
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


  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Editar Questão' : 'Nova Questão'}
        </h2>
        <div className="flex items-center space-x-2">
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
            <label htmlFor="statement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL da Imagem</label>
                      <input
                        type="url"
                        {...register(`images.${index}.url`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descrição (Alt text)</label>
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
            <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <p className="mt-1 text-xs text-gray-500">
              A pontuação será definida ao montar a prova
            </p>
          </div>

        </div>

        {/* Alternatives */}
        {watchedType === 'multiple_choice' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alternativas *
              </label>
              {alternativeFields.length < 6 && (
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
              {alternativeFields.map((field, index) => (
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

                {alternativeFields.length > 2 && (
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

            <div className="mt-2 flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Clique no círculo ao lado da alternativa para marcá-la como correta. 
                Múltiplas alternativas podem estar corretas.
              </p>
            </div>
          </div>
        )}

        {watchedType === 'essay' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Questão: Dissertativa
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800 font-medium mb-1">Questão Dissertativa</p>
                  <p className="text-blue-700 text-sm">
                    Esta questão não terá alternativas pré-definidas. Os alunos deverão responder em formato livre.
                    A correção será manual ou pode ser configurada com critérios específicos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          
          <LoadingButton
            type="submit"
            isLoading={isSubmitting || loading}
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