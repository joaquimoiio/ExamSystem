import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../Common/Modal'
import Button from '../Common/Button'
import Input from '../Common/Input'

const SUBJECT_COLORS = [
  { value: '#3B82F6', label: 'Azul', class: 'bg-blue-500' },
  { value: '#10B981', label: 'Verde', class: 'bg-green-500' },
  { value: '#F59E0B', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: '#EF4444', label: 'Vermelho', class: 'bg-red-500' },
  { value: '#8B5CF6', label: 'Roxo', class: 'bg-purple-500' },
  { value: '#F97316', label: 'Laranja', class: 'bg-orange-500' },
  { value: '#06B6D4', label: 'Ciano', class: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lima', class: 'bg-lime-500' },
  { value: '#EC4899', label: 'Rosa', class: 'bg-pink-500' },
  { value: '#6B7280', label: 'Cinza', class: 'bg-gray-500' }
]

const SubjectForm = ({
  subject = null,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const isEditing = !!subject

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      color: SUBJECT_COLORS[0].value,
      code: '',
      credits: 1,
      isActive: true // Corrigido para isActive em vez de active
    }
  })

  const selectedColor = watch('color')

  useEffect(() => {
    if (subject) {
      reset({
        name: subject.name || '',
        description: subject.description || '',
        color: subject.color || SUBJECT_COLORS[0].value,
        code: subject.code || '',
        credits: subject.credits || 1,
        isActive: subject.isActive !== undefined ? subject.isActive : true
      })
    }
  }, [subject, reset])

  const onFormSubmit = (data) => {
    // Garantir que todos os campos obrigatórios estão presentes
    const formattedData = {
      name: data.name.trim(),
      description: data.description?.trim() || '',
      color: data.color,
      code: data.code?.trim() || '',
      credits: parseInt(data.credits) || 1,
      isActive: Boolean(data.isActive)
    }
    
    console.log('Dados enviados:', formattedData) // Debug
    onSubmit(formattedData)
  }

  const generateCode = () => {
    const name = watch('name')
    if (name) {
      const code = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 6)
      setValue('code', code)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}
      size="lg"
      footer={
        <>
          <Button
            type="submit"
            form="subject-form"
            variant="primary"
            loading={loading}
            disabled={!isValid}
          >
            {isEditing ? 'Atualizar' : 'Criar'}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="mr-3"
          >
            Cancelar
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Nome da Disciplina */}
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
        />

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
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={generateCode}
              className="w-full"
            >
              Gerar Código
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
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Descrição da disciplina (opcional)..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Cor e Créditos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor da Disciplina *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue('color', color.value)}
                  className={`
                    w-10 h-10 rounded-lg border-2 transition-all duration-200
                    ${color.class}
                    ${selectedColor === color.value 
                      ? 'border-gray-900 ring-2 ring-gray-300' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
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
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: selectedColor }}
            >
              {watch('name')?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {watch('name') || 'Nome da Disciplina'}
              </p>
              <p className="text-sm text-gray-500">
                {watch('code') && `${watch('code')} • `}
                {watch('credits')} crédito{watch('credits') !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default SubjectForm