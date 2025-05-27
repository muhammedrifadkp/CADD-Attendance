import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon, ShieldCheckIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { adminsAPI } from '../../../services/api'
import { formatDateLong } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const AdminsList = () => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await adminsAPI.getAdmins()
      setAdmins(response.data)
    } catch (error) {
      console.error('Error fetching admins:', error)
      setError('Failed to load admins')
    } finally {
      setLoading(false)
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
      {admins.length === 0 ? (
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
          {admins.map((admin) => (
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
                <div className="text-center">
                  <span className="text-xs text-gray-500">
                    Full system access • All permissions
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
  )
}

export default AdminsList
