import { useState, useEffect } from 'react'
import {
  CalendarDaysIcon,
  ComputerDesktopIcon,
  ClockIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon as HistoryIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI, labAPI } from '../../services/labAPI'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { formatDateShort, formatDateSimple } from '../../utils/dateUtils'
import PreviousBookingsModal from '../../components/PreviousBookingsModal'
import ApplyPreviousBookingsModal from '../../components/ApplyPreviousBookingsModal'
import ApplyBookingsResultModal from '../../components/ApplyBookingsResultModal'
import ClearBookedSlotsModal from '../../components/ClearBookedSlotsModal'
import ClearSlotsResultModal from '../../components/ClearSlotsResultModal'
import BackButton from '../../components/BackButton'
import CLoader from '../../components/CLoader'

const LabAvailability = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30-12:00')
  const [pcsByRow, setPcsByRow] = useState({})
  const [bookings, setBookings] = useState([])
  const [labInfo, setLabInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [labInfoLoading, setLabInfoLoading] = useState(true)
  const [showPCDetailsModal, setShowPCDetailsModal] = useState(false)
  const [selectedPC, setSelectedPC] = useState(null)

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

  const timeSlots = [
    { id: '09:00-10:30', label: '09:00 AM - 10:30 AM' },
    { id: '10:30-12:00', label: '10:30 AM - 12:00 PM' },
    { id: '12:00-13:30', label: '12:00 PM - 01:30 PM' },
    { id: '14:00-15:30', label: '02:00 PM - 03:30 PM' },
    { id: '15:30-17:00', label: '03:30 PM - 05:00 PM' },
  ]

  useEffect(() => {
    fetchLabInfo()
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

  const fetchLabInfo = async () => {
    try {
      const response = await labAPI.info.getLabInfo()
      setLabInfo(response)
    } catch (error) {
      console.error('Error fetching lab info:', error)
    } finally {
      setLabInfoLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pcsRes, bookingsRes] = await Promise.all([
        pcAPI.getPCsByRow(),
        bookingAPI.getBookings({ date: selectedDate })
      ])

      // Handle response format - check if data is nested
      const pcsData = pcsRes?.data || pcsRes || {}
      const bookingsData = bookingsRes?.data || bookingsRes || []

      setPcsByRow(pcsData)
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch lab data')
      // Set default values on error
      setPcsByRow({})
      setBookings([])
    } finally {
      setLoading(false)
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

  const getAvailableCount = (timeSlot) => {
    if (!pcsByRow || typeof pcsByRow !== 'object') return 0

    const allPCs = Object.values(pcsByRow).flat()
    return allPCs.filter(pc => {
      if (!pc || !pc._id) return false
      const booking = getBookingForPCAndTime(pc._id, timeSlot)
      return !booking && pc.status === 'active'
    }).length
  }

  const getTotalCount = () => {
    return Object.values(pcsByRow).flat().length
  }

  // Get PC availability for the selected time slot
  const getPCAvailability = (pcNumber, rowNumber) => {
    const pc = Object.values(pcsByRow).flat().find(p =>
      p.pcNumber === pcNumber && p.rowNumber === parseInt(rowNumber)
    )

    if (!pc) return { status: 'unavailable', bookedFor: null, booking: null }

    // Check for confirmed booking (occupied)
    const confirmedBooking = getBookingForPCAndTime(pc._id, selectedTimeSlot)
    if (confirmedBooking) {
      return {
        status: 'occupied',
        bookedFor: confirmedBooking.studentName,
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
        bookedFor: completedBooking.studentName,
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

  // Get PCs organized by rows
  const getPCsByRows = () => {
    return pcsByRow
  }

  // Get PC status color
  const getPCStatusColor = (status) => {
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

  // Handle PC click to show details
  const handlePCClick = (pc) => {
    setSelectedPC(pc)
    setShowPCDetailsModal(true)
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



  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header with Lab Information */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <ComputerDesktopIcon className="inline h-10 w-10 mr-3 text-blue-400" />
                Lab Availability
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                {labInfo ? labInfo.instituteName : 'CADD Centre'} - Computer Lab Management
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  {formatDateSimple(selectedDate)}
                </span>
                {labInfo && (
                  <>
                    <span className="flex items-center">
                      <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                      {labInfo.facilities?.totalLabs} Labs
                    </span>
                    <span className="flex items-center">
                      <ComputerDesktopIcon className="w-4 h-4 mr-1" />
                      {labInfo.facilities?.totalPCs} PCs
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                className="h-20 w-auto opacity-80"
                src={labInfo?.logo || "/logos/cadd_logo.png"}
                alt={labInfo?.instituteName || "CADD Centre"}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lab Information Cards */}
      {labInfo && !labInfoLoading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Facility Info</h3>
                <p className="text-sm text-gray-500">{labInfo.instituteType}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>{labInfo.location?.address}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>{labInfo.facilities?.operatingHours?.weekdays}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <PhoneIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Info</h3>
                <p className="text-sm text-gray-500">Get in touch</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>{labInfo.contact?.phone}</span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>{labInfo.contact?.email}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <ComputerDesktopIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Lab Stats</h3>
                <p className="text-sm text-gray-500">Current status</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{labInfo.facilities?.totalPCs}</p>
                <p className="text-xs text-gray-500">Total PCs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{labInfo.facilities?.totalLabs}</p>
                <p className="text-xs text-gray-500">Labs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total PCs</dt>
                  <dd className="text-lg font-medium text-gray-900">{getTotalCount()}</dd>
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

      {/* Compact Date and Time Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:space-x-6 mb-6">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Date & Time Selection</h3>
            <p className="text-sm text-gray-600">Choose date and time slot to view PC availability</p>
          </div>

          {/* Compact Date Input and Previous Booked Button */}
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
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
                  min={new Date().toISOString().split('T')[0]}
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
            <div className="flex flex-col items-center space-y-3">
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

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Apply yesterday's bookings to today
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Clear multiple bookings in bulk
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>

                <div className="text-xs text-gray-500 mt-1 text-center">
                  Bulk Clear
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Time Slots - Clickable Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {timeSlots.map((slot) => {
            const occupiedCount = bookings.filter(b => b.timeSlot === slot.id && b.isActive).length
            const availableCount = getAvailableCount(slot.id)
            const totalCount = getTotalCount()
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
                  {availableCount}/{totalCount} available
                </div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-white opacity-75' : 'text-gray-400'}`}>
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

      {loading ? (
        <CLoader />
      ) : Object.keys(pcsByRow).length > 0 ? (
        <div className="space-y-6">

          {/* Detailed Availability Grid */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detailed Availability</h2>
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
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                        {rowPCs.map((pc) => {
                          const pcAvailability = getPCAvailability(pc.pcNumber, pc.rowNumber)
                          return (
                            <div
                              key={`${pc.rowNumber}-${pc.pcNumber}`}
                              onClick={() => handlePCClick(pc)}
                              className={`
                                relative p-4 rounded-xl text-center text-sm font-medium transition-all duration-300 cursor-pointer group
                                ${getPCStatusColor(pcAvailability.status)}
                                transform hover:scale-110 shadow-lg hover:shadow-xl
                                border-2 border-transparent hover:border-white/30
                                backdrop-blur-sm
                              `}
                              title={
                                pcAvailability.status === 'available'
                                  ? `${pc.pcNumber} - Available for booking`
                                  : pcAvailability.status === 'maintenance'
                                    ? `${pc.pcNumber} - Under Maintenance`
                                    : pcAvailability.status === 'recently-freed'
                                      ? `${pc.pcNumber} - Recently freed (${pcAvailability.bookedFor} left)`
                                      : `${pc.pcNumber} - Occupied by ${pcAvailability.bookedFor}`
                              }
                            >
                              {/* PC Number with enhanced styling */}
                              <div className="font-bold text-lg mb-1 drop-shadow-sm">{pc.pcNumber}</div>

                              {/* Status indicator */}
                              <div className="absolute top-1 right-1">
                                {pcAvailability.status === 'available' && (
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></div>
                                )}
                                {pcAvailability.status === 'occupied' && (
                                  <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse shadow-sm"></div>
                                )}
                                {pcAvailability.status === 'recently-freed' && (
                                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse shadow-sm"></div>
                                )}
                                {pcAvailability.status === 'maintenance' && (
                                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse shadow-sm"></div>
                                )}
                              </div>

                              {/* Status text */}
                              {pcAvailability.status === 'occupied' && (
                                <div className="text-xs mt-1 opacity-90 truncate font-medium">
                                  {pcAvailability.bookedFor}
                                </div>
                              )}
                              {pcAvailability.status === 'recently-freed' && (
                                <div className="text-xs mt-1 opacity-90 truncate font-medium">
                                  Recently Freed
                                </div>
                              )}
                              {pcAvailability.status === 'maintenance' && (
                                <div className="text-xs mt-1 opacity-90 font-medium">
                                  Maintenance
                                </div>
                              )}
                              {pcAvailability.status === 'available' && (
                                <div className="text-xs mt-1 opacity-90 font-medium">
                                  Available
                                </div>
                              )}

                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                              {/* Click ripple effect */}
                              <div className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 transition-transform duration-150 pointer-events-none"></div>
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
        </div>
      ) : (
        <div className="text-center py-12">
          <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Unable to load lab availability for the selected date.
          </p>
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
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* PC Information */}
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 mb-6 border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                      PC Number
                    </div>
                    <div className="font-semibold text-gray-900 text-lg">{selectedPC.pcNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Row
                    </div>
                    <div className="font-semibold text-gray-900 text-lg">Row {selectedPC.rowNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Time Slot
                    </div>
                    <div className="font-semibold text-gray-900">
                      {getTimeSlotLabel(selectedTimeSlot)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`font-semibold text-lg ${getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'available'
                      ? 'text-green-600'
                      : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'maintenance'
                        ? 'text-yellow-600'
                        : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'recently-freed'
                          ? 'text-blue-600'
                          : 'text-red-600'
                      }`}>
                      {getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'available'
                        ? '✅ Available'
                        : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'maintenance'
                          ? '🔧 Maintenance'
                          : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'recently-freed'
                            ? '🔵 Recently Freed'
                            : '🔴 Occupied'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Booking Details */}
              {(() => {
                const pcAvailability = getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber)
                if (pcAvailability.status === 'occupied' && pcAvailability.booking) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                      <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        Current Booking
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-red-600">Student</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.studentName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Teacher</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.teacherName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Purpose</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.purpose}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Time Slot</div>
                          <div className="font-semibold text-red-800">{getTimeSlotLabel(pcAvailability.booking.timeSlot)}</div>
                        </div>
                      </div>
                      {pcAvailability.booking.notes && (
                        <div className="mt-3">
                          <div className="text-sm text-red-600">Notes</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.notes}</div>
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Note:</span> Lab slots are automatically freed when students are marked absent/late in attendance.
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Availability for All Time Slots */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Availability for All Time Slots
                </h4>
                <div className="space-y-2">
                  {timeSlots.map((slot) => {
                    const slotAvailability = getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber)
                    const slotBooking = getBookingForPCAndTime(selectedPC._id, slot.id)
                    const isCurrentSlot = slot.id === selectedTimeSlot

                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-lg border ${isCurrentSlot
                          ? 'border-cadd-red bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className={`font-medium ${isCurrentSlot ? 'text-cadd-red' : 'text-gray-900'}`}>
                              {slot.label}
                            </span>
                            {isCurrentSlot && (
                              <span className="ml-2 px-2 py-1 bg-cadd-red text-white text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            {slotBooking ? (
                              <span className="text-red-600 font-medium text-sm">
                                🔴 Occupied by {slotBooking.studentName}
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium text-sm">
                                ✅ Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowPCDetailsModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105 shadow-lg"
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

export default LabAvailability
