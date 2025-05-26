import { useState } from 'react'
import { bookingAPI } from '../services/labAPI'
import { toast } from 'react-toastify'
import ApplyBookingsDebug from './ApplyBookingsDebug'

const DebugLabFeatures = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const testApplyPreviousBookings = async () => {
    try {
      setLoading(true)
      setResults(null)

      const today = new Date().toISOString().split('T')[0]
      console.log('🧪 Testing Apply Previous Bookings with date:', today)

      const response = await bookingAPI.applyPreviousBookings({
        targetDate: today
      })

      console.log('✅ Apply Previous Bookings Response:', response)
      setResults({ type: 'apply', data: response })
      toast.success('Apply Previous Bookings test completed')
    } catch (error) {
      console.error('❌ Apply Previous Bookings Error:', error)
      setResults({ type: 'error', data: error.response?.data || error.message })
      toast.error('Apply Previous Bookings test failed')
    } finally {
      setLoading(false)
    }
  }

  const testClearBookedSlots = async () => {
    try {
      setLoading(true)
      setResults(null)

      const today = new Date().toISOString().split('T')[0]
      console.log('🧪 Testing Clear Booked Slots with date:', today)

      const response = await bookingAPI.clearBookedSlotsBulk({
        date: today,
        timeSlot: 'all',
        pcIds: [],
        confirmClear: true
      })

      console.log('✅ Clear Booked Slots Response:', response)
      setResults({ type: 'clear', data: response })
      toast.success('Clear Booked Slots test completed')
    } catch (error) {
      console.error('❌ Clear Booked Slots Error:', error)
      setResults({ type: 'error', data: error.response?.data || error.message })
      toast.error('Clear Booked Slots test failed')
    } finally {
      setLoading(false)
    }
  }

  const testGetPreviousBookings = async () => {
    try {
      setLoading(true)
      setResults(null)

      const today = new Date().toISOString().split('T')[0]
      console.log('🧪 Testing Get Previous Bookings with date:', today)

      const response = await bookingAPI.getPreviousBookings({ date: today })

      console.log('✅ Get Previous Bookings Response:', response)
      setResults({ type: 'previous', data: response })
      toast.success('Get Previous Bookings test completed')
    } catch (error) {
      console.error('❌ Get Previous Bookings Error:', error)
      setResults({ type: 'error', data: error.response?.data || error.message })
      toast.error('Get Previous Bookings test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Debug Lab Features</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testGetPreviousBookings}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Get Previous Bookings'}
        </button>

        <button
          onClick={testApplyPreviousBookings}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Apply Previous Bookings'}
        </button>

        <button
          onClick={testClearBookedSlots}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Clear Booked Slots'}
        </button>
      </div>

      {results && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">
            {results.type === 'error' ? '❌ Error Result' : '✅ Test Result'}
          </h3>
          <pre className="bg-white border border-gray-300 rounded p-3 text-sm overflow-auto max-h-96">
            {JSON.stringify(results.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Make sure you're logged in as admin or teacher</li>
          <li>2. Check browser console for detailed logs</li>
          <li>3. Check backend console for server-side logs</li>
          <li>4. Ensure you have test data (run seeder if needed)</li>
        </ul>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Expected Behavior</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li><strong>Get Previous Bookings:</strong> Should return yesterday's bookings</li>
          <li><strong>Apply Previous Bookings:</strong> Should copy yesterday's bookings to today</li>
          <li><strong>Clear Booked Slots:</strong> Should clear today's bookings</li>
        </ul>
      </div>

      {/* Advanced Debug Component */}
      <div className="mt-8">
        <ApplyBookingsDebug />
      </div>
    </div>
  )
}

export default DebugLabFeatures
