import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { adminsAPI } from '../../../services/api'
import { formatDateLong } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const AdminsList = () => {
  const [admins, setAdmins] = useState([])
  const [filteredAdmins, setFilteredAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteModal, setDeleteModal] = useState({ show: false, admin: null })

  useEffect(() => {
    fetchAdmins()
  }, [])

  useEffect(() => {
    filterAdmins()
  }, [admins, searchTerm, statusFilter])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminsAPI.getAdmins()
      setAdmins(response.data)
    } catch (error) {
      console.error('Error fetching admins:', error)
      setError('Failed to load admins')
      toast.error('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  const filterAdmins = () => {
    let filtered = [...admins]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(admin =>
        statusFilter === 'active' ? admin.active : !admin.active
      )
    }

    setFilteredAdmins(filtered)
  }

  const handleDelete = async (adminId) => {
    try {
      await adminsAPI.deleteAdmin(adminId)
      toast.success('Admin deleted successfully')
      setDeleteModal({ show: false, admin: null })
      fetchAdmins() // Refresh the list
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast.error(error.response?.data?.message || 'Failed to delete admin')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <BackButton />
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage system administrators and their access permissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/admins/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Admin
          </Link>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Admins
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
                placeholder="Search by name or email..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
              >
                <option value="all">All Admins</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredAdmins.length} of {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </span>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="text-cadd-red hover:text-cadd-pink font-medium"
            >
              Clear filters
            </button>
          )}
          
        </div>
        {/* Stats Summary */}
      {admins.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-cadd-red">{admins.length}</div>
              <div className="text-sm text-gray-600">Total Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {admins.filter(admin => admin.active).length}
              </div>
              <div className="text-sm text-gray-600">Active Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">System Access</div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* Admins List */}
      {filteredAdmins.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No admins found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new admin.</p>
          <div className="mt-6">
            <Link
              to="/admin/admins/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Admin
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAdmins.map((admin) => (
            <div key={admin._id} className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group border border-gray-100">
              {/* Admin Card */}
              <div className="px-6 py-6 bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center shadow-lg">
                      <ShieldCheckIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-cadd-red transition-colors duration-300">
                          {admin.name}
                        </h3>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <ShieldCheckIcon className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Details */}
              <div className="px-6 py-4 bg-white border-t border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Administrator Role</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Created: {formatDateLong(admin.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${admin.active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className={`text-sm font-medium ${admin.active ? 'text-green-600' : 'text-red-600'}`}>
                      {admin.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Full system access
                  </span>
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/admins/${admin._id}`}
                      className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/admin/admins/${admin._id}/edit`}
                      className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Edit Admin"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ show: true, admin })}
                      className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      title="Delete Admin"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Admin</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{deleteModal.admin?.name}</strong>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDelete(deleteModal.admin._id)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete Admin
                </button>
                <button
                  onClick={() => setDeleteModal({ show: false, admin: null })}
                  className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminsList
