import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { batchesAPI, attendanceAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { format, subDays } from 'date-fns'

const AttendanceReport = () => {
  const { id: batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [stats, setStats] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBatchAndStats = async () => {
      try {
        setLoading(true)
        const [batchRes, statsRes] = await Promise.all([
          batchesAPI.getBatch(batchId),
          attendanceAPI.getBatchAttendanceStats(batchId, dateRange),
        ])

        setBatch(batchRes.data)
        setStats(statsRes.data)
      } catch (error) {
        toast.error('Failed to fetch attendance data')
      } finally {
        setLoading(false)
      }
    }

    fetchBatchAndStats()
  }, [batchId, dateRange])

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Batch not found</h3>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            {batch.name} • {batch.academicYear} • {batch.section}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to={`/batches/${batchId}/attendance`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Mark Attendance
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="form-label">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="form-input"
                value={dateRange.startDate}
                onChange={handleDateChange}
                max={dateRange.endDate}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="form-label">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="form-input"
                value={dateRange.endDate}
                onChange={handleDateChange}
                min={dateRange.startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          {stats ? (
            <div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800">Present</h3>
                  <p className="mt-2 text-3xl font-semibold text-green-600">
                    {stats.presentPercentage ? `${stats.presentPercentage.toFixed(1)}%` : 'N/A'}
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    {stats.presentCount} records
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800">Absent</h3>
                  <p className="mt-2 text-3xl font-semibold text-red-600">
                    {stats.absentPercentage ? `${stats.absentPercentage.toFixed(1)}%` : 'N/A'}
                  </p>
                  <p className="mt-1 text-sm text-red-600">
                    {stats.absentCount} records
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800">Late</h3>
                  <p className="mt-2 text-3xl font-semibold text-yellow-600">
                    {stats.latePercentage ? `${stats.latePercentage.toFixed(1)}%` : 'N/A'}
                  </p>
                  <p className="mt-1 text-sm text-yellow-600">
                    {stats.lateCount} records
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Students</dt>
                    <dd className="mt-1 text-sm text-gray-900">{stats.studentCount}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Days Recorded</dt>
                    <dd className="mt-1 text-sm text-gray-900">{stats.uniqueDatesCount}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Records</dt>
                    <dd className="mt-1 text-sm text-gray-900">{stats.totalRecords}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Average Attendance</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {stats.averageAttendance ? `${stats.averageAttendance.toFixed(1)}%` : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No attendance data available for the selected date range.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendanceReport
