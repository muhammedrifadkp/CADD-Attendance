import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentsAPI, batchesAPI } from '../../../services/api'
import {
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'
import CLoader from '../../../components/CLoader'

const TeacherStudentsList = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  // Helper function to format timing display
  const formatTiming = (timing) => {
    if (!timing) return 'No timing set'

    const timeSlots = {
      '09:00-10:30': '09:00 AM - 10:30 AM',
      '10:30-12:00': '10:30 AM - 12:00 PM',
      '12:00-13:30': '12:00 PM - 01:30 PM',
      '14:00-15:30': '02:00 PM - 03:30 PM',
      '15:30-17:00': '03:30 PM - 05:00 PM'
    }

    return timeSlots[timing] || timing
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [studentsRes, batchesRes] = await Promise.all([
          studentsAPI.getStudents(),
          batchesAPI.getBatches()
        ])

        setStudents(studentsRes.data)
        setBatches(batchesRes.data)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch students data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = students

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.batch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by batch
    if (selectedBatch !== 'all') {
      filtered = filtered.filter(student => student.batch?._id === selectedBatch)
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(student =>
        selectedStatus === 'active' ? student.isActive : !student.isActive
      )
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, selectedBatch, selectedStatus])

  const getStudentStats = () => {
    const total = students.length
    const active = students.filter(s => s.isActive).length
    const inactive = total - active
    const batchCount = new Set(students.map(s => s.batch?._id).filter(Boolean)).size

    return { total, active, inactive, batchCount }
  }

  const stats = getStudentStats()

  if (loading) {
    return <CLoader />
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <UserIcon className="inline h-10 w-10 mr-3 text-blue-400" />
                All Students
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Comprehensive view of all students across batches
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  System Online
                </span>
                <span className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  {formatDateSimple(new Date())}
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
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Students</p>
              <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Batches</p>
              <p className="text-3xl font-bold text-purple-600">{stats.batchCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200"
            >
              <option value="all">All Batches</option>
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} - {batch.academicYear}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>{viewMode === 'grid' ? 'Table View' : 'Grid View'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* Students Display */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <UserIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedBatch !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No students have been added yet.'}
          </p>
          {(!searchTerm && selectedBatch === 'all' && selectedStatus === 'all') && (
            <Link
              to="/batches"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Manage Batches
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStudents.map((student, index) => (
            <div
              key={student._id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Student Header */}
              <div className="relative p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${student.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-cadd-red transition-colors duration-300">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      Roll: {student.rollNo}
                    </p>
                    {/* Class Time Display */}
                    {student.batch?.timing && (
                      <div className="flex items-center mt-1 text-xs text-cadd-red font-semibold">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatTiming(student.batch.timing)}
                      </div>
                    )}
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${student.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div className="p-6 space-y-4">
                {/* Batch Information */}
                {student.batch && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AcademicCapIcon className="h-5 w-5 text-cadd-red" />
                      <span className="font-semibold text-gray-900">Batch Details</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-gray-900">{student.batch.name}</p>
                      <p className="text-gray-600">{student.batch.academicYear} • Section {student.batch.section}</p>
                      {student.batch.timing && (
                        <div className="flex items-center text-cadd-red font-medium">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatTiming(student.batch.timing)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 text-sm">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    {student.contactInfo?.email && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{student.contactInfo.email}</span>
                      </div>
                    )}
                    {student.contactInfo?.phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <span>{student.contactInfo.phone}</span>
                      </div>
                    )}
                    {student.contactInfo?.address && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{student.contactInfo.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enrollment Date */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Enrolled: {formatDateSimple(student.createdAt)}</span>
                    {student.batch && (
                      <Link
                        to={`/batches/${student.batch._id}/students`}
                        className="text-cadd-red hover:text-cadd-pink font-medium transition-colors duration-200"
                      >
                        View Batch
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6">
                <div className="flex space-x-2">
                  {student.batch && (
                    <Link
                      to={`/batches/${student.batch._id}/students/${student._id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  )}
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-200">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center shadow-lg mr-4">
                          <span className="text-white font-bold text-sm">
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">Roll: {student.rollNo}</div>
                          {/* Class Time Display in Table */}
                          {student.batch?.timing && (
                            <div className="flex items-center mt-1 text-xs text-cadd-red font-semibold">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {formatTiming(student.batch.timing)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.batch ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.batch.name}</div>
                          <div className="text-sm text-gray-500">{student.batch.academicYear} • {student.batch.section}</div>
                          {student.batch.timing && (
                            <div className="text-xs text-cadd-red font-medium mt-1">
                              {formatTiming(student.batch.timing)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No batch assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.contactInfo?.email && (
                          <div className="flex items-center mb-1">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="truncate max-w-32">{student.contactInfo.email}</span>
                          </div>
                        )}
                        {student.contactInfo?.phone && (
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span>{student.contactInfo.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateSimple(student.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {student.batch && (
                          <Link
                            to={`/batches/${student.batch._id}/students/${student._id}/edit`}
                            className="text-cadd-red hover:text-cadd-pink transition-colors duration-200"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        )}
                        <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherStudentsList
