import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { studentsAPI } from '../../../services/api'
import { toast } from 'react-toastify'

const StudentForm = () => {
  const { id: batchId, studentId } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(studentId)

  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    contactInfo: {
      email: '',
      phone: '',
      address: '',
    },
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)

  useEffect(() => {
    const fetchStudent = async () => {
      if (isEditMode) {
        try {
          setFetchLoading(true)
          const res = await studentsAPI.getStudent(studentId)
          const { name, rollNo, contactInfo, isActive } = res.data
          setFormData({
            name,
            rollNo,
            contactInfo: {
              email: contactInfo?.email || '',
              phone: contactInfo?.phone || '',
              address: contactInfo?.address || '',
            },
            isActive,
          })
        } catch (error) {
          toast.error('Failed to fetch student details')
          navigate(`/batches/${batchId}/students`)
        } finally {
          setFetchLoading(false)
        }
      }
    }

    fetchStudent()
  }, [batchId, studentId, isEditMode, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('contactInfo.')) {
      const contactField = name.split('.')[1]
      setFormData({
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          [contactField]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditMode) {
        await studentsAPI.updateStudent(studentId, formData)
        toast.success('Student updated successfully')
      } else {
        await studentsAPI.createStudent({
          ...formData,
          batchId,
        })
        toast.success('Student created successfully')
      }
      navigate(`/batches/${batchId}/students`)
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update student' : 'Failed to create student')
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
          {isEditMode ? 'Edit Student' : 'Add New Student'}
        </h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="rollNo" className="form-label">
                Roll Number
              </label>
              <input
                type="text"
                name="rollNo"
                id="rollNo"
                required
                className="form-input"
                value={formData.rollNo}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="contactInfo.email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                name="contactInfo.email"
                id="contactInfo.email"
                className="form-input"
                value={formData.contactInfo.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="contactInfo.phone" className="form-label">
                Phone Number
              </label>
              <input
                type="text"
                name="contactInfo.phone"
                id="contactInfo.phone"
                className="form-input"
                value={formData.contactInfo.phone}
                onChange={handleChange}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="contactInfo.address" className="form-label">
                Address
              </label>
              <textarea
                name="contactInfo.address"
                id="contactInfo.address"
                rows="3"
                className="form-input"
                value={formData.contactInfo.address}
                onChange={handleChange}
              ></textarea>
            </div>

            {isEditMode && (
              <div className="flex items-center h-full pt-6">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active Student
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <Link
              to={`/batches/${batchId}/students`}
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

export default StudentForm
