import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { batchesAPI, attendanceAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { format, isToday, parseISO } from 'date-fns'
import { useAuth } from '../../../context/AuthContext'
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const AttendanceDashboard = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [batches, setBatches] = useState([])
  const [attendanceStats, setAttendanceStats] = useState({})
  const [todayAttendance, setTodayAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Determine the correct calendar route based on user role and current location
  const getCalendarRoute = () => {
    if (location.pathname.startsWith('/admin')) {
      return '/admin/attendance/calendar'
    }
    return '/attendance/calendar'
  }

  useEffect(() => {
    fetchDashboardData()
  }, [selectedDate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all batches
      const batchesRes = await batchesAPI.getBatches()
      setBatches(batchesRes.data)

      // Fetch attendance stats and today's attendance for each batch
      const statsPromises = batchesRes.data.map(async (batch) => {
        try {
          const [statsRes, todayRes] = await Promise.all([
            attendanceAPI.getBatchAttendanceStats(batch._id, {
              startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
              endDate: format(new Date(), 'yyyy-MM-dd')
            }),
            attendanceAPI.getBatchAttendance(batch._id, selectedDate)
          ])

          return {
            batchId: batch._id,
            stats: statsRes.data,
            todayAttendance: todayRes.data
          }
        } catch (error) {
          console.error(`Error fetching data for batch ${batch._id}:`, error)
          return {
            batchId: batch._id,
            stats: null,
            todayAttendance: []
          }
        }
      })

      const results = await Promise.all(statsPromises)

      const statsMap = {}
      const todayMap = {}

      results.forEach(({ batchId, stats, todayAttendance }) => {
        statsMap[batchId] = stats
        todayMap[batchId] = todayAttendance
      })

      setAttendanceStats(statsMap)
      setTodayAttendance(todayMap)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch attendance data')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceSummary = (batchId) => {
    const attendance = todayAttendance[batchId] || []
    const total = attendance.length
    const present = attendance.filter(item => item.attendance?.status === 'present').length
    const absent = attendance.filter(item => item.attendance?.status === 'absent').length
    const late = attendance.filter(item => item.attendance?.status === 'late').length
    const notMarked = total - present - absent - late

    return { total, present, absent, late, notMarked }
  }

  const getAttendancePercentage = (batchId) => {
    const stats = attendanceStats[batchId]
    return stats?.presentPercentage || 0
  }

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100'
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track attendance across all your batches
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="form-input"
          />
          <Link
            to={getCalendarRoute()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Calendar View
          </Link>
          {location.pathname.startsWith('/admin') && (
            <Link
              to="/admin/attendance/report"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Advanced Report
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Batches</dt>
                  <dd className="text-lg font-medium text-gray-900">{batches.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Attendance</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {batches.length > 0
                      ? `${Math.round((batches.reduce((sum, batch) => sum + getAttendancePercentage(batch._id), 0) / batches.length) * 10) / 10}%`
                      : '0%'
                    }
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
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {isToday(parseISO(selectedDate)) ? "Today's" : "Selected Date"} Records
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Object.values(todayAttendance).reduce((sum, attendance) =>
                      sum + attendance.filter(item => item.attendance?.status).length, 0
                    )}
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
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Object.values(todayAttendance).reduce((sum, attendance) =>
                      sum + attendance.filter(item => !item.attendance?.status).length, 0
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {batches.map((batch) => {
          const summary = getAttendanceSummary(batch._id)
          const percentage = getAttendancePercentage(batch._id)
          const statusColor = getStatusColor(percentage)

          return (
            <div key={batch._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{batch.name}</h3>
                    <p className="text-sm text-gray-500">
                      {batch.academicYear} • {batch.section}
                    </p>
                    {batch.createdBy && (
                      <p className="text-xs text-gray-400 mt-1">
                        Created by: {batch.createdBy.name}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                    {Math.round(percentage * 10) / 10}%
                  </div>
                </div>

                {/* Attendance Summary for Selected Date */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span>
                      {isToday(parseISO(selectedDate)) ? "Today's" : format(parseISO(selectedDate), 'MMM dd')} Attendance
                    </span>
                    <span>{summary.total} students</span>
                  </div>

                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600">{summary.present}</span>
                    </div>
                    <div className="flex items-center">
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-600">{summary.absent}</span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-yellow-600">{summary.late}</span>
                    </div>
                    {summary.notMarked > 0 && (
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-gray-600">{summary.notMarked}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: summary.total > 0 ? `${(summary.present / summary.total) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    to={`/batches/${batch._id}/attendance`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                    Mark Attendance
                  </Link>
                  <Link
                    to={`/batches/${batch._id}/attendance/report`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    View Report
                  </Link>
                  <Link
                    to={`/batches/${batch._id}/students`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    Students
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {batches.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No batches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first batch.
          </p>
          <div className="mt-6">
            <Link
              to="/batches/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Batch
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceDashboard
