import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ComputerDesktopIcon,
  PlusIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI } from '../../../services/labAPI'
import { batchesAPI, studentsAPI, teachersAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import { showConfirm } from '../../../utils/popup'
import { formatDateLong, formatDateSimple, formatDateShort } from '../../../utils/dateUtils'
import PreviousBookingsModal from '../../../components/PreviousBookingsModal'
import ApplyPreviousBookingsModal from '../../../components/ApplyPreviousBookingsModal'
import ApplyBookingsResultModal from '../../../components/ApplyBookingsResultModal'
import ClearBookedSlotsModal from '../../../components/ClearBookedSlotsModal'
import ClearSlotsResultModal from '../../../components/ClearSlotsResultModal'
import BackButton from '../../../components/BackButton'

const LabManagement = () => {
  const { user } = useAuth()
  const [pcsByRow, setPcsByRow] = useState({})
  const [bookings, setBookings] = useState([])
  const [batches, setBatches] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [allTeachers, setAllTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showPCDetailsModal, setShowPCDetailsModal] = useState(false)
  const [selectedPC, setSelectedPC] = useState(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30-12:00')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'detailed'

  // Previous bookings state
  const [showPreviousBookingsModal, setShowPreviousBookingsModal] = useState(false)
  const [previousBookings, setPreviousBookings] = useState([])
  const [previousDate, setPreviousDate] = useState('')
  const [loadingPrevious, setLoadingPrevious] = useState(false)

  // Apply previous bookings state
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [applyResult, setApplyResult] = useState(null)
  const [applyingBookings, setApplyingBookings] = useState(false)

  // Clear booked slots state
  const [showClearModal, setShowClearModal] = useState(false)
  const [showClearResultModal, setShowClearResultModal] = useState(false)
  const [clearResult, setClearResult] = useState(null)
  const [clearingSlots, setClearingSlots] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    selectedStudent: '',
    studentName: '',
    teacherName: user?.name || ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState([])

  const timeSlots = [
    { id: '09:00-10:30', label: '09:00 AM - 10:30 AM' },
    { id: '10:30-12:00', label: '10:30 AM - 12:00 PM' },
    { id: '12:00-13:30', label: '12:00 PM - 01:30 PM' },
    { id: '14:00-15:30', label: '02:00 PM - 03:30 PM' },
    { id: '15:30-17:00', label: '03:30 PM - 05:00 PM' },
  ]

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  // Listen for lab availability updates from attendance submissions
  useEffect(() => {
    const handleLabUpdate = (event) => {
      const { date, updates } = event.detail
      // Refresh data if the update is for the currently selected date
      if (date === selectedDate) {
        console.log('🔄 Lab availability updated via attendance, refreshing data...')
        fetchData()

        // Show a brief notification
        if (updates && updates.length > 0) {
          toast.info('Lab availability updated based on attendance changes', {
            duration: 3000
          })
        }
      }
    }

    window.addEventListener('labAvailabilityUpdate', handleLabUpdate)

    return () => {
      window.removeEventListener('labAvailabilityUpdate', handleLabUpdate)
    }
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pcsRes, bookingsRes, batchesRes, studentsRes, teachersRes] = await Promise.all([
        pcAPI.getPCsByRow(),
        bookingAPI.getBookings({ date: selectedDate }),
        batchesAPI.getBatches(),
        studentsAPI.getStudents(),
        teachersAPI.getTeachers()
      ])

      // Handle response formats - check if data is nested
      const pcsData = pcsRes?.data || pcsRes || {}
      const bookingsData = bookingsRes?.data || bookingsRes || []
      const batchesData = batchesRes?.data || batchesRes || []
      const studentsData = studentsRes?.data || studentsRes || []
      const teachersData = teachersRes?.data || teachersRes || []

      setPcsByRow(pcsData)
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      setBatches(Array.isArray(batchesData) ? batchesData : [])
      setAllStudents(Array.isArray(studentsData) ? studentsData : [])
      setAllTeachers(Array.isArray(teachersData) ? teachersData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch lab data')
      // Set default values on error
      setPcsByRow({})
      setBookings([])
      setBatches([])
      setAllStudents([])
      setAllTeachers([])
    } finally {
      setLoading(false)
    }
  }

  const clearAllPCs = async () => {
    const confirmed = await showConfirm('Are you sure you want to clear all PCs? This action cannot be undone.', 'Clear All PCs')
    if (confirmed) {
      try {
        await pcAPI.clearAllPCs()
        toast.success('All PCs cleared successfully')
        fetchData()
      } catch (error) {
        toast.error('Failed to clear PCs')
      }
    }
  }

  const fetchPreviousBookings = async () => {
    try {
      setLoadingPrevious(true)
      const response = await bookingAPI.getPreviousBookings({ date: selectedDate })
      const data = response?.data || response || {}

      setPreviousBookings(data.bookings || [])
      setPreviousDate(data.date || '')
      setShowApplyModal(true)
    } catch (error) {
      console.error('Error fetching previous bookings:', error)
      toast.error('Failed to fetch previous bookings')
    } finally {
      setLoadingPrevious(false)
    }
  }

  const handleApplyPreviousBookings = async () => {
    try {
      setApplyingBookings(true)
      setShowApplyModal(false)

      const response = await bookingAPI.applyPreviousBookings({
        targetDate: selectedDate,
        sourceDate: previousDate
      })

      const data = response?.data || response || {}
      setApplyResult(data)
      setShowResultModal(true)

      // Refresh the data to show new bookings
      fetchData()

      toast.success(`Applied ${data.summary?.appliedBookings || 0} bookings successfully`)
    } catch (error) {
      console.error('Error applying previous bookings:', error)
      toast.error('Failed to apply previous bookings')
    } finally {
      setApplyingBookings(false)
    }
  }

  const handleClearBookedSlots = async (clearOptions) => {
    try {
      setClearingSlots(true)
      setShowClearModal(false)

      const response = await bookingAPI.clearBookedSlotsBulk(clearOptions)
      const data = response?.data || response || {}

      setClearResult(data)
      setShowClearResultModal(true)

      // Refresh the data to show cleared slots
      fetchData()

      toast.success(`Cleared ${data.clearedCount || 0} booked slots successfully`)
    } catch (error) {
      console.error('Error clearing booked slots:', error)
      toast.error('Failed to clear booked slots')
    } finally {
      setClearingSlots(false)
    }
  }

  const handlePCClick = (pc, timeSlot) => {
    const booking = getBookingForPCAndTime(pc._id, timeSlot)
    setSelectedPC(pc)
    setSelectedTimeSlot(timeSlot)

    if (booking) {
      // Show PC details modal with booking information
      setShowPCDetailsModal(true)
    } else {
      // Open booking modal
      setShowBookingModal(true)
    }
  }

  const getBookingForPCAndTime = (pcId, timeSlot) => {
    return bookings.find(booking =>
      booking.pc &&
      booking.pc._id === pcId &&
      booking.timeSlot === timeSlot &&
      booking.isActive &&
      booking.status === 'confirmed'  // Only show confirmed bookings as occupied
    )
  }

  const handleBookPC = async () => {
    try {
      const bookingData = {
        pc: selectedPC._id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        bookedFor: bookingForm.studentName,
        studentName: bookingForm.studentName,
        teacherName: bookingForm.teacherName,
        purpose: 'Lab Session', // Default purpose
        batch: null,
        notes: '',
        isActive: true
      }

      await bookingAPI.createBooking(bookingData)
      toast.success('PC booked successfully')
      setShowBookingModal(false)
      resetBookingForm()
      fetchData()
    } catch (error) {
      toast.error('Failed to book PC')
    }
  }

  const handleEditBooking = (booking) => {
    setEditingBooking(booking)
    setIsEditMode(true)

    // Find the student to get the combined selection value
    const student = allStudents.find(s => s.name === booking.studentName)
    const selectedValue = student ? `${student._id}|${booking.studentName}|${booking.teacherName}` : ''

    setBookingForm({
      selectedStudent: selectedValue,
      studentName: booking.studentName,
      teacherName: booking.teacherName
    })
    setSearchQuery(`${booking.studentName} - Teacher: ${booking.teacherName}`)
    setShowDropdown(false)
    setSelectedPC(booking.pc)
    setSelectedTimeSlot(booking.timeSlot)
    setShowPCDetailsModal(false)
    setShowBookingModal(true)
  }

  const handleUpdateBooking = async () => {
    try {
      const updateData = {
        studentName: bookingForm.studentName,
        teacherName: bookingForm.teacherName,
        bookedFor: bookingForm.studentName
      }

      await bookingAPI.updateBooking(editingBooking._id, updateData)
      toast.success('Booking updated successfully')
      setShowBookingModal(false)
      setIsEditMode(false)
      setEditingBooking(null)
      resetBookingForm()
      fetchData()
    } catch (error) {
      toast.error('Failed to update booking')
    }
  }

  const handleFreeSlot = async () => {
    const booking = getBookingForPCAndTime(selectedPC._id, selectedTimeSlot)
    if (!booking) return

    const confirmed = await showConfirm(`Are you sure you want to free this slot?\n\nPC: ${selectedPC.pcNumber}\nTime: ${getTimeSlotLabel(selectedTimeSlot)}\nBooked for: ${booking.studentName}`, 'Free Slot')
    if (confirmed) {
      try {
        await bookingAPI.deleteBooking(booking._id)
        toast.success('Slot freed successfully')
        setShowPCDetailsModal(false)
        fetchData()
      } catch (error) {
        console.error('Error freeing slot:', error)
        toast.error('Failed to free slot')
      }
    }
  }



  const resetBookingForm = () => {
    setBookingForm({
      selectedStudent: '',
      studentName: '',
      teacherName: user?.name || ''
    })
    setSearchQuery('')
    setShowDropdown(false)
    setFilteredOptions([])
    setSelectedPC(null)
    setSelectedTimeSlot('')
    setIsEditMode(false)
    setEditingBooking(null)
  }

  const getPCStatus = (pc, timeSlot) => {
    const booking = getBookingForPCAndTime(pc._id, timeSlot)
    if (booking) {
      return 'occupied'
    }
    return pc.status === 'active' ? 'free' : pc.status
  }

  const getPCStatusColor = (status) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
      case 'maintenance':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
    }
  }

  // Grid view helper functions (similar to Today's Bookings)
  const getPCAvailability = (pcNumber, rowNumber) => {
    if (!pcsByRow || typeof pcsByRow !== 'object') {
      return { status: 'unavailable', bookedFor: null, booking: null }
    }

    const pc = Object.values(pcsByRow).flat().find(p =>
      p && p.pcNumber === pcNumber && p.rowNumber === parseInt(rowNumber)
    )

    if (!pc) return { status: 'unavailable', bookedFor: null, booking: null }

    // Check for confirmed booking (occupied)
    const confirmedBooking = getBookingForPCAndTime(pc._id, selectedTimeSlot)
    if (confirmedBooking) {
      return {
        status: 'occupied',
        bookedFor: confirmedBooking.studentName || 'Unknown Student',
        booking: confirmedBooking
      }
    }

    // Check for recently completed booking (student left)
    const completedBooking = bookings.find(booking =>
      booking.pc &&
      booking.pc._id === pc._id &&
      booking.timeSlot === selectedTimeSlot &&
      booking.isActive &&
      booking.status === 'completed'
    )

    if (completedBooking) {
      return {
        status: 'recently-freed',
        bookedFor: completedBooking.studentName || 'Unknown Student',
        booking: completedBooking,
        completedAt: completedBooking.updatedAt
      }
    }

    return {
      status: pc.status === 'active' ? 'available' : pc.status,
      bookedFor: null,
      booking: null
    }
  }

  // Get PCs organized by rows for grid view
  const getPCsByRows = () => {
    return pcsByRow
  }

  // Get PC status color for grid view
  const getGridPCStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600 text-white'
      case 'recently-freed':
        return 'bg-blue-500 hover:bg-blue-600 text-white'  // Blue for recently freed slots
      case 'maintenance':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white'
      default:
        return 'bg-gray-300 hover:bg-gray-400 text-gray-700'
    }
  }

  // Get time slot label
  const getTimeSlotLabel = (timeSlot) => {
    const slot = timeSlots.find(s => s.id === timeSlot)
    return slot ? slot.label : timeSlot
  }

  // Get teacher name for a student based on their batch
  const getTeacherForStudent = (student) => {
    if (!student || !student.batch) {
      return 'No Teacher Assigned'
    }

    // Check if student.batch is populated with createdBy information
    if (student.batch.createdBy && typeof student.batch.createdBy === 'object' && student.batch.createdBy.name) {
      return student.batch.createdBy.name
    }

    // Fallback: Find the batch in the batches array
    const batch = batches.find(b => b._id === (typeof student.batch === 'object' ? student.batch._id : student.batch))
    if (!batch) {
      return 'No Teacher Assigned'
    }

    // Check if batch has createdBy field (could be ObjectId or populated object)
    let teacherId = null
    if (batch.createdBy) {
      // If createdBy is populated (object with _id), use _id
      // If createdBy is just an ObjectId string, use it directly
      teacherId = typeof batch.createdBy === 'object' ? batch.createdBy._id : batch.createdBy
    }

    if (!teacherId) {
      return 'No Teacher Assigned'
    }

    // Find the teacher in allTeachers array
    const teacher = allTeachers.find(t => t._id === teacherId)
    return teacher ? teacher.name : 'Unknown Teacher'
  }

  // Create combined student-teacher options
  const getStudentTeacherOptions = () => {
    return allStudents.map(student => {
      const teacherName = getTeacherForStudent(student)
      return {
        value: `${student._id}|${student.name}|${teacherName}`,
        label: `${student.name} (${student.rollNo}) - Teacher: ${teacherName}`,
        studentName: student.name,
        teacherName: teacherName,
        rollNo: student.rollNo
      }
    })
  }

  // Handle combined student-teacher selection
  const handleStudentTeacherChange = (value) => {
    if (!value) {
      setBookingForm({
        ...bookingForm,
        selectedStudent: '',
        studentName: '',
        teacherName: ''
      })
      setSearchQuery('')
      setShowDropdown(false)
      return
    }

    const [, studentName, teacherName] = value.split('|')
    setBookingForm({
      ...bookingForm,
      selectedStudent: value,
      studentName: studentName,
      teacherName: teacherName
    })
    // Clear the search input after selection
    setSearchQuery('')
    setShowDropdown(false)
  }

  // Filter options based on search query
  const filterOptions = (query) => {
    if (!query.trim()) {
      return getStudentTeacherOptions()
    }

    const lowercaseQuery = query.toLowerCase()
    return getStudentTeacherOptions().filter(option =>
      option.studentName.toLowerCase().includes(lowercaseQuery) ||
      option.teacherName.toLowerCase().includes(lowercaseQuery) ||
      option.rollNo.toLowerCase().includes(lowercaseQuery)
    )
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowDropdown(true)

    const filtered = filterOptions(query)
    setFilteredOptions(filtered)

    // Clear selection if query doesn't match current selection
    if (bookingForm.selectedStudent && !query.includes(bookingForm.studentName)) {
      setBookingForm({
        ...bookingForm,
        selectedStudent: '',
        studentName: '',
        teacherName: ''
      })
    }
  }

  // Handle search input focus
  const handleSearchFocus = () => {
    setShowDropdown(true)
    const filtered = filterOptions(searchQuery)
    setFilteredOptions(filtered)
  }

  // Handle search input blur (with delay to allow option selection)
  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowDropdown(false)
    }, 200)
  }

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

      {/* Header - Lab Teacher Style */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Lab Management System</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and control all lab computers and systems
        </p>
      </div>

      {/* Status Overview - Lab Teacher Style */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total PCs</dt>
                  <dd className="text-lg font-medium text-gray-900">Total PCs</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{Object.values(pcsByRow).flat().filter(pc => pc.status === 'active').length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Maintenance</dt>
                  <dd className="text-lg font-medium text-gray-900">{Object.values(pcsByRow).flat().filter(pc => pc.status === 'maintenance').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Bookings</dt>
                  <dd className="text-lg font-medium text-gray-900">{bookings.filter(b => b.isActive).length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Control Actions - Lab Teacher Style */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Lab Control Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/lab/book"
            className="relative group bg-white p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-500 text-white">
                <CalendarDaysIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Admin Book
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Create advanced bookings with administrative privileges
              </p>
            </div>
          </Link>

          <Link
            to="/admin/lab/pcs/new"
            className="relative group bg-white p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-500 text-white">
                <PlusIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add PC
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Register a new computer in the lab
              </p>
            </div>
          </Link>

          <button
            onClick={clearAllPCs}
            className="relative group bg-white p-6 border-2 border-gray-200 rounded-lg hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-red-500 text-white">
                <TrashIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-red-900">
                Clear All PCs
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Remove all PCs from the system (dangerous action)
              </p>
            </div>
          </button>



          <div className="relative group bg-white p-6 border-2 border-gray-200 rounded-lg">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-purple-500 text-white">
                <ClockIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">
                View Mode
              </h3>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-all ${viewMode === 'grid'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-all ${viewMode === 'detailed'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Detailed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots Header - Clickable Buttons */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Time Slots</h3>
            <p className="text-sm text-gray-600">Click on a time slot to view PC availability for that period</p>
          </div>
          {/* Compact Date Input and Action Buttons - Single Row Layout */}
          <div className="flex items-center space-x-4">
            <div className="group">
              <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-2 text-cadd-red" />
                Select Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="
                    w-full px-4 py-2
                    bg-white
                    border-2 border-gray-200
                    rounded-lg
                    text-gray-900 font-medium text-sm
                    transition-all duration-200
                    focus:outline-none
                    focus:ring-2 focus:ring-cadd-red/20
                    focus:border-cadd-red
                    hover:border-cadd-red/50
                    cursor-pointer
                  "
                />
              </div>
            </div>

            {/* Compact Date Display */}
            <div className="text-right">
              <div className="text-xs font-medium text-gray-600 mb-1">Selected Date</div>
              <div className="text-sm font-semibold text-gray-800">
                {formatDateShort(selectedDate)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDateSimple(selectedDate) === formatDateSimple(new Date())
                  ? '🔴 Today'
                  : new Date(selectedDate) > new Date()
                    ? '🟡 Future'
                    : '🟢 Past'
                }
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Apply Previous Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={fetchPreviousBookings}
                  disabled={loadingPrevious}
                  className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center space-x-2">
                    {loadingPrevious ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <HistoryIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">Apply Previous</span>
                  </div>
                </button>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Copy Previous Day
                </div>
              </div>

              {/* Clear Slots Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setShowClearModal(true)}
                  disabled={clearingSlots}
                  className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center space-x-2">
                    {clearingSlots ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">Clear Slots</span>
                  </div>
                </button>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Bulk Clear
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {timeSlots.map((slot) => {
            const occupiedCount = Array.isArray(bookings)
              ? bookings.filter(b => b && b.timeSlot === slot.id && b.isActive).length
              : 0
            const isSelected = selectedTimeSlot === slot.id

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedTimeSlot(slot.id)}
                className={`text-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${isSelected
                  ? 'bg-gradient-to-r from-cadd-red to-cadd-pink text-white shadow-lg ring-2 ring-cadd-red ring-opacity-50'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border-2 border-transparent hover:border-gray-200'
                  }`}
              >
                <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {slot.label}
                </div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-white opacity-90' : 'text-gray-500'}`}>
                  {occupiedCount} occupied
                </div>
                {isSelected && (
                  <div className="mt-2">
                    <div className="w-2 h-2 bg-white rounded-full mx-auto animate-pulse"></div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lab Layout */}
      {viewMode === 'grid' ? (
        // Grid View - Similar to Today's Bookings
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lab Layout - Grid View</h2>
                <p className="text-sm text-gray-500 mt-1">
                  PC availability for {getTimeSlotLabel(selectedTimeSlot)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {getTimeSlotLabel(selectedTimeSlot)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Status Legend */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Legend:</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>Recently Freed (Student Left)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span>Maintenance</span>
                </div>
              </div>
            </div>

            {Object.keys(getPCsByRows()).length === 0 ? (
              <div className="text-center py-12">
                <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No computers are available for the selected date.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(getPCsByRows()).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([rowNumber, rowPCs]) => (
                  <div key={rowNumber} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">Row {rowNumber}</h3>
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-sm text-gray-500">
                        {rowPCs.filter(pc => getPCAvailability(pc.pcNumber, pc.rowNumber).status === 'occupied').length} / {rowPCs.length} occupied
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                      {rowPCs.map((pc) => {
                        const pcAvailability = getPCAvailability(pc.pcNumber, pc.rowNumber)
                        return (
                          <div
                            key={`${pc.rowNumber}-${pc.pcNumber}`}
                            className={`
                              relative p-3 rounded-lg text-center text-sm font-medium transition-all duration-200 cursor-pointer
                              ${getGridPCStatusColor(pcAvailability.status)}
                              transform hover:scale-105 shadow-sm hover:shadow-md
                            `}
                            title={
                              pcAvailability.status === 'available'
                                ? `${pc.pcNumber} - Available`
                                : pcAvailability.status === 'recently-freed'
                                  ? `${pc.pcNumber} - Recently freed (${pcAvailability.bookedFor} left)`
                                  : `${pc.pcNumber} - ${pcAvailability.status} (${pcAvailability.bookedFor})`
                            }
                            onClick={() => handlePCClick(pc, selectedTimeSlot)}
                          >
                            <div className="font-bold">{pc.pcNumber}</div>
                            {pcAvailability.status === 'occupied' && (
                              <div className="text-xs mt-1 opacity-90 truncate">
                                {pcAvailability.bookedFor}
                              </div>
                            )}
                            {pcAvailability.status === 'maintenance' && (
                              <div className="text-xs mt-1 opacity-90">
                                Maintenance
                              </div>
                            )}
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
      ) : (
        // Detailed View - Original Layout
        <div className="space-y-6">
          {Object.entries(pcsByRow).map(([rowNumber, pcs]) => (
            <div key={rowNumber} className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">{rowNumber}</span>
                </div>
                Row {rowNumber}
                <span className="ml-4 text-sm font-normal text-gray-500">
                  ({pcs.length} PCs)
                </span>
              </h3>

              {/* Time slots for this row */}
              <div className="space-y-4">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{timeSlot.label}</h4>
                      <div className="text-sm text-gray-500">
                        {pcs.filter(pc => getPCStatus(pc, timeSlot.id) === 'occupied').length} / {pcs.length} occupied
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {pcs.map((pc) => {
                        const status = getPCStatus(pc, timeSlot.id)
                        const booking = getBookingForPCAndTime(pc._id, timeSlot.id)

                        return (
                          <div
                            key={pc._id}
                            className={`relative border-2 rounded-xl p-3 cursor-pointer transition-all duration-300 transform hover:scale-105 ${getPCStatusColor(status)}`}
                            onClick={() => handlePCClick(pc, timeSlot.id)}
                          >
                            <div className="text-center">
                              <div className="font-bold text-sm mb-1">{pc.pcNumber}</div>
                              {booking ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-red-700">
                                    {booking.studentName}
                                  </div>
                                  <div className="text-xs text-red-600">
                                    {booking.teacherName}
                                  </div>
                                  <div className="flex items-center justify-center">
                                    <UserIcon className="h-3 w-3 text-red-500" />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium">
                                    {status === 'free' ? 'Available' : status.charAt(0).toUpperCase() + status.slice(1)}
                                  </div>
                                  <div className="flex items-center justify-center">
                                    {status === 'free' ? (
                                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                    ) : status === 'maintenance' ? (
                                      <ArrowPathIcon className="h-3 w-3 text-yellow-500" />
                                    ) : (
                                      <XCircleIcon className="h-3 w-3 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Status indicator */}
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${status === 'free' ? 'bg-green-400' :
                              status === 'occupied' ? 'bg-red-400' :
                                status === 'maintenance' ? 'bg-yellow-400' : 'bg-gray-400'
                              }`}></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {Object.keys(pcsByRow).length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ComputerDesktopIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PCs Available</h3>
          <p className="text-gray-600 mb-6">
            Start by adding PCs to the lab to manage bookings and sessions.
          </p>
          <Link
            to="/admin/lab/pcs/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add First PC
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Available</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Occupied</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Maintenance</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Inactive</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Booking' : 'Book PC'} {selectedPC?.pcNumber}
                </h3>
                <button
                  onClick={() => {
                    setShowBookingModal(false)
                    resetBookingForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600">Time Slot</div>
                  <div className="font-semibold text-gray-900">
                    {timeSlots.find(slot => slot.id === selectedTimeSlot)?.label}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Student & Teacher *
                  </label>

                  {/* Search Input Container */}
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        placeholder="Type student name, roll number, or teacher name..."
                        className="
                          w-full px-4 py-3 pl-12 pr-12
                          bg-gradient-to-r from-white via-gray-50/50 to-white
                          border-2 border-gray-200
                          rounded-xl
                          text-gray-900 font-medium text-sm
                          placeholder-gray-400
                          transition-all duration-300 ease-in-out
                          focus:outline-none
                          focus:ring-4 focus:ring-cadd-red/20
                          focus:border-cadd-red
                          focus:bg-white
                          focus:shadow-lg
                          hover:border-gray-300
                          hover:shadow-md
                          shadow-sm
                        "
                      />

                      {/* Search Icon */}
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>

                      {/* Dropdown Arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''
                          }`} />
                      </div>
                    </div>

                    {/* Dropdown Options */}
                    {showDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                          <div className="py-2">
                            {filteredOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleStudentTeacherChange(option.value)}
                                className="
                                  w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                                  transition-colors duration-150 border-b border-gray-100 last:border-b-0
                                "
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {option.studentName}
                                      <span className="text-sm text-gray-500 ml-2">({option.rollNo})</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      <span className="inline-flex items-center">
                                        <UserIcon className="h-3 w-3 mr-1" />
                                        Teacher: {option.teacherName}
                                      </span>
                                    </div>
                                  </div>
                                  {bookingForm.selectedStudent === option.value && (
                                    <CheckCircleIcon className="h-5 w-5 text-cadd-red" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center text-gray-500">
                            <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <div className="text-sm">No students found</div>
                            <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Search by student name, roll number, or teacher name
                  </p>

                  {/* Display selected student and teacher */}
                  {bookingForm.studentName && bookingForm.teacherName && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-blue-900 mb-2">✅ Selection Confirmed</div>
                          <div className="space-y-1">
                            <div className="text-sm text-blue-800">
                              <span className="font-medium">Student:</span> {bookingForm.studentName}
                            </div>
                            <div className="text-sm text-blue-800">
                              <span className="font-medium">Teacher:</span> {bookingForm.teacherName}
                            </div>
                          </div>
                        </div>
                        <div className="text-blue-500">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBookingModal(false)
                    resetBookingForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditMode ? handleUpdateBooking : handleBookPC}
                  disabled={!bookingForm.selectedStudent || !bookingForm.studentName || !bookingForm.teacherName}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-lg hover:from-cadd-pink hover:to-cadd-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isEditMode ? 'Update Booking' : 'Book PC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PC Details Modal */}
      {showPCDetailsModal && selectedPC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  PC {selectedPC.pcNumber} Details
                </h3>
                <button
                  onClick={() => setShowPCDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* PC Information */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">PC Number</div>
                    <div className="font-semibold text-gray-900">{selectedPC.pcNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Row</div>
                    <div className="font-semibold text-gray-900">Row {selectedPC.rowNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Time Slot</div>
                    <div className="font-semibold text-gray-900">
                      {timeSlots.find(slot => slot.id === selectedTimeSlot)?.label}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`font-semibold ${getBookingForPCAndTime(selectedPC._id, selectedTimeSlot) ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {getBookingForPCAndTime(selectedPC._id, selectedTimeSlot) ? 'Occupied' : 'Available'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Booking Details */}
              {(() => {
                const currentBooking = getBookingForPCAndTime(selectedPC._id, selectedTimeSlot)
                if (currentBooking) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                      <h4 className="text-lg font-semibold text-red-800 mb-3">Current Booking</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-red-600">Student</div>
                          <div className="font-semibold text-red-800">{currentBooking.studentName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Teacher</div>
                          <div className="font-semibold text-red-800">{currentBooking.teacherName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Purpose</div>
                          <div className="font-semibold text-red-800">{currentBooking.purpose}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Batch</div>
                          <div className="font-semibold text-red-800">
                            {currentBooking.batch ?
                              batches.find(b => b._id === currentBooking.batch)?.name || 'Unknown Batch' :
                              'Individual Booking'
                            }
                          </div>
                        </div>
                      </div>
                      {currentBooking.notes && (
                        <div className="mt-3">
                          <div className="text-sm text-red-600">Notes</div>
                          <div className="font-semibold text-red-800">{currentBooking.notes}</div>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleEditBooking(currentBooking)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit Booking
                        </button>
                        <button
                          onClick={handleFreeSlot}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Free Slot
                        </button>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Note:</span> Lab slots are automatically freed when students are marked absent/late in attendance.
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* All Students List */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">All Students</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                  {allStudents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {allStudents.map((student) => (
                        <div key={student._id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">Roll: {student.rollNo}</div>
                          </div>
                          <div className="text-xs text-blue-600">
                            {batches.find(b => b._id === student.batch)?.name || 'No Batch'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">No students found</div>
                  )}
                </div>
              </div>

              {/* All Teachers List */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">All Teachers</h4>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                  {allTeachers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {allTeachers.map((teacher) => (
                        <div key={teacher._id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{teacher.name}</div>
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${teacher.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {teacher.role === 'admin' ? 'Admin' : 'Teacher'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">No teachers found</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowPCDetailsModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Previous Bookings Modal */}
      <PreviousBookingsModal
        isOpen={showPreviousBookingsModal}
        onClose={() => setShowPreviousBookingsModal(false)}
        previousBookings={previousBookings}
        previousDate={previousDate}
      />

      {/* Apply Previous Bookings Modal */}
      <ApplyPreviousBookingsModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onConfirm={handleApplyPreviousBookings}
        previousBookings={previousBookings}
        selectedDate={selectedDate}
        loading={applyingBookings}
      />

      {/* Apply Bookings Result Modal */}
      <ApplyBookingsResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        result={applyResult}
      />

      {/* Clear Booked Slots Modal */}
      <ClearBookedSlotsModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearBookedSlots}
        selectedDate={selectedDate}
        pcsByRow={pcsByRow}
        loading={clearingSlots}
      />

      {/* Clear Slots Result Modal */}
      <ClearSlotsResultModal
        isOpen={showClearResultModal}
        onClose={() => setShowClearResultModal(false)}
        result={clearResult}
      />
    </div>
  )
}

export default LabManagement