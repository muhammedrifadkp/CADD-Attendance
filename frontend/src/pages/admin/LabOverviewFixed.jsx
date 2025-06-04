import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ComputerDesktopIcon,
  CalendarDaysIcon,
  UserIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserGroupIcon,
  AcademicCapIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon,
  BoltIcon,
  FireIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  PowerIcon,
  UserPlusIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI } from '../../services/labAPI'
import { teachersAPI, studentsAPI, batchesAPI } from '../../services/api'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { showConfirm } from '../../utils/popup'
import BackButton from '../../components/BackButton'

const LabOverviewFixed = () => {
  // Core State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [pcsByRow, setPcsByRow] = useState({})
  const [bookings, setBookings] = useState([])
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [teachers, setTeachers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  // Modal State
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedPC, setSelectedPC] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [filteredStudents, setFilteredStudents] = useState([])

  // Enhanced state
  const [labStats, setLabStats] = useState({
    totalPCs: 0,
    activePCs: 0,
    bookedPCs: 0,
    availablePCs: 0,
    maintenancePCs: 0,
    inactivePCs: 0
  })
  const [realTimeMode, setRealTimeMode] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Advanced filtering
  const [filterByBatch, setFilterByBatch] = useState(false)
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)

  // Enhanced Time slots configuration based on batch timings
  const getBatchTimeSlots = () => {
    const defaultSlots = [
      { value: '09:00-10:30', label: '09:00 - 10:30 AM', type: 'morning' },
      { value: '10:30-12:00', label: '10:30 - 12:00 PM', type: 'morning' },
      { value: '12:00-13:30', label: '12:00 - 01:30 PM', type: 'afternoon' },
      { value: '13:30-15:00', label: '01:30 - 03:00 PM', type: 'afternoon' },
      { value: '15:00-16:30', label: '03:00 - 04:30 PM', type: 'evening' },
      { value: '16:30-18:00', label: '04:30 - 06:00 PM', type: 'evening' }
    ]

    // If batch is selected, filter slots based on batch timing
    if (selectedBatch && batches.length > 0) {
      const batch = batches.find(b => b._id === selectedBatch)
      if (batch?.timing) {
        return defaultSlots.filter(slot => slot.type === batch.timing.toLowerCase())
      }
    }

    return defaultSlots
  }

  const timeSlots = getBatchTimeSlots()

  // Smart PC Color Coding Based on Attendance
  const getPCStatusColor = (pc, booking) => {
    // PC Status Priority: Inactive > Maintenance > Booking Status
    if (pc.status === 'inactive') {
      return 'bg-gray-500 border-gray-600 text-white' // ⚫ Gray: Inactive/Offline
    }

    if (pc.status === 'maintenance') {
      return 'bg-yellow-500 border-yellow-600 text-white' // 🟡 Yellow: Under maintenance
    }

    // If PC is booked, check attendance status
    if (booking) {
      const attendanceStatus = booking.attendanceStatus || 'not-marked'
      switch (attendanceStatus) {
        case 'present':
          return 'bg-red-500 border-red-600 text-white' // 🔴 Red: Booked with student present
        case 'absent':
          return 'bg-orange-500 border-orange-600 text-white' // 🟠 Orange: Booked but student absent
        case 'late':
          return 'bg-purple-500 border-purple-600 text-white' // 🟣 Purple: Booked with student late
        default:
          return 'bg-amber-500 border-amber-600 text-white' // 🟡 Amber: Booked but attendance not marked
      }
    }

    // Available for booking
    return 'bg-green-500 border-green-600 text-white hover:bg-green-600' // 🟢 Green: Available for booking
  }

  const getPCStatusText = (pc, booking) => {
    if (pc.status === 'inactive') return 'Inactive'
    if (pc.status === 'maintenance') return 'Maintenance'

    if (booking) {
      const attendanceStatus = booking.attendanceStatus || 'not-marked'
      switch (attendanceStatus) {
        case 'present': return 'Present'
        case 'absent': return 'Absent'
        case 'late': return 'Late'
        default: return 'Not Marked'
      }
    }

    return 'Available'
  }

  const getPCStatusIcon = (pc, booking) => {
    if (pc.status === 'inactive') return <PowerIcon className="h-5 w-5" />
    if (pc.status === 'maintenance') return <WrenchScrewdriverIcon className="h-5 w-5" />

    if (booking) {
      const attendanceStatus = booking.attendanceStatus || 'not-marked'
      switch (attendanceStatus) {
        case 'present': return <CheckCircleIcon className="h-5 w-5" />
        case 'absent': return <XCircleIcon className="h-5 w-5" />
        case 'late': return <ClockIcon className="h-5 w-5" />
        default: return <ExclamationTriangleIcon className="h-5 w-5" />
      }
    }

    return <UserPlusIcon className="h-5 w-5" />
  }

  // Initialize data
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Fetch bookings when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      fetchBookings()
    }
  }, [selectedDate, selectedTimeSlot])

  // Enhanced student filtering with teacher info and batch filtering
  useEffect(() => {
    let studentsArray = Array.isArray(students) ? students : []

    // Filter by batch if batch filtering is enabled
    if (filterByBatch && selectedBatch) {
      studentsArray = studentsArray.filter(student =>
        student.batch?._id === selectedBatch || student.batch === selectedBatch
      )
    }

    // Filter by search term
    if (studentSearch.trim()) {
      const searchTerm = studentSearch.toLowerCase()
      studentsArray = studentsArray.filter(student => {
        const nameMatch = student.name?.toLowerCase().includes(searchTerm)
        const rollMatch = student.rollNo?.toLowerCase().includes(searchTerm)
        const teacherMatch = student.teacher?.name?.toLowerCase().includes(searchTerm)
        const batchMatch = student.batch?.name?.toLowerCase().includes(searchTerm)

        return nameMatch || rollMatch || teacherMatch || batchMatch
      })
    }

    // Filter out students who already have bookings for the same date and time
    if (selectedDate && selectedTimeSlot) {
      studentsArray = studentsArray.filter(student => {
        const hasExistingBooking = bookings.some(booking =>
          booking.student?._id === student._id &&
          booking.date === selectedDate &&
          booking.timeSlot === selectedTimeSlot
        )
        return !hasExistingBooking
      })
    }

    // Sort by name for better UX
    studentsArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    setFilteredStudents(studentsArray)
  }, [studentSearch, students, selectedBatch, filterByBatch, selectedDate, selectedTimeSlot, bookings])

  // Get teacher information for a student
  const getStudentTeacher = (studentId) => {
    const student = students.find(s => s._id === studentId)
    if (!student) return { teacher: null, batch: null }

    let teacher = null
    let batch = null

    // Try to get teacher from student's batch
    if (student.batch) {
      if (typeof student.batch === 'object') {
        batch = student.batch
        teacher = teachers.find(t => t._id === student.batch.teacher)
      } else {
        batch = batches.find(b => b._id === student.batch)
        if (batch) {
          teacher = teachers.find(t => t._id === batch.teacher)
        }
      }
    }

    // Fallback to direct teacher reference
    if (!teacher && student.teacher) {
      teacher = teachers.find(t => t._id === student.teacher)
    }

    return { teacher, batch }
  }

  // Update lab statistics
  const updateLabStats = () => {
    try {
      const pcsData = Object.values(pcsByRow).flat()
      const totalPCs = pcsData.length
      const activePCs = pcsData.filter(pc => pc.status === 'active').length
      const maintenancePCs = pcsData.filter(pc => pc.status === 'maintenance').length
      const bookedPCs = bookings.length
      const availablePCs = activePCs - bookedPCs

      setLabStats({
        totalPCs,
        activePCs,
        bookedPCs,
        availablePCs,
        maintenancePCs
      })
    } catch (error) {
      console.error('Error updating lab stats:', error)
    }
  }

  // Update stats when data changes
  useEffect(() => {
    updateLabStats()
  }, [pcsByRow, bookings])

  // Auto-refresh functionality
  useEffect(() => {
    let interval
    if (autoRefresh && selectedDate && selectedTimeSlot) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing lab data...')
        fetchBookings()
        updateLabStats()
      }, 30000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, selectedDate, selectedTimeSlot])

  // Fetch Functions
  const fetchInitialData = async () => {
    console.log('🚀 Starting initial data fetch...')
    setLoading(true)
    
    try {
      await Promise.all([
        fetchPCsByRow(),
        fetchStudents(),
        fetchBatches(),
        fetchTeachers()
      ])
      toast.success('✅ Lab data loaded successfully')
    } catch (error) {
      console.error('❌ Error fetching initial data:', error)
      toast.error('Failed to load lab data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPCsByRow = async () => {
    try {
      console.log('📡 Fetching PCs by row...')
      const response = await pcAPI.getPCsByRow()
      const pcsData = response?.data || response || {}
      console.log('✅ PCs fetched:', Object.keys(pcsData).length, 'rows')
      setPcsByRow(pcsData)
    } catch (error) {
      console.error('❌ Error fetching PCs:', error)
      setPcsByRow({})
    }
  }

  const fetchStudents = async () => {
    try {
      console.log('📡 Fetching students...')
      const response = await studentsAPI.getStudents()
      
      // Handle different response formats
      let studentsData = []
      if (Array.isArray(response)) {
        studentsData = response
      } else if (response?.data?.students) {
        studentsData = response.data.students
      } else if (response?.data) {
        studentsData = response.data
      }
      
      console.log('✅ Students fetched:', studentsData.length)
      setStudents(studentsData)
      setFilteredStudents(studentsData)
    } catch (error) {
      console.error('❌ Error fetching students:', error)
      setStudents([])
      setFilteredStudents([])
    }
  }

  const fetchBatches = async () => {
    try {
      console.log('📡 Fetching batches...')
      const response = await batchesAPI.getBatches()
      const batchesData = Array.isArray(response) ? response : (response.data || [])
      console.log('✅ Batches fetched:', batchesData.length)
      setBatches(batchesData)
    } catch (error) {
      console.error('❌ Error fetching batches:', error)
      setBatches([])
    }
  }

  const fetchTeachers = async () => {
    try {
      console.log('📡 Fetching teachers...')
      const response = await teachersAPI.getTeachers()
      const teachersData = Array.isArray(response) ? response : (response.data || [])
      const teachers = teachersData.filter(teacher => teacher.role === 'teacher')
      console.log('✅ Teachers fetched:', teachers.length)
      setTeachers(teachers)
    } catch (error) {
      console.error('❌ Error fetching teachers:', error)
      setTeachers([])
    }
  }

  const fetchBookings = async () => {
    try {
      console.log('📡 Fetching bookings for:', { date: selectedDate, timeSlot: selectedTimeSlot })

      // Fetch bookings with attendance data
      const response = await bookingAPI.getBookingsWithAttendance({
        date: selectedDate,
        timeSlot: selectedTimeSlot
      })

      const bookingsData = Array.isArray(response) ? response : (response.data || [])
      console.log('✅ Bookings fetched:', bookingsData.length)

      // Validate and enhance booking data
      const validBookings = bookingsData.filter(booking => {
        if (!booking.pc || !booking.pc._id) {
          console.warn('⚠️ Invalid booking - missing PC data:', booking)
          return false
        }
        return true
      }).map(booking => {
        // Ensure attendance status is properly set
        if (!booking.attendanceStatus) {
          booking.attendanceStatus = 'not-marked'
        }
        return booking
      })

      setBookings(validBookings)

      // Log attendance status distribution for debugging
      const statusCounts = validBookings.reduce((acc, booking) => {
        const status = booking.attendanceStatus || 'not-marked'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
      console.log('📊 Attendance status distribution:', statusCounts)

    } catch (error) {
      console.error('❌ Error fetching bookings:', error)
      setBookings([])
      toast.error('Failed to fetch booking data')
    }
  }

  // Fetch attendance data for real-time updates
  const fetchAttendance = async () => {
    try {
      if (!selectedDate) return

      console.log('📡 Fetching attendance for date:', selectedDate)

      // This would be your attendance API call
      const response = await api.get(`/api/attendance`, {
        params: { date: selectedDate }
      })

      const attendanceData = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      setAttendance(attendanceData)

      console.log('✅ Attendance fetched:', attendanceData.length, 'records')

    } catch (error) {
      console.error('❌ Error fetching attendance:', error)
      setAttendance([])
    }
  }

  // Enhanced PC Click Handler with Smart Validation
  const handlePCClick = (pc) => {
    console.log('🖱️ PC clicked:', pc.pcNumber, 'Status:', pc.status)

    // Validation 1: Check if date and time slot are selected
    if (!selectedDate || !selectedTimeSlot) {
      toast.warning('⚠️ Please select date and time slot first', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    // Validation 2: Check PC status with detailed messages
    if (pc.status !== 'active') {
      let message = ''
      let icon = ''
      switch (pc.status) {
        case 'maintenance':
          message = `🔧 PC ${pc.pcNumber} is under maintenance and not available for booking`
          icon = '🔧'
          break
        case 'inactive':
          message = `⚫ PC ${pc.pcNumber} is inactive/offline and not available for booking`
          icon = '⚫'
          break
        default:
          message = `❌ PC ${pc.pcNumber} is not available for booking (Status: ${pc.status})`
          icon = '❌'
      }
      toast.warning(message, {
        position: "top-center",
        autoClose: 4000,
      })
      return
    }

    // Check if PC is already booked for the selected time slot
    const existingBooking = bookings.find(booking =>
      booking.pc._id === pc._id &&
      booking.timeSlot === selectedTimeSlot &&
      booking.date === selectedDate
    )

    console.log('🔍 Existing booking check:', existingBooking ? 'Found' : 'Not found')

    if (existingBooking) {
      // Show booking management modal for existing booking
      console.log('📋 Opening booking management for:', existingBooking.studentName)
      setSelectedPC({ ...pc, booking: existingBooking })
      setShowBookingModal(true)

      const { teacher } = getStudentTeacher(existingBooking.student?._id)
      toast.info(`📋 Managing booking: ${existingBooking.studentName} (Teacher: ${teacher?.name || 'Unknown'})`, {
        position: "top-right",
        autoClose: 3000,
      })
    } else {
      // Open new booking form
      console.log('➕ Opening new booking form for PC:', pc.pcNumber)
      setSelectedPC(pc)
      setSelectedStudent('')
      setStudentSearch('')
      setShowBookingModal(true)

      // Show available students count
      const availableStudents = filteredStudents.length
      toast.info(`➕ Book PC ${pc.pcNumber} for ${selectedTimeSlot} (${availableStudents} students available)`, {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  // Enhanced Booking Submit Handler with Comprehensive Validation
  const handleBookingSubmit = async () => {
    console.log('📝 Starting advanced booking submission...')

    // Validation 1: Check if student is selected
    if (!selectedStudent) {
      toast.error('❌ Please select a student to book the PC', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    // Validation 2: Get student and teacher information
    const student = students.find(s => s._id === selectedStudent)
    if (!student) {
      toast.error('❌ Selected student not found in system', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    const { teacher, batch } = getStudentTeacher(selectedStudent)

    // Validation 3: Check if student already has a booking for this time slot
    const studentAlreadyBooked = bookings.find(booking =>
      booking.student?._id === selectedStudent &&
      booking.timeSlot === selectedTimeSlot &&
      booking.date === selectedDate
    )

    if (studentAlreadyBooked) {
      toast.error(`❌ ${student.name} already has a booking for ${selectedTimeSlot} on ${selectedDate}`, {
        position: "top-center",
        autoClose: 4000,
      })
      return
    }

    // Validation 4: Check if PC is still available
    const pcStillAvailable = !bookings.find(booking =>
      booking.pc._id === selectedPC._id &&
      booking.timeSlot === selectedTimeSlot &&
      booking.date === selectedDate
    )

    if (!pcStillAvailable) {
      toast.error(`❌ PC ${selectedPC.pcNumber} has been booked by someone else. Please refresh and try again.`, {
        position: "top-center",
        autoClose: 4000,
      })
      await fetchBookings()
      setShowBookingModal(false)
      return
    }

    try {
      setBookingLoading(true)
      console.log('🔄 Creating booking with enhanced data...')

      const bookingData = {
        pc: selectedPC._id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        student: selectedStudent,
        studentName: student.name,
        studentRollNo: student.rollNo,
        teacherName: teacher?.name || 'Unknown Teacher',
        teacherId: teacher?._id || null,
        batch: batch?._id || student.batch || null,
        batchName: batch?.name || 'Unknown Batch',
        department: student.department || batch?.department || 'Unknown',
        purpose: 'Lab Session',
        attendanceStatus: 'not-marked',
        bookedBy: 'admin', // or get from auth context
        bookedAt: new Date().toISOString()
      }

      console.log('📤 Enhanced booking data:', bookingData)

      // Try bookingAPI first, fallback to direct API
      let response
      if (typeof bookingAPI.createBooking === 'function') {
        console.log('✅ Using bookingAPI.createBooking')
        response = await bookingAPI.createBooking(bookingData)
      } else {
        console.log('⚠️ Using direct API call')
        const apiResponse = await api.post('/api/lab/bookings', bookingData)
        response = apiResponse.data
      }

      console.log('✅ Booking created successfully:', response)

      // Enhanced success message with teacher info
      const successMessage = `✅ PC ${selectedPC.pcNumber} booked successfully!\n👤 Student: ${student.name}\n👨‍🏫 Teacher: ${teacher?.name || 'Unknown'}\n📚 Batch: ${batch?.name || 'Unknown'}`

      toast.success(successMessage, {
        position: "top-right",
        autoClose: 4000,
      })

      // Refresh data to show updated booking status
      await Promise.all([
        fetchBookings(),
        fetchAttendance() // Also refresh attendance data
      ])

      // Close modal and reset form
      setShowBookingModal(false)
      setSelectedPC(null)
      setSelectedStudent('')
      setStudentSearch('')

      console.log('✅ Booking process completed successfully')

    } catch (error) {
      console.error('❌ Error creating booking:', error)

      let errorMessage = 'Failed to create booking'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(`❌ ${errorMessage}`, {
        position: "top-center",
        autoClose: 4000,
      })
    } finally {
      setBookingLoading(false)
    }
  }

  // Delete Booking Handler
  const handleDeleteBooking = async (bookingId) => {
    try {
      if (typeof bookingAPI.deleteBooking === 'function') {
        await bookingAPI.deleteBooking(bookingId)
      } else {
        await api.delete(`/api/lab/bookings/${bookingId}`)
      }

      toast.success('✅ Booking deleted successfully')
      await fetchBookings()
      setShowBookingModal(false)
      setSelectedPC(null)
    } catch (error) {
      console.error('❌ Error deleting booking:', error)
      toast.error('Failed to delete booking')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl shadow-2xl">
        <div className="relative px-8 py-8 z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BoltIcon className="h-8 w-8 text-yellow-300" />
                </div>
                <h1 className="text-4xl font-bold text-white">Smart Lab Control Center</h1>
                {realTimeMode && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-sm font-medium">LIVE</span>
                  </div>
                )}
              </div>
              <p className="text-xl text-white/90 mb-4">Advanced PC Slot Booking & Real-time Lab Management System</p>
            </div>

            {/* Stats Dashboard */}
            <div className="lg:w-80">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Total PCs</p>
                      <p className="text-2xl font-bold text-white">{labStats.totalPCs}</p>
                    </div>
                    <ComputerDesktopIcon className="h-8 w-8 text-blue-300" />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Available</p>
                      <p className="text-2xl font-bold text-green-300">{labStats.availablePCs}</p>
                    </div>
                    <CheckCircleIcon className="h-8 w-8 text-green-300" />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Booked</p>
                      <p className="text-2xl font-bold text-red-300">{labStats.bookedPCs}</p>
                    </div>
                    <UserIcon className="h-8 w-8 text-red-300" />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Maintenance</p>
                      <p className="text-2xl font-bold text-yellow-300">{labStats.maintenancePCs}</p>
                    </div>
                    <Cog6ToothIcon className="h-8 w-8 text-yellow-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Smart Lab Control Panel</h2>
              <p className="text-sm text-gray-600">Advanced booking management with real-time controls</p>
            </div>

            {/* Real-time Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRealTimeMode(!realTimeMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    realTimeMode ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    realTimeMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm font-medium text-gray-700">Real-time Mode</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm font-medium text-gray-700">Auto-refresh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date & Time Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">📅 Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                  <span>
                    {new Date(selectedDate).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                  {selectedDate === new Date().toISOString().split('T')[0] && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Today
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Batch & Student Filtering */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">📚 Batch Filter (Optional)</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({batch.timing || 'No timing'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filterByBatch}
                    onChange={(e) => setFilterByBatch(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Filter students by batch</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Show only available PCs</span>
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">⚡ Quick Actions</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={fetchInitialData}
                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Refresh All Data</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDate(new Date().toISOString().split('T')[0])
                      setSelectedTimeSlot('')
                      setSelectedBatch('')
                      setFilterByBatch(false)
                      setShowOnlyAvailable(false)
                      toast.info('🔄 Reset all filters')
                    }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>Reset Filters</span>
                  </button>

                  <button
                    onClick={() => {
                      fetchBookings()
                      fetchAttendance()
                      toast.info('🔄 Refreshed booking data')
                    }}
                    className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <BookmarkIcon className="h-4 w-4" />
                    <span>Refresh Bookings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Time Slots Selection with Batch Integration */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">⏰ Smart Time Slot Selection</h2>
              <p className="text-sm text-gray-600">
                {selectedBatch
                  ? `Showing time slots for ${batches.find(b => b._id === selectedBatch)?.name || 'selected batch'}`
                  : 'Choose a time slot to view and manage PC bookings'
                }
              </p>
            </div>

            {selectedBatch && (
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">
                  Batch: {batches.find(b => b._id === selectedBatch)?.name}
                </div>
                <div className="text-xs text-gray-500">
                  Timing: {batches.find(b => b._id === selectedBatch)?.timing || 'Not specified'}
                </div>
              </div>
            )}
          </div>
        </div>

        {timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No time slots available for the selected batch</p>
            <p className="text-sm text-gray-400 mt-2">Please select a different batch or check batch timing configuration</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {timeSlots.map((slot) => {
              const slotValue = typeof slot === 'object' ? slot.value : slot
              const slotLabel = typeof slot === 'object' ? slot.label : slot
              const slotType = typeof slot === 'object' ? slot.type : 'general'

              const bookingCount = bookings.filter(b => b.timeSlot === slotValue).length
              const isSelected = selectedTimeSlot === slotValue
              const isActive = bookingCount > 0

              // Color coding based on slot type and status
              let slotColor = 'border-gray-200 bg-gray-50 hover:border-gray-300'
              let textColor = 'text-gray-700'

              if (isSelected) {
                slotColor = 'border-blue-500 bg-blue-50 shadow-lg'
                textColor = 'text-blue-700'
              } else if (isActive) {
                slotColor = 'border-orange-300 bg-orange-50 hover:border-orange-400'
                textColor = 'text-orange-700'
              } else {
                // Color by time type
                switch (slotType) {
                  case 'morning':
                    slotColor = 'border-green-200 bg-green-50 hover:border-green-300'
                    textColor = 'text-green-700'
                    break
                  case 'afternoon':
                    slotColor = 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                    textColor = 'text-yellow-700'
                    break
                  case 'evening':
                    slotColor = 'border-purple-200 bg-purple-50 hover:border-purple-300'
                    textColor = 'text-purple-700'
                    break
                }
              }

              return (
                <button
                  key={slotValue}
                  onClick={() => setSelectedTimeSlot(slotValue)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${slotColor}`}
                >
                  <div className="text-center">
                    <div className={`text-sm font-bold ${textColor}`}>
                      {slotLabel}
                    </div>
                    <div className={`text-xs mt-1 opacity-75`}>
                      {bookingCount} booking{bookingCount !== 1 ? 's' : ''}
                    </div>
                    {typeof slot === 'object' && (
                      <div className="text-xs mt-1 opacity-60 capitalize">
                        {slotType}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {isActive && !isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{bookingCount}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {selectedTimeSlot && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-blue-900">
                  Selected: {timeSlots.find(s => (typeof s === 'object' ? s.value : s) === selectedTimeSlot)?.label || selectedTimeSlot}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-blue-700">
                  {bookings.filter(b => b.timeSlot === selectedTimeSlot).length} PCs booked
                </div>
                <button
                  onClick={() => setSelectedTimeSlot('')}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Color-Coded Status Legend */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">🎨 Smart PC Status Color Coding</h2>
          <p className="text-sm text-gray-600">Real-time status indicators based on attendance integration</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
            <div>
              <div className="text-sm font-medium text-red-700">🔴 Present</div>
              <div className="text-xs text-red-600">Booked & Present</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="w-4 h-4 bg-orange-500 rounded border border-orange-600"></div>
            <div>
              <div className="text-sm font-medium text-orange-700">🟠 Absent</div>
              <div className="text-xs text-orange-600">Booked but Absent</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="w-4 h-4 bg-purple-500 rounded border border-purple-600"></div>
            <div>
              <div className="text-sm font-medium text-purple-700">🟣 Late</div>
              <div className="text-xs text-purple-600">Booked & Late</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="w-4 h-4 bg-amber-500 rounded border border-amber-600"></div>
            <div>
              <div className="text-sm font-medium text-amber-700">🟡 Pending</div>
              <div className="text-xs text-amber-600">Attendance Not Marked</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
            <div>
              <div className="text-sm font-medium text-green-700">🟢 Available</div>
              <div className="text-xs text-green-600">Ready for Booking</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="w-4 h-4 bg-yellow-500 rounded border border-yellow-600"></div>
            <div>
              <div className="text-sm font-medium text-yellow-700">🟡 Maintenance</div>
              <div className="text-xs text-yellow-600">Under Repair</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="w-4 h-4 bg-gray-500 rounded border border-gray-600"></div>
            <div>
              <div className="text-sm font-medium text-gray-700">⚫ Inactive</div>
              <div className="text-xs text-gray-600">Offline/Disabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced PC Grid with Smart Color Coding */}
      {selectedDate && selectedTimeSlot && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">🖥️ PC Lab Layout</h2>
            <p className="text-sm text-gray-600">
              Click on any PC to book or manage bookings for {getTimeSlotLabel(selectedTimeSlot)} on {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>

          {Object.keys(pcsByRow).length === 0 ? (
            <div className="text-center py-12">
              <ComputerDesktopIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No PCs found. Please check your lab configuration.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(pcsByRow).map(([rowName, pcs]) => (
                <div key={rowName} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {rowName}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {pcs.map((pc) => {
                      const booking = bookings.find(b => b.pc._id === pc._id)
                      const isBooked = !!booking

                      // Filter PCs if "Show only available" is enabled
                      if (showOnlyAvailable && (pc.status !== 'active' || isBooked)) {
                        return null
                      }

                      // Use smart color coding functions
                      const statusColor = getPCStatusColor(pc, booking)
                      const statusText = getPCStatusText(pc, booking)
                      const statusIcon = getPCStatusIcon(pc, booking)

                      return (
                        <button
                          key={pc._id}
                          onClick={() => handlePCClick(pc)}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${statusColor}`}
                          title={`PC ${pc.pcNumber} - ${statusText}${booking ? `\nStudent: ${booking.studentName}\nTeacher: ${booking.teacherName}` : ''}`}
                        >
                          <div className="text-center">
                            {/* PC Icon and Status Icon */}
                            <div className="flex items-center justify-center mb-2">
                              <ComputerDesktopIcon className="h-6 w-6" />
                              <div className="ml-1">
                                {statusIcon}
                              </div>
                            </div>

                            {/* PC Number */}
                            <div className="font-bold text-lg">{pc.pcNumber}</div>

                            {/* Status Text */}
                            <div className="text-xs opacity-90 mt-1">{statusText}</div>

                            {/* Student Information */}
                            {isBooked && (
                              <div className="text-xs mt-2 opacity-80 space-y-1">
                                <div className="font-medium truncate">{booking.studentName}</div>
                                <div className="truncate">{booking.teacherName}</div>
                                {booking.batchName && (
                                  <div className="truncate text-xs opacity-70">{booking.batchName}</div>
                                )}
                              </div>
                            )}

                            {/* Hover Indicator */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-xl transition-all duration-200"></div>

                            {/* Status Indicator Dot */}
                            <div className="absolute top-2 right-2">
                              <div className={`w-3 h-3 rounded-full ${
                                pc.status === 'inactive' ? 'bg-gray-300' :
                                pc.status === 'maintenance' ? 'bg-yellow-300' :
                                isBooked ? 'bg-white opacity-80' : 'bg-green-300'
                              }`}></div>
                            </div>

                            {/* Booking Count for Multiple Bookings */}
                            {isBooked && booking.attendanceStatus && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-800">
                                  {booking.attendanceStatus === 'present' ? '✓' :
                                   booking.attendanceStatus === 'absent' ? '✗' :
                                   booking.attendanceStatus === 'late' ? '⏰' : '?'}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    }).filter(Boolean)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedPC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedPC.booking ? 'Manage Booking' : 'Book PC'} - {selectedPC.pcNumber}
                </h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {selectedPC.booking ? (
                // Show existing booking details
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">Current Booking</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Student:</span> {selectedPC.booking.studentName}</p>
                      <p><span className="font-medium">Teacher:</span> {selectedPC.booking.teacherName}</p>
                      <p><span className="font-medium">Time:</span> {getTimeSlotLabel(selectedPC.booking.timeSlot)}</p>
                      <p><span className="font-medium">Date:</span> {new Date(selectedPC.booking.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBooking(selectedPC.booking._id)}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Booking
                  </button>
                </div>
              ) : (
                // Show booking form
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Booking Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">PC:</span> {selectedPC.pcNumber}</p>
                      <p><span className="font-medium">Time:</span> {getTimeSlotLabel(selectedTimeSlot)}</p>
                      <p><span className="font-medium">Date:</span> {new Date(selectedDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Student
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                    {filteredStudents.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-medium">No students found</p>
                        <p className="text-sm mt-1">
                          {studentSearch.trim()
                            ? 'Try adjusting your search terms'
                            : 'No students available for this time slot'
                          }
                        </p>
                        {selectedBatch && filterByBatch && (
                          <p className="text-xs mt-2 text-blue-600">
                            Filtered by batch: {batches.find(b => b._id === selectedBatch)?.name}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-gray-50 border-b border-gray-200">
                          <div className="text-sm text-gray-600">
                            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} available
                            {selectedBatch && filterByBatch && (
                              <span className="ml-2 text-blue-600">
                                (from {batches.find(b => b._id === selectedBatch)?.name})
                              </span>
                            )}
                          </div>
                        </div>

                        {filteredStudents.slice(0, 15).map((student) => {
                          const { teacher, batch } = getStudentTeacher(student._id)
                          const isSelected = selectedStudent === student._id

                          return (
                            <button
                              key={student._id}
                              onClick={() => setSelectedStudent(student._id)}
                              className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
                                isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-20' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                      {student.name}
                                    </div>
                                    {isSelected && (
                                      <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                                    )}
                                  </div>

                                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <div className="flex items-center space-x-4">
                                      <span>📋 Roll: {student.rollNo}</span>
                                      <span>📚 Batch: {batch?.name || 'N/A'}</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <span>👨‍🏫 Teacher:</span>
                                      <span className={`font-medium ${teacher ? 'text-green-600' : 'text-red-500'}`}>
                                        {teacher?.name || 'Not Assigned'}
                                      </span>
                                    </div>

                                    {student.department && (
                                      <div className="text-xs text-gray-500">
                                        🏢 Department: {student.department}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="ml-3">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <CheckCircleIcon className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}

                        {filteredStudents.length > 15 && (
                          <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-600">
                              Showing first 15 of {filteredStudents.length} students.
                              <span className="text-blue-600 ml-1">Refine your search to see more.</span>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleBookingSubmit}
                    disabled={!selectedStudent || bookingLoading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {bookingLoading ? 'Booking...' : 'Book PC'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LabOverviewFixed
