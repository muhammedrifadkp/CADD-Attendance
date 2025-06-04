import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { labStatsAPI, bookingAPI, pcAPI } from '../../services/api'

const LabTeacherDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPCs: 0,
    availablePCs: 0,
    bookedPCs: 0,
    maintenancePCs: 0,
    utilizationRate: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [labStatus, setLabStatus] = useState('operational')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [statsRes, bookingsRes, pcsRes] = await Promise.all([
        labStatsAPI.getOverviewStats().catch(() => ({ data: {} })),
        bookingAPI.getBookings({ limit: 10 }).catch(() => ({ data: [] })),
        pcAPI.getPCs().catch(() => ({ data: [] }))
      ])

      // Calculate stats from PC data if stats API fails
      const pcs = Array.isArray(pcsRes.data) ? pcsRes.data : []
      const calculatedStats = {
        totalPCs: pcs.length,
        availablePCs: pcs.filter(pc => pc.status === 'available').length,
        bookedPCs: pcs.filter(pc => pc.status === 'booked').length,
        maintenancePCs: pcs.filter(pc => pc.status === 'maintenance').length,
        utilizationRate: pcs.length > 0 ? Math.round((pcs.filter(pc => pc.status === 'booked').length / pcs.length) * 100) : 0
      }

      setStats(statsRes.data.overview || calculatedStats)
      setRecentBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : [])
      
      // Determine lab status
      const maintenanceRate = calculatedStats.totalPCs > 0 ? 
        (calculatedStats.maintenancePCs / calculatedStats.totalPCs) * 100 : 0
      
      if (maintenanceRate > 30) {
        setLabStatus('maintenance')
      } else if (calculatedStats.utilizationRate > 90) {
        setLabStatus('busy')
      } else {
        setLabStatus('operational')
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100'
      case 'busy': return 'text-yellow-600 bg-yellow-100'
      case 'maintenance': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'operational': return 'Operational'
      case 'busy': return 'High Usage'
      case 'maintenance': return 'Maintenance Required'
      default: return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lab Management Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(labStatus)}`}>
            {getStatusText(labStatus)}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total PCs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPCs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.availablePCs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Booked</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.bookedPCs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.maintenancePCs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Utilization Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lab Utilization</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${stats.utilizationRate}%` }}
              ></div>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-900">{stats.utilizationRate}%</span>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
        {recentBookings.length > 0 ? (
          <div className="space-y-3">
            {recentBookings.slice(0, 5).map((booking, index) => (
              <div key={booking._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    PC {booking.pc?.pcNumber || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.student?.name || 'Unknown Student'} • {booking.timeSlot || 'No time slot'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent bookings</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/lab-availability'}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">View Availability</p>
            </div>
          </button>
          
          <button 
            onClick={fetchDashboardData}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Refresh Data</p>
            </div>
          </button>
          
          <button 
            onClick={() => toast.info('Maintenance mode feature coming soon')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LabTeacherDashboard
