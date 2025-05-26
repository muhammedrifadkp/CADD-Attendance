import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { teachersAPI } from '../../../services/api'
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { showConfirm } from '../../../utils/popup'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const TeachersList = () => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        const res = await teachersAPI.getTeachers()
        setTeachers(res.data)
      } catch (error) {
        console.error('Error fetching teachers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [refreshKey])

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this teacher?', 'Delete Teacher')
    if (confirmed) {
      try {
        await teachersAPI.deleteTeacher(id)
        toast.success('Teacher deleted successfully')
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        toast.error('Failed to delete teacher')
      }
    }
  }

  const handleResetPassword = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to reset this teacher\'s password?', 'Reset Password')
    if (confirmed) {
      try {
        const res = await teachersAPI.resetPassword(id)
        toast.success(`Password reset successfully. New password: ${res.data.newPassword}`)
      } catch (error) {
        toast.error('Failed to reset password')
      }
    }
  }

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Teachers</h1>
        <Link
          to="/admin/teachers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add Teacher
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new teacher account.
          </p>
          <div className="mt-6">
            <Link
              to="/admin/teachers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Teacher
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <div key={teacher._id} className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              {/* Clickable Header Section */}
              <Link to={`/admin/teachers/${teacher._id}`} className="block">
                <div className="px-6 py-6 bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-cadd-red to-cadd-pink flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <span className="text-white font-bold text-xl">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-5 flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-cadd-red transition-colors duration-300">
                        {teacher.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">{teacher.email}</p>
                      <div className="mt-2 flex items-center space-x-3">
                        <span className={`px-3 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${teacher.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {teacher.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-3 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${teacher.role === 'admin'
                          ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                          }`}>
                          {teacher.role === 'admin' ? 'Administrator' : 'Teacher'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Click to view indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                      Last login: {teacher.lastLogin ? formatDateSimple(teacher.lastLogin) : 'Never'}
                    </div>
                    <div className="flex items-center text-cadd-red opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-xs font-medium mr-1">View Details</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResetPassword(teacher._id)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                    Reset Password
                  </button>
                  <Link
                    to={`/admin/teachers/${teacher._id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(teacher._id)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeachersList
