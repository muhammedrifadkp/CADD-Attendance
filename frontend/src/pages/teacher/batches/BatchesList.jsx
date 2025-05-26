import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { batchesAPI } from '../../../services/api'
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, ClipboardDocumentCheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import { showConfirm } from '../../../utils/popup'

const BatchesList = () => {
  console.log('BatchesList component is rendering...')

  const { user } = useAuth()
  const location = useLocation()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Determine if we're in admin context
  const isAdminContext = location.pathname.startsWith('/admin')
  const baseUrl = isAdminContext ? '/admin/batches' : '/batches'

  // Helper function to format timing display
  const formatTiming = (timing) => {
    if (!timing) return 'No timing set'

    const timeSlots = {
      '09:00-10:30': '09:00 AM - 10:30 AM',
      '10:30-12:00': '10:30 AM - 12:00 PM',
      '12:00-13:30': '12:00 PM - 01:30 PM',
      '14:00-15:30': '02:00 PM - 03:30 PM',
      '15:30-17:00': '03:30 PM - 05:00 PM'
    }

    return timeSlots[timing] || timing
  }

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        console.log('BatchesList: Starting to fetch batches...')
        setLoading(true)
        const res = await batchesAPI.getBatches()
        console.log('BatchesList: Batches fetched successfully:', res.data)
        setBatches(res.data)
      } catch (error) {
        console.error('BatchesList: Error fetching batches:', error)
        console.error('BatchesList: Error response:', error.response?.data)
        toast.error('Failed to fetch batches. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
  }, [refreshKey])

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this batch? This will also delete all students and attendance records associated with this batch.', 'Delete Batch')
    if (confirmed) {
      try {
        await batchesAPI.deleteBatch(id)
        toast.success('Batch deleted successfully')
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        toast.error('Failed to delete batch')
      }
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Batches</h1>
        <Link
          to={`${baseUrl}/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Batch
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No batches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new batch.
          </p>
          <div className="mt-6">
            <Link
              to={`${baseUrl}/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Batch
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="bg-white overflow-hidden shadow-lg rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
            >
              {/* Clickable Header Section */}
              <Link to={`${baseUrl}/${batch._id}`} className="block">
                <div className="px-6 py-6 bg-gradient-to-br from-cadd-purple/5 to-cadd-pink/5 hover:from-cadd-purple/10 hover:to-cadd-pink/10 transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl p-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <span className="text-white font-bold text-lg">
                        {batch.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-cadd-red transition-colors duration-300">
                        {batch.name}
                      </h3>
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <span className="font-medium">{batch.academicYear} • {batch.section}</span>
                        {batch.isArchived && (
                          <span className="ml-2 px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Archived
                          </span>
                        )}
                      </div>
                      {/* Batch Timing */}
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        <span className="font-medium text-cadd-red">
                          {formatTiming(batch.timing)}
                        </span>
                      </div>
                      {batch.createdBy && (
                        <div className="mt-2 text-xs text-gray-500">
                          Created by: {' '}
                          {user && batch.createdBy._id === user._id ? (
                            <span className="text-cadd-red font-semibold">You</span>
                          ) : (
                            <span className="text-gray-700 font-medium">
                              {batch.createdBy.name}
                              {user && user.role === 'admin' && (
                                <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-xs font-semibold">
                                  {batch.createdBy.role === 'admin' ? 'Admin' : 'Teacher'}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Click to view indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                      Click to view details
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
                  <Link
                    to={`${baseUrl}/${batch._id}/students`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
                  >
                    <UserGroupIcon className="h-4 w-4 mr-1.5" />
                    Students
                  </Link>
                  <Link
                    to={`${baseUrl}/${batch._id}/attendance`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1.5" />
                    Attendance
                  </Link>
                  <Link
                    to={`${baseUrl}/${batch._id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(batch._id)
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
      )
      }
    </div >
  )
}

export default BatchesList
