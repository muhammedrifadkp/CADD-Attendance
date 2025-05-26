import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { batchesAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { ClockIcon } from '@heroicons/react/24/outline'

const BatchForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  // Institute time slots (same as lab time slots)
  const timeSlots = [
    { id: '09:00-10:30', label: '09:00 AM - 10:30 AM', icon: '🌅' },
    { id: '10:30-12:00', label: '10:30 AM - 12:00 PM', icon: '☀️' },
    { id: '12:00-13:30', label: '12:00 PM - 01:30 PM', icon: '🌞' },
    { id: '14:00-15:30', label: '02:00 PM - 03:30 PM', icon: '🌤️' },
    { id: '15:30-17:00', label: '03:30 PM - 05:00 PM', icon: '🌇' },
  ]

  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    section: '',
    timing: '',
    isArchived: false,
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)

  useEffect(() => {
    const fetchBatch = async () => {
      if (isEditMode) {
        try {
          setFetchLoading(true)
          const res = await batchesAPI.getBatch(id)
          const { name, academicYear, section, timing, isArchived } = res.data
          setFormData({ name, academicYear, section, timing: timing || '', isArchived })
        } catch (error) {
          toast.error('Failed to fetch batch details')
          navigate('/batches')
        } finally {
          setFetchLoading(false)
        }
      }
    }

    fetchBatch()
  }, [id, isEditMode, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditMode) {
        await batchesAPI.updateBatch(id, formData)
        toast.success('Batch updated successfully')
      } else {
        await batchesAPI.createBatch(formData)
        toast.success('Batch created successfully')
      }
      navigate('/batches')
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update batch' : 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Batch' : 'Create New Batch'}
        </h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="form-label">
                Batch Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Computer Science 101"
              />
            </div>

            <div>
              <label htmlFor="academicYear" className="form-label">
                Academic Year
              </label>
              <input
                type="text"
                name="academicYear"
                id="academicYear"
                required
                className="form-input"
                value={formData.academicYear}
                onChange={handleChange}
                placeholder="e.g. 2023-2024"
              />
            </div>

            <div>
              <label htmlFor="section" className="form-label">
                Section
              </label>
              <input
                type="text"
                name="section"
                id="section"
                required
                className="form-input"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g. A"
              />
            </div>

            {/* Batch Timing Selection */}
            <div className="sm:col-span-2">
              <label className="form-label flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                Batch Timing
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Select the time slot when this batch will have classes. This matches the institute's lab time slots.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {timeSlots.map((slot) => (
                  <label
                    key={slot.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200 ${formData.timing === slot.id
                        ? 'border-cadd-red bg-red-50 ring-2 ring-cadd-red'
                        : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="timing"
                      value={slot.id}
                      checked={formData.timing === slot.id}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{slot.icon}</span>
                      <div>
                        <div className={`text-sm font-medium ${formData.timing === slot.id ? 'text-cadd-red' : 'text-gray-900'
                          }`}>
                          {slot.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {slot.id === '12:00-13:30' ? 'Lunch Break Included' : 'Regular Class Time'}
                        </div>
                      </div>
                    </div>
                    {formData.timing === slot.id && (
                      <div className="absolute -inset-px rounded-lg border-2 border-cadd-red pointer-events-none" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {isEditMode && (
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    id="isArchived"
                    name="isArchived"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isArchived}
                    onChange={handleChange}
                  />
                  <label htmlFor="isArchived" className="ml-2 block text-sm text-gray-900">
                    Archive this batch (read-only mode)
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Archived batches cannot be modified, but can still be viewed for reference.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <Link
              to="/batches"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BatchForm
