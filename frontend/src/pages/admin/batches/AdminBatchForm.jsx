import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { batchesAPI, coursesAPI, departmentsAPI } from '../../../services/api'
import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'

const AdminBatchForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEditMode = Boolean(id)

  // Get course from URL params if creating from course page
  const urlParams = new URLSearchParams(location.search)
  const preselectedCourse = urlParams.get('course')

  const [formData, setFormData] = useState({
    name: '',
    course: preselectedCourse || '',
    academicYear: new Date().getFullYear().toString(),
    section: '',
    timing: '',
    startDate: '',
    maxStudents: 20
  })

  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const timingOptions = [
    '09:00 AM - 10:30 AM',
    '10:30 AM - 12:00 PM',
    '12:00 PM - 01:30 PM',
    '02:00 PM - 03:30 PM',
    '03:30 PM - 05:00 PM'
  ]

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (isEditMode && id) {
      fetchBatchData()
    }
  }, [id, isEditMode])

  useEffect(() => {
    // Filter courses by selected department
    if (selectedDepartment) {
      const filtered = courses.filter(course => course.department?._id === selectedDepartment)
      setFilteredCourses(filtered)
    } else {
      setFilteredCourses(courses)
    }
  }, [selectedDepartment, courses])

  const fetchInitialData = async () => {
    try {
      setFetchLoading(true)
      const [coursesRes, departmentsRes] = await Promise.all([
        coursesAPI.getCourses(),
        departmentsAPI.getDepartments()
      ])

      setCourses(coursesRes.data)
      setDepartments(departmentsRes.data)
      setFilteredCourses(coursesRes.data)

      // If preselected course, set the department filter
      if (preselectedCourse) {
        const selectedCourse = coursesRes.data.find(c => c._id === preselectedCourse)
        if (selectedCourse?.department) {
          setSelectedDepartment(selectedCourse.department._id)
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Failed to load form data')
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchBatchData = async () => {
    try {
      setFetchLoading(true)
      const res = await batchesAPI.getBatchById(id)
      const batch = res.data

      setFormData({
        name: batch.name,
        course: batch.course?._id || '',
        academicYear: batch.academicYear,
        section: batch.section,
        timing: batch.timing,
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
        maxStudents: batch.maxStudents || 20
      })

      // Set department filter based on course
      if (batch.course?.department) {
        setSelectedDepartment(batch.course.department._id)
      }
    } catch (error) {
      console.error('Error fetching batch:', error)
      toast.error('Failed to load batch data')
      navigate('/admin/batches')
    } finally {
      setFetchLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Batch name is required'
    }

    if (!formData.course) {
      newErrors.course = 'Course is required'
    }

    if (!formData.academicYear.trim()) {
      newErrors.academicYear = 'Academic year is required'
    }

    if (!formData.section.trim()) {
      newErrors.section = 'Section is required'
    }

    if (!formData.timing) {
      newErrors.timing = 'Timing is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!formData.maxStudents || formData.maxStudents < 1) {
      newErrors.maxStudents = 'Max students must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (isEditMode) {
        await batchesAPI.updateBatch(id, formData)
        toast.success('Batch updated successfully')
      } else {
        await batchesAPI.createBatch(formData)
        toast.success('Batch created successfully')
      }
      navigate('/admin/batches')
    } catch (error) {
      console.error('Error saving batch:', error)
      toast.error(isEditMode ? 'Failed to update batch' : 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Batch' : 'Create New Batch'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditMode ? 'Update batch information' : 'Add a new batch to the system'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-cadd-red to-cadd-pink">
            <h2 className="text-xl font-bold text-white">Batch Information</h2>
            <p className="text-white/80">Fill in the details below</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            {/* Batch Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter batch name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Department Filter */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course */}
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="course"
                  value={formData.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                    errors.course ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a course</option>
                  {filteredCourses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.department?.name})
                    </option>
                  ))}
                </select>
              </div>
              {errors.course && (
                <p className="mt-1 text-sm text-red-600">{errors.course}</p>
              )}
            </div>

            {/* Academic Year and Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                      errors.academicYear ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 2024"
                  />
                </div>
                {errors.academicYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>
                )}
              </div>

              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                  Section *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="section"
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                      errors.section ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., A, B, Morning"
                  />
                </div>
                {errors.section && (
                  <p className="mt-1 text-sm text-red-600">{errors.section}</p>
                )}
              </div>
            </div>

            {/* Timing and Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="timing" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Timing *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="timing"
                    value={formData.timing}
                    onChange={(e) => handleInputChange('timing', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                      errors.timing ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select timing</option>
                    {timingOptions.map(timing => (
                      <option key={timing} value={timing}>{timing}</option>
                    ))}
                  </select>
                </div>
                {errors.timing && (
                  <p className="mt-1 text-sm text-red-600">{errors.timing}</p>
                )}
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                      errors.startDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>
            </div>

            {/* Max Students */}
            <div>
              <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Students *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="maxStudents"
                  min="1"
                  max="50"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || '')}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                    errors.maxStudents ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter maximum number of students"
                />
              </div>
              {errors.maxStudents && (
                <p className="mt-1 text-sm text-red-600">{errors.maxStudents}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Maximum number of students allowed in this batch (1-50)
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/batches')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  isEditMode ? 'Update Batch' : 'Create Batch'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminBatchForm
