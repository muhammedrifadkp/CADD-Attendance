import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { batchesAPI, attendanceAPI, coursesAPI } from '../../../services/api'
import api from '../../../services/api'
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
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

const AttendanceDashboard = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [batches, setBatches] = useState([])
  const [filteredBatches, setFilteredBatches] = useState([])
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [attendanceStats, setAttendanceStats] = useState({})
  const [todayAttendance, setTodayAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Enhanced filtering states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

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

  // Filter batches based on search and filters
  useEffect(() => {
    let filtered = batches

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.academicYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.course?.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(batch => {
        const batchDept = batch.course?.department?._id || batch.course?.department
        return batchDept === selectedDepartment
      })
    }

    // Filter by course
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(batch => {
        const batchCourse = batch.course?._id || batch.course
        return batchCourse === selectedCourse
      })
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(batch => !batch.isFinished && !batch.isArchived)
      } else if (selectedStatus === 'finished') {
        filtered = filtered.filter(batch => batch.isFinished)
      } else if (selectedStatus === 'archived') {
        filtered = filtered.filter(batch => batch.isArchived)
      }
    }

    setFilteredBatches(filtered)
  }, [batches, searchTerm, selectedDepartment, selectedCourse, selectedStatus])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data
      const [batchesRes, departmentsRes, coursesRes] = await Promise.all([
        batchesAPI.getBatches(),
        api.get('/departments?active=true'),
        api.get('/courses?active=true')
      ])

      setBatches(batchesRes.data)

      // Filter departments to only include the 4 required ones
      const allDepartments = departmentsRes.data || []
      const requiredDepartments = allDepartments.filter(dept =>
        ['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'].includes(dept.name)
      )
      setDepartments(requiredDepartments)
      setCourses(coursesRes.data?.courses || coursesRes.data || [])

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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl shadow-lg">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage and track attendance across all your batches with advanced filtering
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-4 py-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900"
              />
            </div>
            <Link
              to={getCalendarRoute()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
            >
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Calendar View
            </Link>
            {location.pathname.startsWith('/admin') && (
              <Link
                to="/admin/attendance/report"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Advanced Report
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search batches by name, academic year, section, course, or department..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-cadd-red focus:border-cadd-red focus:bg-white transition-all duration-300 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value)
                  setSelectedCourse('all') // Reset course when department changes
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-sm bg-white"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-sm bg-white"
                disabled={selectedDepartment === 'all'}
              >
                <option value="all">
                  {selectedDepartment === 'all' ? 'Select Department First' : 'All Courses'}
                </option>
                {selectedDepartment !== 'all' && courses
                  .filter(course => {
                    const courseDept = course.department?._id || course.department
                    return courseDept === selectedDepartment
                  })
                  .map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))
                }
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Batches</option>
                <option value="finished">Finished Batches</option>
                <option value="archived">Archived Batches</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                Showing {filteredBatches.length} of {batches.length} batches
              </span>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-200"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Batches</dt>
                  <dd className="text-2xl font-bold text-gray-900">{filteredBatches.length}</dd>
                  <dd className="text-xs text-gray-400">of {batches.length} total</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Attendance</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {filteredBatches.length > 0
                      ? `${Math.round((filteredBatches.reduce((sum, batch) => sum + getAttendancePercentage(batch._id), 0) / filteredBatches.length) * 10) / 10}%`
                      : '0%'
                    }
                  </dd>
                  <dd className="text-xs text-gray-400">filtered batches</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl shadow-lg">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {isToday(parseISO(selectedDate)) ? "Today's" : "Selected Date"} Records
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {filteredBatches.reduce((sum, batch) => {
                      const attendance = todayAttendance[batch._id] || []
                      return sum + attendance.filter(item => item.attendance?.status).length
                    }, 0)}
                  </dd>
                  <dd className="text-xs text-gray-400">marked attendance</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {filteredBatches.reduce((sum, batch) => {
                      const attendance = todayAttendance[batch._id] || []
                      return sum + attendance.filter(item => !item.attendance?.status).length
                    }, 0)}
                  </dd>
                  <dd className="text-xs text-gray-400">not marked yet</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Batch Cards */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 lg:grid-cols-2' : 'space-y-4'}>
        {filteredBatches.map((batch) => {
          const summary = getAttendanceSummary(batch._id)
          const percentage = getAttendancePercentage(batch._id)
          const statusColor = getStatusColor(percentage)

          return (
            <div key={batch._id} className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg shadow-md">
                        <AcademicCapIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{batch.name}</h3>
                        <p className="text-sm text-gray-600">
                          {batch.academicYear} • Section {batch.section}
                        </p>
                      </div>
                    </div>

                    {/* Department and Course Info */}
                    {batch.course && (
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        {batch.course.department && (
                          <div className="flex items-center space-x-1">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <span>{batch.course.department.name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>{batch.course.name}</span>
                        </div>
                      </div>
                    )}

                    {batch.createdBy && (
                      <p className="text-xs text-gray-400">
                        Created by: {batch.createdBy.name}
                      </p>
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${statusColor}`}>
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

                {/* Enhanced Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to={`/batches/${batch._id}/attendance`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Link>
                  <Link
                    to={`/batches/${batch._id}/attendance/report`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    View Report
                  </Link>
                  <Link
                    to={`/batches/${batch._id}/students`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Students
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* No Results State */}
      {filteredBatches.length === 0 && batches.length > 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="p-8">
            <FunnelIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No batches match your filters</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or filters to find the batches you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedDepartment('all')
                setSelectedCourse('all')
                setSelectedStatus('all')
              }}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {batches.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="p-8">
            <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No batches found</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first batch to begin tracking attendance.
            </p>
            <Link
              to="/batches/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Create Your First Batch
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceDashboard
