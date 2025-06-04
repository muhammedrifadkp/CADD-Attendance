import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { studentsAPI, departmentsAPI, coursesAPI, batchesAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  AcademicCapIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'

const StudentForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    guardianName: '',
    guardianPhone: '',
    department: '',
    course: '',
    batch: '',
    rollNumber: '',
    admissionDate: '',
    feesPaid: 0,
    totalFees: 0,
    paymentStatus: 'pending',
    emergencyContact: '',
    qualification: '',
    isActive: true,
  })

  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)
  const [errors, setErrors] = useState({})

  const genderOptions = ['Male', 'Female', 'Other']
  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' }
  ]

  useEffect(() => {
    fetchDepartments()
    if (isEditMode) {
      fetchStudent()
    }
  }, [id, isEditMode])

  useEffect(() => {
    if (formData.department) {
      fetchCourses(formData.department)
    } else {
      setCourses([])
      setBatches([])
    }
  }, [formData.department])

  useEffect(() => {
    if (formData.course) {
      fetchBatches(formData.course)
    } else {
      setBatches([])
    }
  }, [formData.course])

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments({ active: true })
      setDepartments(response.data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to load departments')
    }
  }

  const fetchCourses = async (departmentId) => {
    try {
      const response = await coursesAPI.getCoursesByDepartment(departmentId, { active: true })
      setCourses(response.data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    }
  }

  const fetchBatches = async (courseId) => {
    try {
      const response = await batchesAPI.getBatchesByCourse(courseId, { active: true })
      setBatches(response.data || [])
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast.error('Failed to load batches')
    }
  }

  const fetchStudent = async () => {
    try {
      setFetchLoading(true)
      const res = await studentsAPI.getStudent(id)
      const student = res.data

      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
        gender: student.gender || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        department: student.department?._id || '',
        course: student.course?._id || '',
        batch: student.batch?._id || '',
        rollNumber: student.rollNumber || '',
        admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
        feesPaid: student.feesPaid || 0,
        totalFees: student.totalFees || 0,
        paymentStatus: student.paymentStatus || 'pending',
        emergencyContact: student.emergencyContact || '',
        qualification: student.qualification || '',
        isActive: student.isActive !== false,
      })
    } catch (error) {
      toast.error('Failed to fetch student details')
      navigate('/admin/students')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked :
              type === 'number' ? Number(value) : value,
    })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Reset dependent fields when parent changes
    if (name === 'department') {
      setFormData(prev => ({ ...prev, course: '', batch: '' }))
    } else if (name === 'course') {
      setFormData(prev => ({ ...prev, batch: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.department) {
      newErrors.department = 'Please select a department'
    }

    if (!formData.course) {
      newErrors.course = 'Please select a course'
    }

    if (!formData.batch) {
      newErrors.batch = 'Please select a batch'
    }

    if (formData.guardianPhone && !/^\+?[\d\s\-\(\)]+$/.test(formData.guardianPhone)) {
      newErrors.guardianPhone = 'Please enter a valid guardian phone number'
    }

    if (formData.emergencyContact && !/^\+?[\d\s\-\(\)]+$/.test(formData.emergencyContact)) {
      newErrors.emergencyContact = 'Please enter a valid emergency contact number'
    }

    if (formData.feesPaid < 0) {
      newErrors.feesPaid = 'Fees paid cannot be negative'
    }

    if (formData.totalFees < 0) {
      newErrors.totalFees = 'Total fees cannot be negative'
    }

    if (formData.feesPaid > formData.totalFees) {
      newErrors.feesPaid = 'Fees paid cannot exceed total fees'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      if (isEditMode) {
        await studentsAPI.updateStudent(id, formData)
        toast.success('Student updated successfully!')
      } else {
        await studentsAPI.createStudent(formData)
        toast.success('Student created successfully!')
      }
      navigate('/admin/students')
    } catch (error) {
      console.error('Error saving student:', error)
      toast.error(error.response?.data?.message || (isEditMode ? 'Failed to update student' : 'Failed to create student'))
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update student information and enrollment details' : 'Create a new student enrollment with department and course assignment'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-cadd-red to-cadd-pink">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-6 w-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Student Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <IdentificationIcon className="h-4 w-4 inline mr-1" />
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="e.g., STU001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="student@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhoneIcon className="h-4 w-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="e.g., 12th, Diploma, B.Tech"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                placeholder="Enter complete address"
              />
            </div>
          </div>

          {/* Guardian Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Guardian Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="Parent/Guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhoneIcon className="h-4 w-4 inline mr-1" />
                  Guardian Phone
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.guardianPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.guardianPhone && <p className="text-red-500 text-sm mt-1">{errors.guardianPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.emergencyContact ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.emergencyContact && <p className="text-red-500 text-sm mt-1">{errors.emergencyContact}</p>}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Academic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                  Course *
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  disabled={!formData.department}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.course ? 'border-red-500' : 'border-gray-300'
                  } ${!formData.department ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
                {errors.course && <p className="text-red-500 text-sm mt-1">{errors.course}</p>}
                {!formData.department && <p className="text-gray-500 text-sm mt-1">Select department first</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserGroupIcon className="h-4 w-4 inline mr-1" />
                  Batch *
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  disabled={!formData.course}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.batch ? 'border-red-500' : 'border-gray-300'
                  } ${!formData.course ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Batch</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'No date'})
                    </option>
                  ))}
                </select>
                {errors.batch && <p className="text-red-500 text-sm mt-1">{errors.batch}</p>}
                {!formData.course && <p className="text-gray-500 text-sm mt-1">Select course first</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Admission Date
              </label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
              />
            </div>
          </div>

          {/* Fee Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Fee Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyRupeeIcon className="h-4 w-4 inline mr-1" />
                  Total Fees (₹)
                </label>
                <input
                  type="number"
                  name="totalFees"
                  value={formData.totalFees}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.totalFees ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.totalFees && <p className="text-red-500 text-sm mt-1">{errors.totalFees}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fees Paid (₹)
                </label>
                <input
                  type="number"
                  name="feesPaid"
                  value={formData.feesPaid}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.feesPaid ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.feesPaid && <p className="text-red-500 text-sm mt-1">{errors.feesPaid}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                >
                  {paymentStatusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.totalFees > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Fee Progress:</span>
                  <span className="font-semibold">
                    ₹{formData.feesPaid.toLocaleString()} / ₹{formData.totalFees.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cadd-red to-cadd-pink h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((formData.feesPaid / formData.totalFees) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {formData.totalFees > 0 ? Math.round((formData.feesPaid / formData.totalFees) * 100) : 0}% completed
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Status</h3>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                Active Student
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              to="/admin/students"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Cancel</span>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              <span>{isEditMode ? 'Update Student' : 'Create Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentForm
