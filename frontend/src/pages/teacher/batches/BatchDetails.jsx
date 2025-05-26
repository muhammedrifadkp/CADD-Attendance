import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { batchesAPI, attendanceAPI } from '../../../services/api'
import { UserGroupIcon, ClipboardDocumentCheckIcon, ChartBarIcon, ArrowLeftIcon, CalendarDaysIcon, AcademicCapIcon, ClockIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'

const BatchDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const [batch, setBatch] = useState(null)
  const [stats, setStats] = useState({
    studentCount: 0,
    presentPercentage: 0,
    absentPercentage: 0,
    latePercentage: 0,
  })
  const [loading, setLoading] = useState(true)

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

  // Determine the correct base route based on user role and current location
  const getBaseRoute = () => {
    if (location.pathname.startsWith('/admin')) {
      return '/admin/batches'
    }
    return '/batches'
  }

  const baseRoute = getBaseRoute()

  useEffect(() => {
    const fetchBatchAndStats = async () => {
      try {
        setLoading(true)
        const [batchRes, statsRes] = await Promise.all([
          batchesAPI.getBatch(id),
          attendanceAPI.getBatchAttendanceStats(id),
        ])

        setBatch(batchRes.data)
        setStats(statsRes.data)
      } catch (error) {
        toast.error('Failed to fetch batch details')
      } finally {
        setLoading(false)
      }
    }

    fetchBatchAndStats()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Batch not found</h3>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cadd-purple to-cadd-pink rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link
                to={baseRoute}
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Batches
              </Link>
              <div className="w-px h-8 bg-white/30"></div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{batch.name}</h1>
                <div className="flex items-center space-x-4 text-white/90">
                  <span className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    {batch.academicYear}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    Section {batch.section}
                  </span>
                  {batch.isArchived && (
                    <>
                      <span>•</span>
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-sm font-medium">
                        Archived
                      </span>
                    </>
                  )}
                </div>
                {/* Batch Timing */}
                {batch.timing && (
                  <div className="mt-3 flex items-center text-white/90">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span className="font-semibold text-cadd-yellow">
                      {formatTiming(batch.timing)}
                    </span>
                  </div>
                )}
                {batch.createdBy && (
                  <div className="mt-3 text-sm text-white/80">
                    Created by: {' '}
                    {user && batch.createdBy._id === user._id ? (
                      <span className="text-cadd-yellow font-semibold">You</span>
                    ) : (
                      <span className="text-white font-medium">
                        {batch.createdBy.name}
                        {user && user.role === 'admin' && (
                          <span className="ml-2 px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                            {batch.createdBy.role === 'admin' ? 'Admin' : 'Teacher'}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-3xl">
                  {batch.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Students Card */}
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.studentCount}</div>
                <div className="text-sm font-medium text-gray-500">Total Students</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Manage student enrollment and information
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-t border-blue-200">
            <Link
              to={`${baseRoute}/${id}/students`}
              className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors duration-300"
            >
              View all students
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.presentPercentage ? `${stats.presentPercentage.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm font-medium text-gray-500">Attendance Rate</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Track daily attendance and patterns
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-t border-green-200">
            <Link
              to={`${baseRoute}/${id}/attendance`}
              className="inline-flex items-center text-sm font-semibold text-green-700 hover:text-green-900 transition-colors duration-300"
            >
              Mark attendance
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Reports Card */}
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group sm:col-span-2 lg:col-span-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cadd-red to-cadd-pink shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">Reports</div>
                <div className="text-sm font-medium text-gray-500">Analytics & Insights</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                View detailed attendance reports and analytics
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10 px-6 py-4 border-t border-cadd-red/20">
            <Link
              to={`${baseRoute}/${id}/attendance/report`}
              className="inline-flex items-center text-sm font-semibold text-cadd-red hover:text-cadd-pink transition-colors duration-300"
            >
              View reports
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Attendance Overview</h2>
        <div className="mt-4 bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">Present</h3>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {stats.presentPercentage ? `${stats.presentPercentage.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800">Absent</h3>
              <p className="mt-2 text-3xl font-semibold text-red-600">
                {stats.absentPercentage ? `${stats.absentPercentage.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800">Late</h3>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">
                {stats.latePercentage ? `${stats.latePercentage.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to={`${baseRoute}/${id}/students`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Manage Students
          </Link>
          <Link
            to={`${baseRoute}/${id}/attendance`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
            Mark Attendance
          </Link>
          <Link
            to={`${baseRoute}/${id}/attendance/report`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            View Reports
          </Link>
          <Link
            to={`${baseRoute}/${id}/edit`}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Batch
          </Link>
        </div>
      </div>
    </div>
  )
}

export default BatchDetails
