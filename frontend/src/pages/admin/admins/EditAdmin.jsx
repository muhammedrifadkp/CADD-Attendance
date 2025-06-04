import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { adminsAPI } from '../../../services/api'
import {
  UserIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'

const EditAdmin = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    active: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchAdmin()
  }, [id])

  const fetchAdmin = async () => {
    try {
      setLoading(true)
      const response = await adminsAPI.getAdminById(id)
      const admin = response.data
      setFormData({
        name: admin.name,
        email: admin.email,
        password: '',
        active: admin.active
      })
    } catch (error) {
      console.error('Error fetching admin:', error)
      toast.error('Failed to fetch admin details')
      navigate('/admin/admins')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
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

    setSubmitting(true)
    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        active: formData.active
      }

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password
      }

      await adminsAPI.updateAdmin(id, updateData)
      toast.success('Admin updated successfully!')
      navigate(`/admin/admins/${id}`)
    } catch (error) {
      console.error('Error updating admin:', error)
      const message = error.response?.data?.message || 'Failed to update admin'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Edit Admin</h1>
            <p className="mt-2 text-gray-600">Update admin information and settings</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-cadd-red to-cadd-pink px-6 py-8">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-white">Admin Information</h2>
                <p className="text-white/80">Update admin details below</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter admin's full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter admin's email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Leave blank to keep the current password. Minimum 8 characters if changing.
              </p>
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="active"
                    value="true"
                    checked={formData.active === true}
                    onChange={() => setFormData(prev => ({ ...prev, active: true }))}
                    className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300"
                  />
                  <span className="ml-2 flex items-center text-sm text-gray-700">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    Active
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="active"
                    value="false"
                    checked={formData.active === false}
                    onChange={() => setFormData(prev => ({ ...prev, active: false }))}
                    className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300"
                  />
                  <span className="ml-2 flex items-center text-sm text-gray-700">
                    <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                    Inactive
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/admin/admins/${id}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Admin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditAdmin
