import React from 'react'
import { formatNumber, formatPercentage } from '../../utils/helpers'

const Statistics = ({ data }) => {
  const stats = [
    {
      title: 'Taxa de Participação',
      value: data.participationRate || 0,
      format: 'percentage',
      icon: '👥',
      color: 'text-blue-600',
      description: 'Porcentagem de alunos que realizaram provas'
    },
    {
      title: 'Taxa de Aprovação',
      value: data.passRate || 0,
      format: 'percentage',
      icon: '✅',
      color: 'text-green-600',
      description: 'Porcentagem de alunos aprovados (≥70%)'
    },
    {
      title: 'Tempo Médio',
      value: data.averageTime || 0,
      format: 'minutes',
      icon: '⏱️',
      color: 'text-purple-600',
      description: 'Tempo médio para completar provas'
    },
    {
      title: 'Taxa de Conclusão',
      value: data.completionRate || 0,
      format: 'percentage',
      icon: '🎯',
      color: 'text-orange-600',
      description: 'Porcentagem de provas completadas'
    }
  ]

  const formatValue = (value, format) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'minutes':
        return `${Math.round(value)} min`
      case 'number':
        return formatNumber(value)
      default:
        return value
    }
  }

  const getProgressColor = (value, format) => {
    if (format === 'percentage') {
      if (value >= 80) return 'bg-green-500'
      if (value >= 60) return 'bg-yellow-500'
      return 'bg-red-500'
    }
    return 'bg-blue-500'
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Estatísticas de Performance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{stat.icon}</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {stat.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {stat.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-lg font-semibold ${stat.color}`}>
                  {formatValue(stat.value, stat.format)}
                </span>
              </div>
            </div>
            
            {stat.format === 'percentage' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stat.value, stat.format)}`}
                  style={{ width: `${Math.min(stat.value, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Statistics */}
      {data.detailed && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Estatísticas Detalhadas
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.detailed.totalQuestions || 0)}
              </div>
              <div className="text-sm text-gray-500">
                Questões Cadastradas
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.detailed.totalAnswers || 0)}
              </div>
              <div className="text-sm text-gray-500">
                Respostas Enviadas
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.detailed.averageScore ? `${data.detailed.averageScore.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">
                Nota Média Geral
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance by Subject */}
      {data.bySubject && data.bySubject.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Performance por Disciplina
          </h4>
          
          <div className="space-y-3">
            {data.bySubject.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded mr-3"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {subject.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {subject.totalExams} provas • {subject.totalSubmissions} submissões
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {subject.averageScore ? `${subject.averageScore.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className={`text-xs ${
                    subject.passRate >= 70 ? 'text-green-600' :
                    subject.passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {subject.passRate ? `${subject.passRate.toFixed(1)}% aprovação` : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Difficulty Analysis */}
      {data.difficultyAnalysis && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Análise por Dificuldade
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {data.difficultyAnalysis.easy?.averageScore?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-green-600 font-medium">Fácil</div>
              <div className="text-xs text-gray-500">
                {data.difficultyAnalysis.easy?.count || 0} questões
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-600">
                {data.difficultyAnalysis.medium?.averageScore?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-yellow-600 font-medium">Médio</div>
              <div className="text-xs text-gray-500">
                {data.difficultyAnalysis.medium?.count || 0} questões
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-lg font-semibold text-red-600">
                {data.difficultyAnalysis.hard?.averageScore?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-red-600 font-medium">Difícil</div>
              <div className="text-xs text-gray-500">
                {data.difficultyAnalysis.hard?.count || 0} questões
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      {data.trends && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Tendências
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-blue-900">
                  Submissões
                </div>
                <div className="text-xs text-blue-600">
                  Últimos 30 dias
                </div>
              </div>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  data.trends.submissions > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.trends.submissions > 0 ? '+' : ''}{data.trends.submissions}%
                </span>
                <svg className={`ml-1 h-4 w-4 ${
                  data.trends.submissions > 0 ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={data.trends.submissions > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-green-900">
                  Performance Média
                </div>
                <div className="text-xs text-green-600">
                  Últimos 30 dias
                </div>
              </div>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  data.trends.performance > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.trends.performance > 0 ? '+' : ''}{data.trends.performance}%
                </span>
                <svg className={`ml-1 h-4 w-4 ${
                  data.trends.performance > 0 ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={data.trends.performance > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics