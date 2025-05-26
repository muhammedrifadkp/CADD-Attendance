import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BackButton from '../../../components/BackButton'
import {
  ComputerDesktopIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { labAPI } from '../../../services/labAPI'
import { toast } from 'react-toastify'
import { showConfirm } from '../../../utils/popup'
import { formatDateSimple } from '../../../utils/dateUtils'

const PCList = () => {
  const [pcs, setPCs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({ row: '', status: '' })

  useEffect(() => {
    fetchPCs()
  }, [filter])

  const fetchPCs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.row) params.rowNumber = filter.row
      if (filter.status) params.status = filter.status

      const response = await labAPI.pcs.getPCs(params)
      // Handle response format - check if data is nested
      const pcsData = response?.data || response || []
      setPCs(Array.isArray(pcsData) ? pcsData : [])
    } catch (error) {
      console.error('Error fetching PCs:', error)
      toast.error('Failed to fetch PCs')
      setPCs([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (pcId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this PC?', 'Delete PC')
    if (confirmed) {
      try {
        await labAPI.pcs.deletePC(pcId)
        toast.success('PC deleted successfully')
        setPCs(pcs.filter(pc => pc._id !== pcId))
      } catch (error) {
        console.error('Error deleting PC:', error)
        toast.error('Failed to delete PC')
      }
    }
  }

  const filteredPCs = pcs.filter(pc =>
    pc.pcNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PC Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all laboratory computers and their configurations
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/lab/pcs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-red/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add PC
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
              value={filter.row}
              onChange={(e) => setFilter({ ...filter, row: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cadd-red focus:border-cadd-red sm:text-sm"
            >
              <option value="">All Rows</option>
              <option value="1">Row 1</option>
              <option value="2">Row 2</option>
              <option value="3">Row 3</option>
              <option value="4">Row 4</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-cadd-red focus:border-cadd-red sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter({ row: '', status: '' })
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

      {/* PC List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPCs.map((pc) => (
              <div key={pc._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <ComputerDesktopIcon className="h-8 w-8 text-cadd-red mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{pc.pcNumber}</h3>
                      <p className="text-sm text-gray-500">Row {pc.rowNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(pc.status)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pc.status)}`}>
                      {pc.status}
                    </span>
                  </div>
                </div>



                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {pc.lastMaintenance && (
                      <p>Last maintenance: {formatDateSimple(pc.lastMaintenance)}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/lab/pcs/${pc._id}/edit`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(pc._id)}
                      className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPCs.length === 0 && (
            <div className="text-center py-12">
              <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter.row || filter.status
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new PC to the lab.'}
              </p>
              {!searchTerm && !filter.row && !filter.status && (
                <div className="mt-6">
                  <Link
                    to="/admin/lab/pcs/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cadd-red hover:bg-cadd-red/90"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add PC
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PCList
