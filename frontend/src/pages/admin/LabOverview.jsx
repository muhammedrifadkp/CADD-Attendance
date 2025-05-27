import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ComputerDesktopIcon,
  CalendarDaysIcon,
  UserIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI } from '../../services/labAPI'
import { teachersAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { showConfirm } from '../../utils/popup'
import BackButton from '../../components/BackButton'
import labUpdateService from '../../services/labUpdateService'

const LabOverview = () => {
  const [stats, setStats] = useState({
    totalPCs: 0,
    activePCs: 0,
    maintenancePCs: 0,
    inactivePCs: 0,
    todayBookings: 0,
    weeklyBookings: 0,
    teachers: 0,
    utilizationRate: 0,
    loading: true,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [pcsByRow, setPcsByRow] = useState({})
  const [loadingPCs, setLoadingPCs] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
    fetchPCsByRow()
  }, [])

  // Initialize lab update service and listen for updates
  useEffect(() => {
    // Initialize the lab update service
    labUpdateService.init()

    // Subscribe to lab availability updates
    const unsubscribe = labUpdateService.subscribe(['lab_availability', 'booking', 'pc_status'], (update) => {
      console.log('🔄 Lab update received in LabOverview:', update)

      // Refresh data based on update type
      switch (update.type) {
        case 'lab_availability':
          console.log('📊 Refreshing lab overview due to availability update')
          fetchStats()
          fetchPCsByRow()
          break
        case 'booking':
          console.log('📋 Refreshing stats due to booking update')
          fetchStats()
          break
        case 'pc_status':
          console.log('💻 Refreshing PC display due to PC status update')
          fetchStats()
          fetchPCsByRow()
          break
        default:
          console.log('🔄 General refresh triggered')
          fetchStats()
          fetchPCsByRow()
      }
    })

    // Cleanup function
    return () => {
      unsubscribe()
    }
  }, [])

  const fetchStats = async () => {
    try {
      let pcs = []
      let teachers = []
      let todayBookings = 0

      // Try to fetch PCs
      try {
        const pcsRes = await pcAPI.getPCs()
        pcs = Array.isArray(pcsRes) ? pcsRes : (pcsRes.data || [])
      } catch (error) {
        console.error('Error fetching PCs:', error.message)
      }

      // Try to fetch teachers
      try {
        const teachersRes = await teachersAPI.getTeachers()
        teachers = Array.isArray(teachersRes) ? teachersRes : (teachersRes.data || [])
      } catch (error) {
        console.error('Error fetching teachers:', error.message)
      }

      // Try to fetch today's bookings
      try {
        const today = new Date().toISOString().split('T')[0]
        const bookingsRes = await bookingAPI.getBookings({ date: today })
        const bookingsArray = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.data || [])
        todayBookings = bookingsArray.length
      } catch (error) {
        console.error('Error fetching bookings:', error.message)
      }

      // Calculate PC statistics
      const totalPCs = pcs.length
      const activePCs = pcs.filter(pc => pc.status === 'active').length
      const maintenancePCs = pcs.filter(pc => pc.status === 'maintenance').length
      const inactivePCs = pcs.filter(pc => pc.status === 'inactive').length

      // Calculate teachers count
      const teachersCount = teachers.filter(teacher => teacher.role === 'teacher').length

      // Calculate utilization rate (simplified)
      const utilizationRate = totalPCs > 0 ? Math.round((activePCs / totalPCs) * 100) : 0

      setStats({
        totalPCs,
        activePCs,
        maintenancePCs,
        inactivePCs,
        todayBookings,
        weeklyBookings: todayBookings * 7, // Simplified calculation
        teachers: teachersCount,
        utilizationRate,
        loading: false
      })
    } catch (error) {
      console.error('Error fetching lab stats:', error)
      setStats({
        totalPCs: 0,
        activePCs: 0,
        maintenancePCs: 0,
        inactivePCs: 0,
        todayBookings: 0,
        weeklyBookings: 0,
        teachers: 0,
        utilizationRate: 0,
        loading: false
      })
    }
  }

  const clearAllPCs = async () => {
    const confirmed = await showConfirm('Are you sure you want to clear all PCs? This action cannot be undone.', 'Clear All PCs')
    if (confirmed) {
      try {
        await pcAPI.clearAllPCs()
        toast.success('All PCs cleared successfully')
        fetchStats() // Refresh stats
        fetchPCsByRow() // Refresh PC display
      } catch (error) {
        console.error('Error clearing PCs:', error)
        toast.error('Failed to clear PCs')
      }
    }
  }

  const fetchPCsByRow = async () => {
    try {
      setLoadingPCs(true)
      const response = await pcAPI.getPCsByRow()
      const pcsData = response?.data || response || {}
      setPcsByRow(pcsData)
    } catch (error) {
      console.error('Error fetching PCs by row:', error)
      setPcsByRow({})
    } finally {
      setLoadingPCs(false)
    }
  }

  const handleDeletePC = async (pc) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete PC ${pc.pcNumber}?\n\nThis action cannot be undone and will remove all associated bookings.`,
      'Delete PC'
    )

    if (confirmed) {
      try {
        await pcAPI.deletePC(pc._id)
        toast.success(`PC ${pc.pcNumber} deleted successfully`)
        fetchStats() // Refresh stats
        fetchPCsByRow() // Refresh PC display
      } catch (error) {
        console.error('Error deleting PC:', error)
        toast.error('Failed to delete PC')
      }
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Mock data
      const mockActivity = [
        {
          id: '1',
          type: 'booking_created',
          message: 'New booking created for CS-01',
          user: 'John Doe',
          timestamp: '2024-01-20T10:30:00Z',
          details: 'Web Development Class - 09:00-10:30'
        },
        {
          id: '2',
          type: 'pc_added',
          message: 'New PC added to lab',
          user: 'Admin User',
          timestamp: '2024-01-20T09:15:00Z',
          details: 'CS-25 added to Row 4'
        },
        {
          id: '3',
          type: 'pc_maintenance',
          message: 'PC marked for maintenance',
          user: 'Admin User',
          timestamp: '2024-01-19T16:45:00Z',
          details: 'CS-03 - Hardware issue reported'
        },
        {
          id: '4',
          type: 'booking_cancelled',
          message: 'Booking cancelled',
          user: 'Jane Smith',
          timestamp: '2024-01-19T14:20:00Z',
          details: 'Database Lab session cancelled'
        }
      ]
      setRecentActivity(mockActivity)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return <CalendarDaysIcon className="h-5 w-5 text-green-500" />
      case 'booking_cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'pc_added':
        return <ComputerDesktopIcon className="h-5 w-5 text-blue-500" />
      case 'pc_maintenance':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const cards = [
    {
      name: 'Total PCs',
      count: stats.totalPCs,
      icon: ComputerDesktopIcon,
      color: 'bg-blue-500',
      link: '/admin/lab/pcs',
    },
    {
      name: 'Active PCs',
      count: stats.activePCs,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      link: '/admin/lab/pcs?status=active',
    },
    {
      name: 'Maintenance',
      count: stats.maintenancePCs,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      link: '/admin/lab/maintenance',
    },
    {
      name: 'Today\'s Bookings',
      count: stats.todayBookings,
      icon: CalendarDaysIcon,
      color: 'bg-purple-500',
      link: '/admin/lab/management',
    },
    {
      name: 'Teachers',
      count: stats.teachers,
      icon: UserIcon,
      color: 'bg-indigo-500',
      link: '/admin/teachers?role=teacher',
    },
    {
      name: 'Utilization Rate',
      count: `${stats.utilizationRate}%`,
      icon: ChartBarIcon,
      color: 'bg-pink-500',
      link: '/admin/lab/analytics',
    },
  ]

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cadd-purple to-cadd-pink rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Lab Management Overview</h1>
              <p className="text-xl text-white/90">
                CADD Centre Computer Lab - Monitor and manage resources
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-white/80">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  {stats.activePCs} Active PCs
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  {stats.todayBookings} Today's Bookings
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                  {stats.utilizationRate}% Utilization
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <ComputerDesktopIcon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600">Manage your lab resources and settings</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearAllPCs}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 transition-all duration-300"
            >
              Clear All PCs
            </button>
            <Link
              to="/admin/lab/pcs/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              <ComputerDesktopIcon className="h-4 w-4 mr-2" />
              Add PC
            </Link>
            <Link
              to="/admin/lab/book"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
            >
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Admin Booking
            </Link>
            <Link
              to="/admin/lab/management"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
            >
              <ComputerDesktopIcon className="h-4 w-4 mr-2" />
              Lab Management
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => (
            <Link
              key={card.name}
              to={card.link}
              className="group bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <card.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{card.count}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-500">{card.name}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* PC Layout Display - Grid View */}
        {stats.totalPCs > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lab Layout - Grid View</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    PC arrangement and status overview
                  </p>
                </div>
                <Link
                  to="/admin/lab/management"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
                >
                  <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                  Full Lab Management
                </Link>
              </div>
            </div>

            <div className="p-6">
              {/* Status Legend */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Legend:</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
                    <span>Inactive</span>
                  </div>
                </div>
              </div>

              {loadingPCs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
                  </div>
                </div>
              ) : Object.keys(pcsByRow).length === 0 ? (
                <div className="text-center py-8">
                  <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No computers are available in the lab.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(pcsByRow).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([rowNumber, rowPCs]) => (
                    <div key={rowNumber} className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">Row {rowNumber}</h3>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-sm text-gray-500">
                          {rowPCs.length} PCs
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                        {rowPCs.map((pc) => {
                          const getGridPCStatusColor = (status) => {
                            switch (status) {
                              case 'active':
                                return 'bg-green-500 hover:bg-green-600 text-white'
                              case 'maintenance':
                                return 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              default:
                                return 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                            }
                          }

                          return (
                            <div
                              key={`${pc.rowNumber}-${pc.pcNumber}`}
                              className={`
                                relative group p-3 rounded-lg text-center text-sm font-medium transition-all duration-200 cursor-pointer
                                ${getGridPCStatusColor(pc.status)}
                                transform hover:scale-105 shadow-sm hover:shadow-md
                              `}
                              title={`${pc.pcNumber} - ${pc.status}`}
                            >
                              <div className="font-bold">{pc.pcNumber}</div>
                              <div className="text-xs mt-1 opacity-90 capitalize">
                                {pc.status}
                              </div>

                              {/* Action buttons - show on hover */}
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-1">
                                <Link
                                  to={`/admin/lab/pcs/${pc._id}/edit`}
                                  className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
                                  title="Edit PC"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <PencilIcon className="h-3 w-3" />
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePC(pc)
                                  }}
                                  className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
                                  title="Delete PC"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State for No PCs */}
        {stats.totalPCs === 0 && (
          <div className="mt-8 bg-gray-50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ComputerDesktopIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No PCs in Lab</h3>
            <p className="text-gray-600 mb-6">
              Start by adding PCs to your lab to begin managing bookings and sessions.
            </p>
            <Link
              to="/admin/lab/pcs/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
            >
              <ComputerDesktopIcon className="h-5 w-5 mr-2" />
              Add Your First PC
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default LabOverview
