import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { batchesAPI, attendanceAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { formatDateSimple } from '../../utils/dateUtils'
import { validateApiResponse } from '../../utils/apiValidator'
import BackButton from '../../components/BackButton'

const AttendancePage = () => {
  const { user } = useAuth()
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchBatches()
  }, [])

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents()
      fetchTodayAttendance()
    }
  }, [selectedBatch, selectedDate])

  const fetchBatches = async () => {
    try {
      const res = await batchesAPI.getBatches()
      const batchesData = validateApiResponse(res, 'array', [])
      setBatches(batchesData)
      if (batchesData.length > 0) {
        setSelectedBatch(batchesData[0])
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast.error('Failed to fetch batches')
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await batchesAPI.getBatchStudents(selectedBatch._id)
      const studentsData = validateApiResponse(res, 'array', [])
      setStudents(studentsData)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to fetch students')
      setStudents([])
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const res = await attendanceAPI.getBatchAttendance(selectedBatch._id, selectedDate)
      const attendanceData = validateApiResponse(res, 'array', [])
      const attendanceMap = {}
      attendanceData.forEach(record => {
        if (record.attendance) {
          attendanceMap[record.student._id] = record.attendance.status
        }
      })
      setAttendance(attendanceMap)
    } catch (error) {
      console.error('Error fetching attendance:', error)
      // Don't show error for missing attendance data
      setAttendance({})
    }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmit = async () => {
    if (!selectedBatch) {
      toast.error('Please select a batch')
      return
    }

    setSubmitting(true)
    try {
      const attendanceData = students.map(student => ({
        studentId: student._id,
        status: attendance[student._id] || 'absent'
      }))

      // Mark attendance for each student
      const response = await attendanceAPI.markBulkAttendance({
        batchId: selectedBatch._id,
        date: selectedDate,
        attendanceRecords: attendanceData
      })

      // Show success message with lab booking updates if any
      let successMessage = 'Attendance marked successfully!'
      if (response.summary?.labBookingsUpdated > 0) {
        successMessage += ` Lab bookings automatically updated for ${response.summary.labBookingsUpdated} student(s).`
      }

      toast.success(successMessage)

      // Trigger a custom event to notify lab components to refresh
      console.log('🚀 Dispatching labAvailabilityUpdate event from AttendancePage:', {
        date: selectedDate,
        updates: response.labBookingUpdates || []
      })

      window.dispatchEvent(new CustomEvent('labAvailabilityUpdate', {
        detail: {
          date: selectedDate,
          updates: response.labBookingUpdates || []
        }
      }))
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAttendanceStats = () => {
    const total = filteredStudents.length
    const present = filteredStudents.filter(student => attendance[student._id] === 'present').length
    const absent = filteredStudents.filter(student => attendance[student._id] === 'absent').length
    const late = filteredStudents.filter(student => attendance[student._id] === 'late').length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, late, percentage }
  }

  const stats = getAttendanceStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header */}
      <div className="attendance-header relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
        <div className="relative px-4 sm:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="attendance-title text-2xl sm:text-4xl font-bold text-white mb-2">
                <ClipboardDocumentCheckIcon className="inline h-8 sm:h-10 w-8 sm:w-10 mr-2 sm:mr-3 text-green-400" />
                <span className="hidden sm:inline">Attendance Management</span>
                <span className="sm:hidden">Attendance</span>
              </h1>
              <p className="attendance-subtitle text-base sm:text-xl text-gray-300 mb-4">
                Mark and track student attendance for your batches
              </p>
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-400">
                <span className="flex items-center">
                  <CalendarDaysIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  {formatDateSimple(selectedDate)}
                </span>
                <span className="flex items-center">
                  <UserGroupIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  {batches.length} Batches
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                className="h-20 w-auto opacity-80"
                src="/logos/cadd_logo.png"
                alt="CADD Centre"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Batch Selection and Date */}
      <div className="attendance-batch-selector bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="form-grid grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
          <div className="form-group">
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">
              Select Batch
            </label>
            <select
              value={selectedBatch?._id || ''}
              onChange={(e) => {
                const batch = batches.find(b => b._id === e.target.value)
                setSelectedBatch(batch)
              }}
              className="form-select block w-full border-gray-300 rounded-xl shadow-sm focus:ring-cadd-red focus:border-cadd-red"
            >
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} - {batch.section} {batch.timing && `(${batch.timing})`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input block w-full border-gray-300 rounded-xl shadow-sm focus:ring-cadd-red focus:border-cadd-red"
            />
          </div>
          <div className="form-group">
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <div className="search-container relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input pl-10 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-cadd-red focus:border-cadd-red"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedBatch && (
        <div className="attendance-summary-stats stats-grid grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stats-card attendance-summary-stat bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="dashboard-card-icon p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="stats-card-title text-sm font-medium text-gray-600">Total Students</p>
                <p className="stats-card-value text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="stats-card attendance-summary-stat bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="dashboard-card-icon p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="stats-card-title text-sm font-medium text-gray-600">Present</p>
                <p className="stats-card-value text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </div>
          </div>
          <div className="stats-card attendance-summary-stat bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="dashboard-card-icon p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                <XCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="stats-card-title text-sm font-medium text-gray-600">Absent</p>
                <p className="stats-card-value text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </div>
          <div className="stats-card attendance-summary-stat bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="dashboard-card-icon p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="stats-card-title text-sm font-medium text-gray-600">Attendance %</p>
                <p className="stats-card-value text-2xl font-bold text-purple-600">{stats.percentage}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      {selectedBatch && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedBatch.name} - {selectedBatch.section}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Mark attendance for {formatDateSimple(selectedDate)}
                  {selectedBatch.timing && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {selectedBatch.timing}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || filteredStudents.length === 0}
                className="attendance-submit-button btn-mobile inline-flex items-center px-4 sm:px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 touch-target"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Saving</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Save Attendance</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No students enrolled in this batch.'}
                </p>
              </div>
            ) : (
              <div className="attendance-grid space-y-4">
                {filteredStudents.map((student, index) => (
                  <div
                    key={student._id}
                    className="attendance-student-card list-item flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="list-item-content flex items-center mb-4 sm:mb-0">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-white">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="attendance-student-info ml-4">
                        <p className="attendance-student-name text-sm font-semibold text-gray-900">{student.name}</p>
                        <p className="attendance-student-id text-sm text-gray-500">
                          {student.rollNumber && `Roll: ${student.rollNumber}`}
                          {student.email && ` • ${student.email}`}
                        </p>
                      </div>
                    </div>

                    <div className="attendance-status-buttons flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'present')}
                        className={`attendance-status-button touch-target px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${attendance[student._id] === 'present'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                          }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'late')}
                        className={`attendance-status-button touch-target px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${attendance[student._id] === 'late'
                          ? 'bg-yellow-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'
                          }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'absent')}
                        className={`attendance-status-button touch-target px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${attendance[student._id] === 'absent'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                          }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendancePage
