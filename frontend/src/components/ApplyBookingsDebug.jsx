import { useState } from 'react'
import { toast } from 'react-toastify'
import { bookingAPI } from '../services/labAPI'

const ApplyBookingsDebug = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const testGetPreviousBookings = async () => {
    try {
      setLoading(true)
      setResults(null)
      
      console.log('🧪 Testing Get Previous Bookings with date:', selectedDate)
      
      const response = await bookingAPI.getPreviousBookings({ date: selectedDate })
      
      console.log('✅ Get Previous Bookings Response:', response)
      setResults({ type: 'previous', data: response })
      
      if (response?.bookings?.length > 0) {
        toast.success(`Found ${response.bookings.length} previous bookings`)
      } else {
        toast.warning('No previous bookings found')
      }
    } catch (error) {
      console.error('❌ Get Previous Bookings Error:', error)
      setResults({ type: 'error', data: error.response?.data || error.message })
      toast.error('Get Previous Bookings failed')
    } finally {
      setLoading(false)
    }
  }

  const testApplyPreviousBookings = async () => {
    try {
      setLoading(true)
      setResults(null)
      
      console.log('🧪 Testing Apply Previous Bookings with date:', selectedDate)
      
      const response = await bookingAPI.applyPreviousBookings({
        targetDate: selectedDate
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

  const testCheckTodayBookings = async () => {
    try {
      setLoading(true)
      setResults(null)
      
      console.log('🧪 Testing Check Today Bookings with date:', selectedDate)
      
      const response = await bookingAPI.getBookings({ date: selectedDate })
      
      console.log('✅ Today Bookings Response:', response)
      setResults({ type: 'today', data: response })
      
      if (response?.length > 0) {
        toast.success(`Found ${response.length} bookings for today`)
      } else {
        toast.info('No bookings found for today')
      }
    } catch (error) {
      console.error('❌ Check Today Bookings Error:', error)
      setResults({ type: 'error', data: error.response?.data || error.message })
      toast.error('Check Today Bookings failed')
    } finally {
      setLoading(false)
    }
  }

  const testCheckYesterdayBookings = async () => {
    try {
      setLoading(true)
      setResults(null)
      
      const yesterday = new Date(selectedDate)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      console.log('🧪 Testing Check Yesterday Bookings with date:', yesterdayStr)
      
      const response = await bookingAPI.getBookings({ date: yesterdayStr })
      
      console.log('✅ Yesterday Bookings Response:', response)
      setResults({ type: 'yesterday', data: response })
      
      if (response?.length > 0) {
        toast.success(`Found ${response.length} bookings for yesterday`)
      } else {
        toast.warning('No bookings found for yesterday')
      }
    } catch (error) {
      console.error('❌ Check Yesterday Bookings Error:', error)
      setResults({ type: 'error', data: error.response?.data || error.message })
      toast.error('Check Yesterday Bookings failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Apply Bookings Debug Tool</h2>
      
      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cadd-red focus:border-cadd-red"
        />
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testGetPreviousBookings}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Get Previous'}
        </button>
        
        <button
          onClick={testApplyPreviousBookings}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Apply Previous'}
        </button>
        
        <button
          onClick={testCheckTodayBookings}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Check Today'}
        </button>
        
        <button
          onClick={testCheckYesterdayBookings}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Check Yesterday'}
        </button>
      </div>

      {/* Results Display */}
      {results && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Test Results ({results.type})
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Debug Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. <strong>Check Yesterday</strong> - See if there are bookings from yesterday</li>
          <li>2. <strong>Test Get Previous</strong> - Test the API that fetches previous bookings</li>
          <li>3. <strong>Test Apply Previous</strong> - Test the actual apply function</li>
          <li>4. <strong>Check Today</strong> - See if bookings were applied successfully</li>
        </ul>
      </div>
    </div>
  )
}

export default ApplyBookingsDebug
