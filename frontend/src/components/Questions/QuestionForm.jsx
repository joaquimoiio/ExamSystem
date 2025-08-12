import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import Modal from '../Common/Modal'
import Button from '../Common/Button'
import Input from '../Common/Input'

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Fácil', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Difícil', color: 'bg-red-100 text-red-800' }
]

const ALTERNATIVE_LETTERS = ['A', 'B', 'C', 'D', 'E']

const QuestionForm = ({
  question = null,
  subjectId,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const isEditing = !!question

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      statement: '',
      difficulty: 'medium',
      alternatives: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      explanation: '',
      tags: '',
      points: 1,
      active: true
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'alternatives'
  })

  const watchedAlternatives = watch('alternatives')

  useEffect(() => {
    if (question) {
      reset({
        statement: question.statement || '',
        difficulty: question.difficulty || 'medium',
        alternatives: question.alternatives || [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        explanation: question.explanation || '',
        tags: question.tags ? question.tags.join(', ') : '',
        points: question.points || 1,
        active: question.active !== undefined ? question.active : true
      })
    }
  }, [question, reset])

  const addAlternative = () => {
    if (fields.length < 5) {
      append({ text: '', isCorrect: false })
    }
  }

  const removeAlternative = (index) => {
    if (fields.length > 2) {
      remove(index)
    }
  }

  const setCorrectAlternative = (index) => {
    fields.forEach((_, i) => {
      setValue(`alternatives.${i}.isCorrect`, i === index)
    })
  }

  const onFormSubmit = (data) => {
    // Process tags
    const tags = data.tags
      ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : []

    // Ensure at least one correct alternative
    const hasCorrectAlternative = data.alternatives.some(alt => alt.isCorrect)
    if (!hasCorrectAlternative) {
      alert('Selecione pelo menos uma alternativa correta')
      return
    }

    const formattedData = {
      ...data,
      subjectId,
      tags,
      alternatives: data.alternatives.filter(alt => alt.text.trim().length > 0)
    }

    onSubmit(formattedData)
  }

  const getCorrectAlternativeIndex = () => {
    return watchedAlternatives?.findIndex(alt => alt.isCorrect) ?? -1
  }

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? 'Editar Questão' : 'Nova Questão'}
      size="xl"
      footer={
        <>
          <Button
            type="submit"
            form="question-form"
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
      <form id="question-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Enunciado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enunciado da Questão *
          </label>
          <textarea
            {...register('statement', {
              required: 'Enunciado é obrigatório',
              minLength: {
                value: 10,
                message: 'Enunciado deve ter pelo menos 10 caracteres'
              }
            })}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Digite o enunciado da questão..."
          />
          {errors.statement && (
            <p className="mt-1 text-sm text-red-600">{errors.statement.message}</p>
          )}
        </div>

        {/* Dificuldade e Pontos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dificuldade *
            </label>
            <select
              {...register('difficulty', {
                required: 'Dificuldade é obrigatória'
              })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {DIFFICULTY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pontuação
            </label>
            <select
              {...register('points', {
                required: 'Pontuação é obrigatória',
                min: { value: 0.5, message: 'Mínimo 0.5 pontos' },
                max: { value: 10, message: 'Máximo 10 pontos' }
              })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10].map(points => (
                <option key={points} value={points}>
                  {points} ponto{points !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alternativas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Alternativas *
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addAlternative}
              disabled={fields.length >= 5}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start space-x-3">
                {/* Radio button for correct answer */}
                <div className="flex-shrink-0 mt-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={watchedAlternatives?.[index]?.isCorrect || false}
                    onChange={() => setCorrectAlternative(index)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                </div>

                {/* Alternative letter */}
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {ALTERNATIVE_LETTERS[index]}
                  </span>
                </div>

                {/* Alternative text */}
                <div className="flex-1">
                  <input
                    type="text"
                    {...register(`alternatives.${index}.text`, {
                      required: 'Texto da alternativa é obrigatório'
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={`Alternativa ${ALTERNATIVE_LETTERS[index]}`}
                  />
                  {errors.alternatives?.[index]?.text && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.alternatives[index].text.message}
                    </p>
                  )}
                </div>

                {/* Remove button */}
                {fields.length > 2 && (
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => removeAlternative(index)}
                      className="mt-1 p-1 text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Selecione a alternativa correta marcando o círculo ao lado. 
            Mínimo 2 alternativas, máximo 5.
          </p>
        </div>

        {/* Explicação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Explicação da Resposta
          </label>
          <textarea
            {...register('explanation')}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Explique por que essa é a resposta correta (opcional)..."
          />
          <p className="mt-1 text-sm text-gray-500">
            Esta explicação será mostrada aos alunos após a correção
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            {...register('tags')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Ex: álgebra, geometria, trigonometria (separado por vírgulas)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Use tags para organizar e filtrar questões (opcional)
          </p>
        </div>

        {/* Status Ativo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('active')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Questão ativa
          </label>
          <p className="ml-2 text-xs text-gray-500">
            (questões inativas não aparecem na geração de provas)
          </p>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Preview:</h4>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-start justify-between mb-3">
              <h5 className="font-medium text-gray-900">Questão</h5>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  DIFFICULTY_OPTIONS.find(d => d.value === watch('difficulty'))?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {DIFFICULTY_OPTIONS.find(d => d.value === watch('difficulty'))?.label}
                </span>
                <span className="text-xs text-gray-500">
                  {watch('points')} pts
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">
              {watch('statement') || 'Digite o enunciado da questão...'}
            </p>

            <div className="space-y-2">
              {watchedAlternatives?.map((alt, index) => (
                <div
                  key={index}
                  className={`flex items-start p-2 rounded border ${
                    alt?.isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                    {ALTERNATIVE_LETTERS[index]}
                  </span>
                  <span className="text-sm text-gray-700">
                    {alt?.text || `Alternativa ${ALTERNATIVE_LETTERS[index]}`}
                  </span>
                  {alt?.isCorrect && (
                    <svg className="ml-auto h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default QuestionForm