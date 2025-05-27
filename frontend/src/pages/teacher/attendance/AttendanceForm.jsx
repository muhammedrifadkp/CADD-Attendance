import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { batchesAPI, attendanceAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { format, isToday, parseISO } from 'date-fns'
import { formatDateLong } from '../../../utils/dateUtils'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const AttendanceForm = () => {
  const { id: batchId } = useParams()
  const location = useLocation()
  const [batch, setBatch] = useState(null)
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [bulkAction, setBulkAction] = useState('')
  const [selectedStudents, setSelectedStudents] = useState(new Set())
  const [showSummary, setShowSummary] = useState(true)

  // Determine if we're in admin context
  const isAdminContext = location.pathname.startsWith('/admin')
  const baseUrl = isAdminContext ? '/admin/batches' : '/batches'

  useEffect(() => {
    const fetchBatchAndStudents = async () => {
      try {
        setLoading(true)
        const [batchRes, attendanceRes] = await Promise.all([
          batchesAPI.getBatch(batchId),
          attendanceAPI.getBatchAttendance(batchId, attendanceDate),
        ])

        setBatch(batchRes.data)

        // Map attendance data to students
        setAttendanceData(attendanceRes.data)
      } catch (error) {
        toast.error('Failed to fetch batch data')
      } finally {
        setLoading(false)
      }
    }

    fetchBatchAndStudents()
  }, [batchId, attendanceDate])

  const handleDateChange = (e) => {
    setAttendanceDate(e.target.value)
  }

  const handleStatusChange = (studentId, status) => {
    setAttendanceData((prevData) =>
      prevData.map((item) =>
        item.student._id === studentId
          ? {
            ...item,
            attendance: {
              ...item.attendance,
              status,
            },
          }
          : item
      )
    )
  }

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceData((prevData) =>
      prevData.map((item) =>
        item.student._id === studentId
          ? {
            ...item,
            attendance: {
              ...item.attendance,
              remarks,
            },
          }
          : item
      )
    )
  }

  // Helper functions
  const getAttendanceSummary = () => {
    const total = attendanceData.length
    const present = attendanceData.filter(item => item.attendance?.status === 'present').length
    const absent = attendanceData.filter(item => item.attendance?.status === 'absent').length
    const late = attendanceData.filter(item => item.attendance?.status === 'late').length
    const notMarked = total - present - absent - late
    return { total, present, absent, late, notMarked }
  }

  const filteredData = attendanceData.filter(item => {
    const matchesSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'not-marked' && !item.attendance?.status) ||
      item.attendance?.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleBulkAction = () => {
    if (!bulkAction || selectedStudents.size === 0) return

    setAttendanceData((prevData) =>
      prevData.map((item) =>
        selectedStudents.has(item.student._id)
          ? {
            ...item,
            attendance: {
              ...item.attendance,
              status: bulkAction,
            },
          }
          : item
      )
    )

    setSelectedStudents(new Set())
    setBulkAction('')
    toast.success(`Marked ${selectedStudents.size} students as ${bulkAction}`)
  }

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredData.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredData.map(item => item.student._id)))
    }
  }

  // Quick Attendance Functions
  const markAllPresent = () => {
    const updatedData = attendanceData.map(item => ({
      ...item,
      attendance: {
        ...item.attendance,
        status: 'present'
      }
    }))
    setAttendanceData(updatedData)
    toast.success(`✅ All ${attendanceData.length} students marked as Present`)
  }

  const markAllLate = () => {
    const updatedData = attendanceData.map(item => ({
      ...item,
      attendance: {
        ...item.attendance,
        status: 'late'
      }
    }))
    setAttendanceData(updatedData)
    toast.success(`⏰ All ${attendanceData.length} students marked as Late`)
  }

  const markAllAbsent = () => {
    const updatedData = attendanceData.map(item => ({
      ...item,
      attendance: {
        ...item.attendance,
        status: 'absent'
      }
    }))
    setAttendanceData(updatedData)
    toast.success(`❌ All ${attendanceData.length} students marked as Absent`)
  }

  const clearAllAttendance = () => {
    const updatedData = attendanceData.map(item => ({
      ...item,
      attendance: {
        ...item.attendance,
        status: 'present'
      }
    }))
    setAttendanceData(updatedData)
    toast.info(`🔄 All attendance reset to Present`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Prepare data for bulk attendance
      const attendanceRecords = attendanceData
        .filter((item) => item.attendance?.status) // Only include items with a status
        .map((item) => ({
          studentId: item.student._id,
          status: item.attendance.status,
          remarks: item.attendance.remarks || '',
        }))

      if (attendanceRecords.length === 0) {
        toast.error('No attendance records to submit')
        return
      }

      const response = await attendanceAPI.markBulkAttendance({
        attendanceRecords,
        batchId,
        date: attendanceDate,
      })

      // Show success message with lab booking updates if any
      let successMessage = 'Attendance saved successfully'
      if (response.summary?.labBookingsUpdated > 0) {
        successMessage += ` (${response.summary.labBookingsUpdated} lab booking(s) automatically updated)`
      }

      toast.success(successMessage)

      // Show detailed lab booking updates if any
      if (response.labBookingUpdates && response.labBookingUpdates.length > 0) {
        const labUpdates = response.labBookingUpdates
          .map(update => `${update.message}`)
          .join('\n')

        // Show as info toast for lab updates
        setTimeout(() => {
          toast.info(`Lab Availability Updated:\n${labUpdates}`, {
            duration: 5000
          })
        }, 1000)
      }

      // Trigger a custom event to notify lab components to refresh
      console.log('🚀 Dispatching labAvailabilityUpdate event:', {
        date: attendanceDate,
        updates: response.labBookingUpdates || []
      })

      window.dispatchEvent(new CustomEvent('labAvailabilityUpdate', {
        detail: {
          date: attendanceDate,
          updates: response.labBookingUpdates || []
        }
      }))
    } catch (error) {
      toast.error('Failed to save attendance')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const summary = getAttendanceSummary()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={baseUrl}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Batches
          </Link>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Link
            to={`${baseUrl}/${batchId}/attendance/report`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Report
          </Link>
        </div>
      </div>

      {/* Batch Info & Date */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{batch?.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {batch?.academicYear} • {batch?.section}
              </p>
              {batch?.createdBy && (
                <p className="text-xs text-gray-400 mt-1">
                  Created by: {batch.createdBy.name}
                </p>
              )}
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="attendanceDate"
                  name="attendanceDate"
                  className="form-input"
                  value={attendanceDate}
                  onChange={handleDateChange}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {isToday(parseISO(attendanceDate)) ? "Today's attendance" : formatDateLong(parseISO(attendanceDate))}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {showSummary && attendanceData.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Attendance Summary</h3>
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-2xl font-bold text-gray-900">{summary.total}</span>
                </div>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                  <span className="text-2xl font-bold text-green-600">{summary.present}</span>
                </div>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                  <span className="text-2xl font-bold text-red-600">{summary.absent}</span>
                </div>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="text-2xl font-bold text-yellow-600">{summary.late}</span>
                </div>
                <p className="text-xs text-gray-500">Late</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-gray-500 mr-1" />
                  <span className="text-2xl font-bold text-gray-600">{summary.notMarked}</span>
                </div>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Attendance Progress</span>
                <span>{summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: summary.total > 0 ? `${(summary.present / summary.total) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white shadow rounded-lg">
        {attendanceData.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              This batch doesn't have any students yet.
            </p>
            <div className="mt-6">
              <Link
                to={`${baseUrl}/${batchId}/students/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add Students
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search students by name or roll number..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-select text-sm"
                  >
                    <option value="all">All Students</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="not-marked">Not Marked</option>
                  </select>

                  {selectedStudents.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className="form-select text-sm"
                      >
                        <option value="">Bulk Action</option>
                        <option value="present">Mark Present</option>
                        <option value="absent">Mark Absent</option>
                        <option value="late">Mark Late</option>
                      </select>
                      <button
                        onClick={handleBulkAction}
                        disabled={!bulkAction}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selectedStudents.size > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setSelectedStudents(new Set())}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>

            {/* Quick Attendance Section */}
            {attendanceData.length > 0 && (
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Quick Attendance</h3>
                      <p className="text-xs text-gray-600">Mark all students at once, then adjust individual exceptions</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={markAllPresent}
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      All Present
                    </button>

                    <button
                      type="button"
                      onClick={markAllLate}
                      className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      <ClockIcon className="w-4 h-4 mr-2" />
                      All Late
                    </button>

                    <button
                      type="button"
                      onClick={markAllAbsent}
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      All Absent
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <button
                      type="button"
                      onClick={clearAllAttendance}
                      className="inline-flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Reset
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>💡 Tip: Use quick actions, then click individual students to make exceptions</span>
                  <span className="font-medium">
                    {attendanceData.length} student{attendanceData.length !== 1 ? 's' : ''} total
                  </span>
                </div>
              </div>
            )}

            {/* Enhanced Table */}
            <form onSubmit={handleSubmit}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          checked={selectedStudents.size === filteredData.length && filteredData.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => {
                      const isSelected = selectedStudents.has(item.student._id)
                      const statusColor = item.attendance?.status === 'present' ? 'bg-green-50' :
                        item.attendance?.status === 'absent' ? 'bg-red-50' :
                          item.attendance?.status === 'late' ? 'bg-yellow-50' : ''

                      return (
                        <tr key={item.student._id} className={`${isSelected ? 'bg-primary-50' : statusColor} hover:bg-gray-50`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              checked={isSelected}
                              onChange={() => handleSelectStudent(item.student._id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.student.rollNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {item.student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{item.student.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.student._id, 'present')}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.attendance?.status === 'present'
                                  ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                                  }`}
                              >
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.student._id, 'absent')}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.attendance?.status === 'absent'
                                  ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                                  }`}
                              >
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.student._id, 'late')}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.attendance?.status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500'
                                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
                                  }`}
                              >
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Late
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              className="form-input text-sm"
                              placeholder="Optional remarks"
                              value={item.attendance?.remarks || ''}
                              onChange={(e) => handleRemarksChange(item.student._id, e.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {filteredData.length} of {attendanceData.length} students shown
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default AttendanceForm
