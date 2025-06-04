import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { teachersAPI, batchesAPI, studentsAPI, analyticsAPI, notificationsAPI, departmentsAPI } from '../../services/api'
import { pcAPI, bookingAPI } from '../../services/labAPI'
import {
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BellIcon,
  ClipboardDocumentCheckIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { formatDateLong } from '../../utils/dateUtils'
import BackButton from '../../components/BackButton'
import AnalyticsCards from '../../components/dashboard/AnalyticsCards'
import TrendsChart from '../../components/dashboard/TrendsChart'
import NotificationCenter from '../../components/dashboard/NotificationCenter'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    teachersCount: 0,
    batchesCount: 0,
    studentsCount: 0,
    labPCs: 0,
    activeBookings: 0,
    loading: true,
  })

  const [analytics, setAnalytics] = useState({
    overview: {},
    today: {},
    trends: [],
    loading: true,
  })

  const [notifications, setNotifications] = useState({
    unreadCount: 0,
    recent: [],
    loading: true,
  })

  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Fetching dashboard data...')

        // Fetch analytics summary, notifications, and basic stats in parallel
        const [analyticsRes, notificationsRes, teachersRes] = await Promise.all([
          analyticsAPI.getDashboardSummary().catch(err => {
            console.error('Analytics API error:', err)
            return { data: { overview: {}, today: {}, trends: [] } }
          }),
          notificationsAPI.getUnreadCount().catch(err => {
            console.error('Notifications API error:', err)
            return { data: { unreadCount: 0 } }
          }),
          teachersAPI.getTeachers().catch(err => {
            console.error('Teachers API error:', err)
            return { data: [] }
          })
        ])

        // Update analytics state
        setAnalytics({
          overview: analyticsRes.data.overview || {},
          today: analyticsRes.data.today || {},
          trends: analyticsRes.data.trends || [],
          loading: false,
        })

        // Update notifications state
        setNotifications({
          unreadCount: notificationsRes.data.unreadCount || 0,
          recent: [],
          loading: false,
        })

        // Update basic stats from analytics data
        const overview = analyticsRes.data.overview || {}
        const today = analyticsRes.data.today || {}
        let statsData = {
          teachersCount: overview.totalTeachers || teachersRes.data.length,
          batchesCount: overview.totalBatches || 0,
          studentsCount: overview.totalStudents || 0,
          labPCs: overview.totalPCs || 0,
          activeBookings: today.lab?.bookings || 0,
          activeBatches: overview.activeBatches || 0,
          loading: false,
        }

        // If analytics didn't provide data, fetch from individual APIs
        if (!overview.totalBatches || !overview.totalStudents) {
          try {
            const [batchesRes, studentsRes] = await Promise.all([
              batchesAPI.getBatches(),
              studentsAPI.getStudents(),
            ])

            statsData.batchesCount = batchesRes.data.length
            statsData.studentsCount = studentsRes.data.length
          } catch (error) {
            console.error('Error fetching fallback data:', error)
          }
        }

        // Try to fetch lab data if not available from analytics
        if (!overview.totalPCs) {
          try {
            const pcsRes = await pcAPI.getPCs()
            statsData.labPCs = Array.isArray(pcsRes) ? pcsRes.length : 0
          } catch (labError) {
            console.error('Could not fetch PC data:', labError)
            statsData.labPCs = 0
          }
        }

        console.log('✅ Dashboard data fetched:', {
          analytics: analyticsRes.data,
          stats: statsData,
          notifications: notificationsRes.data
        })

        setStats(statsData)
        setLastUpdated(new Date())
        setIsRefreshing(false)

      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error)
        setStats(prev => ({ ...prev, loading: false }))
        setAnalytics(prev => ({ ...prev, loading: false }))
        setNotifications(prev => ({ ...prev, loading: false }))
        setIsRefreshing(false)
      }
    }

    fetchDashboardData()

    // Set up auto-refresh every 5 minutes for real-time data
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Refreshing dashboard data...')

        const [analyticsRes, notificationsRes] = await Promise.all([
          analyticsAPI.getDashboardSummary().catch(err => {
            console.error('Analytics API error:', err)
            return { data: { overview: {}, today: {}, trends: [], departments: [] } }
          }),
          notificationsAPI.getUnreadCount().catch(err => {
            console.error('Notifications API error:', err)
            return { data: { unreadCount: 0 } }
          })
        ])

        const dashboardData = analyticsRes.data || {}
        const overview = dashboardData.overview || {}
        const today = dashboardData.today || {}

        setAnalytics({
          overview: overview,
          today: today,
          trends: dashboardData.trends || [],
          departments: dashboardData.departments || [],
          loading: false,
        })

        setNotifications({
          unreadCount: notificationsRes.data.unreadCount || 0,
          recent: [],
          loading: false,
        })

        setStats({
          teachersCount: overview.totalTeachers || 0,
          batchesCount: overview.totalBatches || 0,
          studentsCount: overview.totalStudents || 0,
          labPCs: overview.totalPCs || 0,
          activeBookings: today.lab?.bookings || 0,
          activeBatches: overview.activeBatches || 0,
          loading: false,
        })

        setLastUpdated(new Date())
        setIsRefreshing(false)
        console.log('✅ Dashboard refreshed successfully')
      } catch (error) {
        console.error('❌ Error refreshing dashboard:', error)
        setIsRefreshing(false)
      }
    }

    await fetchDashboardData()
  }

  const cards = [
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
      gradient: 'from-cadd-red to-cadd-pink',
      link: '/admin/lab/pcs',
      description: 'Computer lab systems'
    },
    {
      name: 'Active Bookings',
      count: stats.activeBookings,
      icon: CalendarDaysIcon,
      gradient: 'from-cadd-yellow to-yellow-500',
      link: '/admin/lab/management',
      description: 'Current lab sessions'
    },
  ]

  // Additional analytics cards with dynamic data
  const analyticsCards = [
    {
      name: 'Today\'s Attendance',
      count: analytics.today?.attendance?.percentage || 0,
      suffix: '%',
      icon: ClipboardDocumentCheckIcon,
      gradient: (analytics.today?.attendance?.percentage || 0) >= 80
        ? 'from-green-500 to-green-600'
        : (analytics.today?.attendance?.percentage || 0) >= 60
        ? 'from-yellow-500 to-yellow-600'
        : 'from-red-500 to-red-600',
      link: '/admin/attendance',
      description: `${analytics.today?.attendance?.present || 0} of ${analytics.today?.attendance?.total || 0} present`
    },
    {
      name: 'Lab Utilization',
      count: analytics.today?.lab?.utilization || 0,
      suffix: '%',
      icon: ComputerDesktopIcon,
      gradient: (analytics.today?.lab?.utilization || 0) >= 70
        ? 'from-blue-500 to-blue-600'
        : (analytics.today?.lab?.utilization || 0) >= 40
        ? 'from-yellow-500 to-yellow-600'
        : 'from-gray-500 to-gray-600',
      link: '/admin/lab',
      description: `${analytics.today?.lab?.bookings || 0} active bookings`
    },
    {
      name: 'Active Batches',
      count: stats.activeBatches || 0,
      icon: AcademicCapIcon,
      gradient: 'from-purple-500 to-purple-600',
      link: '/admin/batches',
      description: 'Currently running batches'
    },
    {
      name: 'Notifications',
      count: notifications.unreadCount,
      icon: BellIcon,
      gradient: notifications.unreadCount > 0
        ? 'from-red-500 to-red-600'
        : 'from-green-500 to-green-600',
      link: '/admin/notifications',
      description: notifications.unreadCount > 0 ? 'Unread notifications' : 'All caught up!'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, <span className="text-cadd-yellow">{user?.name}</span>
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
                {lastUpdated && (
                  <>
                    <span>•</span>
                    <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            </div>
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-200 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
              <div className="w-32 h-32 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-4xl">{user?.name?.charAt(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats.loading || analytics.loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="stats-grid dashboard-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5">
            {cards.map((card, index) => (
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
                    <ChartBarIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <div className="dashboard-card-stats">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.name}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{card.count}</p>
                    <p className="text-xs text-gray-500">{card.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            {analyticsCards.map((card, index) => (
              <Link
                key={card.name}
                to={card.link}
                className="dashboard-card group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden animate-slide-up touch-target"
                style={{ animationDelay: `${(index + 5) * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <div className="dashboard-card-content relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`dashboard-card-icon p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
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

          {/* Department Overview */}
          {analytics.departments && analytics.departments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Department Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.departments.map((dept, index) => (
                  <div
                    key={dept._id}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    <h4 className="font-semibold text-gray-900 mb-3">{dept.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Courses:</span>
                        <span className="font-medium text-gray-900">{dept.courses}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Batches:</span>
                        <span className="font-medium text-gray-900">{dept.batches}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium text-gray-900">{dept.students}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trends Chart - Takes 2 columns */}
            <div className="lg:col-span-2">
              <TrendsChart
                trends={analytics.trends}
                loading={analytics.loading}
              />
            </div>

            {/* Notification Center - Takes 1 column */}
            <div className="lg:col-span-1">
              <NotificationCenter
                unreadCount={notifications.unreadCount}
                onUnreadCountChange={(count) => setNotifications(prev => ({ ...prev, unreadCount: count }))}
              />
            </div>
          </div>

          {/* System Status & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">System Status</h3>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-900">Database</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-900">Lab Systems</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-900">Analytics</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Running</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-900">Backup</span>
                  </div>
                  <span className="text-xs text-yellow-600 font-medium">Scheduled</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/admin/students/add"
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
                >
                  <UserIcon className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-blue-900">Add Student</span>
                </Link>
                <Link
                  to="/admin/batches/add"
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 group"
                >
                  <AcademicCapIcon className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-green-900">Create Batch</span>
                </Link>
                <Link
                  to="/admin/attendance"
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group"
                >
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-purple-900">Attendance</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 group"
                >
                  <CogIcon className="h-8 w-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-900">Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
