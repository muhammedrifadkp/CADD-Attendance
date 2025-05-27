// Test page to demonstrate offline functionality
import { useState, useEffect } from 'react'
import {
  WifiIcon,
  CloudIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useOffline, useOfflineData } from '../hooks/useOffline'
import { studentsAPI, attendanceAPI } from '../services/api'
import { toast } from 'react-toastify'

const OfflineTestPage = () => {
  const {
    isOnline,
    isOffline,
    isSyncing,
    pendingOperations,
    lastSyncFormatted,
    forceSync,
    queueOperation,
    clearLocalData
  } = useOffline()

  const {
    data: students,
    loading: studentsLoading,
    reload: reloadStudents
  } = useOfflineData('students')

  const [testResults, setTestResults] = useState([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  // Add test result
  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  // Test offline data storage
  const testOfflineStorage = async () => {
    try {
      addTestResult('Offline Storage', true, 'Testing local data storage...')
      
      // Try to fetch students (should work offline if cached)
      const response = await studentsAPI.getStudents()
      const studentCount = response?.data?.length || 0
      
      addTestResult('Fetch Students', true, `Retrieved ${studentCount} students from ${response.fromCache ? 'cache' : 'server'}`)
    } catch (error) {
      addTestResult('Fetch Students', false, `Failed: ${error.message}`)
    }
  }

  // Test offline operation queuing
  const testOfflineOperations = async () => {
    try {
      addTestResult('Queue Operations', true, 'Testing offline operation queuing...')
      
      // Queue a test attendance operation
      const testAttendance = {
        student: 'test-student-id',
        batch: 'test-batch-id',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        timeIn: new Date().toISOString()
      }
      
      if (isOffline) {
        await queueOperation('attendance', 'POST', testAttendance, '/attendance')
        addTestResult('Queue Operation', true, 'Successfully queued attendance operation for sync')
      } else {
        addTestResult('Queue Operation', false, 'Cannot test queuing while online')
      }
    } catch (error) {
      addTestResult('Queue Operation', false, `Failed: ${error.message}`)
    }
  }

  // Test sync functionality
  const testSync = async () => {
    try {
      addTestResult('Sync Test', true, 'Testing sync functionality...')
      
      if (isOnline) {
        const success = await forceSync()
        addTestResult('Force Sync', success, success ? 'Sync completed successfully' : 'Sync failed or already in progress')
      } else {
        addTestResult('Force Sync', false, 'Cannot sync while offline')
      }
    } catch (error) {
      addTestResult('Force Sync', false, `Failed: ${error.message}`)
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    addTestResult('Test Suite', true, 'Starting offline functionality tests...')
    
    await testOfflineStorage()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    
    await testOfflineOperations()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testSync()
    
    addTestResult('Test Suite', true, 'All tests completed')
    setIsRunningTests(false)
  }

  // Clear all test data
  const clearTestData = async () => {
    try {
      await clearLocalData()
      setTestResults([])
      toast.success('All local data cleared')
    } catch (error) {
      toast.error('Failed to clear local data')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Offline Functionality Test Page
          </h1>
          <p className="text-gray-600">
            This page demonstrates the offline capabilities of the CADD Attendance Management System.
            Test various scenarios to see how the app behaves when offline.
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Online/Offline Status */}
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                {isOnline ? (
                  <WifiIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-xs text-gray-500">
                  Connection Status
                </p>
              </div>
            </div>

            {/* Sync Status */}
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isSyncing ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {isSyncing ? (
                  <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
                ) : (
                  <CloudIcon className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isSyncing ? 'Syncing...' : 'Idle'}
                </p>
                <p className="text-xs text-gray-500">
                  Last sync: {lastSyncFormatted}
                </p>
              </div>
            </div>

            {/* Pending Operations */}
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${pendingOperations > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                {pendingOperations > 0 ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {pendingOperations} Pending
                </p>
                <p className="text-xs text-gray-500">
                  Operations to sync
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={testOfflineStorage}
              disabled={isRunningTests}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test Storage
            </button>
            
            <button
              onClick={testOfflineOperations}
              disabled={isRunningTests}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Test Queuing
            </button>
            
            <button
              onClick={testSync}
              disabled={isRunningTests || !isOnline}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Test Sync
            </button>
            
            <button
              onClick={reloadStudents}
              disabled={studentsLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Reload Data
            </button>
            
            <button
              onClick={clearTestData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Clear Data
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No tests run yet. Click "Run All Tests" to start testing offline functionality.
            </p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className={`flex items-start space-x-3 p-3 rounded-md ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.test}
                    </p>
                    <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sample Data */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Data (Students)</h2>
          
          {studentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.slice(0, 5).map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length > 5 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Showing 5 of {students.length} students
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No student data available</p>
              <p className="text-sm text-gray-400 mt-1">
                Try going online and reloading data, or check if you have the necessary permissions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineTestPage
