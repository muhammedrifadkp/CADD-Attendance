import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { pcAPI, bookingAPI } from '../../../services/labAPI'
import { studentsAPI } from '../../../services/api'
import { toast } from 'react-toastify'

const LabDebug = () => {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState({
    user: null,
    pcs: [],
    students: [],
    bookings: [],
    errors: []
  })
  const [loading, setLoading] = useState(false)

  const addError = (error) => {
    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors, error]
    }))
  }

  const testAPIs = async () => {
    setLoading(true)
    setDebugInfo({
      user: user,
      pcs: [],
      students: [],
      bookings: [],
      errors: []
    })

    try {
      // Test PC API
      console.log('Testing PC API...')
      const pcsResponse = await pcAPI.getPCsByRow()
      console.log('PCs Response:', pcsResponse)
      setDebugInfo(prev => ({ ...prev, pcs: pcsResponse?.data || pcsResponse || [] }))
    } catch (error) {
      console.error('PC API Error:', error)
      addError(`PC API Error: ${error.message}`)
    }

    try {
      // Test Students API
      console.log('Testing Students API...')
      const studentsResponse = await studentsAPI.getStudents({ active: true, limit: 10 })
      console.log('Students Response:', studentsResponse)
      const studentsData = studentsResponse?.data?.students || studentsResponse?.data || []
      setDebugInfo(prev => ({ ...prev, students: studentsData }))
    } catch (error) {
      console.error('Students API Error:', error)
      addError(`Students API Error: ${error.message}`)
    }

    try {
      // Test Bookings API
      console.log('Testing Bookings API...')
      const today = new Date().toISOString().split('T')[0]
      const bookingsResponse = await bookingAPI.getBookings({ date: today })
      console.log('Bookings Response:', bookingsResponse)
      setDebugInfo(prev => ({ ...prev, bookings: bookingsResponse?.data || bookingsResponse || [] }))
    } catch (error) {
      console.error('Bookings API Error:', error)
      addError(`Bookings API Error: ${error.message}`)
    }

    try {
      // Test creating a sample booking (if we have data)
      if (debugInfo.pcs.length > 0 && debugInfo.students.length > 0) {
        console.log('Testing Booking Creation...')
        const sampleBooking = {
          pc: Object.values(debugInfo.pcs)[0]?.[0]?._id,
          date: new Date().toISOString().split('T')[0],
          timeSlot: '09:00-10:30',
          studentName: debugInfo.students[0]?.name || 'Test Student',
          teacherName: 'Test Teacher',
          purpose: 'Debug Test',
          notes: 'This is a test booking'
        }
        
        console.log('Sample booking payload:', sampleBooking)
        // Don't actually create the booking, just validate the payload
        if (!sampleBooking.pc) {
          addError('No PC available for test booking')
        }
        if (!sampleBooking.studentName) {
          addError('No student available for test booking')
        }
      }
    } catch (error) {
      console.error('Booking Test Error:', error)
      addError(`Booking Test Error: ${error.message}`)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      testAPIs()
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Lab Management Debug</h1>
          
          <button
            onClick={testAPIs}
            disabled={loading}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </button>

          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">User Information</h2>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(debugInfo.user, null, 2)}
              </pre>
            </div>

            {/* PCs Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">PCs ({Object.values(debugInfo.pcs).flat().length})</h2>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-40">
                {JSON.stringify(debugInfo.pcs, null, 2)}
              </pre>
            </div>

            {/* Students Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Students ({debugInfo.students.length})</h2>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-40">
                {JSON.stringify(debugInfo.students.slice(0, 3), null, 2)}
              </pre>
            </div>

            {/* Bookings Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Bookings ({debugInfo.bookings.length})</h2>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-40">
                {JSON.stringify(debugInfo.bookings, null, 2)}
              </pre>
            </div>

            {/* Errors */}
            {debugInfo.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-red-800">Errors ({debugInfo.errors.length})</h2>
                <div className="space-y-2">
                  {debugInfo.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 bg-white p-2 rounded border">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabDebug
