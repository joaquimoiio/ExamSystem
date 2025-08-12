import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import Modal from '../Common/Modal'
import Button from '../Common/Button'
import Input from '../Common/Input'
import { subjectService } from '../../services/subject'
import { examService } from '../../services/exam'
import { showOperationToast } from '../Common/Toast'
import { QUESTION_DIFFICULTY_LABELS } from '../../utils/constants'

const ExamGenerator = ({ 
  isOpen, 
  onClose, 
  onExamGenerated, 
  preSelectedSubjectId = null 
}) => {
  const [loading, setLoading] = useState(false)
  const [generationStep, setGenerationStep] = useState(1)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [availableQuestions, setAvailableQuestions] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
    control
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      totalQuestions: 10,
      easyQuestions: 4,
      mediumQuestions: 4,
      hardQuestions: 2,
      totalVariations: 3,
      timeLimit: 60,
      passingScore: 6,
      instructions: '',
      allowReview: true,
      showCorrectAnswers: true,
      randomizeQuestions: true,
      randomizeAlternatives: true,
      subjectIds: preSelectedSubjectId ? [preSelectedSubjectId] : []
    }
  })

  // Watch form values
  const watchedSubjectIds = watch('subjectIds')
  const watchedTotalQuestions = watch('totalQuestions')
  const watchedEasyQuestions = watch('easyQuestions')
  const watchedMediumQuestions = watch('mediumQuestions')
  const watchedHardQuestions = watch('hardQuestions')

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getSubjects({ limit: 100 }),
    select: (data) => data.data?.subjects || []
  })

  // Set pre-selected subject
  useEffect(() => {
    if (preSelectedSubjectId && subjects.length > 0) {
      setValue('subjectIds', [preSelectedSubjectId])
    }
  }, [preSelectedSubjectId, subjects, setValue])

  // Generate automatic question distribution
  const generateQuestionDistribution = () => {
    const total = watchedTotalQuestions || 10
    const easy = Math.ceil(total * 0.4)
    const medium = Math.ceil(total * 0.4)
    const hard = total - easy - medium

    return { easy, medium, hard }
  }

  // Validate if exam can be generated
  const canGenerateExam = () => {
    const hasSubjects = watchedSubjectIds && watchedSubjectIds.length > 0
    const hasValidQuestionCount = watchedTotalQuestions > 0
    const hasValidDistribution = 
      (watchedEasyQuestions + watchedMediumQuestions + watchedHardQuestions) === watchedTotalQuestions

    return hasSubjects && hasValidQuestionCount && hasValidDistribution
  }

  const handleNextStep = async () => {
    if (generationStep === 1) {
      // Load available questions for manual selection
      try {
        const questionsPromises = watchedSubjectIds.map(subjectId =>
          subjectService.getSubjectQuestions(subjectId)
        )
        const results = await Promise.all(questionsPromises)
        const allQuestions = results.flatMap(result => result.data?.questions || [])
        setAvailableQuestions(allQuestions)
        setGenerationStep(2)
      } catch (error) {
        showOperationToast.error('carregamento das questões')
      }
    }
  }

  const handlePrevStep = () => {
    if (generationStep === 2) {
      setGenerationStep(1)
      setSelectedQuestions([])
      setAvailableQuestions([])
    }
  }

  const handleQuickGenerate = async (data) => {
    try {
      setLoading(true)
      
      const examData = {
        ...data,
        questionSelection: {
          type: 'automatic',
          distribution: generateQuestionDistribution(),
          subjectIds: data.subjectIds
        },
        generationType: 'automatic'
      }
      
      // Validar dados antes de enviar
      if (!examData.title) {
        showOperationToast.validationError('Título da prova é obrigatório')
        return
      }
      
      if (!examData.subjectIds || examData.subjectIds.length === 0) {
        showOperationToast.validationError('Selecione pelo menos uma disciplina')
        return
      }
      
      if (examData.totalQuestions <= 0) {
        showOperationToast.validationError('Número de questões deve ser maior que zero')
        return
      }
      
      const response = await examService.createExam(examData)
      
      if (response.data?.success) {
        showOperationToast.created('Prova')
        if (onExamGenerated) {
          onExamGenerated(response.data.data.exam)
        }
        handleClose()
      } else {
        throw new Error(response.data?.message || 'Erro ao criar prova')
      }
      
    } catch (error) {
      console.error('Erro ao gerar prova:', error)
      
      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.data?.missing) {
          // Erro de questões insuficientes
          const missing = errorData.data.missing
          const missingText = Object.entries(missing)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => `${value} ${QUESTION_DIFFICULTY_LABELS[key].toLowerCase()}`)
            .join(', ')
          
          showOperationToast.error(`Questões insuficientes. Faltam: ${missingText}`)
        } else {
          showOperationToast.error(errorData.message || 'Dados inválidos')
        }
      } else {
        showOperationToast.error('criação da prova')
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    const examData = {
      ...data,
      questionSelection: {
        type: 'automatic',
        distribution: generateQuestionDistribution(),
        subjectIds: data.subjectIds
      },
      generationType: 'automatic'
    }
    
    if (onExamGenerated) {
      onExamGenerated(examData)
    }
  }

  const handleClose = () => {
    reset()
    setGenerationStep(1)
    setSelectedQuestions([])
    setAvailableQuestions([])
    onClose()
  }

  if (!isOpen) return null

  const distribution = generateQuestionDistribution()
  const totalAvailable = availableQuestions.length

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gerar Nova Prova"
      size="xl"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {generationStep === 2 && (
              <Button
                variant="secondary"
                onClick={handlePrevStep}
              >
                Voltar
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {generationStep === 1 && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleSubmit(handleQuickGenerate)}
                  disabled={!isValid || !canGenerateExam() || loading}
                  loading={loading}
                >
                  Gerar Automaticamente
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={!isValid || !canGenerateExam()}
                >
                  Próximo: Selecionar Questões
                </Button>
              </>
            )}
            
            {generationStep === 2 && (
              <Button
                type="submit"
                form="exam-generator-form"
                variant="primary"
                disabled={selectedQuestions.length !== watchedTotalQuestions || loading}
                loading={loading}
              >
                Gerar Prova
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form id="exam-generator-form" onSubmit={handleSubmit(onSubmit)}>
        {generationStep === 1 && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações da Prova
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="Título da Prova"
                  {...register('title', {
                    required: 'Título é obrigatório',
                    minLength: {
                      value: 3,
                      message: 'Título deve ter pelo menos 3 caracteres'
                    }
                  })}
                  error={errors.title?.message}
                  placeholder="Ex: Prova de Matemática - 1º Bimestre"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Descrição opcional da prova..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Número de Questões"
                    type="number"
                    {...register('totalQuestions', {
                      required: 'Número de questões é obrigatório',
                      min: {
                        value: 1,
                        message: 'Deve ter pelo menos 1 questão'
                      },
                      max: {
                        value: 100,
                        message: 'Máximo de 100 questões'
                      }
                    })}
                    error={errors.totalQuestions?.message}
                    min="1"
                    max="100"
                    required
                  />

                  <Input
                    label="Tempo Limite (minutos)"
                    type="number"
                    {...register('timeLimit', {
                      min: {
                        value: 5,
                        message: 'Mínimo de 5 minutos'
                      },
                      max: {
                        value: 480,
                        message: 'Máximo de 8 horas'
                      }
                    })}
                    error={errors.timeLimit?.message}
                    min="5"
                    max="480"
                    placeholder="0 para sem limite"
                    helperText="Deixe em branco para prova sem limite de tempo"
                  />
                </div>
              </div>
            </div>

            {/* Seleção de Disciplinas */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Disciplinas
              </h3>
              
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma disciplina encontrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subjects.map((subject) => (
                    <label
                      key={subject.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                        watchedSubjectIds?.includes(subject.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Controller
                        name="subjectIds"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <input
                            type="checkbox"
                            checked={value?.includes(subject.id) || false}
                            onChange={(e) => {
                              const currentValue = value || []
                              if (e.target.checked) {
                                onChange([...currentValue, subject.id])
                              } else {
                                onChange(currentValue.filter(id => id !== subject.id))
                              }
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded mr-2"
                            style={{ backgroundColor: subject.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {subject.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {subject.questionsCount || 0} questões disponíveis
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Distribuição de Questões */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Distribuição por Dificuldade
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Questões Fáceis"
                  type="number"
                  {...register('easyQuestions', {
                    required: 'Campo obrigatório',
                    min: { value: 0, message: 'Mínimo 0' }
                  })}
                  error={errors.easyQuestions?.message}
                  min="0"
                />
                
                <Input
                  label="Questões Médias"
                  type="number"
                  {...register('mediumQuestions', {
                    required: 'Campo obrigatório',
                    min: { value: 0, message: 'Mínimo 0' }
                  })}
                  error={errors.mediumQuestions?.message}
                  min="0"
                />
                
                <Input
                  label="Questões Difíceis"
                  type="number"
                  {...register('hardQuestions', {
                    required: 'Campo obrigatório',
                    min: { value: 0, message: 'Mínimo 0' }
                  })}
                  error={errors.hardQuestions?.message}
                  min="0"
                />
              </div>

              {/* Validation Message */}
              {(watchedEasyQuestions + watchedMediumQuestions + watchedHardQuestions) !== watchedTotalQuestions && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        A soma das questões por dificuldade ({watchedEasyQuestions + watchedMediumQuestions + watchedHardQuestions}) 
                        deve ser igual ao total de questões ({watchedTotalQuestions}).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Configurações Avançadas */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configurações Avançadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Número de Variações"
                  type="number"
                  {...register('totalVariations', {
                    required: 'Campo obrigatório',
                    min: { value: 1, message: 'Mínimo 1 variação' },
                    max: { value: 50, message: 'Máximo 50 variações' }
                  })}
                  error={errors.totalVariations?.message}
                  min="1"
                  max="50"
                  helperText="Número de versões diferentes da prova"
                />

                <Input
                  label="Nota de Aprovação"
                  type="number"
                  step="0.1"
                  {...register('passingScore', {
                    min: { value: 0, message: 'Mínimo 0' },
                    max: { value: 10, message: 'Máximo 10' }
                  })}
                  error={errors.passingScore?.message}
                  min="0"
                  max="10"
                  placeholder="6.0"
                />
              </div>

              {/* Instructions */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instruções da Prova
                </label>
                <textarea
                  {...register('instructions')}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Digite as instruções que aparecerão no início da prova..."
                />
              </div>

              {/* Options */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center">
                  <input
                    {...register('randomizeQuestions')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Embaralhar ordem das questões
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('randomizeAlternatives')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Embaralhar alternativas das questões
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('allowReview')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Permitir revisão antes de finalizar
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('showCorrectAnswers')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Mostrar respostas corretas após finalização
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {generationStep === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Seleção Manual de Questões
              </h3>
              <p className="text-sm text-blue-700">
                Selecione exatamente {watchedTotalQuestions} questões das {totalAvailable} disponíveis.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                Selecionadas: {selectedQuestions.length} / {watchedTotalQuestions}
              </div>
            </div>

            {/* Question List */}
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {availableQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedQuestions.includes(question.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => {
                      if (selectedQuestions.includes(question.id)) {
                        setSelectedQuestions(prev => prev.filter(id => id !== question.id))
                      } else if (selectedQuestions.length < watchedTotalQuestions) {
                        setSelectedQuestions(prev => [...prev, question.id])
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {QUESTION_DIFFICULTY_LABELS[question.difficulty]}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {question.alternatives?.length || 0} alternativas
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {question.text}
                        </p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {availableQuestions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Nenhuma questão encontrada nas disciplinas selecionadas.
                </p>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}

export default ExamGenerator