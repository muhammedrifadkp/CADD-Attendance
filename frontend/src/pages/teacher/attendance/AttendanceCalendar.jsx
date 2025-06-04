import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { batchesAPI, attendanceAPI } from '../../../services/api'
import api from '../../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

const AttendanceCalendar = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [batches, setBatches] = useState([])
  const [filteredBatches, setFilteredBatches] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [attendanceData, setAttendanceData] = useState({})
  const [loading, setLoading] = useState(true)

  // Determine the correct back route based on user role and current location
  const getBackRoute = () => {
    if (location.pathname.startsWith('/admin')) {
      return '/admin/attendance'
    }
    return '/attendance'
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  useEffect(() => {
    if (selectedBatch) {
      fetchMonthAttendance()
    }
  }, [selectedBatch, currentDate])

  // Filter batches based on department
  useEffect(() => {
    let filtered = batches

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(batch => {
        const batchDept = batch.course?.department?._id || batch.course?.department
        return batchDept === selectedDepartment
      })
    }

    setFilteredBatches(filtered)

    // Reset selected batch if it's not in filtered results
    if (selectedBatch && !filtered.find(b => b._id === selectedBatch)) {
      setSelectedBatch(filtered.length > 0 ? filtered[0]._id : '')
    }
  }, [batches, selectedDepartment, selectedBatch])

  const fetchBatches = async () => {
    try {
      const [batchesRes, departmentsRes] = await Promise.all([
        batchesAPI.getBatches(),
        api.get('/departments?active=true')
      ])

      setBatches(batchesRes.data)

      // Filter departments to only include the 4 required ones
      const allDepartments = departmentsRes.data || []
      const requiredDepartments = allDepartments.filter(dept =>
        ['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'].includes(dept.name)
      )
      setDepartments(requiredDepartments)

      if (batchesRes.data.length > 0) {
        setSelectedBatch(batchesRes.data[0]._id)
      }
    } catch (error) {
      toast.error('Failed to fetch batches')
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthAttendance = async () => {
    if (!selectedBatch) return

    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      // Get daily attendance data for the month
      const dailyAttendance = {}
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      // Fetch attendance for each day in the month
      let currentDay = monthStart
      while (currentDay <= monthEnd) {
        const dayStr = format(currentDay, 'yyyy-MM-dd')
        try {
          const dayAttendance = await attendanceAPI.getBatchAttendance(selectedBatch, dayStr)
          if (dayAttendance.data && dayAttendance.data.length > 0) {
            const present = dayAttendance.data.filter(record => record.attendance?.status === 'present').length
            const absent = dayAttendance.data.filter(record => record.attendance?.status === 'absent').length
            const late = dayAttendance.data.filter(record => record.attendance?.status === 'late').length
            const total = dayAttendance.data.length

            dailyAttendance[dayStr] = {
              present,
              absent,
              late,
              total,
              records: dayAttendance.data
            }
          }
        } catch (dayError) {
          // Skip days with no data
        }
        currentDay = addDays(currentDay, 1)
      }

      setAttendanceData(dailyAttendance)
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      toast.error('Failed to fetch attendance data')
    }
  }

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  const getAttendanceForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return attendanceData[dateStr] || {
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    }
  }

  const getDateColor = (date, attendance) => {
    if (!isSameMonth(date, currentDate)) return 'text-gray-300'
    if (isToday(date)) return 'bg-primary-600 text-white'

    const percentage = attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 0
    if (percentage >= 90) return 'bg-green-100 text-green-800'
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800'
    if (percentage > 0) return 'bg-red-100 text-red-800'

    return 'text-gray-900 hover:bg-gray-100'
  }

  const selectedBatchData = batches.find(b => b._id === selectedBatch)

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={getBackRoute()}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Attendance
            </Link>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div className="flex items-center">
              <CalendarDaysIcon className="h-6 w-6 text-cadd-red mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Attendance Calendar</h1>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="form-input min-w-[200px] bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 focus:border-cadd-red focus:ring-cadd-red"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="form-input min-w-[250px] bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 focus:border-cadd-red focus:ring-cadd-red"
            >
              <option value="">
                {filteredBatches.length === 0 ? 'No batches available' : 'Select a batch to view calendar'}
              </option>
              {filteredBatches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} - {batch.academicYear} {batch.section}
                  {batch.course?.department && ` (${batch.course.department.name})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedBatch && (
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          {/* Enhanced Calendar Header */}
          <div className="bg-gradient-to-r from-cadd-purple to-cadd-pink px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                {selectedBatchData && (
                  <div className="flex items-center space-x-2 text-white/90">
                    <div className="w-2 h-2 bg-cadd-yellow rounded-full"></div>
                    <p className="text-sm font-medium">
                      {selectedBatchData.name} • {selectedBatchData.academicYear} • {selectedBatchData.section}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDate(addDays(startOfMonth(currentDate), -1))}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-all duration-300"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(addDays(endOfMonth(currentDate), 1))}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Calendar Grid */}
          <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                <div key={day} className="p-3 text-center">
                  <div className="text-sm font-bold text-gray-900">{day.slice(0, 3)}</div>
                  <div className="text-xs text-gray-500 mt-1">{day.slice(0, 1)}</div>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((date) => {
                const attendance = getAttendanceForDate(date)
                const isCurrentMonth = isSameMonth(date, currentDate)
                const isCurrentDay = isToday(date)
                const hasData = attendance.total > 0
                const percentage = hasData ? (attendance.present / attendance.total) * 100 : 0

                let dayClasses = "p-3 min-h-[100px] rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:scale-105"

                if (!isCurrentMonth) {
                  dayClasses += " border-gray-100 bg-gray-50 text-gray-300"
                } else if (isCurrentDay) {
                  dayClasses += " border-cadd-red bg-gradient-to-br from-cadd-red to-cadd-pink text-white shadow-lg"
                } else if (hasData) {
                  if (percentage >= 90) {
                    dayClasses += " border-green-200 bg-gradient-to-br from-green-50 to-green-100 text-green-800"
                  } else if (percentage >= 75) {
                    dayClasses += " border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-800"
                  } else {
                    dayClasses += " border-red-200 bg-gradient-to-br from-red-50 to-red-100 text-red-800"
                  }
                } else {
                  dayClasses += " border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                }

                return (
                  <div key={date.toString()} className={dayClasses}>
                    <div className="flex justify-between items-start mb-2">
                      <div className={`text-lg font-bold ${isCurrentDay ? 'text-white' : ''}`}>
                        {format(date, 'd')}
                      </div>
                      {hasData && (
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${isCurrentDay
                          ? 'bg-white/20 text-white'
                          : percentage >= 90
                            ? 'bg-green-200 text-green-800'
                            : percentage >= 75
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-red-200 text-red-800'
                          }`}>
                          {Math.round(percentage)}%
                        </div>
                      )}
                    </div>

                    {isCurrentMonth && hasData && (
                      <div className="space-y-1">
                        <div className={`text-xs font-medium ${isCurrentDay ? 'text-white/90' : ''}`}>
                          {attendance.present}/{attendance.total}
                        </div>
                        <div className="flex space-x-1">
                          {attendance.present > 0 && (
                            <div className={`w-2 h-2 rounded-full ${isCurrentDay ? 'bg-white/60' : 'bg-green-400'}`}></div>
                          )}
                          {attendance.absent > 0 && (
                            <div className={`w-2 h-2 rounded-full ${isCurrentDay ? 'bg-white/40' : 'bg-red-400'}`}></div>
                          )}
                          {attendance.late > 0 && (
                            <div className={`w-2 h-2 rounded-full ${isCurrentDay ? 'bg-white/50' : 'bg-yellow-400'}`}></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Enhanced Legend */}
          <div className="px-6 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
                <div className="grid grid-cols-2 lg:flex lg:items-center lg:space-x-8 gap-4 lg:gap-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg"></div>
                    <span className="text-sm font-medium text-gray-700">Excellent (90%+)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg"></div>
                    <span className="text-sm font-medium text-gray-700">Good (75-89%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg"></div>
                    <span className="text-sm font-medium text-gray-700">Needs Attention (&lt;75%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg"></div>
                    <span className="text-sm font-medium text-gray-700">Today</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={`/batches/${selectedBatch}/attendance/report`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  View Report
                </Link>
                <Link
                  to={`/batches/${selectedBatch}/attendance`}
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Mark Today's Attendance
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedBatch && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-cadd-red/10 to-cadd-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarDaysIcon className="h-12 w-12 text-cadd-red" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Batch</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Choose a batch from the dropdown above to view the monthly attendance calendar with detailed insights.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-200 rounded-full"></div>
              <span>High Attendance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-200 rounded-full"></div>
              <span>Low Attendance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceCalendar
