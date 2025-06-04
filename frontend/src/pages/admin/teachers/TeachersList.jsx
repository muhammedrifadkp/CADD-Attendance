import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { teachersAPI } from '../../../services/api'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { showConfirm } from '../../../utils/popup'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const TeachersList = () => {
  const [teachers, setTeachers] = useState([])
  const [filteredTeachers, setFilteredTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        const res = await teachersAPI.getTeachers()
        setTeachers(res.data)

        // Calculate stats
        const total = res.data.length
        const active = res.data.filter(teacher => teacher.active).length
        const inactive = total - active

        setStats({ total, active, inactive })
      } catch (error) {
        console.error('Error fetching teachers:', error)
        toast.error('Failed to load teachers')
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [refreshKey])

  // Filter teachers based on search and filters
  useEffect(() => {
    let filtered = [...teachers]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(teacher =>
        statusFilter === 'active' ? teacher.active : !teacher.active
      )
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(teacher =>
        teacher.department?._id === departmentFilter
      )
    }

    setFilteredTeachers(filtered)
  }, [teachers, searchTerm, statusFilter, departmentFilter])

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this teacher?', 'Delete Teacher')
    if (confirmed) {
      try {
        await teachersAPI.deleteTeacher(id)
        toast.success('Teacher deleted successfully')
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        toast.error('Failed to delete teacher')
      }
    }
  }

  const handleResetPassword = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to reset this teacher\'s password?', 'Reset Password')
    if (confirmed) {
      try {
        const res = await teachersAPI.resetPassword(id)
        toast.success(`Password reset successfully. New password: ${res.data.newPassword}`)
      } catch (error) {
        toast.error('Failed to reset password')
      }
    }
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
                <h1 className="text-4xl font-bold text-white mb-2">Teachers Management</h1>
                <p className="text-gray-300 text-lg">Manage teaching staff and their information</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{stats.total}</div>
                  <div className="text-gray-300 text-sm">Total Teachers</div>
                </div>
                <Link
                  to="/admin/teachers/new"
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Teacher
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Teachers</p>
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
                <p className="text-sm text-gray-500">Active Teachers</p>
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
                <p className="text-sm text-gray-500">Inactive Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Teachers
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
                  placeholder="Search by name, email, employee ID, or department..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
                >
                  <option value="all">All Teachers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTeachers.length} of {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
            </span>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDepartmentFilter('all')
                }}
                className="text-cadd-red hover:text-cadd-pink font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Teachers List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No teachers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {teachers.length === 0
                ? "Get started by creating a new teacher."
                : "Try adjusting your search or filter criteria."}
            </p>
            {teachers.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/admin/teachers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Teacher
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
            <div key={teacher._id} className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              {/* Clickable Header Section */}
              <Link to={`/admin/teachers/${teacher._id}`} className="block">
                <div className="px-6 py-6 bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-cadd-red to-cadd-pink flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <span className="text-white font-bold text-xl">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-5 flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-cadd-red transition-colors duration-300">
                        {teacher.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">{teacher.email}</p>
                      <div className="mt-2 flex items-center space-x-3">
                        <span className={`px-3 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${teacher.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {teacher.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-3 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${teacher.role === 'admin'
                          ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                          }`}>
                          {teacher.role === 'admin' ? 'Administrator' : 'Teacher'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Click to view indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                      Last login: {teacher.lastLogin ? formatDateSimple(teacher.lastLogin) : 'Never'}
                    </div>
                    <div className="flex items-center text-cadd-red opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-xs font-medium mr-1">View Details</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Teacher Information */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="space-y-3">
                  {teacher.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{teacher.department.name}</span>
                    </div>
                  )}
                  {teacher.employeeId && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>ID: {teacher.employeeId}</span>
                    </div>
                  )}
                  {teacher.dateOfJoining && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Joined: {formatDateSimple(teacher.dateOfJoining)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {teacher.specialization || 'General Teaching'}
                  </span>
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/teachers/${teacher._id}`}
                      className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/admin/teachers/${teacher._id}/edit`}
                      className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Edit Teacher"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleResetPassword(teacher._id)
                      }}
                      className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      title="Reset Password"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(teacher._id)
                      }}
                      className="inline-flex items-center p-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      title="Delete Teacher"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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

export default TeachersList
