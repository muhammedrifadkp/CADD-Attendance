import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDaysIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI } from '../../../services/labAPI'
import { toast } from 'react-toastify'
import { showConfirm } from '../../../utils/popup'
import BackButton from '../../../components/BackButton'
import ApplyPreviousDateModal from '../../../components/ApplyPreviousDateModal'

const LabBooking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [pcsByRow, setPcsByRow] = useState({})
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showApplyPreviousModal, setShowApplyPreviousModal] = useState(false)

  const timeSlots = [
    { id: '09:00 AM - 10:30 AM', label: '09:00 AM - 10:30 AM', start: '09:00', end: '10:30' },
    { id: '10:30 AM - 12:00 PM', label: '10:30 AM - 12:00 PM', start: '10:30', end: '12:00' },
    { id: '12:00 PM - 01:30 PM', label: '12:00 PM - 01:30 PM', start: '12:00', end: '13:30' },
    { id: '02:00 PM - 03:30 PM', label: '02:00 PM - 03:30 PM', start: '14:00', end: '15:30' },
    { id: '03:30 PM - 05:00 PM', label: '03:30 PM - 05:00 PM', start: '15:30', end: '17:00' },
  ]

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pcsRes, bookingsRes] = await Promise.all([
        pcAPI.getPCsByRow(),
        bookingAPI.getBookings({ date: selectedDate })
      ])

      setPcsByRow(pcsRes?.data || pcsRes || {})
      const bookingsData = bookingsRes?.data || bookingsRes || []
      console.log(`📅 Fetched ${bookingsData.length} bookings for date ${selectedDate}:`, bookingsData)
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch lab data')
      setPcsByRow({})
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const getBookingsForTimeSlot = (timeSlotId) => {
    const filteredBookings = bookings.filter(booking =>
      booking.timeSlot === timeSlotId &&
      booking.status !== 'cancelled'
    )
    console.log(`📊 Time slot ${timeSlotId}: ${filteredBookings.length} bookings found`, filteredBookings)
    return filteredBookings
  }

  const isPCBooked = (pcId, timeSlotId) => {
    return bookings.some(booking => {
      const bookingPcId = booking.pc?._id || booking.pc
      return bookingPcId === pcId &&
        booking.timeSlot === timeSlotId &&
        booking.status !== 'cancelled'
    })
  }

  const getOccupiedCount = (timeSlotId) => {
    const count = getBookingsForTimeSlot(timeSlotId).length
    console.log(`🔢 Occupied count for ${timeSlotId}: ${count}`)
    return count
  }

  const getTotalActivePCs = () => {
    return Object.values(pcsByRow).flat().filter(pc => pc.status === 'active').length
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    const options = { weekday: 'short', day: 'numeric', month: 'short' }
    const formatted = date.toLocaleDateString('en-US', options)
    
    return { formatted, isToday }
  }

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + direction)
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const applyPreviousBookings = () => {
    setShowApplyPreviousModal(true)
  }

  const handleApplyPreviousConfirm = async (sourceDate) => {
    try {
      setBookingLoading(true)

      // Get bookings from the selected source date
      const sourceBookings = await bookingAPI.getBookings({ date: sourceDate })
      const bookingsData = sourceBookings?.data || sourceBookings || []

      if (bookingsData.length > 0) {
        await bookingAPI.applyPreviousBookings({
          targetDate: selectedDate,
          bookings: bookingsData
        })

        toast.success(`Applied ${bookingsData.length} bookings from ${sourceDate}`)
        fetchData()
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

  const clearAllSlots = async () => {
    const confirmed = await showConfirm(
      'This will clear ALL bookings for the selected date. This action cannot be undone.',
      'Clear All Slots'
    )
    
    if (confirmed) {
      try {
        setBookingLoading(true)
        await bookingAPI.clearBookedSlotsBulk({ date: selectedDate })
        toast.success('All slots cleared successfully')
        fetchData()
      } catch (error) {
        console.error('Error clearing slots:', error)
        toast.error('Failed to clear slots')
      } finally {
        setBookingLoading(false)
      }
    }
  }

  const clearTimeSlot = async (timeSlotId) => {
    const timeSlot = timeSlots.find(ts => ts.id === timeSlotId)
    const confirmed = await showConfirm(
      `This will clear all bookings for ${timeSlot?.label}. Continue?`,
      'Clear Time Slot'
    )
    
    if (confirmed) {
      try {
        setBookingLoading(true)
        await bookingAPI.clearBookedSlotsBulk({ 
          date: selectedDate, 
          timeSlots: [timeSlotId] 
        })
        toast.success(`Cleared ${timeSlot?.label} successfully`)
        fetchData()
      } catch (error) {
        console.error('Error clearing time slot:', error)
        toast.error('Failed to clear time slot')
      } finally {
        setBookingLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  const { formatted: formattedDate, isToday } = formatDate(selectedDate)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-cadd-purple to-cadd-pink rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Lab PC Booking System</h1>
              <p className="text-xl text-white/90">
                Manage computer lab bookings and time slots
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CalendarDaysIcon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection and Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Date Navigation */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-cadd-red"
                />
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Selected Date</div>
              <div className="text-lg font-semibold text-gray-900">{formattedDate}</div>
              {isToday && (
                <div className="flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  <span className="text-xs text-red-600 font-medium">Today</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={applyPreviousBookings}
              disabled={bookingLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Apply Previous
            </button>
            
            <button
              onClick={clearAllSlots}
              disabled={bookingLoading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear Slots
            </button>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Time Slots</h2>
          <p className="text-sm text-gray-600">
            Click on a time slot to view PC availability for that period
          </p>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {timeSlots.map((timeSlot) => {
            const occupiedCount = getOccupiedCount(timeSlot.id)
            const totalPCs = getTotalActivePCs()
            const isSelected = selectedTimeSlot === timeSlot.id
            const occupancyRate = totalPCs > 0 ? (occupiedCount / totalPCs) * 100 : 0

            return (
              <div
                key={timeSlot.id}
                onClick={() => setSelectedTimeSlot(isSelected ? null : timeSlot.id)}
                className={`
                  relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                  ${isSelected
                    ? 'border-cadd-red bg-cadd-red/5 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <ClockIcon className={`h-5 w-5 ${isSelected ? 'text-cadd-red' : 'text-gray-400'}`} />
                  {occupiedCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearTimeSlot(timeSlot.id)
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Clear this time slot"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className={`font-semibold mb-2 ${isSelected ? 'text-cadd-red' : 'text-gray-900'}`}>
                  {timeSlot.label}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={`${isSelected ? 'text-cadd-red' : 'text-gray-600'}`}>
                    {occupiedCount} occupied
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-cadd-red' : 'text-gray-500'}`}>
                    {totalPCs > 0 ? `${occupancyRate.toFixed(0)}%` : '0%'}
                  </span>
                </div>

                {/* Occupancy Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      occupancyRate > 80 ? 'bg-red-500' :
                      occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PC Grid - Show when time slot is selected */}
      {selectedTimeSlot && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                PC Availability - {timeSlots.find(ts => ts.id === selectedTimeSlot)?.label}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {getOccupiedCount(selectedTimeSlot)} of {getTotalActivePCs()} PCs occupied
              </p>
            </div>
            <button
              onClick={() => setSelectedTimeSlot(null)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

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
                <span>Booked</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                <span>Maintenance</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                <span>Inactive</span>
              </div>
            </div>
          </div>

          {/* PC Rows */}
          {Object.keys(pcsByRow).length === 0 ? (
            <div className="text-center py-12">
              <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add PCs to the lab to start managing bookings.
              </p>
              <Link
                to="/admin/lab/pcs/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cadd-red hover:bg-cadd-red/90"
              >
                Add PC
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(pcsByRow)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([rowNumber, rowPCs]) => (
                  <div key={rowNumber} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">Row {rowNumber}</h3>
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-sm text-gray-500">
                        {rowPCs.filter(pc => pc.status === 'active' && !isPCBooked(pc._id, selectedTimeSlot)).length} / {rowPCs.filter(pc => pc.status === 'active').length} available
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {rowPCs.map((pc) => {
                        const isBooked = isPCBooked(pc._id, selectedTimeSlot)
                        const isActive = pc.status === 'active'

                        let statusColor = 'bg-gray-400 text-white' // inactive
                        let statusText = 'Inactive'

                        if (pc.status === 'maintenance') {
                          statusColor = 'bg-yellow-500 text-white'
                          statusText = 'Maintenance'
                        } else if (isActive) {
                          if (isBooked) {
                            statusColor = 'bg-red-500 text-white'
                            statusText = 'Booked'
                          } else {
                            statusColor = 'bg-green-500 text-white'
                            statusText = 'Available'
                          }
                        }

                        return (
                          <div
                            key={pc._id}
                            className={`
                              relative p-3 rounded-lg text-center text-sm font-medium transition-all duration-200
                              ${statusColor}
                              ${isActive && !isBooked ? 'hover:scale-105 cursor-pointer' : ''}
                              shadow-sm hover:shadow-md
                            `}
                            title={`${pc.pcNumber} - ${statusText}`}
                          >
                            <div className="font-bold">{pc.pcNumber}</div>
                            <div className="text-xs mt-1 opacity-90">
                              {statusText}
                            </div>
                            {isBooked && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>
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
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ComputerDesktopIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{getTotalActivePCs()}</div>
                <div className="text-sm text-blue-600">Total Active PCs</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {getTotalActivePCs() - bookings.filter(b => b.status !== 'cancelled').length}
                </div>
                <div className="text-sm text-green-600">Available Now</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {bookings.filter(b => b.status !== 'cancelled').length}
                </div>
                <div className="text-sm text-red-600">Total Bookings</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(pcsByRow).flat().filter(pc => pc.status === 'maintenance').length}
                </div>
                <div className="text-sm text-yellow-600">Maintenance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default LabBooking
