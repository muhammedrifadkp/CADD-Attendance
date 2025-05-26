import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { teachersAPI, batchesAPI, studentsAPI } from '../../services/api'
import { pcAPI, bookingAPI } from '../../services/labAPI'
import { UserGroupIcon, UserIcon, AcademicCapIcon, ComputerDesktopIcon, ChartBarIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { formatDateLong } from '../../utils/dateUtils'
import BackButton from '../../components/BackButton'

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔄 Fetching dashboard stats...')

        // Get current date for active bookings
        const today = new Date().toISOString().split('T')[0]
        console.log('📅 Today date for bookings:', today)

        // Fetch basic stats (teachers, batches, students)
        console.log('📊 Fetching basic stats...')
        const [teachersRes, batchesRes, studentsRes] = await Promise.all([
          teachersAPI.getTeachers(),
          batchesAPI.getBatches(),
          studentsAPI.getStudents(),
        ])

        // Initialize stats with basic data
        let statsData = {
          teachersCount: teachersRes.data.length,
          batchesCount: batchesRes.data.length,
          studentsCount: studentsRes.data.length,
          labPCs: 0,
          activeBookings: 0,
          loading: false,
        }

        console.log('✅ Basic stats fetched:', {
          teachers: statsData.teachersCount,
          batches: statsData.batchesCount,
          students: statsData.studentsCount
        })

        // Try to fetch lab data separately with error handling
        console.log('🖥️ Fetching PC data...')
        try {
          const pcsRes = await pcAPI.getPCs()
          console.log('🖥️ Raw PC response:', pcsRes)
          statsData.labPCs = Array.isArray(pcsRes) ? pcsRes.length : 0
          console.log('✅ PC data fetched:', statsData.labPCs, 'PCs')
        } catch (labError) {
          console.error('❌ Could not fetch PC data:', labError)
          console.error('Error details:', labError.response?.data || labError.message)
          statsData.labPCs = 0
        }

        console.log('📅 Fetching booking data for date:', today)
        try {
          const bookingsRes = await bookingAPI.getBookings({ date: today })
          console.log('📅 Raw booking response:', bookingsRes)
          statsData.activeBookings = Array.isArray(bookingsRes) ? bookingsRes.length : 0
          console.log('✅ Booking data fetched:', statsData.activeBookings, 'bookings for', today)
        } catch (bookingError) {
          console.error('❌ Could not fetch booking data:', bookingError)
          console.error('Error details:', bookingError.response?.data || bookingError.message)
          statsData.activeBookings = 0
        }

        setStats(statsData)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

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
      link: '/admin/lab',
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
                CADD Centre Administration Dashboard
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  System Online
                </span>
                <span>•</span>
                <span>{formatDateLong(new Date())}</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-4xl">{user?.name?.charAt(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats.loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-grid dashboard-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New teacher registered</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Batch created successfully</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Lab booking confirmed</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
              <h3 className="text-lg font-bold text-gray-900 mb-6">System Status</h3>
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
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-900">Backup</span>
                  </div>
                  <span className="text-xs text-yellow-600 font-medium">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
