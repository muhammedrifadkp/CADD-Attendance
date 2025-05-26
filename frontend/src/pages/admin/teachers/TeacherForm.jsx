import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { teachersAPI } from '../../../services/api'
import { toast } from 'react-toastify'

const TeacherForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    active: true,
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)

  useEffect(() => {
    const fetchTeacher = async () => {
      if (isEditMode) {
        try {
          setFetchLoading(true)
          const res = await teachersAPI.getTeacher(id)
          const { name, email, role, active } = res.data
          setFormData({ name, email, password: '', role: role || 'teacher', active })
        } catch (error) {
          toast.error('Failed to fetch teacher details')
          navigate('/admin/teachers')
        } finally {
          setFetchLoading(false)
        }
      }
    }

    fetchTeacher()
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
        // Remove password if it's empty (not changing password)
        const dataToSubmit = { ...formData }
        if (!dataToSubmit.password) {
          delete dataToSubmit.password
        }

        await teachersAPI.updateTeacher(id, dataToSubmit)
        toast.success('Teacher updated successfully')
      } else {
        await teachersAPI.createTeacher(formData)
        toast.success('Teacher created successfully')
      }
      navigate('/admin/teachers')
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update teacher' : 'Failed to create teacher')
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
          {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
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
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                name="role"
                id="role"
                className="form-input"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="teacher">Teacher</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Teachers can manage batches, students, and attendance
              </p>
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required={!isEditMode}
                minLength={8}
              />
              <p className="mt-1 text-sm text-gray-500">
                Minimum 8 characters
              </p>
            </div>

            {isEditMode && (
              <div className="flex items-center h-full pt-6">
                <div className="flex items-center">
                  <input
                    id="active"
                    name="active"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.active}
                    onChange={handleChange}
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                    Active Account
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <Link
              to="/admin/teachers"
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

export default TeacherForm
