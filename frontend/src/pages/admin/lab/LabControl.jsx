import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BackButton from '../../../components/BackButton'
import {
  ComputerDesktopIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  PowerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { labAPI } from '../../../services/labAPI'
import { toast } from 'react-toastify'

const LabControl = () => {
  const [labStatus, setLabStatus] = useState({
    totalPCs: 0,
    activePCs: 0,
    maintenancePCs: 0,
    inactivePCs: 0,
    currentBookings: 0,
    nextBooking: null,
    loading: true
  })
  const [pcsByRow, setPcsByRow] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLabStatus()
    fetchPCsByRow()
  }, [])

  const fetchLabStatus = async () => {
    try {
      const response = await labAPI.stats.getOverviewStats()
      setLabStatus({
        ...response,
        currentBookings: response.todayBookings || 0,
        nextBooking: null, // This would need a separate API endpoint
        loading: false
      })
    } catch (error) {
      console.error('Error fetching lab status:', error)
      toast.error('Failed to fetch lab status')
      setLabStatus(prev => ({ ...prev, loading: false }))
    }
  }

  const fetchPCsByRow = async () => {
    try {
      const response = await labAPI.pcs.getPCsByRow()
      setPcsByRow(response)
    } catch (error) {
      console.error('Error fetching PCs by row:', error)
      toast.error('Failed to fetch PC data')
      setPcsByRow({})
    } finally {
      setLoading(false)
    }
  }

  const handlePCStatusChange = async (pcId, newStatus) => {
    try {
      await labAPI.pcs.updatePC(pcId, { status: newStatus })
      toast.success(`PC status updated to ${newStatus}`)

      // Update local state
      setPcsByRow(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(row => {
          updated[row] = updated[row].map(pc =>
            pc._id === pcId ? { ...pc, status: newStatus } : pc
          )
        })
        return updated
      })

      // Refresh lab status
      fetchLabStatus()
    } catch (error) {
      console.error('Error updating PC status:', error)
      toast.error('Failed to update PC status')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'maintenance':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-500" />
      case 'inactive':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'maintenance':
        return 'bg-yellow-500'
      case 'inactive':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lab Control Center</h1>
        <p className="mt-2 text-sm text-gray-700">
          Monitor and control all laboratory computers in real-time
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total PCs</dt>
                  <dd className="text-lg font-medium text-gray-900">{labStatus.totalPCs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active PCs</dt>
                  <dd className="text-lg font-medium text-gray-900">{labStatus.activePCs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Maintenance</dt>
                  <dd className="text-lg font-medium text-gray-900">{labStatus.maintenancePCs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Bookings</dt>
                  <dd className="text-lg font-medium text-gray-900">{labStatus.currentBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PC Grid by Rows */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Lab Layout - PC Status by Row
          </h3>

          {Object.keys(pcsByRow).length === 0 ? (
            <div className="text-center py-12">
              <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add PCs to the lab to see them here.
              </p>
              <div className="mt-6">
                <Link
                  to="/admin/lab/pcs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cadd-red hover:bg-cadd-red/90"
                >
                  <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                  Add PC
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(pcsByRow)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([rowNumber, pcs]) => (
                  <div key={rowNumber} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Row {rowNumber} ({pcs.length} PCs)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {pcs.map((pc) => (
                        <div
                          key={pc._id}
                          className="relative bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {pc.pcNumber}
                            </span>
                            {getStatusIcon(pc.status)}
                          </div>

                          <div className={`w-full h-2 rounded-full ${getStatusColor(pc.status)}`}></div>

                          <div className="mt-2">
                            <select
                              value={pc.status}
                              onChange={(e) => handlePCStatusChange(pc._id, e.target.value)}
                              className="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-cadd-red focus:border-cadd-red"
                            >
                              <option value="active">Active</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="/admin/lab/pcs"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ComputerDesktopIcon className="h-6 w-6 text-blue-500 mr-3" />
              <span className="text-sm font-medium text-gray-900">Manage PCs</span>
            </Link>
            <Link
              to="/admin/lab/pcs/new"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Cog6ToothIcon className="h-6 w-6 text-green-500 mr-3" />
              <span className="text-sm font-medium text-gray-900">Add New PC</span>
            </Link>
            <Link
              to="/admin/lab/maintenance"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-500 mr-3" />
              <span className="text-sm font-medium text-gray-900">Maintenance Center</span>
            </Link>
            <Link
              to="/admin/lab"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="h-6 w-6 text-purple-500 mr-3" />
              <span className="text-sm font-medium text-gray-900">Lab Overview</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabControl
