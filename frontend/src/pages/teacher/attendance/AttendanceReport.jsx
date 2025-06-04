import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { batchesAPI, attendanceAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { format, subDays } from 'date-fns'
import {
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'

const AttendanceReport = () => {
  const { id: batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [stats, setStats] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBatchAndStats = async () => {
      try {
        setLoading(true)
        const [batchRes, statsRes] = await Promise.all([
          batchesAPI.getBatch(batchId),
          attendanceAPI.getBatchAttendanceStats(batchId, dateRange),
        ])

        setBatch(batchRes.data)
        setStats(statsRes.data)
      } catch (error) {
        toast.error('Failed to fetch attendance data')
      } finally {
        setLoading(false)
      }
    }

    fetchBatchAndStats()
  }, [batchId, dateRange])

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    })
  }

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
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Link
              to={`/batches/${batchId}/attendance`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Attendance
            </Link>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl shadow-lg">
                <DocumentChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {batch.name} • {batch.academicYear} • Section {batch.section}
                </p>
                {batch.course && (
                  <p className="text-xs text-gray-500">
                    {batch.course.department?.name} - {batch.course.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Link
              to={`/batches/${batchId}/attendance`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105"
            >
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Mark Attendance
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="form-label">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="form-input"
                value={dateRange.startDate}
                onChange={handleDateChange}
                max={dateRange.endDate}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="form-label">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="form-input"
                value={dateRange.endDate}
                onChange={handleDateChange}
                min={dateRange.startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          {stats ? (
            <div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-700">
                        {stats.presentPercentage ? `${stats.presentPercentage.toFixed(1)}%` : 'N/A'}
                      </p>
                      <p className="text-sm text-green-600 font-medium">Present</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-600">
                    {stats.presentCount} attendance records
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                      <XCircleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-red-700">
                        {stats.absentPercentage ? `${stats.absentPercentage.toFixed(1)}%` : 'N/A'}
                      </p>
                      <p className="text-sm text-red-600 font-medium">Absent</p>
                    </div>
                  </div>
                  <p className="text-sm text-red-600">
                    {stats.absentCount} absence records
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
                      <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-yellow-700">
                        {stats.latePercentage ? `${stats.latePercentage.toFixed(1)}%` : 'N/A'}
                      </p>
                      <p className="text-sm text-yellow-600 font-medium">Late</p>
                    </div>
                  </div>
                  <p className="text-sm text-yellow-600">
                    {stats.lateCount} late arrivals
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Students</dt>
                    <dd className="mt-1 text-sm text-gray-900">{stats.studentCount}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Days Recorded</dt>
                    <dd className="mt-1 text-sm text-gray-900">{stats.uniqueDatesCount}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Records</dt>
                    <dd className="mt-1 text-sm text-gray-900">{stats.totalRecords}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Average Attendance</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {stats.averageAttendance ? `${stats.averageAttendance.toFixed(1)}%` : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No attendance data available for the selected date range.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendanceReport
