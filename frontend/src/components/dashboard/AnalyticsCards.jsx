import { Link } from 'react-router-dom'
import {
  ClipboardDocumentCheckIcon,
  ComputerDesktopIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const AnalyticsCards = ({ analytics, notifications, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
              <div className="w-32 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const analyticsCards = [
    {
      name: 'Today\'s Attendance',
      count: analytics.today?.attendance?.percentage || 0,
      suffix: '%',
      icon: ClipboardDocumentCheckIcon,
      gradient: analytics.today?.attendance?.percentage >= 80
        ? 'from-green-500 to-green-600'
        : analytics.today?.attendance?.percentage >= 60
        ? 'from-yellow-500 to-yellow-600'
        : 'from-red-500 to-red-600',
      link: '/admin/attendance',
      description: `${analytics.today?.attendance?.present || 0} of ${analytics.today?.attendance?.total || 0} present`,
      status: analytics.today?.attendance?.percentage >= 80 ? 'good' :
              analytics.today?.attendance?.percentage >= 60 ? 'warning' : 'critical'
    },
    {
      name: 'Lab Utilization',
      count: analytics.today?.lab?.utilization || 0,
      suffix: '%',
      icon: ComputerDesktopIcon,
      gradient: analytics.today?.lab?.utilization >= 70
        ? 'from-blue-500 to-blue-600'
        : analytics.today?.lab?.utilization >= 40
        ? 'from-indigo-500 to-indigo-600'
        : 'from-gray-500 to-gray-600',
      link: '/admin/lab',
      description: `${analytics.today?.lab?.bookings || 0} active bookings`,
      status: analytics.today?.lab?.utilization >= 70 ? 'good' :
              analytics.today?.lab?.utilization >= 40 ? 'warning' : 'low'
    },
    {
      name: 'Notifications',
      count: notifications.unreadCount || 0,
      icon: BellIcon,
      gradient: notifications.unreadCount > 10
        ? 'from-red-500 to-red-600'
        : notifications.unreadCount > 5
        ? 'from-orange-500 to-orange-600'
        : 'from-green-500 to-green-600',
      link: '/admin/notifications',
      description: notifications.unreadCount > 0 ? 'Unread notifications' : 'All caught up!',
      status: notifications.unreadCount > 10 ? 'critical' :
              notifications.unreadCount > 5 ? 'warning' : 'good'
    },
    {
      name: 'System Health',
      count: 'Good',
      icon: ArrowTrendingUpIcon,
      gradient: 'from-emerald-500 to-emerald-600',
      link: '/admin/settings',
      description: 'All systems operational',
      status: 'good'
    },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircleIcon className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Today's Analytics</h2>
        <Link
          to="/admin/analytics"
          className="text-sm text-cadd-red hover:text-cadd-pink font-medium transition-colors"
        >
          View Detailed Reports →
        </Link>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsCards.map((card, index) => (
          <Link
            key={card.name}
            to={card.link}
            className="dashboard-card group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden animate-slide-up touch-target"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
            <div className="dashboard-card-content relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`dashboard-card-icon p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(card.status)}
                  <ChartBarIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
              <div className="dashboard-card-stats">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.name}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {card.count}{card.suffix || ''}
                </p>
                <p className="text-xs text-gray-500">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analytics.overview?.totalStudents || 0}</p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analytics.overview?.activeBatches || 0}</p>
            <p className="text-sm text-gray-600">Active Batches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analytics.overview?.activePCs || 0}</p>
            <p className="text-sm text-gray-600">Active PCs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analytics.overview?.totalCourses || 0}</p>
            <p className="text-sm text-gray-600">Total Courses</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsCards
