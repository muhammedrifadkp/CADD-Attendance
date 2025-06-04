import { useState, useEffect } from 'react'
import {
  ComputerDesktopIcon,
  ClockIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI, labAPI } from '../../services/labAPI'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const LabAvailability = () => {
  const { user } = useAuth()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30-12:00')
  const [pcsByRow, setPcsByRow] = useState({})
  const [filteredPCs, setFilteredPCs] = useState({})
  const [bookings, setBookings] = useState([])
  const [labInfo, setLabInfo] = useState(null)
  const [departments, setDepartments] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [labInfoLoading, setLabInfoLoading] = useState(true)
  const [showPCDetailsModal, setShowPCDetailsModal] = useState(false)
  const [selectedPC, setSelectedPC] = useState(null)

  // Enhanced filtering states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

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
  }, [])

  // Filter PCs based on search and filters
  useEffect(() => {
    let filtered = { ...pcsByRow }

    // Apply department filter to bookings if needed
    if (selectedDepartment !== 'all' || selectedBatch !== 'all' || searchTerm) {
      // Filter based on current bookings and batch associations
      const relevantBookings = bookings.filter(booking => {
        if (selectedDepartment !== 'all' && booking.batch?.course?.department?._id !== selectedDepartment) {
          return false
        }
        if (selectedBatch !== 'all' && booking.batch?._id !== selectedBatch) {
          return false
        }
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            booking.studentName?.toLowerCase().includes(searchLower) ||
            booking.teacherName?.toLowerCase().includes(searchLower) ||
            booking.purpose?.toLowerCase().includes(searchLower) ||
            booking.batch?.name?.toLowerCase().includes(searchLower)
          )
        }
        return true
      })

      // Update filtered PCs based on relevant bookings
      setFilteredPCs(filtered)
    } else {
      setFilteredPCs(filtered)
    }
  }, [pcsByRow, bookings, searchTerm, selectedDepartment, selectedBatch, selectedStatus])

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
      const today = new Date().toISOString().split('T')[0]

      const [pcsRes, bookingsRes, departmentsRes, batchesRes] = await Promise.all([
        pcAPI.getPCsByRow(),
        bookingAPI.getBookings({ date: today }),
        api.get('/departments?active=true'),
        api.get('/batches?active=true')
      ])

      // Handle response format - check if data is nested
      const pcsData = pcsRes?.data || pcsRes || {}
      const bookingsData = bookingsRes?.data || bookingsRes || []

      setPcsByRow(pcsData)
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])

      // Filter departments to only include the 4 required ones
      const allDepartments = departmentsRes.data || []
      const requiredDepartments = allDepartments.filter(dept =>
        ['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'].includes(dept.name)
      )
      setDepartments(requiredDepartments)

      // Set batches data
      setBatches(batchesRes.data?.batches || batchesRes.data || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch lab data')
      // Set default values on error
      setPcsByRow({})
      setBookings([])
      setDepartments([])
      setBatches([])
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
    if (!filteredPCs || typeof filteredPCs !== 'object') return 0

    const allPCs = Object.values(filteredPCs).flat()
    return allPCs.filter(pc => {
      if (!pc || !pc._id) return false
      const booking = getBookingForPCAndTime(pc._id, timeSlot)
      return !booking && pc.status === 'active'
    }).length
  }

  const getTotalCount = () => {
    return Object.values(filteredPCs).flat().length
  }

  const getFilteredBookings = () => {
    let filtered = bookings

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(booking =>
        booking.batch?.course?.department?._id === selectedDepartment
      )
    }

    if (selectedBatch !== 'all') {
      filtered = filtered.filter(booking =>
        booking.batch?._id === selectedBatch
      )
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.studentName?.toLowerCase().includes(searchLower) ||
        booking.teacherName?.toLowerCase().includes(searchLower) ||
        booking.purpose?.toLowerCase().includes(searchLower) ||
        booking.batch?.name?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
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
    return filteredPCs
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





  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl shadow-lg">
                <ComputerDesktopIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lab Availability</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {labInfo ? labInfo.instituteName : 'CDC'} - Computer Lab Management System
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-4 py-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Real-time Status</span>
            </div>
            <div className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Lab Management
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, teacher, purpose, or batch..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-cadd-red focus:border-cadd-red focus:bg-white transition-all duration-300 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value)
                  setSelectedBatch('all') // Reset batch when department changes
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-sm bg-white"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-sm bg-white"
                disabled={selectedDepartment === 'all'}
              >
                <option value="all">
                  {selectedDepartment === 'all' ? 'Select Department First' : 'All Batches'}
                </option>
                {selectedDepartment !== 'all' && batches
                  .filter(batch => {
                    const batchDept = batch.course?.department?._id || batch.course?.department
                    return batchDept === selectedDepartment
                  })
                  .map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} - {batch.academicYear} {batch.section}
                    </option>
                  ))
                }
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available PCs</option>
                <option value="occupied">Occupied PCs</option>
                <option value="maintenance">Maintenance PCs</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {getFilteredBookings().length} active bookings
              </span>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-200"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </button>
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

      {/* Enhanced Status Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <ComputerDesktopIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total PCs</dt>
                  <dd className="text-2xl font-bold text-gray-900">{getTotalCount()}</dd>
                  <dd className="text-xs text-gray-400">in lab</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
                  <dd className="text-2xl font-bold text-gray-900">{getAvailableCount(selectedTimeSlot)}</dd>
                  <dd className="text-xs text-gray-400">for {getTimeSlotLabel(selectedTimeSlot)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                  <XCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Occupied</dt>
                  <dd className="text-2xl font-bold text-gray-900">{getFilteredBookings().filter(b => b.timeSlot === selectedTimeSlot && b.isActive).length}</dd>
                  <dd className="text-xs text-gray-400">current slot</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Maintenance</dt>
                  <dd className="text-2xl font-bold text-gray-900">{Object.values(filteredPCs).flat().filter(pc => pc.status === 'maintenance').length}</dd>
                  <dd className="text-xs text-gray-400">under repair</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Time Slot Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:space-x-6 mb-6">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Time Slot Selection</h3>
            <p className="text-sm text-gray-600">Choose a time slot to view PC availability and current bookings</p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-2 bg-gray-50 rounded-xl px-4 py-2">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Today's Lab Status</span>
          </div>
        </div>

        {/* Enhanced Time Slots - Clickable Buttons */}
        <div className="grid grid-cols-5 gap-4">
          {timeSlots.map((slot) => {
            const filteredBookings = getFilteredBookings()
            const occupiedCount = filteredBookings.filter(b => b.timeSlot === slot.id && b.isActive).length
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
        <div className="flex items-center justify-center min-h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
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


    </div>
  )
}

export default LabAvailability
