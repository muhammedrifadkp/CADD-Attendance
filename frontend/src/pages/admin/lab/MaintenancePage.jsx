import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ComputerDesktopIcon,
  WrenchScrewdriverIcon,
  PencilIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { labAPI } from '../../../services/labAPI'
import { toast } from 'react-toastify'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const MaintenancePage = () => {
  const [maintenancePCs, setMaintenancePCs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [rowFilter, setRowFilter] = useState('')

  useEffect(() => {
    fetchMaintenancePCs()
  }, [rowFilter])

  const fetchMaintenancePCs = async () => {
    setLoading(true)
    try {
      const params = { status: 'maintenance' }
      if (rowFilter) params.rowNumber = rowFilter

      const response = await labAPI.pcs.getPCs(params)
      // Handle response format - check if data is nested
      const pcsData = response?.data || response || []
      setMaintenancePCs(Array.isArray(pcsData) ? pcsData : [])
    } catch (error) {
      console.error('Error fetching maintenance PCs:', error)
      toast.error('Failed to fetch maintenance PCs')
      setMaintenancePCs([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (pcId, newStatus) => {
    try {
      await labAPI.pcs.updatePC(pcId, {
        status: newStatus,
        ...(newStatus === 'active' && { lastMaintenance: new Date() })
      })
      toast.success(`PC status updated to ${newStatus}`)

      // Remove from maintenance list if status changed to active/inactive
      if (newStatus !== 'maintenance') {
        setMaintenancePCs(prev => prev.filter(pc => pc._id !== pcId))
      }
    } catch (error) {
      console.error('Error updating PC status:', error)
      toast.error('Failed to update PC status')
    }
  }

  const filteredPCs = maintenancePCs.filter(pc =>
    pc.pcNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getMaintenanceDuration = (lastMaintenance) => {
    if (!lastMaintenance) return 'Unknown'

    const now = new Date()
    const maintenanceDate = new Date(lastMaintenance)
    const diffTime = Math.abs(now - maintenanceDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day'
    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} years`
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-500 mr-3" />
            PC Maintenance Center
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and monitor PCs currently under maintenance
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/admin/lab/pcs"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ComputerDesktopIcon className="h-4 w-4 mr-2" />
            All PCs
          </Link>
          <Link
            to="/admin/lab/pcs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-red/90"
          >
            <ComputerDesktopIcon className="h-4 w-4 mr-2" />
            Add PC
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total in Maintenance</dt>
                  <dd className="text-lg font-medium text-gray-900">{maintenancePCs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Long-term Maintenance</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {maintenancePCs.filter(pc => {
                      if (!pc.lastMaintenance) return true
                      const diffDays = Math.ceil(Math.abs(new Date() - new Date(pc.lastMaintenance)) / (1000 * 60 * 60 * 24))
                      return diffDays > 7
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent Maintenance</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {maintenancePCs.filter(pc => {
                      if (!pc.lastMaintenance) return false
                      const diffDays = Math.ceil(Math.abs(new Date() - new Date(pc.lastMaintenance)) / (1000 * 60 * 60 * 24))
                      return diffDays <= 7
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search PCs
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PC number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-cadd-red focus:border-cadd-red sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Row Number
            </label>
            <select
              value={rowFilter}
              onChange={(e) => setRowFilter(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cadd-red focus:border-cadd-red sm:text-sm"
            >
              <option value="">All Rows</option>
              <option value="1">Row 1</option>
              <option value="2">Row 2</option>
              <option value="3">Row 3</option>
              <option value="4">Row 4</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setRowFilter('')
                setSearchTerm('')
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance PCs List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {filteredPCs.length === 0 ? (
            <div className="text-center py-12">
              <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {maintenancePCs.length === 0 ? 'No PCs in Maintenance' : 'No PCs found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {maintenancePCs.length === 0
                  ? 'All PCs are currently active or inactive. Great job keeping the lab running!'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {maintenancePCs.length === 0 && (
                <div className="mt-6">
                  <Link
                    to="/admin/lab/pcs"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cadd-red hover:bg-cadd-red/90"
                  >
                    <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                    View All PCs
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPCs.map((pc) => (
                <div key={pc._id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-500 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{pc.pcNumber}</h3>
                        <p className="text-sm text-gray-500">Row {pc.rowNumber}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Maintenance
                    </span>
                  </div>

                  <div className="mb-4 text-sm text-gray-600">
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>
                        {pc.lastMaintenance
                          ? `In maintenance for ${getMaintenanceDuration(pc.lastMaintenance)}`
                          : 'Maintenance duration unknown'
                        }
                      </span>
                    </div>
                    {pc.lastMaintenance && (
                      <div className="flex items-center mb-2">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>Since: {formatDateSimple(pc.lastMaintenance)}</span>
                      </div>
                    )}
                    {pc.notes && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <strong>Notes:</strong> {pc.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(pc._id, 'active')}
                        className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-white hover:bg-green-50"
                      >
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Mark Active
                      </button>
                      <Link
                        to={`/admin/lab/pcs/${pc._id}/edit`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MaintenancePage
