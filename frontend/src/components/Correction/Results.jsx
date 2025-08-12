import React, { useState } from 'react'
import { formatDateTime, formatDuration } from '../../utils/helpers'
import Button from '../Common/Button'

const Results = ({
  exam,
  submission,
  onRetakeExam,
  onViewCorrection,
  onShareResult,
  showActions = true
}) => {
  const [showDetails, setShowDetails] = useState(false)

  if (!submission) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum resultado encontrado
        </h3>
        <p className="text-gray-500">
          Você ainda não fez esta prova ou os resultados não estão disponíveis.
        </p>
      </div>
    )
  }

  const score = submission.score || 0
  const totalQuestions = exam?.totalQuestions || submission.totalQuestions || 0
  const correctAnswers = submission.correctAnswers || 0
  const timeSpent = submission.timeSpent || 0

  const getScoreStatus = (score) => {
    if (score >= 70) return { status: 'approved', label: 'Aprovado', color: 'green' }
    if (score >= 50) return { status: 'partial', label: 'Parcial', color: 'yellow' }
    return { status: 'failed', label: 'Reprovado', color: 'red' }
  }

  const scoreStatus = getScoreStatus(score)

  const getGradeLabel = (score) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Resultado Principal */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className={`bg-${scoreStatus.color}-50 border-b border-${scoreStatus.color}-200 px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resultado da Prova
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {exam?.title || 'Prova'}
              </p>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${scoreStatus.color}-100 text-${scoreStatus.color}-800`}>
              {scoreStatus.label}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Score Display */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-${scoreStatus.color}-100 mb-4`}>
              <div className="text-center">
                <div className={`text-4xl font-bold text-${scoreStatus.color}-600`}>
                  {score.toFixed(1)}%
                </div>
                <div className={`text-lg font-medium text-${scoreStatus.color}-600`}>
                  {getGradeLabel(score)}
                </div>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sua pontuação final
            </h2>
            <p className="text-gray-600">
              {correctAnswers} de {totalQuestions} questões corretas
            </p>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Acertos</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {totalQuestions - correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Erros</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {timeSpent ? formatDuration(Math.floor(timeSpent / 60)) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Tempo Total</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Taxa de Acerto</span>
              <span>{score.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-${scoreStatus.color}-500 h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>

          {/* Detalhes da Submissão */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Informações da Submissão
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {submission.submittedAt && (
                <div>
                  <span className="font-medium text-gray-700">Data de submissão:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDateTime(submission.submittedAt)}
                  </span>
                </div>
              )}
              
              {timeSpent && (
                <div>
                  <span className="font-medium text-gray-700">Tempo gasto:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDuration(Math.floor(timeSpent / 60))}
                  </span>
                </div>
              )}
              
              {exam?.timeLimit && (
                <div>
                  <span className="font-medium text-gray-700">Tempo limite:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDuration(exam.timeLimit)}
                  </span>
                </div>
              )}
              
              {submission.attempts && (
                <div>
                  <span className="font-medium text-gray-700">Tentativa:</span>
                  <span className="ml-2 text-gray-600">
                    {submission.attempts}ª tentativa
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Performance por Dificuldade */}
          {submission.performanceByDifficulty && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Performance por Dificuldade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(submission.performanceByDifficulty).map(([difficulty, data]) => {
                  const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0
                  const difficultyConfig = {
                    easy: { label: 'Fácil', color: 'green' },
                    medium: { label: 'Médio', color: 'yellow' },
                    hard: { label: 'Difícil', color: 'red' }
                  }
                  const config = difficultyConfig[difficulty] || { label: difficulty, color: 'gray' }

                  return (
                    <div key={difficulty} className={`bg-${config.color}-50 rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium text-${config.color}-800`}>
                          {config.label}
                        </span>
                        <span className={`text-lg font-bold text-${config.color}-600`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {data.correct}/{data.total} questões
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${config.color}-500 h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Feedback do Professor */}
          {submission.feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Feedback do Professor
              </h3>
              <p className="text-blue-800 whitespace-pre-wrap">
                {submission.feedback}
              </p>
            </div>
          )}

          {/* Ações */}
          {showActions && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {onViewCorrection && (
                  <Button
                    variant="primary"
                    onClick={onViewCorrection}
                    className="flex-1 sm:flex-none"
                    icon={
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                  >
                    Ver Correção Detalhada
                  </Button>
                )}

                {onRetakeExam && exam?.allowRetake && (
                  <Button
                    variant="secondary"
                    onClick={onRetakeExam}
                    className="flex-1 sm:flex-none"
                    icon={
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    }
                  >
                    Refazer Prova
                  </Button>
                )}

                {onShareResult && (
                  <Button
                    variant="secondary"
                    onClick={onShareResult}
                    className="flex-1 sm:flex-none"
                    icon={
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    }
                  >
                    Compartilhar
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex-1 sm:flex-none"
                  icon={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDetails ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  }
                >
                  {showDetails ? 'Ocultar' : 'Ver'} Detalhes
                </Button>
              </div>
            </div>
          )}

          {/* Detalhes Expandidos */}
          {showDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estatísticas Detalhadas
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {((correctAnswers / totalQuestions) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Taxa de Acerto</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {submission.rank || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Posição</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {timeSpent && totalQuestions ? 
                      formatDuration(Math.floor(timeSpent / 60 / totalQuestions)) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Tempo/Questão</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {submission.efficiency ? `${submission.efficiency.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Eficiência</div>
                </div>
              </div>

              {/* Comparação com a Turma */}
              {submission.classStats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Comparação com a Turma
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Média da turma:</span>
                      <span className="ml-2 text-gray-600">
                        {submission.classStats.average?.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Maior nota:</span>
                      <span className="ml-2 text-gray-600">
                        {submission.classStats.highest?.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Menor nota:</span>
                      <span className="ml-2 text-gray-600">
                        {submission.classStats.lowest?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mensagem Motivacional */}
      <div className={`bg-${scoreStatus.color}-50 border border-${scoreStatus.color}-200 rounded-lg p-6`}>
        <div className="flex">
          <div className={`flex-shrink-0 text-${scoreStatus.color}-400`}>
            {scoreStatus.status === 'approved' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : scoreStatus.status === 'partial' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium text-${scoreStatus.color}-800`}>
              {scoreStatus.status === 'approved' && 'Parabéns! Você foi aprovado!'}
              {scoreStatus.status === 'partial' && 'Bom trabalho! Continue se esforçando.'}
              {scoreStatus.status === 'failed' && 'Não desanime! Use este resultado para melhorar.'}
            </h3>
            <div className={`mt-2 text-sm text-${scoreStatus.color}-700`}>
              <p>
                {scoreStatus.status === 'approved' && 
                  'Excelente desempenho! Você demonstrou domínio do conteúdo.'
                }
                {scoreStatus.status === 'partial' && 
                  'Você está no caminho certo. Revise os tópicos onde teve dificuldade.'
                }
                {scoreStatus.status === 'failed' && 
                  'Revise o material e tente novamente. O erro faz parte do aprendizado.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results