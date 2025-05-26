import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDaysIcon,
  ComputerDesktopIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { labAPI } from '../../services/labAPI'
import { batchesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { showConfirm } from '../../utils/popup'
import { formatDateSimple } from '../../utils/dateUtils'
import BackButton from '../../components/BackButton'

const TodaysBookings = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [batches, setBatches] = useState([])
  const [pcs, setPCs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTimeSlot, setFilterTimeSlot] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30-12:00')
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0
  })

  const timeSlots = [
    { id: '09:00-10:30', label: '09:00 AM - 10:30 AM' },
    { id: '10:30-12:00', label: '10:30 AM - 12:00 PM' },
    { id: '12:00-13:30', label: '12:00 PM - 01:30 PM' },
    { id: '14:00-15:30', label: '02:00 PM - 03:30 PM' },
    { id: '15:30-17:00', label: '03:30 PM - 05:00 PM' }
  ]

  useEffect(() => {
    fetchBookings()
    fetchBatches()
    fetchPCs()
  }, [selectedDate])

  useEffect(() => {
    applyFilters()
  }, [bookings, searchTerm, filterStatus, filterTimeSlot])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const response = await labAPI.bookings.getBookings({ date: selectedDate })
      setBookings(response)
      calculateStats(response)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to fetch bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBatches = async () => {
    try {
      const response = await batchesAPI.getBatches()
      setBatches(response.data)
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const fetchPCs = async () => {
    try {
      const response = await labAPI.pcs.getPCs()
      setPCs(response)

      // If no PCs exist, create sample PCs for demonstration
      if (response.length === 0) {
        await createSamplePCs()
      }
    } catch (error) {
      console.error('Error fetching PCs:', error)
    }
  }

  const createSamplePCs = async () => {
    try {
      const samplePCs = []

      // Create PCs with different naming formats for demonstration
      const pcFormats = [
        { prefix: 'CS', start: 1 },   // CS-01 to CS-09
        { prefix: 'SS', start: 1 },   // SS-01 to SS-09
        { prefix: 'MS', start: 1 },   // MS-01 to MS-09
        { prefix: 'DS', start: 1 }    // DS-01 to DS-09
      ]

      for (let row = 1; row <= 4; row++) {
        const format = pcFormats[row - 1]
        for (let pc = 1; pc <= 9; pc++) {
          const pcNumber = `${format.prefix}-${String(format.start + pc - 1).padStart(2, '0')}`
          samplePCs.push({
            pcNumber,
            rowNumber: row,
            status: 'active',
            notes: `Sample ${format.prefix} PC for demonstration`
          })
        }
      }

      // Create PCs one by one
      for (const pcData of samplePCs) {
        try {
          await labAPI.pcs.createPC(pcData)
        } catch (error) {
          console.error(`Error creating PC ${pcData.pcNumber}:`, error)
        }
      }

      // Refresh PCs list
      const response = await labAPI.pcs.getPCs()
      // Handle response format - check if data is nested
      const pcsData = response?.data || response || []
      setPCs(Array.isArray(pcsData) ? pcsData : [])
      toast.success('Sample PCs created with different naming formats!')
    } catch (error) {
      console.error('Error creating sample PCs:', error)
    }
  }

  const calculateStats = (bookingsList) => {
    const total = bookingsList.length
    const confirmed = bookingsList.filter(b => b.status === 'confirmed').length
    const pending = bookingsList.filter(b => b.status === 'pending').length
    const cancelled = bookingsList.filter(b => b.status === 'cancelled').length

    setStats({ total, confirmed, pending, cancelled })
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookedFor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.pc?.pcNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.batch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterStatus)
    }

    // Time slot filter
    if (filterTimeSlot !== 'all') {
      filtered = filtered.filter(booking => booking.timeSlot === filterTimeSlot)
    }

    setFilteredBookings(filtered)
  }

  const handleCancelBooking = async (bookingId) => {
    const confirmed = await showConfirm('Are you sure you want to cancel this booking?', 'Cancel Booking')
    if (!confirmed) {
      return
    }

    try {
      await labAPI.bookings.updateBooking(bookingId, { status: 'cancelled' })
      toast.success('Booking cancelled successfully')
      fetchBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  const getBatchName = (batchId) => {
    const batch = batches.find(b => b._id === batchId)
    return batch ? `${batch.name} - ${batch.section}` : 'N/A'
  }

  const getTimeSlotLabel = (timeSlot) => {
    const slot = timeSlots.find(s => s.id === timeSlot)
    return slot ? slot.label : timeSlot
  }

  // Get PC availability for the selected time slot
  const getPCAvailability = (pcNumber, rowNumber) => {
    const booking = bookings.find(b =>
      b.pc?.pcNumber === pcNumber &&
      b.pc?.rowNumber === rowNumber &&
      b.timeSlot === selectedTimeSlot &&
      b.status === 'confirmed'  // Only show confirmed bookings as occupied
    )

    if (booking) {
      return {
        status: 'occupied',  // Always show confirmed bookings as occupied
        bookedFor: booking.bookedFor,
        booking: booking
      }
    }

    return {
      status: 'available',
      bookedFor: null,
      booking: null
    }
  }

  // Get PCs organized by rows
  const getPCsByRows = () => {
    const rows = {}

    pcs.forEach(pc => {
      if (!rows[pc.rowNumber]) {
        rows[pc.rowNumber] = []
      }
      rows[pc.rowNumber].push(pc)
    })

    // Sort PCs within each row by PC number
    Object.keys(rows).forEach(rowNumber => {
      rows[rowNumber].sort((a, b) => {
        const aNum = parseInt(a.pcNumber.replace(/\D/g, ''))
        const bNum = parseInt(b.pcNumber.replace(/\D/g, ''))
        return aNum - bNum
      })
    })

    return rows
  }

  // Get PC status color
  const getPCStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 'confirmed':
        return 'bg-red-500 hover:bg-red-600 text-white'
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white'
      default:
        return 'bg-gray-300 hover:bg-gray-400 text-gray-700'
    }
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

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <CalendarDaysIcon className="inline h-10 w-10 mr-3 text-blue-400" />
                Today's Bookings
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Manage and monitor lab bookings for {formatDateSimple(selectedDate)}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <ComputerDesktopIcon className="w-4 h-4 mr-1" />
                  {stats.total} Total Bookings
                </span>
                <span className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  {stats.confirmed} Confirmed
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {stats.pending} Pending
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-cadd-red focus:border-cadd-red"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-cadd-red focus:border-cadd-red"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-cadd-red focus:border-cadd-red"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Slot
            </label>
            <select
              value={selectedTimeSlot}
              onChange={(e) => setSelectedTimeSlot(e.target.value)}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-cadd-red focus:border-cadd-red"
            >
              {timeSlots.map(slot => (
                <option key={slot.id} value={slot.id}>{slot.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Link
              to="/book-lab"
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Booking
            </Link>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bookings List</h2>
              <p className="text-sm text-gray-500 mt-1">
                {bookings.filter(b => b.timeSlot === selectedTimeSlot).length} of {bookings.length} bookings shown
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
          {pcs.length === 0 ? (
            <div className="text-center py-12">
              <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No computers have been added to the lab yet.
              </p>
              <div className="mt-6">
                <Link
                  to="/book-lab"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Booking
                </Link>
              </div>
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
                      const availability = getPCAvailability(pc.pcNumber, pc.rowNumber)
                      return (
                        <div
                          key={`${pc.rowNumber}-${pc.pcNumber}`}
                          className={`
                            relative p-3 rounded-lg text-center text-sm font-medium transition-all duration-200 cursor-pointer
                            ${getPCStatusColor(availability.status)}
                            transform hover:scale-105 shadow-sm hover:shadow-md
                          `}
                          title={
                            availability.status === 'available'
                              ? `${pc.pcNumber} - Available`
                              : `${pc.pcNumber} - ${availability.status} (${availability.bookedFor})`
                          }
                        >
                          <div className="font-bold">{pc.pcNumber}</div>
                          {availability.status !== 'available' && (
                            <div className="text-xs mt-1 opacity-90 truncate">
                              {availability.bookedFor}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {Object.keys(getPCsByRows()).length === 0 && (
                <div className="text-center py-12">
                  <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No computers are available for the selected time slot.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/book-lab"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create First Booking
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TodaysBookings
