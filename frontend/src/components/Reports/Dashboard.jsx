import React, { useState } from 'react'
import Charts from './Charts'
import Statistics from './Statistics'
import Button from '../Common/Button'
import { formatPercentage, formatNumber } from '../../utils/helpers'

const Dashboard = ({ data, onExportPDF, onExportExcel, onRefresh }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('submissions')

  const periods = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '1y', label: 'Último ano' }
  ]

  const metrics = [
    { value: 'submissions', label: 'Submissões' },
    { value: 'scores', label: 'Notas' },
    { value: 'performance', label: 'Performance' },
    { value: 'usage', label: 'Uso da Plataforma' }
  ]

  const summaryCards = [
    {
      title: 'Total de Provas',
      value: data?.totalExams || 0,
      icon: '📝',
      color: 'bg-blue-100 text-blue-600',
      change: data?.examsChange || 0
    },
    {
      title: 'Submissões',
      value: data?.totalSubmissions || 0,
      icon: '✅',
      color: 'bg-green-100 text-green-600',
      change: data?.submissionsChange || 0
    },
    {
      title: 'Alunos Únicos',
      value: data?.uniqueStudents || 0,
      icon: '👥',
      color: 'bg-purple-100 text-purple-600',
      change: data?.studentsChange || 0
    },
    {
      title: 'Média Geral',
      value: data?.averageScore ? `${data.averageScore.toFixed(1)}%` : 'N/A',
      icon: '📊',
      color: 'bg-yellow-100 text-yellow-600',
      change: data?.scoreChange || 0
    }
  ]

  const chartData = {
    submissions: data?.submissionsOverTime || [],
    scores: data?.scoresOverTime || [],
    performance: data?.performanceData || [],
    usage: data?.usageData || []
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Métrica
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {metrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Atualizar
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportExcel}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Excel
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={onExportPDF}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${card.color}`}>
                    <span className="text-lg">{card.icon}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <span className="text-lg font-medium text-gray-900">
                        {card.value}
                      </span>
                      {card.change !== 0 && (
                        <span className={`ml-2 text-sm font-medium ${
                          card.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {card.change > 0 ? '+' : ''}{card.change}%
                        </span>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <Charts
        data={chartData[selectedMetric]}
        type="line"
        title={`${metrics.find(m => m.value === selectedMetric)?.label} - ${periods.find(p => p.value === selectedPeriod)?.label}`}
        height={400}
      />

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Charts
          data={data?.scoreDistribution || []}
          type="bar"
          title="Distribuição de Notas"
          height={300}
        />
        
        <Charts
          data={data?.difficultyDistribution || []}
          type="pie"
          title="Questões por Dificuldade"
          height={300}
        />
      </div>

      {/* Performance Statistics */}
      <Statistics data={data?.performanceStats || {}} />

      {/* Top Performers */}
      {data?.topPerformers && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Performers
          </h3>
          <div className="space-y-3">
            {data.topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {performer.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {performer.examsCompleted} provas realizadas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {performer.averageScore.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    Média geral
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data?.recentActivity && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Atividade Recente
          </h3>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {data.recentActivity.map((activity, index) => (
                <li key={index} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {activity.type === 'exam' ? '📝' : '✅'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.user} • {activity.timeAgo}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard