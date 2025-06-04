import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { studentsAPI, batchesAPI, coursesAPI } from '../../../services/api'
import api from '../../../services/api'
import { toast } from 'react-toastify'

const StudentForm = () => {
  const { id: batchId, studentId } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(studentId)

  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    course: '',
    batch: batchId || '',
    contactInfo: {
      email: '',
      phone: '',
      address: '',
    },
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)
  const [batch, setBatch] = useState(null)
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true)

        // Fetch batch, departments, and courses
        const [batchRes, departmentsRes, coursesRes] = await Promise.all([
          batchId ? batchesAPI.getBatch(batchId) : Promise.resolve(null),
          api.get('/departments?active=true'),
          api.get('/courses?active=true')
        ])

        if (batchRes) {
          setBatch(batchRes.data)
        }

        // Filter departments to only include the 4 required ones
        const allDepartments = departmentsRes.data || []
        const requiredDepartments = allDepartments.filter(dept =>
          ['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'].includes(dept.name)
        )
        setDepartments(requiredDepartments)
        setCourses(coursesRes.data.courses || coursesRes.data || [])

        // If editing, fetch student data
        if (isEditMode) {
          const studentRes = await studentsAPI.getStudent(studentId)
          const student = studentRes.data

          setFormData({
            name: student.name || '',
            rollNo: student.rollNo || '',
            email: student.email || student.contactInfo?.email || '',
            phone: student.phone || student.contactInfo?.phone || '',
            address: student.address || student.contactInfo?.address || '',
            department: student.department?._id || student.department || '',
            course: student.course?._id || student.course || '',
            batch: student.batch?._id || student.batch || batchId || '',
            contactInfo: {
              email: student.contactInfo?.email || student.email || '',
              phone: student.contactInfo?.phone || student.phone || '',
              address: student.contactInfo?.address || student.address || '',
            },
            isActive: student.isActive !== undefined ? student.isActive : true,
          })
        } else if (batchRes) {
          // For new students, pre-fill department and course from batch
          setFormData(prev => ({
            ...prev,
            department: batchRes.data.course?.department?._id || batchRes.data.course?.department || '',
            course: batchRes.data.course?._id || batchRes.data.course || '',
            batch: batchId
          }))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch data')
        if (isEditMode) {
          navigate(`/batches/${batchId}/students`)
        }
      } finally {
        setFetchLoading(false)
      }
    }

    fetchData()
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
        // Also update the main field for backend compatibility
        [contactField]: value,
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      })

      // Update contactInfo for backward compatibility
      if (['email', 'phone', 'address'].includes(name)) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          contactInfo: {
            ...prev.contactInfo,
            [name]: value,
          }
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        rollNo: formData.rollNo,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        department: formData.department,
        course: formData.course,
        batch: formData.batch || batchId,
        isActive: formData.isActive,
        // Keep contactInfo for backward compatibility
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        }
      }

      if (isEditMode) {
        await studentsAPI.updateStudent(studentId, submitData)
        toast.success('Student updated successfully')
      } else {
        await studentsAPI.createStudent(submitData)
        toast.success('Student created successfully')
      }
      navigate(`/batches/${batchId}/students`)
    } catch (error) {
      console.error('Error submitting student:', error)
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
                placeholder="Enter student's full name"
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
                placeholder="Enter roll number"
              />
            </div>

            <div>
              <label htmlFor="department" className="form-label">
                Department
              </label>
              <select
                name="department"
                id="department"
                required
                className="form-input"
                value={formData.department}
                onChange={handleChange}
                disabled={!isEditMode && batch} // Disable if creating and batch is pre-selected
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {!isEditMode && batch && (
                <p className="mt-1 text-sm text-gray-500">
                  Department is pre-selected based on the batch
                </p>
              )}
            </div>

            <div>
              <label htmlFor="course" className="form-label">
                Course
              </label>
              <select
                name="course"
                id="course"
                required
                className="form-input"
                value={formData.course}
                onChange={handleChange}
                disabled={!isEditMode && batch} // Disable if creating and batch is pre-selected
              >
                <option value="">Select Course</option>
                {courses
                  .filter(course => {
                    if (!formData.department) return false
                    const courseDept = course.department?._id || course.department
                    return courseDept === formData.department
                  })
                  .map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))
                }
              </select>
              {!isEditMode && batch && (
                <p className="mt-1 text-sm text-gray-500">
                  Course is pre-selected based on the batch
                </p>
              )}
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
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                required
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                rows="3"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter complete address"
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
