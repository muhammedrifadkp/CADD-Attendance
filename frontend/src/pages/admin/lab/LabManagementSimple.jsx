import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { ComputerDesktopIcon } from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'
import { pcAPI, bookingAPI } from '../../../services/labAPI'

const LabManagementSimple = () => {
  const [loading, setLoading] = useState(true)
  const [pcsByRow, setPcsByRow] = useState({})
  const [bookings, setBookings] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')

  // Time slots
  const timeSlots = [
    { id: '09:00 AM - 10:30 AM', label: '09:00 AM - 10:30 AM' },
    { id: '10:30 AM - 12:00 PM', label: '10:30 AM - 12:00 PM' },
    { id: '12:00 PM - 01:30 PM', label: '12:00 PM - 01:30 PM' },
    { id: '02:00 PM - 03:30 PM', label: '02:00 PM - 03:30 PM' },
    { id: '03:30 PM - 05:00 PM', label: '03:30 PM - 05:00 PM' }
  ]

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching data for date:', selectedDate)
      
      // Fetch PCs
      const pcsResponse = await pcAPI.getPCsByRow()
      console.log('📊 PCs Response:', pcsResponse)
      
      // Fetch bookings
      const bookingsResponse = await bookingAPI.getBookings({ date: selectedDate })
      console.log('📅 Bookings Response:', bookingsResponse)

      // Set data
      const pcsData = pcsResponse?.data || pcsResponse || {}
      const bookingsData = bookingsResponse?.data || bookingsResponse || []

      console.log('📋 Setting PCs data:', pcsData)
      console.log('📋 Setting Bookings data:', bookingsData)

      setPcsByRow(pcsData)
      setBookings(bookingsData)
      
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      toast.error('Failed to fetch lab data')
      setPcsByRow({})
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  // Get PC status and color
  const getPCStatus = (pc) => {
    if (!selectedTimeSlot) {
      // No time slot selected - show basic PC status
      return {
        color: pc.status === 'active' ? 'bg-blue-500 text-white' : 
               pc.status === 'maintenance' ? 'bg-yellow-500 text-white' : 
               'bg-gray-400 text-white',
        text: pc.status.charAt(0).toUpperCase() + pc.status.slice(1),
        isClickable: false
      }
    }

    // Check if PC is booked for selected time slot
    const isBooked = bookings.some(booking => {
      const bookingPcId = booking.pc?._id || booking.pc
      return bookingPcId === pc._id &&
        booking.timeSlot === selectedTimeSlot &&
        booking.status !== 'cancelled'
    })

    if (isBooked) {
      return {
        color: 'bg-red-500 text-white',
        text: 'Booked',
        isClickable: true
      }
    } else if (pc.status === 'active') {
      return {
        color: 'bg-green-500 text-white',
        text: 'Available',
        isClickable: true
      }
    } else {
      return {
        color: pc.status === 'maintenance' ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white',
        text: pc.status === 'maintenance' ? 'Maintenance' : 'Inactive',
        isClickable: false
      }
    }
  }

  const handlePCClick = (pc) => {
    console.log('PC clicked:', pc)
    if (!selectedTimeSlot) {
      toast.warning('Please select a time slot first')
      return
    }
    // Add booking logic here later
    toast.info(`Clicked PC ${pc.pcNumber}`)
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

  console.log('🏗️ Rendering with PCs:', pcsByRow)
  console.log('🏗️ Rendering with Bookings:', bookings)

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Back Button */}
        <div className="flex items-center">
          <BackButton />
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Lab Management (Simple)</h1>
            <p className="text-gray-600 mt-1">Manage lab PCs and bookings</p>
          </div>

          {/* Date and Time Slot Selection */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cadd-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cadd-red"
                >
                  <option value="">Select time slot</option>
                  {timeSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>{slot.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">PC Status Legend:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Active (No time slot)</span>
            </div>
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
          </div>
        </div>

        {/* PC Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {Object.keys(pcsByRow).length === 0 ? (
              <div className="text-center py-12">
                <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
                <p className="mt-1 text-sm text-gray-500">No computers are available in the lab.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(pcsByRow).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([rowNumber, rowPCs]) => {
                  console.log(`🏠 Rendering Row ${rowNumber} with ${rowPCs.length} PCs`)
                  return (
                    <div key={rowNumber} className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">Row {rowNumber}</h3>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-sm text-gray-500">
                          {rowPCs.length} PCs
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {rowPCs.map((pc) => {
                          console.log(`💻 Rendering PC:`, pc)
                          const pcStatus = getPCStatus(pc)
                          
                          return (
                            <div
                              key={`${pc.row}-${pc.pcNumber}`}
                              onClick={() => pcStatus.isClickable ? handlePCClick(pc) : null}
                              className={`
                                relative p-3 rounded-lg text-center text-sm font-medium transition-all duration-200
                                ${pcStatus.color}
                                ${pcStatus.isClickable ? 'hover:scale-105 cursor-pointer' : ''}
                                shadow-sm hover:shadow-md
                              `}
                              title={`${pc.pcNumber} - ${pcStatus.text}`}
                            >
                              <div className="font-bold">{pc.pcNumber}</div>
                              <div className="text-xs mt-1 opacity-90">
                                {pcStatus.text}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info:</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>PCs by Row Keys: {Object.keys(pcsByRow).join(', ')}</div>
            <div>Total PCs: {Object.values(pcsByRow).flat().length}</div>
            <div>Total Bookings: {bookings.length}</div>
            <div>Selected Date: {selectedDate}</div>
            <div>Selected Time Slot: {selectedTimeSlot || 'None'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabManagementSimple
