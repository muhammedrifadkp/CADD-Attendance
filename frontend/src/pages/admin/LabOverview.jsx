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
  SparklesIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI } from '../../services/labAPI'
import { teachersAPI, studentsAPI, batchesAPI } from '../../services/api'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { showConfirm } from '../../utils/popup'
import BackButton from '../../components/BackButton'
import labUpdateService from '../../services/labUpdateService'
import ApplyPreviousDateModal from '../../components/ApplyPreviousDateModal'

const LabOverview = () => {
  // Booking System State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [pcsByRow, setPcsByRow] = useState({})
  const [bookings, setBookings] = useState([])
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  // Modal State
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedPC, setSelectedPC] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [filteredStudents, setFilteredStudents] = useState([])
  const [showApplyPreviousModal, setShowApplyPreviousModal] = useState(false)

  // Enhanced state for better functionality
  const [labStats, setLabStats] = useState({
    totalPCs: 0,
    activePCs: 0,
    bookedPCs: 0,
    availablePCs: 0,
    maintenancePCs: 0
  })
  const [realTimeMode, setRealTimeMode] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'list', 'timeline'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'available', 'booked', 'maintenance'
  const [searchTerm, setSearchTerm] = useState('')

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    studentsLoaded: false,
    studentsCount: 0,
    lastError: null,
    apiResponse: null
  })

  // Time slots configuration
  const timeSlots = [
    '09:00 AM - 10:30 AM',
    '10:30 AM - 12:00 PM',
    '12:00 PM - 01:30 PM',
    '02:00 PM - 03:30 PM',
    '03:30 PM - 05:00 PM',
  ]

  // Time slot labels for display
  const getTimeSlotLabel = (slot) => {
    const labels = {
      '09:00-10:30': '09:00 - 10:30 AM',
      '10:30-12:00': '10:30 - 12:00 PM',
      '12:00-01:30': '12:00 - 01:30 PM',
      '02:30-03:30': '02:30 - 03:30 PM',
      '03:30-05:00': '03:30 - 05:00 PM',
    }
    return labels[slot] || slot
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      fetchBookings()
    }
  }, [selectedDate, selectedTimeSlot])

  useEffect(() => {
    // Filter students based on search and selected time slot
    // Ensure students is always an array
    const studentsArray = Array.isArray(students) ? students : []

    console.log('🔍 Filtering students. Total students:', studentsArray.length)
    console.log('🔍 Search term:', studentSearch)

    if (studentSearch.trim()) {
      const filtered = studentsArray.filter(student => {
        const nameMatch = student.name?.toLowerCase().includes(studentSearch.toLowerCase())
        const rollMatch = student.rollNo?.toLowerCase().includes(studentSearch.toLowerCase())
        const matches = nameMatch || rollMatch

        if (matches) {
          console.log('✅ Student matches search:', student.name)
        }

        return matches
      })

      console.log('🔍 Filtered students count:', filtered.length)
      setFilteredStudents(filtered)
    } else {
      console.log('🔍 No search term, showing all students:', studentsArray.length)
      setFilteredStudents(studentsArray)
    }
  }, [studentSearch, students])

  // Initialize lab update service
  useEffect(() => {
    labUpdateService.init()
    const unsubscribe = labUpdateService.subscribe(['lab_availability', 'booking', 'pc_status'], (update) => {
      console.log('🔄 Lab update received:', update)
      if (realTimeMode) {
        fetchBookings()
        fetchPCsByRow()
        updateLabStats()
      }
    })
    return () => unsubscribe()
  }, [realTimeMode])

  // Auto-refresh functionality
  useEffect(() => {
    let interval
    if (autoRefresh && selectedDate && selectedTimeSlot) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing lab data...')
        fetchBookings()
        updateLabStats()
      }, 30000) // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, selectedDate, selectedTimeSlot])

  // Update lab statistics
  const updateLabStats = async () => {
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

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchPCsByRow(),
        fetchStudents(),
        fetchBatches(),
        fetchTeachers()
      ])
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Failed to load lab data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPCsByRow = async () => {
    try {
      const response = await pcAPI.getPCsByRow()
      const pcsData = response?.data || response || {}
      setPcsByRow(pcsData)
    } catch (error) {
      console.error('Error fetching PCs by row:', error)
      setPcsByRow({})
    }
  }

  const fetchStudents = async () => {
    try {
      console.log('🚀 === STARTING STUDENT FETCH DEBUG ===')
      console.log('📡 Fetching students for booking...')

      // Update debug info
      setDebugInfo(prev => ({ ...prev, studentsLoaded: false, lastError: null }))

      // First try to get all students without filters to see if API works
      const response = await studentsAPI.getStudents()

      console.log('📡 Raw students response:', response)
      console.log('📡 Response type:', typeof response)
      console.log('📡 Response keys:', response ? Object.keys(response) : 'null')

      // Update debug info with API response
      setDebugInfo(prev => ({ ...prev, apiResponse: response }))

      // Handle different response formats
      let studentsData = []
      if (Array.isArray(response)) {
        console.log('✅ Response is direct array')
        studentsData = response
      } else if (response && response.data && Array.isArray(response.data.students)) {
        console.log('✅ Response has data.students property with array')
        studentsData = response.data.students
      } else if (response && response.data && Array.isArray(response.data)) {
        console.log('✅ Response has data property with array')
        studentsData = response.data
      } else if (response && Array.isArray(response.students)) {
        console.log('✅ Response has students property with array')
        studentsData = response.students
      } else {
        console.warn('⚠️ Unexpected response format:', response)
        console.warn('⚠️ Response structure:', JSON.stringify(response, null, 2))
        studentsData = []
      }

      console.log('📚 Students data extracted:', studentsData.length, 'students')

      if (studentsData.length > 0) {
        console.log('📋 First student sample:', JSON.stringify(studentsData[0], null, 2))
        console.log('📋 All students preview:', studentsData.map(s => ({
          name: s.name,
          id: s._id,
          rollNo: s.rollNo
        })))
      } else {
        console.warn('⚠️ No students in extracted data')
      }

      // Validate and filter student data
      const validStudents = studentsData.filter((student, index) => {
        console.log(`🔍 Validating student ${index + 1}:`, student)

        if (!student || typeof student !== 'object') {
          console.warn('⚠️ Invalid student data - not an object:', student)
          return false
        }

        if (!student.name || !student._id) {
          console.warn('⚠️ Invalid student data - missing name or ID:', {
            name: student.name,
            id: student._id,
            keys: Object.keys(student)
          })
          return false
        }

        // For now, include all students regardless of active status for debugging
        console.log('✅ Valid student:', student.name, 'ID:', student._id, 'Active:', student.isActive)
        return true
      })

      console.log('✅ Final valid students count:', validStudents.length)
      console.log('🚀 === SETTING STUDENTS STATE ===')

      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        studentsLoaded: true,
        studentsCount: validStudents.length
      }))

      setStudents(validStudents)
      setFilteredStudents(validStudents)

      console.log('🚀 === STUDENTS STATE SET ===')
      console.log('📊 Students state:', validStudents.length)
      console.log('📊 Filtered students state:', validStudents.length)

      if (validStudents.length === 0) {
        console.warn('⚠️ No valid students found for booking')
        toast.warning('No students found. Please check if students exist in the system.')
      } else {
        toast.success(`✅ Loaded ${validStudents.length} students for booking`)
      }

      console.log('🚀 === STUDENT FETCH DEBUG COMPLETE ===')

    } catch (error) {
      console.error('❌ === STUDENT FETCH ERROR ===')
      console.error('❌ Error fetching students:', error)
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      })

      // Update debug info with error
      setDebugInfo(prev => ({
        ...prev,
        studentsLoaded: false,
        lastError: error.message,
        studentsCount: 0
      }))

      toast.error('Failed to fetch student data: ' + (error.message || 'Unknown error'))
      setStudents([])
      setFilteredStudents([])
      console.error('❌ === STUDENT FETCH ERROR COMPLETE ===')
    }
  }

  const fetchBatches = async () => {
    try {
      const response = await batchesAPI.getBatches()
      const batchesData = Array.isArray(response) ? response : (response.data || [])
      setBatches(batchesData)
    } catch (error) {
      console.error('Error fetching batches:', error)
      setBatches([])
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getTeachers()
      const teachersData = Array.isArray(response) ? response : (response.data || [])
      setTeachers(teachersData.filter(teacher => teacher.role === 'teacher'))
    } catch (error) {
      console.error('Error fetching teachers:', error)
      setTeachers([])
    }
  }

  const fetchBookings = async () => {
    try {
      console.log('📡 Fetching bookings for:', { date: selectedDate, timeSlot: selectedTimeSlot })

      const response = await bookingAPI.getBookingsWithAttendance({
        date: selectedDate,
        timeSlot: selectedTimeSlot
      })

      const bookingsData = Array.isArray(response) ? response : (response.data || [])
      console.log('📋 Bookings fetched:', bookingsData.length, 'bookings')

      // Validate booking data structure
      const validBookings = bookingsData.filter(booking => {
        if (!booking.pc || !booking.pc._id) {
          console.warn('⚠️ Invalid booking - missing PC data:', booking)
          return false
        }
        return true
      })

      setBookings(validBookings)

      // Log attendance status distribution
      const statusCounts = validBookings.reduce((acc, booking) => {
        const status = booking.attendanceStatus || 'not-marked'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
      console.log('📊 Attendance status distribution:', statusCounts)

    } catch (error) {
      console.error('❌ Error fetching bookings:', error)
      toast.error('Failed to fetch booking data')
      setBookings([])
    }
  }

  // Booking System Functions
  const handlePCClick = (pc) => {
    console.log('🖱️ PC clicked:', pc.pcNumber, 'Status:', pc.status)

    // Validation: Check if date and time slot are selected
    if (!selectedDate || !selectedTimeSlot) {
      toast.warning('⚠️ Please select date and time slot first', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    // Validation: Check PC status
    if (pc.status !== 'active') {
      let message = ''
      switch (pc.status) {
        case 'maintenance':
          message = `🔧 PC ${pc.pcNumber} is under maintenance and not available for booking`
          break
        case 'inactive':
          message = `⚫ PC ${pc.pcNumber} is inactive and not available for booking`
          break
        default:
          message = `❌ PC ${pc.pcNumber} is not available for booking`
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
      // Show booking details modal for existing booking
      console.log('📋 Opening booking details for:', existingBooking.studentName)
      setSelectedPC({ ...pc, booking: existingBooking })
      setShowBookingModal(true)
      toast.info(`📋 Viewing booking details for PC ${pc.pcNumber}`, {
        position: "top-right",
        autoClose: 2000,
      })
    } else {
      // Open new booking form
      console.log('➕ Opening new booking form for PC:', pc.pcNumber)
      setSelectedPC(pc)
      setSelectedStudent('')
      setStudentSearch('')
      setShowBookingModal(true)
      toast.info(`➕ Book PC ${pc.pcNumber} for ${selectedTimeSlot}`, {
        position: "top-right",
        autoClose: 2000,
      })
    }
  }

  const handleBookingSubmit = async () => {
    console.log('📝 Starting booking submission...')

    // Debug: Check what's available in bookingAPI
    console.log('🔍 bookingAPI object:', bookingAPI)
    console.log('🔍 bookingAPI keys:', Object.keys(bookingAPI))
    console.log('🔍 createBooking function:', bookingAPI.createBooking)
    console.log('🔍 createBooking type:', typeof bookingAPI.createBooking)

    // Validation: Check if student is selected
    if (!selectedStudent) {
      toast.error('❌ Please select a student to book the PC', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    // Validation: Check if student already has a booking for this time slot
    const studentAlreadyBooked = bookings.find(booking =>
      booking.student?._id === selectedStudent &&
      booking.timeSlot === selectedTimeSlot &&
      booking.date === selectedDate
    )

    if (studentAlreadyBooked) {
      const studentsArray = Array.isArray(students) ? students : []
      const student = studentsArray.find(s => s._id === selectedStudent)
      toast.error(`❌ ${student?.name || 'Student'} already has a booking for ${selectedTimeSlot} on ${selectedDate}`, {
        position: "top-center",
        autoClose: 4000,
      })
      return
    }

    try {
      setBookingLoading(true)
      console.log('🔄 Creating booking...')

      const studentsArray = Array.isArray(students) ? students : []
      const teachersArray = Array.isArray(teachers) ? teachers : []

      const student = studentsArray.find(s => s._id === selectedStudent)
      const teacher = teachersArray.find(t => t._id === student?.batch?.teacher || student?.teacher)

      if (!student) {
        throw new Error('Selected student not found')
      }

      const bookingData = {
        pc: selectedPC._id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        student: selectedStudent,
        studentName: student.name,
        teacherName: teacher?.name || 'Unknown Teacher',
        batch: student.batch?._id || null,
        purpose: 'Lab Session'
      }

      console.log('📤 Booking data:', bookingData)

      // Check if createBooking function exists, if not use direct API call
      let response
      if (typeof bookingAPI.createBooking === 'function') {
        console.log('✅ Using bookingAPI.createBooking')
        response = await bookingAPI.createBooking(bookingData)
      } else {
        console.log('⚠️ bookingAPI.createBooking not available, using direct API call')
        console.log('🔍 Available bookingAPI methods:', Object.keys(bookingAPI))

        // Fallback: Use direct API call
        const apiResponse = await api.post('/lab/bookings', bookingData)
        response = apiResponse.data
      }
      console.log('✅ Booking created:', response)

      // Handle enhanced API response
      const successMessage = response.message || `PC ${selectedPC.pcNumber} booked successfully for ${student.name}`

      toast.success(`✅ ${successMessage}`, {
        position: "top-right",
        autoClose: 3000,
      })

      // Trigger real-time update if available
      if (response.updateEvent) {
        console.log('🔄 Triggering real-time update:', response.updateEvent)
        // This would trigger the lab update service
        labUpdateService.triggerLabRefresh('booking_created')
      }

      // Refresh data to show updated booking status
      await fetchBookings()

      // Close modal and reset form
      setShowBookingModal(false)
      setSelectedPC(null)
      setSelectedStudent('')
      setStudentSearch('')

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

  const handleDeleteBooking = async (bookingId) => {
    console.log('🗑️ Attempting to delete booking:', bookingId)

    const booking = selectedPC?.booking
    const confirmMessage = booking
      ? `Are you sure you want to delete the booking for:\n\n👤 Student: ${booking.studentName}\n💻 PC: ${selectedPC.pcNumber}\n🕒 Time: ${booking.timeSlot}\n📅 Date: ${selectedDate}\n\nThis action cannot be undone.`
      : 'Are you sure you want to delete this booking?\n\nThis action cannot be undone.'

    const confirmed = await showConfirm(
      confirmMessage,
      'Delete Booking'
    )

    if (confirmed) {
      try {
        console.log('🔄 Deleting booking...')
        const response = await bookingAPI.deleteBooking(bookingId)

        // Handle enhanced API response
        const successMessage = response.message || `Booking deleted successfully for PC ${selectedPC?.pcNumber || 'Unknown'}`

        toast.success(`✅ ${successMessage}`, {
          position: "top-right",
          autoClose: 3000,
        })

        // Trigger real-time update if available
        if (response.updateEvent) {
          console.log('🔄 Triggering real-time update:', response.updateEvent)
          labUpdateService.triggerLabRefresh('booking_deleted')
        }

        // Refresh bookings to update the UI
        await fetchBookings()

        // Close modal
        setShowBookingModal(false)
        setSelectedPC(null)

        console.log('✅ Booking deleted and UI updated')

      } catch (error) {
        console.error('❌ Error deleting booking:', error)

        let errorMessage = 'Failed to delete booking'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }

        toast.error(`❌ ${errorMessage}`, {
          position: "top-center",
          autoClose: 4000,
        })
      }
    }
  }

  // Utility Functions
  const getPCStatusColor = (pc) => {
    if (!selectedDate || !selectedTimeSlot) {
      // Default colors when no time slot selected
      switch (pc.status) {
        case 'active':
          return 'bg-green-500 hover:bg-green-600 text-white border-green-600'
        case 'maintenance':
          return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
        case 'inactive':
          return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600'
        default:
          return 'bg-gray-300 hover:bg-gray-400 text-gray-700 border-gray-400'
      }
    }

    // Check if PC is booked for selected time slot
    const booking = bookings.find(b =>
      b.pc._id === pc._id &&
      b.timeSlot === selectedTimeSlot
    )

    if (booking) {
      // Color based on attendance status
      switch (booking.attendanceStatus) {
        case 'present':
          return 'bg-red-500 hover:bg-red-600 text-white border-red-600' // Red - Booked, Student Present
        case 'absent':
          return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' // Orange - Booked, Student Absent
        case 'late':
          return 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600' // Purple - Booked, Student Late
        case 'not-marked':
        default:
          return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600' // Amber - Booked, Attendance Not Marked
      }
    }

    // Available colors based on PC status
    switch (pc.status) {
      case 'active':
        return 'bg-green-500 hover:bg-green-600 text-white border-green-600' // Green - Available
      case 'maintenance':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600' // Yellow - Under Maintenance
      case 'inactive':
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600' // Gray - Inactive/Offline
      default:
        return 'bg-gray-300 hover:bg-gray-400 text-gray-700 border-gray-400'
    }
  }

  const getPCStatusText = (pc) => {
    if (!selectedDate || !selectedTimeSlot) {
      return pc.status.charAt(0).toUpperCase() + pc.status.slice(1)
    }

    const booking = bookings.find(b =>
      b.pc._id === pc._id &&
      b.timeSlot === selectedTimeSlot
    )

    if (booking) {
      switch (booking.attendanceStatus) {
        case 'present':
          return 'Booked - Present'
        case 'absent':
          return 'Booked - Absent'
        case 'late':
          return 'Booked - Late'
        case 'not-marked':
        default:
          return 'Booked - Pending'
      }
    }

    return pc.status === 'active' ? 'Available' : pc.status.charAt(0).toUpperCase() + pc.status.slice(1)
  }

  const getStudentTeacher = (studentId) => {
    // Ensure students and teachers are arrays
    const studentsArray = Array.isArray(students) ? students : []
    const teachersArray = Array.isArray(teachers) ? teachers : []

    const student = studentsArray.find(s => s._id === studentId)
    if (!student) return { student: null, teacher: null }

    const teacher = teachersArray.find(t => t._id === student.batch?.teacher || student.teacher)
    return { student, teacher }
  }

  // Add test students function for debugging
  const addTestStudents = () => {
    const testStudents = [
      {
        _id: 'test1',
        name: 'Test Student 1',
        rollNo: 'TS001',
        isActive: true,
        batch: { name: 'Test Batch 1' }
      },
      {
        _id: 'test2',
        name: 'Test Student 2',
        rollNo: 'TS002',
        isActive: true,
        batch: { name: 'Test Batch 2' }
      },
      {
        _id: 'test3',
        name: 'Test Student 3',
        rollNo: 'TS003',
        isActive: true,
        batch: { name: 'Test Batch 3' }
      }
    ]

    console.log('🧪 Adding test students:', testStudents)
    setStudents(testStudents)
    setFilteredStudents(testStudents)
    setDebugInfo(prev => ({
      ...prev,
      studentsLoaded: true,
      studentsCount: testStudents.length
    }))
    toast.success('✅ Added 3 test students for debugging')
  }

  // Apply Previous Day functionality
  const handleApplyPrevious = () => {
    if (!selectedDate) {
      toast.warning('Please select a date first')
      return
    }
    setShowApplyPreviousModal(true)
  }

  const handleApplyPreviousConfirm = async (sourceDate) => {
    try {
      setBookingLoading(true)

      // Get bookings from the selected source date
      let sourceBookings
      if (typeof bookingAPI.getBookings === 'function') {
        sourceBookings = await bookingAPI.getBookings({ date: sourceDate })
      } else {
        const apiResponse = await api.get('/lab/bookings', { params: { date: sourceDate } })
        sourceBookings = apiResponse.data
      }

      const bookingsData = Array.isArray(sourceBookings) ? sourceBookings : (sourceBookings.data || [])

      if (bookingsData.length > 0) {
        // Use the backend API endpoint for applying previous bookings
        try {
          const response = await api.post('/api/lab/bookings/apply-previous', {
            targetDate: selectedDate,
            bookings: bookingsData
          })

          const result = response.data

          if (result.appliedCount !== undefined) {
            toast.success(`✅ ${result.message || `Applied ${result.appliedCount} bookings successfully`}`)

            if (result.errors?.length > 0) {
              console.warn('⚠️ Some bookings failed to apply:', result.errors)
              toast.warning(`⚠️ ${result.errors.length} bookings failed to apply`)
            }
          } else {
            throw new Error(result.message || 'Failed to apply bookings')
          }

          await fetchBookings() // Refresh the display

        } catch (error) {
          console.error('❌ Error using apply-previous API, falling back to manual method:', error)

          // Fallback to manual booking creation
          let appliedCount = 0
          let failedCount = 0

          for (const prevBooking of bookingsData) {
            try {
              // Check if PC is available for the target date and time slot
              const existingBooking = bookings.find(b =>
                b.pc._id === prevBooking.pc._id &&
                b.timeSlot === prevBooking.timeSlot &&
                b.date === selectedDate
              )

              if (existingBooking) {
                console.log(`⚠️ PC ${prevBooking.pc.pcNumber} already booked for ${prevBooking.timeSlot}`)
                failedCount++
                continue
              }

              // Create new booking for target date
              const newBookingData = {
                pc: prevBooking.pc._id,
                date: selectedDate,
                timeSlot: prevBooking.timeSlot,
                student: prevBooking.student?._id || null,
                studentName: prevBooking.studentName,
                teacherName: prevBooking.teacherName,
                batch: prevBooking.batch?._id || null,
                purpose: prevBooking.purpose || 'Lab Session'
              }

              // Use the same booking creation logic as the main booking function
              if (typeof bookingAPI.createBooking === 'function') {
                await bookingAPI.createBooking(newBookingData)
              } else {
                const apiResponse = await api.post('/lab/bookings', newBookingData)
              }

              appliedCount++
              console.log(`✅ Applied booking for PC ${prevBooking.pc.pcNumber}`)

            } catch (error) {
              console.error(`❌ Failed to apply booking for PC ${prevBooking.pc.pcNumber}:`, error)
              failedCount++
            }
          }

          // Show results
          if (appliedCount > 0) {
            toast.success(`✅ Applied ${appliedCount} bookings successfully${failedCount > 0 ? ` (${failedCount} failed)` : ''}`)
          } else {
            toast.warning(`⚠️ No bookings could be applied${failedCount > 0 ? ` (${failedCount} conflicts or errors)` : ''}`)
          }

          await fetchBookings() // Refresh the display
        }
      } else {
        toast.info(`No bookings found for ${sourceDate} to apply`)
      }
    } catch (error) {
      console.error('Error applying previous bookings:', error)
      toast.error('Failed to apply previous bookings')
    } finally {
      setBookingLoading(false)
      setShowApplyPreviousModal(false)
    }
  }

  // Clear Slots functionality
  const handleClearSlots = async () => {
    console.log('🗑️ Clear Slots button clicked')
    console.log('🗑️ Selected date:', selectedDate)
    console.log('🗑️ Selected time slot:', selectedTimeSlot)
    console.log('🗑️ Current bookings:', bookings)

    if (!selectedDate || !selectedTimeSlot) {
      toast.warning('Please select date and time slot first')
      return
    }

    // Filter bookings for the selected date and time slot
    const bookingsForSlot = bookings.filter(b => {
      const bookingDate = new Date(b.date).toISOString().split('T')[0]
      const matches = b.timeSlot === selectedTimeSlot && bookingDate === selectedDate
      console.log(`🔍 Checking booking:`, {
        booking: b,
        bookingDate,
        selectedDate,
        timeSlotMatch: b.timeSlot === selectedTimeSlot,
        dateMatch: bookingDate === selectedDate,
        matches
      })
      return matches
    })

    console.log('🗑️ Bookings to delete:', bookingsForSlot)
    const slotsToDelete = bookingsForSlot.length

    if (slotsToDelete === 0) {
      toast.info('No bookings found for the selected time slot and date')
      return
    }

    const confirmed = await showConfirm(
      `Clear all ${slotsToDelete} bookings for ${selectedTimeSlot} on ${selectedDate}?\n\nThis action cannot be undone.`,
      'Clear Time Slot Bookings'
    )

    if (confirmed) {
      try {
        console.log('🗑️ Clearing slots for:', {
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          bookingsCount: slotsToDelete
        })

        // Use the backend API endpoint for bulk clearing
        try {
          console.log('🗑️ Calling clear-bulk API with data:', {
            date: selectedDate,
            timeSlots: [selectedTimeSlot]
          })

          const response = await api.delete('/api/lab/bookings/clear-bulk', {
            data: {
              date: selectedDate,
              timeSlots: [selectedTimeSlot]
            }
          })

          console.log('🗑️ Clear-bulk API response:', response)
          const result = response.data

          if (result.deletedCount !== undefined) {
            toast.success(`✅ ${result.message || `Cleared ${result.deletedCount} bookings successfully`}`)
          } else {
            throw new Error(result.message || 'Failed to clear bookings')
          }

          await fetchBookings() // Refresh the display

        } catch (error) {
          console.error('❌ Error using clear-bulk API, falling back to manual method:', error)
          console.error('❌ Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          })

          // Fallback to manual deletion
          const bookingsToDelete = bookings.filter(b =>
            b.timeSlot === selectedTimeSlot &&
            b.date === selectedDate
          )

          console.log('🗑️ Found bookings to delete:', bookingsToDelete.length)

          let deletedCount = 0
          let failedCount = 0

          // Delete each booking individually
          for (const booking of bookingsToDelete) {
            try {
              console.log(`🗑️ Deleting booking for PC ${booking.pc.pcNumber}...`)

              // Use the same deletion logic as the main delete function
              if (typeof bookingAPI.deleteBooking === 'function') {
                await bookingAPI.deleteBooking(booking._id)
              } else {
                const apiResponse = await api.delete(`/api/lab/bookings/${booking._id}`)
              }

              deletedCount++
              console.log(`✅ Deleted booking for PC ${booking.pc.pcNumber}`)

            } catch (error) {
              console.error(`❌ Failed to delete booking for PC ${booking.pc.pcNumber}:`, error)
              failedCount++
            }
          }

          // Show results
          if (deletedCount > 0) {
            toast.success(`✅ Cleared ${deletedCount} bookings successfully${failedCount > 0 ? ` (${failedCount} failed)` : ''}`)
          } else {
            toast.warning(`⚠️ No bookings could be cleared${failedCount > 0 ? ` (${failedCount} errors)` : ''}`)
          }

          await fetchBookings() // Refresh the display
        }

      } catch (error) {
        console.error('❌ Error clearing slots:', error)
        toast.error('Failed to clear time slot bookings: ' + (error.message || 'Unknown error'))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Revolutionary Lab Management Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>

        <div className="relative px-8 py-8 z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            {/* Title and Description */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BoltIcon className="h-8 w-8 text-yellow-300" />
                </div>
                <h1 className="text-4xl font-bold text-white">
                  Smart Lab Control Center
                </h1>
                {realTimeMode && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-sm font-medium">LIVE</span>
                  </div>
                )}
              </div>

              <p className="text-xl text-white/90 mb-4">
                Advanced PC Slot Booking & Real-time Lab Management System
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
                  <SparklesIcon className="h-4 w-4 text-blue-300" />
                  <span>AI-Powered Booking</span>
                </span>
                <span className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
                  <FireIcon className="h-4 w-4 text-red-300" />
                  <span>Real-time Updates</span>
                </span>
                <span className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
                  <EyeIcon className="h-4 w-4 text-green-300" />
                  <span>Smart Analytics</span>
                </span>
              </div>
            </div>

            {/* Real-time Stats Dashboard */}
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

      {/* Advanced Control Panel */}
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

              {/* View Mode Selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">👁️ View Mode</label>
                <div className="flex space-x-2">
                  {[
                    { value: 'grid', label: 'Grid', icon: '⊞' },
                    { value: 'list', label: 'List', icon: '☰' },
                    { value: 'timeline', label: 'Timeline', icon: '📊' }
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setViewMode(mode.value)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        viewMode === mode.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mode.icon} {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">🔍 Search PCs</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by PC number, student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">🎯 Filter Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">All PCs</option>
                  <option value="available">Available Only</option>
                  <option value="booked">Booked Only</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">⚡ Quick Actions</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleApplyPrevious}
                    disabled={!selectedDate}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Apply Previous</span>
                  </button>

                  <button
                    onClick={handleClearSlots}
                    disabled={!selectedDate || !selectedTimeSlot}
                    className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Clear Slots</span>
                  </button>

                  <button
                    onClick={fetchStudents}
                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Refresh Data</span>
                  </button>

                  <button
                    onClick={addTestStudents}
                    className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <UserGroupIcon className="h-4 w-4" />
                    <span>Test Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Time Slots</h2>
          <p className="text-sm text-gray-600">Click on a time slot to view PC availability for that period</p>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {timeSlots.map((slot, index) => {
            const slotBookings = bookings.filter(booking => booking.timeSlot === slot)
            const occupiedCount = slotBookings.length
            const isSelected = selectedTimeSlot === slot

            return (
              <div
                key={slot}
                onClick={() => setSelectedTimeSlot(slot)}
                className={`
                  relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 transform hover:scale-105
                  ${isSelected
                    ? 'bg-red-500 text-white border-red-600 shadow-lg'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-center">
                  <div className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {getTimeSlotLabel(slot)}
                  </div>
                  <div className={`text-sm mt-1 ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                    {occupiedCount} occupied
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Booking indicator */}
                {occupiedCount > 0 && !isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {occupiedCount}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedTimeSlot && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">
                  Selected Time Slot: {selectedTimeSlot}
                </h4>
                <p className="text-sm text-blue-700">
                  {bookings.filter(b => b.timeSlot === selectedTimeSlot).length} PCs booked for this time slot
                </p>
              </div>
              <button
                onClick={() => setSelectedTimeSlot('')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>



      {/* Smart Color-Coded Status Legend */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Smart Color-Coded PC Status</h2>
          <p className="text-sm text-gray-600">Real-time status indicators with attendance integration</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
            <span className="text-sm font-medium">🔴 Booked - Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded border border-orange-600"></div>
            <span className="text-sm font-medium">🟠 Booked - Absent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded border border-purple-600"></div>
            <span className="text-sm font-medium">🟣 Booked - Late</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded border border-amber-600"></div>
            <span className="text-sm font-medium">🟡 Booked - Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
            <span className="text-sm font-medium">🟢 Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded border border-yellow-600"></div>
            <span className="text-sm font-medium">🟡 Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded border border-gray-600"></div>
            <span className="text-sm font-medium">⚫ Inactive</span>
          </div>
        </div>
      </div>

      {/* Interactive PC Grid */}
      {Object.keys(pcsByRow).length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Interactive PC Booking Grid</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDate && selectedTimeSlot
                    ? `Showing bookings for ${selectedDate} at ${selectedTimeSlot}`
                    : 'Select date and time slot to view bookings'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/admin/lab/pcs"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Manage PCs
                </Link>
                <Link
                  to="/admin/lab/pcs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                >
                  <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                  Add PC
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6">
            {Object.keys(pcsByRow).length === 0 ? (
              <div className="text-center py-12">
                <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No computers are available in the lab.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(pcsByRow).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([rowNumber, rowPCs]) => (
                  <div key={rowNumber} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">Row {rowNumber}</h3>
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-sm text-gray-500">
                        {rowPCs.length} PCs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {rowPCs.map((pc) => {
                        const booking = bookings.find(b =>
                          b.pc._id === pc._id &&
                          b.timeSlot === selectedTimeSlot
                        )

                        return (
                          <div
                            key={`${pc.rowNumber || pc.row}-${pc.pcNumber}`}
                            onClick={() => handlePCClick(pc)}
                            className={`
                              relative group p-4 rounded-xl text-center text-sm font-medium transition-all duration-300 cursor-pointer
                              ${getPCStatusColor(pc)}
                              transform hover:scale-105 shadow-lg hover:shadow-xl border-2
                              ${pc.status !== 'active' ? 'cursor-not-allowed opacity-75' : ''}
                              ${!selectedDate || !selectedTimeSlot ? 'cursor-help' : ''}
                            `}
                            title={`${pc.pcNumber} - ${getPCStatusText(pc)}${booking ? `\nStudent: ${booking.studentName}\nTeacher: ${booking.teacherName}` : ''}${!selectedDate || !selectedTimeSlot ? '\n\n⚠️ Select date and time slot first' : ''}`}
                          >
                            {/* PC Number and Status */}
                            <div className="font-bold text-lg">{pc.pcNumber}</div>
                            <div className="text-xs mt-1 opacity-90">
                              {getPCStatusText(pc)}
                            </div>

                            {/* Booking Information */}
                            {booking && (
                              <div className="text-xs mt-2 opacity-80">
                                <div className="truncate font-medium">{booking.studentName}</div>
                                <div className="truncate text-xs opacity-70">{booking.teacherName}</div>
                              </div>
                            )}

                            {/* Status Icons */}
                            <div className="absolute top-2 right-2">
                              {booking ? (
                                <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
                              ) : pc.status === 'active' && selectedDate && selectedTimeSlot ? (
                                <div className="w-3 h-3 bg-green-300 rounded-full opacity-60"></div>
                              ) : null}
                            </div>

                            {/* Interactive Hover Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-75 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="text-white text-center px-2">
                                <div className="font-bold text-base">{pc.pcNumber}</div>
                                <div className="text-xs mt-1">{getPCStatusText(pc)}</div>

                                {booking && (
                                  <div className="text-xs mt-2 space-y-1">
                                    <div className="flex items-center justify-center">
                                      <span>👤</span>
                                      <span className="ml-1 truncate">{booking.studentName}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                      <span>👨‍🏫</span>
                                      <span className="ml-1 truncate">{booking.teacherName}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                      <span>📊</span>
                                      <span className="ml-1">
                                        {booking.attendanceStatus === 'present' ? 'Present' :
                                         booking.attendanceStatus === 'absent' ? 'Absent' :
                                         booking.attendanceStatus === 'late' ? 'Late' :
                                         'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs mt-3 opacity-90 font-medium">
                                  {!selectedDate || !selectedTimeSlot ? (
                                    '⚠️ Select date & time first'
                                  ) : pc.status !== 'active' ? (
                                    '❌ Not available'
                                  ) : booking ? (
                                    '👁️ Click to view/edit'
                                  ) : (
                                    '➕ Click to book'
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedPC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPC.booking ? 'Booking Details' : 'Book PC'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    PC {selectedPC.pcNumber} - Row {selectedPC.row || selectedPC.rowNumber}
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {selectedPC.booking ? (
                /* Existing Booking Details */
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Current Booking</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Student:</span>
                        <span className="font-medium">{selectedPC.booking.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Teacher:</span>
                        <span className="font-medium">{selectedPC.booking.teacherName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Slot:</span>
                        <span className="font-medium">{selectedPC.booking.timeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attendance:</span>
                        <span className={`font-medium ${
                          selectedPC.booking.attendanceStatus === 'present' ? 'text-green-600' :
                          selectedPC.booking.attendanceStatus === 'absent' ? 'text-red-600' :
                          selectedPC.booking.attendanceStatus === 'late' ? 'text-purple-600' :
                          'text-amber-600'
                        }`}>
                          {selectedPC.booking.attendanceStatus === 'present' ? '✅ Present' :
                           selectedPC.booking.attendanceStatus === 'absent' ? '❌ Absent' :
                           selectedPC.booking.attendanceStatus === 'late' ? '🟣 Late' :
                           '⏳ Not Marked'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleDeleteBooking(selectedPC.booking._id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Delete Booking
                    </button>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* New Booking Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Student
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Type student name or roll number..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                      />
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Student Selection */}
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {(() => {
                      console.log('🎭 Modal rendering - filteredStudents:', filteredStudents)
                      console.log('🎭 Modal rendering - filteredStudents type:', typeof filteredStudents)
                      console.log('🎭 Modal rendering - filteredStudents isArray:', Array.isArray(filteredStudents))
                      console.log('🎭 Modal rendering - filteredStudents length:', filteredStudents?.length)

                      if (!Array.isArray(filteredStudents)) {
                        return (
                          <div className="p-4 text-center text-gray-500">
                            Loading students...
                          </div>
                        )
                      }

                      if (filteredStudents.length === 0) {
                        return (
                          <div className="p-4 text-center text-gray-500">
                            No students found
                            <div className="text-xs mt-2 text-gray-400">
                              Total students: {students?.length || 0}
                              <br />
                              Search term: "{studentSearch}"
                            </div>
                          </div>
                        )
                      }

                      return filteredStudents.slice(0, 10).map((student) => {
                        const { teacher } = getStudentTeacher(student._id)
                        return (
                          <div
                            key={student._id}
                            onClick={() => setSelectedStudent(student._id)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              selectedStudent === student._id ? 'bg-cadd-red/10 border-cadd-red' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-600">Roll: {student.rollNo}</div>
                                {teacher && (
                                  <div className="text-xs text-gray-500">Teacher: {teacher.name}</div>
                                )}
                              </div>
                              {selectedStudent === student._id && (
                                <CheckCircleIcon className="h-5 w-5 text-cadd-red" />
                              )}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleBookingSubmit}
                      disabled={!selectedStudent || bookingLoading}
                      className="flex-1 px-4 py-2 bg-cadd-red text-white rounded-lg hover:bg-cadd-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {bookingLoading ? 'Booking...' : 'Book PC'}
                    </button>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Previous Date Modal */}
      <ApplyPreviousDateModal
        isOpen={showApplyPreviousModal}
        onClose={() => setShowApplyPreviousModal(false)}
        onConfirm={handleApplyPreviousConfirm}
        targetDate={selectedDate}
        loading={bookingLoading}
      />
    </div>
  )
}

export default LabOverview
