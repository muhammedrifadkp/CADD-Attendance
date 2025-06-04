import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { 
  attendanceAPI, 
  batchesAPI, 
  studentsAPI 
} from '../../../services/api'
import {
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const AdminAttendanceMark = () => {
  const { batchId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Data states
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [existingAttendance, setExistingAttendance] = useState({})
  const [filteredStudents, setFilteredStudents] = useState([])

  useEffect(() => {
    if (batchId) {
      fetchData()
    } else {
      // If no batchId, redirect to batch selection
      navigate('/admin/attendance')
    }
  }, [batchId, selectedDate])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [batchRes, studentsRes] = await Promise.all([
        batchesAPI.getBatchById(batchId),
        studentsAPI.getStudentsByBatch(batchId)
      ])

      setBatch(batchRes.data)
      
      // Handle different response structures
      const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : []
      setStudents(studentsData)

      // Fetch existing attendance for the selected date
      await fetchExistingAttendance(studentsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load batch data')
      navigate('/admin/attendance')
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingAttendance = async (studentsData) => {
    try {
      const attendanceRes = await attendanceAPI.getBatchAttendance(batchId, selectedDate)
      const attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : []
      
      const existingMap = {}
      const currentMap = {}
      
      attendanceData.forEach(record => {
        if (record.student && record.student._id) {
          existingMap[record.student._id] = record.status
          currentMap[record.student._id] = record.status
        }
      })
      
      setExistingAttendance(existingMap)
      setAttendance(currentMap)
    } catch (error) {
      console.error('Error fetching existing attendance:', error)
      // Don't show error for missing attendance data
      setExistingAttendance({})
      setAttendance({})
    }
  }

  const filterStudents = () => {
    let filtered = [...students]

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredStudents(filtered)
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleBulkAction = (status) => {
    const newAttendance = {}
    filteredStudents.forEach(student => {
      newAttendance[student._id] = status
    })
    setAttendance(prev => ({
      ...prev,
      ...newAttendance
    }))
  }

  const handleSubmit = async () => {
    if (!batch) {
      toast.error('Batch information not available')
      return
    }

    setSubmitting(true)
    try {
      const attendanceRecords = students.map(student => ({
        studentId: student._id,
        status: attendance[student._id] || 'absent'
      }))

      const response = await attendanceAPI.markBulkAttendance({
        batchId: batch._id,
        date: selectedDate,
        attendanceRecords
      })

      let successMessage = 'Attendance marked successfully!'
      if (response.data?.summary?.labBookingsUpdated > 0) {
        successMessage += ` Lab bookings automatically updated for ${response.data.summary.labBookingsUpdated} student(s).`
      }

      toast.success(successMessage)
      
      // Refresh existing attendance
      await fetchExistingAttendance(students)
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const getAttendanceStats = () => {
    const total = students.length
    const present = Object.values(attendance).filter(status => status === 'present').length
    const absent = Object.values(attendance).filter(status => status === 'absent').length
    const late = Object.values(attendance).filter(status => status === 'late').length
    const unmarked = total - present - absent - late
    
    return { total, present, absent, late, unmarked }
  }

  const stats = getAttendanceStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Batch Not Found</h2>
          <button
            onClick={() => navigate('/admin/attendance')}
            className="text-cadd-red hover:text-cadd-pink"
          >
            Back to Attendance
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10 pointer-events-none"></div>
          <div className="relative px-8 py-12 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Mark Attendance</h1>
                <p className="text-gray-300 text-lg">{batch.name} • {batch.course?.name}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {batch.course?.department?.name} • Section: {batch.section}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{students.length}</div>
                <div className="text-gray-300 text-sm">Total Students</div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selection and Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Attendance Stats */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Attendance Summary</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{stats.present}</div>
                  <div className="text-xs text-green-600">Present</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{stats.absent}</div>
                  <div className="text-xs text-red-600">Absent</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{stats.late}</div>
                  <div className="text-xs text-yellow-600">Late</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">{stats.unmarked}</div>
                  <div className="text-xs text-gray-600">Unmarked</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Bulk Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
                  placeholder="Search by name, roll number, email..."
                />
              </div>
            </div>

            {/* Bulk Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bulk Actions
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('present')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Mark All Present
                </button>
                <button
                  onClick={() => handleBulkAction('absent')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Mark All Absent
                </button>
                <button
                  onClick={() => handleBulkAction('late')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Mark All Late
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Students ({filteredStudents.length} of {students.length})
            </h3>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {students.length === 0
                  ? "No students enrolled in this batch."
                  : "Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <div key={student._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Student Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{student.name}</h4>
                        <p className="text-sm text-gray-500">
                          Roll: {student.rollNo || student.rollNumber || 'N/A'} • {student.email}
                        </p>
                      </div>
                      {existingAttendance[student._id] && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Previously: {existingAttendance[student._id]}
                        </span>
                      )}
                    </div>

                    {/* Attendance Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'present')}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attendance[student._id] === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Present
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'absent')}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attendance[student._id] === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Absent
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'late')}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attendance[student._id] === 'late'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Late
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={() => navigate('/admin/attendance')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 disabled:opacity-50"
          >
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Attendance'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminAttendanceMark
