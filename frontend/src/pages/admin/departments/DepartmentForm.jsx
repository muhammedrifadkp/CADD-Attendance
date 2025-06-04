import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { departmentsAPI, teachersAPI } from '../../../services/api'
import BackButton from '../../../components/BackButton'

const DepartmentForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
    establishedYear: new Date().getFullYear(),
    contactInfo: {
      email: '',
      phone: '',
      extension: ''
    },
    location: {
      building: '',
      floor: '',
      roomNumbers: []
    },
    isActive: true
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchTeachers()
    if (isEdit) {
      fetchDepartment()
    }
  }, [id])

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getTeachers()
      setTeachers(response.data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const fetchDepartment = async () => {
    try {
      setLoading(true)
      const response = await departmentsAPI.getDepartmentById(id)
      const dept = response.data

      setFormData({
        name: dept.name || '',
        code: dept.code || '',
        description: dept.description || '',
        headOfDepartment: dept.headOfDepartment?._id || '',
        establishedYear: dept.establishedYear || new Date().getFullYear(),
        contactInfo: {
          email: dept.contactInfo?.email || '',
          phone: dept.contactInfo?.phone || '',
          extension: dept.contactInfo?.extension || ''
        },
        location: {
          building: dept.location?.building || '',
          floor: dept.location?.floor || '',
          roomNumbers: dept.location?.roomNumbers || []
        },
        isActive: dept.isActive !== false
      })
    } catch (error) {
      console.error('Error fetching department:', error)
      toast.error('Failed to load department details')
      navigate('/admin/departments')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required'
    } else if (!['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'].includes(formData.name.toUpperCase())) {
      newErrors.name = 'Department name must be one of: CADD, LIVEWIRE, DREAMZONE, SYNERGY'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required'
    } else if (formData.code.length < 2 || formData.code.length > 10) {
      newErrors.code = 'Code must be between 2-10 characters'
    }

    if (formData.establishedYear < 1900 || formData.establishedYear > new Date().getFullYear()) {
      newErrors.establishedYear = 'Please enter a valid year'
    }

    if (formData.contactInfo.email && !/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
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

    try {
      setLoading(true)

      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        headOfDepartment: formData.headOfDepartment || undefined
      }

      if (isEdit) {
        await departmentsAPI.updateDepartment(id, submitData)
        toast.success('Department updated successfully!')
      } else {
        await departmentsAPI.createDepartment(submitData)
        toast.success('Department created successfully!')
      }

      navigate('/admin/departments')
    } catch (error) {
      console.error('Error saving department:', error)
      toast.error(error.response?.data?.message || 'Failed to save department')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }

    // Clear error when user starts typing
    if (errors[name] || errors[name.split('.')[1]]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        [name.split('.')[1]]: ''
      }))
    }
  }

  if (loading && isEdit) {
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
            {isEdit ? 'Edit Department' : 'Add New Department'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update department information' : 'Create a new department for CDC'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-cadd-red to-cadd-pink">
          <div className="flex items-center space-x-3">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Department Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                Department Name *
              </label>
              <select
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Department</option>
                <option value="CADD">CADD - Computer Aided Design & Drafting</option>
                <option value="LIVEWIRE">LIVEWIRE - Electronics & Electrical</option>
                <option value="DREAMZONE">DREAMZONE - Creative Design</option>
                <option value="SYNERGY">SYNERGY - Integrated Technology</option>
              </select>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CodeBracketIcon className="h-4 w-4 inline mr-1" />
                Department Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., CADD"
                maxLength="10"
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
              placeholder="Brief description of the department..."
            />
          </div>

          {/* Head of Department and Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Head of Department
              </label>
              <select
                name="headOfDepartment"
                value={formData.headOfDepartment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
              >
                <option value="">Select a teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Established Year
              </label>
              <input
                type="number"
                name="establishedYear"
                value={formData.establishedYear}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                  errors.establishedYear ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.establishedYear && <p className="text-red-500 text-sm mt-1">{errors.establishedYear}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="department@caddcentre.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhoneIcon className="h-4 w-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Address
              </label>
              <textarea
                name="contactInfo.address"
                value={formData.contactInfo.address}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                placeholder="Department address..."
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Building
                </label>
                <input
                  type="text"
                  name="location.building"
                  value={formData.location.building}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="e.g., Main Building"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Floor
                </label>
                <input
                  type="text"
                  name="location.floor"
                  value={formData.location.floor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="e.g., 2nd Floor"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Room Numbers (comma-separated)
              </label>
              <input
                type="text"
                name="location.roomNumbers"
                value={formData.location.roomNumbers.join(', ')}
                onChange={(e) => {
                  const rooms = e.target.value.split(',').map(room => room.trim()).filter(Boolean);
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      roomNumbers: rooms
                    }
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                placeholder="e.g., 201, 202, 203"
              />
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                Department is active
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/departments')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Cancel</span>
            </button>
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
              <span>{isEdit ? 'Update Department' : 'Create Department'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DepartmentForm
