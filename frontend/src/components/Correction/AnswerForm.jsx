import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../Common/Button'
import { ALTERNATIVE_LETTERS } from '../../utils/constants'
import { formatTime } from '../../utils/helpers'

const AnswerForm = ({
  exam,
  examVariation,
  onSubmit,
  onAnswerChange,
  initialAnswers = [],
  timeRemaining = null,
  isSubmitting = false,
  readOnly = false
}) => {
  const [currentAnswers, setCurrentAnswers] = useState(initialAnswers)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      answers: initialAnswers
    }
  })

  const watchedAnswers = watch('answers')
  const questions = examVariation?.questions || exam?.questions || []
  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (watchedAnswers) {
      setCurrentAnswers(watchedAnswers)
      if (onAnswerChange) {
        onAnswerChange(watchedAnswers)
      }
    }
  }, [watchedAnswers, onAnswerChange])

  const handleAnswerSelect = (questionIndex, alternativeIndex) => {
    if (readOnly) return

    const newAnswers = [...currentAnswers]
    newAnswers[questionIndex] = alternativeIndex
    setCurrentAnswers(newAnswers)
    setValue('answers', newAnswers)
  }

  const handleNavigation = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index)
  }

  const getAnsweredCount = () => {
    return currentAnswers.filter(answer => answer !== null && answer !== undefined).length
  }

  const getProgressPercentage = () => {
    return Math.round((getAnsweredCount() / questions.length) * 100)
  }

  const isQuestionAnswered = (index) => {
    return currentAnswers[index] !== null && currentAnswers[index] !== undefined
  }

  const onFormSubmit = (data) => {
    if (onSubmit) {
      onSubmit({
        examId: exam.id,
        variationId: examVariation?.id,
        answers: data.answers,
        timeSpent: exam.timeLimit ? (exam.timeLimit * 60) - (timeRemaining || 0) : null
      })
    }
  }

  if (!questions.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhuma questão encontrada.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header com informações da prova */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-sm text-gray-600">
              {exam.subject?.name} • {questions.length} questões
            </p>
          </div>
          
          {timeRemaining !== null && (
            <div className={`text-right ${
              timeRemaining < 300 ? 'text-red-600' : 
              timeRemaining < 900 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              <div className="text-lg font-semibold">
                {formatTime(new Date(timeRemaining * 1000))}
              </div>
              <div className="text-xs">tempo restante</div>
            </div>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso: {getAnsweredCount()}/{questions.length}</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Navegação por questões */}
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToQuestion(index)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors duration-200 ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : isQuestionAnswered(index)
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Questão atual */}
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                {currentQuestionIndex + 1}
              </span>
              <div>
                <span className="text-sm text-gray-500">
                  Questão {currentQuestionIndex + 1} de {questions.length}
                </span>
                {currentQuestion?.points && (
                  <span className="ml-2 text-sm text-gray-500">
                    • {currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {currentQuestion?.difficulty && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentQuestion.difficulty === 'easy' ? 'Fácil' :
                 currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </span>
            )}
          </div>

          {/* Enunciado */}
          <div className="mb-6">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {currentQuestion?.statement}
            </p>
          </div>

          {/* Alternativas */}
          <div className="space-y-3">
            {currentQuestion?.alternatives?.map((alternative, altIndex) => (
              <label
                key={altIndex}
                className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  currentAnswers[currentQuestionIndex] === altIndex
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200'
                } ${readOnly ? 'cursor-default' : ''}`}
              >
                <input
                  type="radio"
                  {...register(`answers.${currentQuestionIndex}`)}
                  value={altIndex}
                  checked={currentAnswers[currentQuestionIndex] === altIndex}
                  onChange={() => handleAnswerSelect(currentQuestionIndex, altIndex)}
                  disabled={readOnly}
                  className="sr-only"
                />
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                  currentAnswers[currentQuestionIndex] === altIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {ALTERNATIVE_LETTERS[altIndex]}
                </span>
                <span className="text-sm text-gray-700 flex-1">
                  {alternative.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleNavigation('prev')}
            disabled={currentQuestionIndex === 0}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
          >
            Anterior
          </Button>

          <div className="flex space-x-3">
            {!readOnly && (
              <Button
                type="submit"
                variant="success"
                loading={isSubmitting}
                disabled={getAnsweredCount() === 0}
              >
                Finalizar Prova
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => handleNavigation('next')}
            disabled={currentQuestionIndex === questions.length - 1}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
            iconPosition="right"
          >
            Próxima
          </Button>
        </div>
      </form>

      {/* Aviso sobre questões não respondidas */}
      {!readOnly && getAnsweredCount() < questions.length && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Questões não respondidas
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Você ainda tem {questions.length - getAnsweredCount()} questões não respondidas. 
                Certifique-se de responder todas antes de finalizar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnswerForm