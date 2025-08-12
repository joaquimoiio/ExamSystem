import React from 'react'
import { ALTERNATIVE_LETTERS } from '../../utils/constants'
import { formatDateTime, formatDuration } from '../../utils/helpers'

const CorrectionSummary = ({
  exam,
  submission,
  showCorrectAnswers = true,
  showExplanations = true,
  compact = false
}) => {
  if (!submission || !exam) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Dados não disponíveis</p>
      </div>
    )
  }

  const questions = exam.questions || []
  const answers = submission.answers || []
  const score = submission.score || 0
  const totalQuestions = questions.length
  const correctAnswers = answers.filter(answer => answer.isCorrect).length

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-100'
    if (score >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Resultado da Prova
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${getScoreBgColor(score)} rounded-lg p-4 text-center`}>
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Nota Final</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {correctAnswers}
            </div>
            <div className="text-sm text-gray-600">Acertos</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {totalQuestions - correctAnswers}
            </div>
            <div className="text-sm text-gray-600">Erros</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">
              {totalQuestions}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        {/* Informações da Submissão */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Prova:</span>
            <span className="ml-2 text-gray-600">{exam.title}</span>
          </div>
          
          {exam.subject && (
            <div>
              <span className="font-medium text-gray-700">Disciplina:</span>
              <span className="ml-2 text-gray-600">{exam.subject.name}</span>
            </div>
          )}
          
          {submission.submittedAt && (
            <div>
              <span className="font-medium text-gray-700">Data de submissão:</span>
              <span className="ml-2 text-gray-600">
                {formatDateTime(submission.submittedAt)}
              </span>
            </div>
          )}
          
          {submission.timeSpent && (
            <div>
              <span className="font-medium text-gray-700">Tempo gasto:</span>
              <span className="ml-2 text-gray-600">
                {formatDuration(Math.floor(submission.timeSpent / 60))}
              </span>
            </div>
          )}
        </div>

        {/* Gráfico de Performance por Dificuldade */}
        {!compact && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Performance por Dificuldade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['easy', 'medium', 'hard'].map(difficulty => {
                const diffQuestions = questions.filter(q => q.difficulty === difficulty)
                const diffCorrect = answers.filter((answer, index) => 
                  answer.isCorrect && questions[index]?.difficulty === difficulty
                ).length
                const diffPercentage = diffQuestions.length > 0 
                  ? (diffCorrect / diffQuestions.length) * 100 
                  : 0

                const difficultyLabels = {
                  easy: { label: 'Fácil', color: 'green' },
                  medium: { label: 'Médio', color: 'yellow' },
                  hard: { label: 'Difícil', color: 'red' }
                }

                const diffConfig = difficultyLabels[difficulty]

                return (
                  <div key={difficulty} className={`bg-${diffConfig.color}-50 rounded-lg p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium text-${diffConfig.color}-800`}>
                        {diffConfig.label}
                      </span>
                      <span className={`text-lg font-bold text-${diffConfig.color}-600`}>
                        {diffPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {diffCorrect}/{diffQuestions.length} questões
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${diffConfig.color}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${diffPercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Questões Detalhadas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Revisão das Questões
        </h2>
        
        <div className="space-y-6">
          {questions.map((question, questionIndex) => {
            const answer = answers[questionIndex]
            const isCorrect = answer?.isCorrect || false
            const selectedAlternative = answer?.selectedAlternative
            const correctAlternativeIndex = question.alternatives?.findIndex(alt => alt.isCorrect) ?? -1

            return (
              <div 
                key={questionIndex}
                className={`border rounded-lg p-4 ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                {/* Cabeçalho da Questão */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                      {questionIndex + 1}
                    </span>
                    <div>
                      {question.difficulty && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty === 'easy' ? 'Fácil' :
                           question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                        </span>
                      )}
                      {question.points && (
                        <span className="ml-2 text-sm text-gray-500">
                          {question.points} pt{question.points !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 ${
                    isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isCorrect ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">
                      {isCorrect ? 'Correto' : 'Incorreto'}
                    </span>
                  </div>
                </div>

                {/* Enunciado */}
                <div className="mb-4">
                  <p className="text-gray-900">{question.statement}</p>
                </div>

                {/* Alternativas */}
                <div className="space-y-2 mb-4">
                  {question.alternatives?.map((alternative, altIndex) => {
                    const isSelected = selectedAlternative === altIndex
                    const isCorrectAnswer = altIndex === correctAlternativeIndex
                    
                    let borderColor = 'border-gray-200'
                    let bgColor = 'bg-white'
                    
                    if (showCorrectAnswers && isCorrectAnswer) {
                      borderColor = 'border-green-300'
                      bgColor = 'bg-green-50'
                    } else if (isSelected && !isCorrectAnswer) {
                      borderColor = 'border-red-300'
                      bgColor = 'bg-red-50'
                    } else if (isSelected) {
                      borderColor = 'border-blue-300'
                      bgColor = 'bg-blue-50'
                    }

                    return (
                      <div
                        key={altIndex}
                        className={`flex items-start p-3 rounded border ${borderColor} ${bgColor}`}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                          showCorrectAnswers && isCorrectAnswer
                            ? 'bg-green-500 text-white'
                            : isSelected && !isCorrectAnswer
                            ? 'bg-red-500 text-white'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ALTERNATIVE_LETTERS[altIndex]}
                        </span>
                        <span className="text-sm text-gray-700 flex-1">
                          {alternative.text}
                        </span>
                        {isSelected && (
                          <span className="flex-shrink-0 ml-2">
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                        {showCorrectAnswers && isCorrectAnswer && (
                          <span className="flex-shrink-0 ml-2">
                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Resposta do Aluno */}
                <div className="text-sm mb-3">
                  <span className="font-medium text-gray-700">Sua resposta:</span>
                  <span className={`ml-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAlternative !== null && selectedAlternative !== undefined
                      ? `${ALTERNATIVE_LETTERS[selectedAlternative]} - ${question.alternatives[selectedAlternative]?.text}`
                      : 'Não respondida'
                    }
                  </span>
                </div>

                {/* Resposta Correta */}
                {showCorrectAnswers && !isCorrect && correctAlternativeIndex >= 0 && (
                  <div className="text-sm mb-3">
                    <span className="font-medium text-gray-700">Resposta correta:</span>
                    <span className="ml-2 text-green-600">
                      {ALTERNATIVE_LETTERS[correctAlternativeIndex]} - {question.alternatives[correctAlternativeIndex]?.text}
                    </span>
                  </div>
                )}

                {/* Explicação */}
                {showExplanations && question.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Explicação:</h4>
                    <p className="text-sm text-blue-800">{question.explanation}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Feedback Adicional */}
      {submission.feedback && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Feedback do Professor
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
          </div>
        </div>
      )}

      {/* Estatísticas Detalhadas */}
      {!compact && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Estatísticas Detalhadas
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {((correctAnswers / totalQuestions) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Taxa de Acerto</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {submission.timeSpent ? formatDuration(Math.floor(submission.timeSpent / 60)) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Tempo Total</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {submission.timeSpent && totalQuestions ? 
                  formatDuration(Math.floor(submission.timeSpent / 60 / totalQuestions)) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Tempo por Questão</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {submission.attempts || 1}
              </div>
              <div className="text-sm text-gray-500">Tentativas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CorrectionSummary