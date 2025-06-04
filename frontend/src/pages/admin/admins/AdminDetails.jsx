import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { adminsAPI } from '../../../services/api'
import {
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'

const AdminDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    fetchAdmin()
  }, [id])

  const fetchAdmin = async () => {
    try {
      setLoading(true)
      const response = await adminsAPI.getAdminById(id)
      setAdmin(response.data)
    } catch (error) {
      console.error('Error fetching admin:', error)
      toast.error('Failed to fetch admin details')
      navigate('/admin/admins')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await adminsAPI.deleteAdmin(id)
      toast.success('Admin deleted successfully')
      navigate('/admin/admins')
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast.error(error.response?.data?.message || 'Failed to delete admin')
    } finally {
      setActionLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    try {
      setActionLoading(true)
      await adminsAPI.resetAdminPassword(id, { newPassword })
      toast.success('Password reset successfully')
      setShowPasswordModal(false)
      setNewPassword('')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Not Found</h2>
          <Link to="/admin/admins" className="text-cadd-red hover:text-cadd-pink">
            Back to Admins
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Details</h1>
              <p className="mt-2 text-gray-600">View and manage admin information</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/admin/admins/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Admin
              </Link>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                Reset Password
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Admin Information Card */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-cadd-red to-cadd-pink px-6 py-8">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-white" />
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">{admin.name}</h2>
                <p className="text-white/80 flex items-center mt-1">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Administrator
                </p>
                <div className="flex items-center mt-2">
                  {admin.active ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium">{admin.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-gray-900 font-medium">{formatDate(admin.createdAt)}</p>
                    </div>
                  </div>
                  {admin.updatedAt && admin.updatedAt !== admin.createdAt && (
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="text-gray-900 font-medium">{formatDate(admin.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Admin</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this admin? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <KeyIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4 text-center">Reset Password</h3>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                    placeholder="Enter new password (min 8 characters)"
                    minLength={8}
                  />
                </div>
                <div className="mt-6">
                  <button
                    onClick={handlePasswordReset}
                    disabled={actionLoading || !newPassword}
                    className="px-4 py-2 bg-cadd-red text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-cadd-red disabled:opacity-50"
                  >
                    {actionLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setNewPassword('')
                    }}
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
    </div>
  )
}

export default AdminDetails
