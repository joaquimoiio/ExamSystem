// frontend/src/components/Subjects/SubjectForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Shuffle, Palette } from 'lucide-react';
import { Button, Input, Modal } from '../Common';
import { subjectService } from '../../services/api/subjectService';

// Cores predefinidas para disciplinas
const PREDEFINED_COLORS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#84CC16', label: 'Lima' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6B7280', label: 'Cinza' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#A855F7', label: 'Violeta' }
];

const SubjectForm = ({ 
  subject = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const isEditing = !!subject;
  
  // Estados locais
  const [selectedColor, setSelectedColor] = useState(subject?.color || PREDEFINED_COLORS[0].value);
  const [validatingName, setValidatingName] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);

  // Hook do formulário
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isValid, isDirty }
  } = useForm({
    defaultValues: {
      name: subject?.name || '',
      description: subject?.description || '',
      color: subject?.color || PREDEFINED_COLORS[0].value,
      code: subject?.code || '',
      credits: subject?.credits || 1,
      isActive: subject?.isActive !== undefined ? subject.isActive : true
    },
    mode: 'onChange'
  });

  // Observar mudanças nos campos
  const watchedName = watch('name');
  const watchedCode = watch('code');
  const watchedCredits = watch('credits');

  // Atualizar cor selecionada quando mudar no formulário
  useEffect(() => {
    setValue('color', selectedColor);
  }, [selectedColor, setValue]);

  // Validação em tempo real do nome
  useEffect(() => {
    const validateName = async () => {
      if (watchedName && watchedName.trim() && watchedName.trim() !== subject?.name) {
        setValidatingName(true);
        try {
          const result = await subjectService.validateName(
            watchedName.trim(), 
            isEditing ? subject.id : null
          );
          
          if (!result.isValid) {
            setError('name', { 
              type: 'manual', 
              message: result.message 
            });
          } else {
            clearErrors('name');
          }
        } catch (error) {
          console.error('Erro na validação do nome:', error);
        } finally {
          setValidatingName(false);
        }
      }
    };

    const timeoutId = setTimeout(validateName, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedName, subject?.name, subject?.id, isEditing, setError, clearErrors]);

  // Validação em tempo real do código
  useEffect(() => {
    const validateCode = async () => {
      if (watchedCode && watchedCode.trim() && watchedCode.trim() !== subject?.code) {
        setValidatingCode(true);
        try {
          const result = await subjectService.validateCode(
            watchedCode.trim(), 
            isEditing ? subject.id : null
          );
          
          if (!result.isValid) {
            setError('code', { 
              type: 'manual', 
              message: result.message 
            });
          } else {
            clearErrors('code');
          }
        } catch (error) {
          console.error('Erro na validação do código:', error);
        } finally {
          setValidatingCode(false);
        }
      }
    };

    const timeoutId = setTimeout(validateCode, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedCode, subject?.code, subject?.id, isEditing, setError, clearErrors]);

  // Função para gerar código automático
  const generateCode = () => {
    if (watchedName && watchedName.trim()) {
      const generatedCode = subjectService.generateCode(watchedName.trim());
      setValue('code', generatedCode, { shouldValidate: true });
    }
  };

  // Função para selecionar cor aleatória
  const selectRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * PREDEFINED_COLORS.length);
    const randomColor = PREDEFINED_COLORS[randomIndex];
    setSelectedColor(randomColor.value);
  };

  // Handler do submit
  const onFormSubmit = async (data) => {
    try {
      console.log('📝 Enviando formulário:', { isEditing, data });
      
      // Preparar dados
      const formData = {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : '',
        color: selectedColor,
        code: data.code ? data.code.trim() : null,
        credits: parseInt(data.credits) || 1,
        isActive: Boolean(data.isActive)
      };

      if (isEditing) {
        await onSubmit(subject.id, formData);
      } else {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('❌ Erro no submit:', error);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="subject-form"
            variant="primary"
            loading={loading}
            disabled={!isValid || !isDirty || validatingName || validatingCode}
          >
            {isEditing ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Nome da Disciplina */}
        <div>
          <Input
            label="Nome da Disciplina"
            {...register('name', {
              required: 'Nome é obrigatório',
              minLength: {
                value: 2,
                message: 'Nome deve ter pelo menos 2 caracteres'
              },
              maxLength: {
                value: 100,
                message: 'Nome deve ter no máximo 100 caracteres'
              }
            })}
            error={errors.name?.message}
            placeholder="Ex: Matemática, História, Programação..."
            required
            loading={validatingName}
          />
        </div>

        {/* Código da Disciplina */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Código da Disciplina"
              {...register('code', {
                maxLength: {
                  value: 20,
                  message: 'Código deve ter no máximo 20 caracteres'
                }
              })}
              error={errors.code?.message}
              placeholder="Ex: MAT101, HIST200..."
              helperText="Código único para identificar a disciplina (opcional)"
              loading={validatingCode}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={generateCode}
              disabled={!watchedName || loading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Gerar
            </Button>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            {...register('description', {
              maxLength: {
                value: 500,
                message: 'Descrição deve ter no máximo 500 caracteres'
              }
            })}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
            placeholder="Descrição opcional da disciplina..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Grid para Cor e Créditos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seleção de Cor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Cor da Disciplina
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectRandomColor}
                className="flex items-center gap-1 text-xs"
              >
                <Palette className="h-3 w-3" />
                Aleatória
              </Button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    selectedColor === color.value
                      ? 'border-gray-900 ring-2 ring-gray-300' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Cor para identificação visual da disciplina
            </p>
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
            )}
          </div>

          {/* Créditos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Créditos
            </label>
            <select
              {...register('credits', {
                required: 'Número de créditos é obrigatório',
                min: {
                  value: 1,
                  message: 'Deve ter pelo menos 1 crédito'
                },
                max: {
                  value: 20,
                  message: 'Máximo de 20 créditos'
                }
              })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            {errors.credits && (
              <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
            )}
          </div>
        </div>

        {/* Status Ativo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Disciplina ativa
          </label>
          <p className="ml-2 text-xs text-gray-500">
            (disciplinas inativas não aparecem na criação de provas)
          </p>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview:</h4>
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-medium text-lg"
              style={{ backgroundColor: selectedColor }}
            >
              {watchedName?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {watchedName || 'Nome da Disciplina'}
              </p>
              <p className="text-sm text-gray-500">
                {watch('code') && `${watch('code')} • `}
                {watchedCredits} crédito{watchedCredits !== 1 ? 's' : ''}
                {!watch('isActive') && ' • Inativa'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SubjectForm;