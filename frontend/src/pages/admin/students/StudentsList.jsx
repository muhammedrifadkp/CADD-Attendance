import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { studentsAPI, departmentsAPI, coursesAPI, batchesAPI } from '../../../services/api'
import {
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
  ChartBarIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'
import { showConfirm } from '../../../utils/popup'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const StudentsList = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalFees: 0,
    paidFees: 0
  })

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [studentsRes, departmentsRes, coursesRes, batchesRes] = await Promise.all([
        studentsAPI.getStudents(),
        departmentsAPI.getDepartments(),
        coursesAPI.getCourses(),
        batchesAPI.getBatches()
      ])

      // Ensure data is always an array - handle different response structures
      const studentsData = Array.isArray(studentsRes.data?.students) ? studentsRes.data.students :
                          Array.isArray(studentsRes.data) ? studentsRes.data : []
      const departmentsData = Array.isArray(departmentsRes.data) ? departmentsRes.data : []
      const coursesData = Array.isArray(coursesRes.data?.courses) ? coursesRes.data.courses :
                         Array.isArray(coursesRes.data) ? coursesRes.data : []
      const batchesData = Array.isArray(batchesRes.data) ? batchesRes.data : []

      setStudents(studentsData)
      setDepartments(departmentsData)
      setCourses(coursesData)
      setBatches(batchesData)

      // Calculate stats
      const total = studentsData.length
      const active = studentsData.filter(student => student.isActive).length
      const inactive = total - active
      const totalFees = studentsData.reduce((sum, student) => sum + (student.totalFees || 0), 0)
      const paidFees = studentsData.reduce((sum, student) => sum + (student.feesPaid || 0), 0)

      setStats({ total, active, inactive, totalFees, paidFees })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load students')
      // Set empty arrays on error to prevent map errors
      setStudents([])
      setDepartments([])
      setCourses([])
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  // Filter students based on search and filters
  useEffect(() => {
    let filtered = [...students]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student =>
        statusFilter === 'active' ? student.isActive : !student.isActive
      )
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(student =>
        student.department?._id === departmentFilter
      )
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(student =>
        student.course?._id === courseFilter
      )
    }

    // Batch filter
    if (batchFilter !== 'all') {
      filtered = filtered.filter(student =>
        student.batch?._id === batchFilter
      )
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(student =>
        student.paymentStatus === paymentFilter
      )
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, statusFilter, departmentFilter, courseFilter, batchFilter, paymentFilter])

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this student? This action cannot be undone.', 'Delete Student')
    if (confirmed) {
      try {
        await studentsAPI.deleteStudent(id)
        toast.success('Student deleted successfully')
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        toast.error('Failed to delete student')
      }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10 pointer-events-none"></div>
          <div className="relative px-8 py-12 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Students Management</h1>
                <p className="text-gray-300 text-lg">Manage all students across departments and courses</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{stats.total}</div>
                  <div className="text-gray-300 text-sm">Total Students</div>
                </div>
                <Link
                  to="/admin/students/new"
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Student
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Inactive Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CurrencyRupeeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalFees)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Fees Collected</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.paidFees)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
                  placeholder="Search by name, email, phone, roll number..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                id="department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
              >
                <option value="all">All Departments</option>
                {departments && departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                id="course"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
              >
                <option value="all">All Courses</option>
                {courses && courses.map(course => (
                  <option key={course._id} value={course._id}>{course.name}</option>
                ))}
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-2">
                Payment
              </label>
              <select
                id="payment"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
            </span>
            {(searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' || courseFilter !== 'all' || batchFilter !== 'all' || paymentFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDepartmentFilter('all')
                  setCourseFilter('all')
                  setBatchFilter('all')
                  setPaymentFilter('all')
                }}
                className="text-cadd-red hover:text-cadd-pink font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
        </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {students.length === 0
                ? "Get started by adding a new student."
                : "Try adjusting your search or filter criteria."}
            </p>
            {students.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/admin/students/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Student
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudents && filteredStudents.map((student) => (
              <div key={student._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
                {/* Student Header */}
                <div className="bg-gradient-to-r from-cadd-red to-cadd-pink px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white truncate">{student.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm mt-1">
                    Roll: {student.rollNo || student.rollNumber || 'N/A'}
                  </p>
                </div>

                {/* Student Information */}
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    {student.department && (
                      <div className="flex items-center text-sm text-gray-600">
                        <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{student.department.name || student.department}</span>
                      </div>
                    )}
                    {student.course && (
                      <div className="flex items-center text-sm text-gray-600">
                        <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{student.course.name || student.course}</span>
                      </div>
                    )}
                    {student.batch && (
                      <div className="flex items-center text-sm text-gray-600">
                        <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{student.batch.name || student.batch}</span>
                      </div>
                    )}
                    {(student.totalFees || student.feesPaid) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyRupeeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {formatCurrency(student.feesPaid || 0)} / {formatCurrency(student.totalFees || 0)}
                        </span>
                      </div>
                    )}
                    {student.paymentStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Payment:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          student.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          student.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {student.paymentStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/students/${student._id}`}
                        className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/admin/students/${student._id}/edit`}
                        className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        title="Edit Student"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        title="Delete Student"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(student.createdAt || student.admissionDate) ?
                        formatDateSimple(student.createdAt || student.admissionDate) :
                        'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentsList
