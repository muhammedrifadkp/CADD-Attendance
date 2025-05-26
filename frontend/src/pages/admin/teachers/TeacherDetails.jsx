import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { teachersAPI, batchesAPI, studentsAPI } from '../../../services/api'
import {
  UserIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import { showConfirm } from '../../../utils/popup'
import { formatDateLong, formatDateSimple } from '../../../utils/dateUtils'

const TeacherDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [teacher, setTeacher] = useState(null)
  const [stats, setStats] = useState({
    batchesCount: 0,
    studentsCount: 0,
    totalAttendanceRecords: 0,
  })
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true)

        // Fetch teacher details
        const teacherRes = await teachersAPI.getTeacher(id)
        setTeacher(teacherRes.data)

        // Fetch all batches to filter by this teacher
        const batchesRes = await batchesAPI.getBatches()
        const teacherBatches = batchesRes.data.filter(batch =>
          batch.createdBy && batch.createdBy._id === id
        )
        setBatches(teacherBatches)

        // Calculate stats
        let totalStudents = 0
        for (const batch of teacherBatches) {
          try {
            const studentsRes = await batchesAPI.getBatchStudents(batch._id)
            totalStudents += studentsRes.data.length
          } catch (error) {
            console.error('Error fetching students for batch:', batch._id)
          }
        }

        setStats({
          batchesCount: teacherBatches.length,
          studentsCount: totalStudents,
          totalAttendanceRecords: 0, // This would need attendance API integration
        })

      } catch (error) {
        console.error('Error fetching teacher data:', error)
        toast.error('Failed to fetch teacher details')
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherData()
  }, [id])

  const handleResetPassword = async () => {
    const confirmed = await showConfirm('Are you sure you want to reset this teacher\'s password?', 'Reset Password')
    if (confirmed) {
      try {
        const res = await teachersAPI.resetPassword(id)
        toast.success(`Password reset successfully. New password: ${res.data.newPassword}`)
      } catch (error) {
        toast.error('Failed to reset password')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Teacher not found</h3>
        <p className="mt-2 text-sm text-gray-500">The teacher you're looking for doesn't exist.</p>
        <Link
          to="/admin/teachers"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Teachers
        </Link>
      </div>
    )
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      default:
        return 'Teacher'
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link
                to="/admin/teachers"
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Teachers
              </Link>
              <div className="w-px h-8 bg-white/30"></div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{teacher.name}</h1>
                <div className="flex items-center space-x-4 text-white/90">
                  <span className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    {teacher.email}
                  </span>
                  <span>•</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(teacher.role)}`}>
                    {getRoleLabel(teacher.role)}
                  </span>
                  {!teacher.active && (
                    <>
                      <span>•</span>
                      <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-full text-sm font-medium">
                        Inactive
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-3 text-sm text-white/80">
                  <span className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Joined {formatDateLong(teacher.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-3xl">
                  {teacher.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Batches Card */}
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.batchesCount}</div>
                <div className="text-sm font-medium text-gray-500">Total Batches</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Batches created and managed by this teacher
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-t border-green-200">
            <div className="text-sm font-semibold text-green-700">
              {stats.batchesCount > 0 ? 'View batches below' : 'No batches yet'}
            </div>
          </div>
        </div>

        {/* Students Card */}
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.studentsCount}</div>
                <div className="text-sm font-medium text-gray-500">Total Students</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Students across all batches managed by this teacher
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-t border-blue-200">
            <div className="text-sm font-semibold text-blue-700">
              {stats.studentsCount > 0 ? 'Distributed across batches' : 'No students yet'}
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group sm:col-span-2 lg:col-span-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cadd-red to-cadd-pink shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">Actions</div>
                <div className="text-sm font-medium text-gray-500">Manage Teacher</div>
              </div>
            </div>
            <div className="space-y-3">
              <Link
                to={`/admin/teachers/${id}/edit`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Teacher
              </Link>
              <button
                onClick={handleResetPassword}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher's Batches */}
      {batches.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Batches Created by {teacher.name}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <Link
                key={batch._id}
                to={`/admin/batches/${batch._id}`}
                className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-cadd-red/30 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg flex items-center justify-center mr-3 group-hover:shadow-lg transition-shadow duration-300">
                    <span className="text-white font-bold text-sm">
                      {batch.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-cadd-red transition-colors duration-300">
                      {batch.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {batch.academicYear} • {batch.section}
                    </p>
                  </div>
                </div>
                {batch.isArchived && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Archived
                  </span>
                )}
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  Created {formatDateSimple(batch.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for No Batches */}
      {batches.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Created</h3>
          <p className="text-gray-600 mb-6">
            {teacher.name} hasn't created any batches yet. Batches will appear here once they start creating them.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Active Batches</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
              <span>Archived Batches</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to={`/admin/teachers/${id}/edit`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Profile
          </Link>
          <button
            onClick={handleResetPassword}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Reset Password
          </button>
          <Link
            to="/admin/batches"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            View All Batches
          </Link>
          <Link
            to="/admin/students"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            View All Students
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TeacherDetails