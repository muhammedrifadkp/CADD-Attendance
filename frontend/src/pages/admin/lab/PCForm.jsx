import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import BackButton from '../../../components/BackButton'
import { pcAPI } from '../../../services/labAPI'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import {
  ComputerDesktopIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const PCForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    pcNumber: '',
    rowNumber: 1,
    status: 'active',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      fetchPC()
    }
  }, [id, isEdit])

  const fetchPC = async () => {
    try {
      setFetchLoading(true)
      const pcData = await pcAPI.getPC(id)

      // Extract only the fields we need for our simplified form
      setFormData({
        pcNumber: pcData.pcNumber || '',
        rowNumber: pcData.rowNumber || 1,
        status: pcData.status || 'active',
        notes: pcData.notes || ''
      })
    } catch (error) {
      console.error('Error fetching PC:', error)
      toast.error('Failed to fetch PC details')
      navigate('/admin/lab')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit) {
        await pcAPI.updatePC(id, formData)
        toast.success('PC updated successfully')
      } else {
        await pcAPI.createPC(formData)
        toast.success('PC created successfully')
      }
      navigate('/admin/lab')
    } catch (error) {
      console.error('Error saving PC:', error)
      toast.error(error.response?.data?.message || 'Failed to save PC')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cadd-purple to-cadd-pink rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {isEdit ? 'Edit PC' : 'Add New PC'}
              </h1>
              <p className="text-xl text-white/90">
                {isEdit ? 'Update PC information and specifications' : 'Register a new computer in the lab'}
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <ComputerDesktopIcon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">PC Information</h2>
            <Link
              to="/admin/lab"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Lab
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="pcNumber" className="block text-sm font-medium text-gray-700 mb-2">
                PC Number *
              </label>
              <input
                type="text"
                id="pcNumber"
                name="pcNumber"
                value={formData.pcNumber}
                onChange={handleInputChange}
                placeholder="e.g., CS-01, SS-05, MS-67"
                title="PC number format: XX-XX (e.g., CS-01, SS-05, MS-67)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-colors duration-300"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Format: XX-XX (e.g., CS-01, SS-05, MS-67)</p>
            </div>

            <div>
              <label htmlFor="rowNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Row Number *
              </label>
              <select
                id="rowNumber"
                name="rowNumber"
                value={formData.rowNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-colors duration-300"
                required
              >
                <option value={1}>Row 1</option>
                <option value={2}>Row 2</option>
                <option value={3}>Row 3</option>
                <option value={4}>Row 4</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-colors duration-300"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>



          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Additional notes about this PC..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-colors duration-300"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/lab')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-xl hover:from-cadd-pink hover:to-cadd-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
            >
              {loading ? 'Saving...' : isEdit ? 'Update PC' : 'Create PC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PCForm
