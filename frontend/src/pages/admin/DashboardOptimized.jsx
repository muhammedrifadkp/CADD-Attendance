import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMultipleDataFetching } from '../../hooks/useDataFetching'
import { teachersAPI, batchesAPI, studentsAPI, analyticsAPI, notificationsAPI } from '../../services/api'
import { pcAPI } from '../../services/labAPI'
import {
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BellIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDateLong } from '../../utils/dateUtils'
import BackButton from '../../components/BackButton'
import AnalyticsCards from '../../components/dashboard/AnalyticsCards'
import TrendsChart from '../../components/dashboard/TrendsChart'
import NotificationCenter from '../../components/dashboard/NotificationCenter'

const AdminDashboardOptimized = () => {
  const { user } = useAuth()
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Configure data fetching for multiple sources
  const fetchConfigs = useMemo(() => [
    {
      key: 'analytics',
      fetchFunction: analyticsAPI.getDashboardSummary,
      options: { fallbackData: { overview: {}, today: {}, trends: [] } }
    },
    {
      key: 'notifications',
      fetchFunction: notificationsAPI.getUnreadCount,
      options: { fallbackData: { unreadCount: 0 } }
    },
    {
      key: 'teachers',
      fetchFunction: teachersAPI.getTeachers,
      options: { fallbackData: [] }
    },
    {
      key: 'batches',
      fetchFunction: batchesAPI.getBatches,
      options: { fallbackData: [] }
    },
    {
      key: 'students',
      fetchFunction: studentsAPI.getStudents,
      options: { fallbackData: [] }
    },
    {
      key: 'pcs',
      fetchFunction: pcAPI.getPCs,
      options: { fallbackData: [] }
    }
  ], [])

  const { results, loading, errors, refetch } = useMultipleDataFetching(fetchConfigs)

  // Memoized computed values
  const stats = useMemo(() => {
    const analytics = results.analytics?.overview || {}
    const teachers = Array.isArray(results.teachers) ? results.teachers : []
    const batches = Array.isArray(results.batches) ? results.batches : []
    const students = Array.isArray(results.students) ? results.students : []
    const pcs = Array.isArray(results.pcs) ? results.pcs : []

    return {
      teachersCount: analytics.totalTeachers || teachers.length,
      batchesCount: analytics.totalBatches || batches.length,
      studentsCount: analytics.totalStudents || students.length,
      labPCs: analytics.totalPCs || pcs.length,
      activeBookings: results.analytics?.today?.lab?.bookings || 0,
      activeBatches: analytics.activeBatches || batches.filter(b => !b.isFinished).length
    }
  }, [results])

  const analytics = useMemo(() => ({
    overview: results.analytics?.overview || {},
    today: results.analytics?.today || {},
    trends: results.analytics?.trends || [],
    departments: results.analytics?.departments || []
  }), [results.analytics])

  const notifications = useMemo(() => ({
    unreadCount: results.notifications?.unreadCount || 0
  }), [results.notifications])

  // Memoized card configurations
  const mainCards = useMemo(() => [
    {
      name: 'Total Teachers',
      count: stats.teachersCount,
      icon: UserIcon,
      gradient: 'from-blue-500 to-blue-600',
      link: '/admin/teachers',
      description: 'Manage teaching staff'
    },
    {
      name: 'Total Batches',
      count: stats.batchesCount,
      icon: AcademicCapIcon,
      gradient: 'from-green-500 to-green-600',
      link: '/admin/batches',
      description: 'Active student groups'
    },
    {
      name: 'Total Students',
      count: stats.studentsCount,
      icon: UserGroupIcon,
      gradient: 'from-purple-500 to-purple-600',
      link: '/admin/students',
      description: 'Enrolled learners'
    },
    {
      name: 'Lab Computers',
      count: stats.labPCs,
      icon: ComputerDesktopIcon,
      gradient: 'from-red-500 to-pink-600',
      link: '/admin/lab/pcs',
      description: 'Computer lab systems'
    },
    {
      name: 'Active Bookings',
      count: stats.activeBookings,
      icon: CalendarDaysIcon,
      gradient: 'from-yellow-500 to-orange-500',
      link: '/admin/lab/management',
      description: 'Current lab sessions'
    }
  ], [stats])

  const analyticsCards = useMemo(() => {
    const attendancePercentage = analytics.today?.attendance?.percentage || 0
    const labUtilization = analytics.today?.lab?.utilization || 0

    return [
      {
        name: 'Today\'s Attendance',
        count: attendancePercentage,
        suffix: '%',
        icon: ClipboardDocumentCheckIcon,
        gradient: attendancePercentage >= 80 ? 'from-green-500 to-green-600' :
                 attendancePercentage >= 60 ? 'from-yellow-500 to-yellow-600' :
                 'from-red-500 to-red-600',
        link: '/admin/attendance',
        description: `${analytics.today?.attendance?.present || 0} of ${analytics.today?.attendance?.total || 0} present`
      },
      {
        name: 'Lab Utilization',
        count: labUtilization,
        suffix: '%',
        icon: ComputerDesktopIcon,
        gradient: labUtilization >= 70 ? 'from-blue-500 to-blue-600' :
                 labUtilization >= 40 ? 'from-yellow-500 to-yellow-600' :
                 'from-gray-500 to-gray-600',
        link: '/admin/lab',
        description: `${analytics.today?.lab?.bookings || 0} active bookings`
      },
      {
        name: 'Active Batches',
        count: stats.activeBatches,
        icon: AcademicCapIcon,
        gradient: 'from-purple-500 to-purple-600',
        link: '/admin/batches',
        description: 'Currently running batches'
      },
      {
        name: 'Notifications',
        count: notifications.unreadCount,
        icon: BellIcon,
        gradient: notifications.unreadCount > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
        link: '/admin/notifications',
        description: notifications.unreadCount > 0 ? 'Unread notifications' : 'All caught up!'
      }
    ]
  }, [analytics, stats, notifications])

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    await refetch()
    setLastUpdated(new Date())
  }, [refetch])

  // Memoized card component
  const DashboardCard = useMemo(() => ({ card, index, delay = 0 }) => (
    <Link
      key={card.name}
      to={card.link}
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
      style={{ animationDelay: `${(index + delay) * 100}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
            <card.icon className="h-6 w-6 text-white" />
          </div>
          <ChartBarIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{card.name}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {card.count}{card.suffix || ''}
          </p>
          <p className="text-xs text-gray-500">{card.description}</p>
        </div>
      </div>
    </Link>
  ), [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, <span className="text-yellow-400">{user?.name}</span>
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                CDC Administration Dashboard
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  System Online
                </span>
                <span>•</span>
                <span>{formatDateLong(new Date())}</span>
                <span>•</span>
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-200"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-4xl">{user?.name?.charAt(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {mainCards.map((card, index) => (
          <DashboardCard key={card.name} card={card} index={index} />
        ))}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsCards.map((card, index) => (
          <DashboardCard key={card.name} card={card} index={index} delay={5} />
        ))}
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trends Chart */}
        <div className="lg:col-span-2">
          <TrendsChart
            trends={analytics.trends}
            loading={false}
          />
        </div>

        {/* Notification Center */}
        <div className="lg:col-span-1">
          <NotificationCenter
            unreadCount={notifications.unreadCount}
            onUnreadCountChange={() => {}} // Handle in parent if needed
          />
        </div>
      </div>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">Some data could not be loaded:</h3>
          <ul className="text-yellow-700 text-sm mt-1">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>• {key}: {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardOptimized
