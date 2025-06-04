import { useState } from 'react'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

const TrendsChart = ({ trends, loading }) => {
  const [selectedMetric, setSelectedMetric] = useState('attendance')

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-32 h-6 bg-gray-200 rounded"></div>
          <div className="w-24 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 h-8 bg-gray-200 rounded"></div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const metrics = [
    { key: 'attendance', label: 'Attendance', color: 'bg-green-500' },
    { key: 'bookings', label: 'Lab Bookings', color: 'bg-blue-500' },
  ]

  const getMaxValue = (data, metric) => {
    return Math.max(...data.map(item => item[metric] || 0))
  }

  const calculateTrend = (data, metric) => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 }

    const recent = data.slice(-3).reduce((sum, item) => sum + (item[metric] || 0), 0) / 3
    const previous = data.slice(-6, -3).reduce((sum, item) => sum + (item[metric] || 0), 0) / 3

    if (previous === 0) return { direction: 'stable', percentage: 0 }

    const percentage = ((recent - previous) / previous) * 100
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable'

    return { direction, percentage: Math.abs(percentage) }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const maxValue = getMaxValue(trends, selectedMetric)
  const trend = calculateTrend(trends, selectedMetric)

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
      default:
        return <ChartBarIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg">
            <ChartBarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Weekly Trends</h3>
            <p className="text-sm text-gray-500">Last 7 days performance</p>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedMetric === metric.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center space-x-2 mb-4">
        {getTrendIcon(trend.direction)}
        <span className={`text-sm font-medium ${getTrendColor(trend.direction)}`}>
          {trend.direction === 'up' && 'Trending up'}
          {trend.direction === 'down' && 'Trending down'}
          {trend.direction === 'stable' && 'Stable'}
          {trend.percentage > 0 && ` ${trend.percentage.toFixed(1)}%`}
        </span>
        <span className="text-xs text-gray-500">vs previous period</span>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {trends.slice(-7).map((item, index) => {
          const value = item[selectedMetric] || 0
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          const selectedColor = metrics.find(m => m.key === selectedMetric)?.color || 'bg-gray-500'

          return (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-xs text-gray-600 font-medium">
                {formatDate(item.date)}
              </div>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`h-full ${selectedColor} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-medium text-gray-700">
                      {value}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-12 text-xs text-gray-500 text-right">
                {percentage.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {trends.reduce((sum, item) => sum + (item[selectedMetric] || 0), 0)}
            </p>
            <p className="text-xs text-gray-500">Total This Week</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {trends.length > 0 ? Math.round(trends.reduce((sum, item) => sum + (item[selectedMetric] || 0), 0) / trends.length) : 0}
            </p>
            <p className="text-xs text-gray-500">Daily Average</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {Math.max(...trends.map(item => item[selectedMetric] || 0))}
            </p>
            <p className="text-xs text-gray-500">Peak Day</p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 flex items-center justify-center text-xs text-gray-400">
        <CalendarDaysIcon className="h-3 w-3 mr-1" />
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}

export default TrendsChart
