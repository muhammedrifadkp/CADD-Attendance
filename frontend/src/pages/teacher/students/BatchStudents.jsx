import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { batchesAPI, studentsAPI } from '../../../services/api'
import { PlusIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { showConfirm } from '../../../utils/popup'

const BatchStudents = () => {
  const { id: batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchBatchAndStudents = async () => {
      try {
        setLoading(true)
        const [batchRes, studentsRes] = await Promise.all([
          batchesAPI.getBatch(batchId),
          batchesAPI.getBatchStudents(batchId),
        ])

        setBatch(batchRes.data)
        setStudents(studentsRes.data)
      } catch (error) {
        console.error('Error fetching batch students:', error)
        toast.error('Failed to fetch students')
      } finally {
        setLoading(false)
      }
    }

    fetchBatchAndStudents()
  }, [batchId, refreshKey])

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this student? This will also delete all attendance records for this student.', 'Delete Student')
    if (confirmed) {
      try {
        await studentsAPI.deleteStudent(id)
        toast.success('Student deleted successfully')
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        toast.error('Failed to delete student')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Batch not found</h3>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <p className="mt-1 text-sm text-gray-500">
            {batch.name} • {batch.academicYear} • {batch.section}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to={`/batches/${batchId}/students/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Student
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a student to this batch.
          </p>
          <div className="mt-6">
            <Link
              to={`/batches/${batchId}/students/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Student
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          {student.profilePhoto === 'default-profile.jpg' ? (
                            <UserIcon className="h-6 w-6 text-primary-600" />
                          ) : (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={student.profilePhoto}
                              alt={student.name}
                            />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.rollNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.contactInfo?.email || 'No email'}<br />
                      {student.contactInfo?.phone || 'No phone'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/batches/${batchId}/students/${student._id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchStudents
