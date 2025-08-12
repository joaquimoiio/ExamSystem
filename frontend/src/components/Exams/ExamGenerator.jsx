import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../Common/Modal'
import Button from '../Common/Button'
import Input from '../Common/Input'
import Loading from '../Common/Loading'
import { useApi } from '../../hooks/useApi'
import { apiClient } from '../../services/api'
import { QUESTION_DIFFICULTIES, QUESTION_DIFFICULTY_LABELS } from '../../utils/constants'

const ExamGenerator = ({
  isOpen,
  onClose,
  onExamGenerated,
  loading = false
}) => {
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [questionFilters, setQuestionFilters] = useState({})
  const [generationStep, setGenerationStep] = useState(1)
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])

  const { useApiQuery } = useApi()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      subjectIds: [],
      totalQuestions: 10,
      timeLimit: 60,
      difficulty: {
        easy: 30,
        medium: 50,
        hard: 20
      },
      randomizeQuestions: true,
      randomizeAlternatives: true,
      includeExplanations: false,
      allowRetake: false,
      showResultsImmediately: true
    }
  })

  // Fetch subjects
  const { data: subjectsData } = useApiQuery(
    ['subjects'],
    () => apiClient.get('/subjects'),
    { enabled: isOpen }
  )

  const subjects = subjectsData?.data?.subjects || []
  const watchedSubjectIds = watch('subjectIds')
  const watchedTotalQuestions = watch('totalQuestions')
  const watchedDifficulty = watch('difficulty')

  // Fetch questions when subjects change
  useEffect(() => {
    if (watchedSubjectIds?.length > 0) {
      fetchAvailableQuestions()
    }
  }, [watchedSubjectIds])

  const fetchAvailableQuestions = async () => {
    try {
      const response = await apiClient.get('/questions', {
        params: {
          subjectIds: watchedSubjectIds.join(','),
          active: true,
          limit: 1000
        }
      })
      setAvailableQuestions(response.data.questions || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setAvailableQuestions([])
    }
  }

  const generateQuestionDistribution = () => {
    const total = watchedTotalQuestions
    const difficulty = watchedDifficulty

    const distribution = {
      easy: Math.round((total * difficulty.easy) / 100),
      medium: Math.round((total * difficulty.medium) / 100),
      hard: Math.round((total * difficulty.hard) / 100)
    }

    // Adjust for rounding differences
    const sum = distribution.easy + distribution.medium + distribution.hard
    if (sum !== total) {
      const diff = total - sum
      if (diff > 0) {
        distribution.medium += diff
      } else {
        distribution.medium = Math.max(0, distribution.medium + diff)
      }
    }

    return distribution
  }

  const getQuestionsByDifficulty = (difficulty) => {
    return availableQuestions.filter(q => q.difficulty === difficulty)
  }

  const canGenerateExam = () => {
    const distribution = generateQuestionDistribution()
    const easyQuestions = getQuestionsByDifficulty('easy').length
    const mediumQuestions = getQuestionsByDifficulty('medium').length
    const hardQuestions = getQuestionsByDifficulty('hard').length

    return (
      easyQuestions >= distribution.easy &&
      mediumQuestions >= distribution.medium &&
      hardQuestions >= distribution.hard
    )
  }

  const handleSubjectToggle = (subjectId) => {
    const currentSubjects = watchedSubjectIds || []
    const newSubjects = currentSubjects.includes(subjectId)
      ? currentSubjects.filter(id => id !== subjectId)
      : [...currentSubjects, subjectId]
    
    setValue('subjectIds', newSubjects)
    setSelectedSubjects(newSubjects)
  }

  const handleDifficultyChange = (difficulty, value) => {
    const currentDifficulty = watchedDifficulty
    const newDifficulty = {
      ...currentDifficulty,
      [difficulty]: parseInt(value)
    }
    setValue('difficulty', newDifficulty)
  }

  const handleAutoSelectQuestions = () => {
    const distribution = generateQuestionDistribution()
    const selected = []

    // Select questions for each difficulty
    Object.entries(distribution).forEach(([difficulty, count]) => {
      const questionsForDifficulty = getQuestionsByDifficulty(difficulty)
      const shuffled = [...questionsForDifficulty].sort(() => Math.random() - 0.5)
      selected.push(...shuffled.slice(0, count))
    })

    setSelectedQuestions(selected)
  }

  const handleQuestionToggle = (question) => {
    const isSelected = selectedQuestions.some(q => q.id === question.id)
    if (isSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id))
    } else if (selectedQuestions.length < watchedTotalQuestions) {
      setSelectedQuestions([...selectedQuestions, question])
    }
  }

  const handleNextStep = () => {
    if (generationStep === 1 && canGenerateExam()) {
      setGenerationStep(2)
      handleAutoSelectQuestions()
    }
  }

  const handlePrevStep = () => {
    if (generationStep === 2) {
      setGenerationStep(1)
    }
  }

  const onSubmit = (data) => {
    const examData = {
      ...data,
      questions: selectedQuestions.map(q => q.id),
      generationType: 'manual'
    }
    
    if (onExamGenerated) {
      onExamGenerated(examData)
    }
  }

  const handleQuickGenerate = async (data) => {
    const distribution = generateQuestionDistribution()
    
    const examData = {
      ...data,
      questionSelection: {
        type: 'automatic',
        distribution,
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
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={watchedSubjectIds?.includes(subject.id) || false}
                        onChange={() => handleSubjectToggle(subject.id)}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded mr-3 flex-shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {subject.name}
                        </span>
                        {subject.questionCounts?.total && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({subject.questionCounts.total} questões)
                          </span>
                        )}
                      </div>
                      {watchedSubjectIds?.includes(subject.id) && (
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              )}
              
              {errors.subjectIds && (
                <p className="mt-2 text-sm text-red-600">{errors.subjectIds.message}</p>
              )}
            </div>

            {/* Distribuição de Dificuldade */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Distribuição por Dificuldade
              </h3>
              
              <div className="space-y-4">
                {Object.entries(QUESTION_DIFFICULTIES).map(([key, difficulty]) => {
                  const percentage = watchedDifficulty?.[difficulty] || 0
                  const questionCount = Math.round((watchedTotalQuestions * percentage) / 100)
                  const available = getQuestionsByDifficulty(difficulty).length
                  
                  return (
                    <div key={difficulty} className="flex items-center space-x-4">
                      <div className="w-20">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {QUESTION_DIFFICULTY_LABELS[difficulty]}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={percentage}
                          onChange={(e) => handleDifficultyChange(difficulty, e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="w-16 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {percentage}%
                        </span>
                      </div>
                      
                      <div className="w-24 text-right text-sm">
                        <span className={`${questionCount > available ? 'text-red-600' : 'text-gray-600'}`}>
                          {questionCount}/{available}
                        </span>
                      </div>
                    </div>
                  )
                })}
                
                <div className="text-xs text-gray-500">
                  Total: {watchedDifficulty?.easy + watchedDifficulty?.medium + watchedDifficulty?.hard}%
                  {watchedDifficulty?.easy + watchedDifficulty?.medium + watchedDifficulty?.hard !== 100 && (
                    <span className="text-red-600 ml-2">
                      (Deve somar 100%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Opções Avançadas */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Opções Avançadas
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('randomizeQuestions')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Embaralhar ordem das questões
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('randomizeAlternatives')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Embaralhar alternativas
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('includeExplanations')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Incluir explicações no resultado
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('allowRetake')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Permitir refazer a prova
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('showResultsImmediately')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Mostrar resultado imediatamente
                  </span>
                </label>
              </div>
            </div>

            {/* Resumo */}
            {watchedSubjectIds?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Resumo da Prova
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Total de questões:</span>
                    <span className="ml-2 text-gray-600">{watchedTotalQuestions}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Questões disponíveis:</span>
                    <span className={`ml-2 ${totalAvailable >= watchedTotalQuestions ? 'text-green-600' : 'text-red-600'}`}>
                      {totalAvailable}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Fáceis:</span>
                    <span className="ml-2 text-gray-600">{distribution.easy}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Médias:</span>
                    <span className="ml-2 text-gray-600">{distribution.medium}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Difíceis:</span>
                    <span className="ml-2 text-gray-600">{distribution.hard}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Tempo limite:</span>
                    <span className="ml-2 text-gray-600">
                      {watch('timeLimit') ? `${watch('timeLimit')} min` : 'Sem limite'}
                    </span>
                  </div>
                </div>

                {!canGenerateExam() && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Atenção:</strong> Não há questões suficientes para gerar a prova com a distribuição selecionada.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {generationStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selecionar Questões ({selectedQuestions.length}/{watchedTotalQuestions})
              </h3>
              
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Questões selecionadas automaticamente baseadas na distribuição
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAutoSelectQuestions}
                >
                  Reselecionar Automaticamente
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso da seleção</span>
                  <span>{selectedQuestions.length}/{watchedTotalQuestions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedQuestions.length / watchedTotalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Questions by Difficulty */}
              {Object.entries(QUESTION_DIFFICULTIES).map(([key, difficulty]) => {
                const questionsForDifficulty = getQuestionsByDifficulty(difficulty)
                const selectedForDifficulty = selectedQuestions.filter(q => q.difficulty === difficulty)
                const neededForDifficulty = distribution[difficulty]

                if (questionsForDifficulty.length === 0) return null

                return (
                  <div key={difficulty} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-md font-medium ${
                        difficulty === 'easy' ? 'text-green-800' :
                        difficulty === 'medium' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        Questões {QUESTION_DIFFICULTY_LABELS[difficulty]} 
                        <span className="ml-2 text-sm text-gray-600">
                          ({selectedForDifficulty.length}/{neededForDifficulty})
                        </span>
                      </h4>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {questionsForDifficulty.map((question) => {
                        const isSelected = selectedQuestions.some(q => q.id === question.id)
                        const canSelect = !isSelected && selectedQuestions.length < watchedTotalQuestions

                        return (
                          <label
                            key={question.id}
                            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                              isSelected
                                ? 'border-blue-300 bg-blue-50'
                                : canSelect
                                ? 'border-gray-200 hover:bg-gray-50'
                                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleQuestionToggle(question)}
                              disabled={!canSelect && !isSelected}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {question.statement.substring(0, 100)}
                                {question.statement.length > 100 && '...'}
                              </p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span>{question.points} pts</span>
                                {question.tags && question.tags.length > 0 && (
                                  <span>#{question.tags.join(', #')}</span>
                                )}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}

export default ExamGenerator