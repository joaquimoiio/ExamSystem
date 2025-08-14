// frontend/src/components/Subjects/SubjectForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Shuffle, Palette } from 'lucide-react';
import { Button, Input, Modal } from '../Common';
// CORREÇÃO: Mudar para o import correto baseado na estrutura existente
import { subjectService } from '../../services/subject';

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

  // Validação em tempo real do nome (simplificada, já que o service atual não tem validateName)
  useEffect(() => {
    const validateName = async () => {
      if (watchedName && watchedName.trim() && watchedName.trim() !== subject?.name) {
        setValidatingName(true);
        try {
          // Como o service atual não tem validateName, fazemos validação básica
          if (watchedName.trim().length < 2) {
            setError('name', {
              type: 'minLength',
              message: 'Nome deve ter pelo menos 2 caracteres'
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
  }, [watchedName, subject?.name, setError, clearErrors]);

  // Validação em tempo real do código (simplificada)
  useEffect(() => {
    const validateCode = async () => {
      if (watchedCode && watchedCode.trim() && watchedCode.trim() !== subject?.code) {
        setValidatingCode(true);
        try {
          // Validação básica de código
          if (watchedCode.trim().length < 2) {
            setError('code', {
              type: 'minLength',
              message: 'Código deve ter pelo menos 2 caracteres'
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
  }, [watchedCode, subject?.code, setError, clearErrors]);

  // Função para gerar cor aleatória
  const handleRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * PREDEFINED_COLORS.length);
    setSelectedColor(PREDEFINED_COLORS[randomIndex].value);
  };

  // Função para gerar código automático
  const handleGenerateCode = () => {
    if (watchedName && watchedName.trim()) {
      const name = watchedName.trim();
      const words = name.toUpperCase().split(' ');
      let code = '';
      
      if (words.length === 1) {
        code = words[0].substring(0, 3) + '101';
      } else if (words.length === 2) {
        code = words[0].charAt(0) + words[1].charAt(0) + '01';
      } else {
        code = words[0].charAt(0) + words[1].charAt(0) + words[2].charAt(0);
      }
      
      setValue('code', code);
    }
  };

  // Submissão do formulário
  const handleFormSubmit = async (data) => {
    try {
      console.log('Dados do formulário:', data);
      
      const formData = {
        ...data,
        color: selectedColor,
        credits: parseInt(data.credits) || 1
      };

      if (isEditing) {
        // Para edição, use updateSubject
        await subjectService.updateSubject(subject.id, formData);
      } else {
        // Para criação, use createSubject
        await subjectService.createSubject(formData);
      }

      // Chamar callback de sucesso
      if (onSubmit) {
        onSubmit(formData);
      }
    } catch (error) {
      console.error('Erro ao salvar disciplina:', error);
      // Aqui você pode exibir uma mensagem de erro para o usuário
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      {/* Nome da disciplina */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome da disciplina *
        </label>
        <Input
          id="name"
          {...register('name', {
            required: 'Nome é obrigatório',
            minLength: {
              value: 2,
              message: 'Nome deve ter pelo menos 2 caracteres'
            }
          })}
          placeholder="Ex: Matemática, Português, História..."
          error={errors.name?.message}
          disabled={loading || validatingName}
        />
        {validatingName && (
          <p className="text-xs text-blue-600 mt-1">Validando nome...</p>
        )}
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Descrição opcional da disciplina..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Código e Créditos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Código
          </label>
          <div className="flex gap-2">
            <Input
              id="code"
              {...register('code')}
              placeholder="Ex: MAT101"
              error={errors.code?.message}
              disabled={loading || validatingCode}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateCode}
              disabled={!watchedName || loading}
              title="Gerar código automaticamente"
            >
              <Shuffle size={16} />
            </Button>
          </div>
          {validatingCode && (
            <p className="text-xs text-blue-600 mt-1">Validando código...</p>
          )}
        </div>

        <div>
          <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-1">
            Créditos
          </label>
          <Input
            id="credits"
            type="number"
            min="1"
            max="20"
            {...register('credits', {
              min: { value: 1, message: 'Mínimo 1 crédito' },
              max: { value: 20, message: 'Máximo 20 créditos' }
            })}
            error={errors.credits?.message}
            disabled={loading}
          />
        </div>
      </div>

      {/* Cor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Cor da disciplina *
        </label>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-lg border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRandomColor}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Shuffle size={16} />
            Aleatória
          </Button>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
          {PREDEFINED_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setSelectedColor(color.value)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                selectedColor === color.value
                  ? 'border-gray-800 scale-110'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
              disabled={loading}
            />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <input
          id="isActive"
          type="checkbox"
          {...register('isActive')}
          disabled={loading}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          Disciplina ativa
        </label>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit" 
          loading={loading}
          disabled={loading || !isValid}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Disciplina
        </Button>
      </div>
    </form>
  );
};

export default SubjectForm;