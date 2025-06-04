import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { departmentsAPI, coursesAPI, studentsAPI, batchesAPI } from '../../../services/api'
import {
  BuildingOfficeIcon,
  UserIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'

const DepartmentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [department, setDepartment] = useState(null)
  const [stats, setStats] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchDepartmentData()
  }, [id])

  const fetchDepartmentData = async () => {
    try {
      setLoading(true)
      const [deptResponse, statsResponse, coursesResponse] = await Promise.all([
        departmentsAPI.getDepartmentById(id),
        departmentsAPI.getDepartmentStats(id),
        coursesAPI.getCourses({ department: id })
      ])

      setDepartment(deptResponse.data)
      setStats(statsResponse.data.stats)
      setCourses(coursesResponse.data.courses || [])
    } catch (error) {
      console.error('Error fetching department data:', error)
      toast.error('Failed to fetch department details')
      navigate('/admin/departments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await departmentsAPI.deleteDepartment(id)
      toast.success('Department deleted successfully')
      navigate('/admin/departments')
    } catch (error) {
      console.error('Error deleting department:', error)
      toast.error(error.response?.data?.message || 'Failed to delete department')
    } finally {
      setActionLoading(false)
      setShowDeleteModal(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Department Not Found</h2>
          <Link to="/admin/departments" className="text-cadd-red hover:text-cadd-pink">
            Back to Departments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{department.name} Department</h1>
              <p className="mt-2 text-gray-600">Department overview and management</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/admin/departments/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Department
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Department Information Card */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-cadd-red to-cadd-pink px-6 py-8">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="h-10 w-10 text-white" />
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">{department.name}</h2>
                <p className="text-white/80 text-lg">{department.code}</p>
                <div className="flex items-center mt-2">
                  {department.isActive ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  {department.description && (
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-900">{department.description}</p>
                    </div>
                  )}
                  {department.establishedYear && (
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Established</p>
                        <p className="text-gray-900 font-medium">{department.establishedYear}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {department.headOfDepartment && (
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Head of Department</p>
                        <p className="text-gray-900 font-medium">{department.headOfDepartment.name}</p>
                        {department.headOfDepartment.email && (
                          <p className="text-sm text-gray-600">{department.headOfDepartment.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {department.contactInfo?.email && (
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900 font-medium">{department.contactInfo.email}</p>
                      </div>
                    </div>
                  )}
                  {department.contactInfo?.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900 font-medium">{department.contactInfo.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="space-y-4">
                  {department.location?.building && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Building</p>
                        <p className="text-gray-900 font-medium">{department.location.building}</p>
                      </div>
                    </div>
                  )}
                  {department.location?.floor && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Floor</p>
                        <p className="text-gray-900 font-medium">{department.location.floor}</p>
                      </div>
                    </div>
                  )}
                  {department.location?.roomNumbers && department.location.roomNumbers.length > 0 && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Rooms</p>
                        <p className="text-gray-900 font-medium">{department.location.roomNumbers.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-gray-900 font-medium">{formatDate(department.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeCourses || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Average Fees</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageFees ? formatCurrency(stats.averageFees) : '₹0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalFees ? formatCurrency(stats.totalFees) : '₹0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Department Courses</h3>
              <Link
                to={`/admin/courses/new?department=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
              >
                <AcademicCapIcon className="h-4 w-4 mr-2" />
                Add Course
              </Link>
            </div>
          </div>

          <div className="px-6 py-6">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No courses found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new course for this department.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{course.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>{course.duration?.value} {course.duration?.unit}</span>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        <span>{formatCurrency(course.fees?.amount || 0)}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to={`/admin/courses/${course._id}`}
                        className="text-cadd-red hover:text-cadd-pink text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Department</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete the {department.name} department? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete Department'}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DepartmentDetails
