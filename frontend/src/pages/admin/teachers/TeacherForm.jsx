import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { teachersAPI, departmentsAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  AcademicCapIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'

const TeacherForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    department: '',
    phone: '',
    address: '',
    dateOfJoining: '',
    qualification: '',
    experience: '',
    specialization: '',
    employeeId: '',
    active: true,
  })
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState('')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchDepartments()
    if (isEditMode) {
      fetchTeacher()
    }
  }, [id, isEditMode])

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments({ active: true })
      setDepartments(response.data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to load departments')
    }
  }

  const fetchTeacher = async () => {
    try {
      setFetchLoading(true)
      const res = await teachersAPI.getTeacher(id)
      const teacher = res.data
      setFormData({
        name: teacher.name || '',
        email: teacher.email || '',
        password: '',
        role: teacher.role || 'teacher',
        department: teacher.department?._id || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        dateOfJoining: teacher.dateOfJoining ? teacher.dateOfJoining.split('T')[0] : '',
        qualification: teacher.qualification || '',
        experience: teacher.experience || '',
        specialization: teacher.specialization || '',
        employeeId: teacher.employeeId || '',
        active: teacher.active !== false,
      })
    } catch (error) {
      toast.error('Failed to fetch teacher details')
      navigate('/admin/teachers')
    } finally {
      setFetchLoading(false)
    }
  }

  // Department code mapping for Employee ID preview
  const DEPARTMENT_CODE_MAP = {
    'CADD': 'CADD',
    'LIVEWIRE': 'LW',
    'DREAMZONE': 'DZ',
    'SYNERGY': 'SY'
  }

  const generateEmployeeIdPreview = (departmentId) => {
    if (!departmentId || isEditMode) return ''

    const selectedDept = departments.find(dept => dept._id === departmentId)
    if (!selectedDept) return ''

    const deptCode = DEPARTMENT_CODE_MAP[selectedDept.name]
    if (!deptCode) return ''

    return `${deptCode}-XXX (Auto-generated)`
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })

    // Generate Employee ID preview when department changes
    if (name === 'department' && !isEditMode) {
      setGeneratedEmployeeId(generateEmployeeIdPreview(value))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!isEditMode && !formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.department) {
      newErrors.department = 'Please select a department'
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
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
        // Remove password if it's empty (not changing password)
        const dataToSubmit = { ...formData }
        if (!dataToSubmit.password) {
          delete dataToSubmit.password
        }

        await teachersAPI.updateTeacher(id, dataToSubmit)
        toast.success('Teacher updated successfully!')
      } else {
        const response = await teachersAPI.createTeacher(formData)

        // Check if email was sent successfully
        if (response.data.emailSent) {
          toast.success('Teacher created successfully and welcome email sent!')
          if (response.data.emailPreviewUrl) {
            console.log('Email preview URL:', response.data.emailPreviewUrl)
          }
        } else {
          toast.success('Teacher created successfully!')
          toast.info('Welcome email could not be sent. Please provide the teacher with their login credentials manually.')
          if (response.data.emailMessage) {
            console.warn('Email error:', response.data.emailMessage)
          }
        }
      }
      navigate('/admin/teachers')
    } catch (error) {
      console.error('Error saving teacher:', error)
      toast.error(error.response?.data?.message || (isEditMode ? 'Failed to update teacher' : 'Failed to create teacher'))
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
            {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update teacher information and department assignment' : 'Create a new teacher account with department assignment'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-cadd-red to-cadd-pink">
          <div className="flex items-center space-x-3">
            <UserIcon className="h-6 w-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Teacher Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

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
                  Employee ID {!isEditMode && <span className="text-xs text-gray-500">(Auto-generated)</span>}
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={isEditMode ? formData.employeeId : (generatedEmployeeId || 'Select department first')}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder={isEditMode ? formData.employeeId : "Will be auto-generated"}
                />
                {!isEditMode && formData.department && (
                  <p className="text-xs text-blue-600 mt-1">
                    Employee ID will be automatically generated based on selected department
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="teacher@caddcentre.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                {!isEditMode && (
                  <p className="text-xs text-green-600 mt-1">
                    📧 Login credentials will be automatically sent to this email address
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhoneIcon className="h-4 w-4 inline mr-1" />
                  Phone Number
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

          {/* Department & Role */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Department & Role</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Date of Joining
                </label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Professional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="e.g., B.Tech, M.Tech, Diploma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Specialization
              </label>
              <textarea
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                placeholder="Areas of expertise, software skills, etc."
              />
            </div>
          </div>

          {/* Security */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Security & Access</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LockClosedIcon className="h-4 w-4 inline mr-1" />
                  {isEditMode ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 8 characters"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                <p className="text-gray-500 text-sm mt-1">
                  {isEditMode ? 'Leave blank to keep current password' : 'Minimum 8 characters required'}
                </p>
              </div>

              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="active"
                    id="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">
                    <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    Active Account
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              to="/admin/teachers"
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
              <span>{isEditMode ? 'Update Teacher' : 'Create Teacher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherForm
