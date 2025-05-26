import axios from 'axios'
import { toast } from 'react-toastify'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:5001/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    const message = error.response?.data?.message || 'Something went wrong'

    if (error.response?.status === 401) {
      // Handle token expiration
      if (error.response?.data?.error === 'TokenExpiredError') {
        // Clear localStorage and show specific message
        localStorage.removeItem('isLoggedIn')
        toast.error('Your session has expired. Please login again.')
      } else {
        toast.error(message)
      }

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } else if (error.response?.status !== 404) {
      // Show toast for all errors except 404
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),
}

// Teachers API
export const teachersAPI = {
  getTeachers: () => api.get('/users/teachers'),
  getTeacher: (id) => api.get(`/users/teachers/${id}`),
  createTeacher: (teacher) => api.post('/users', teacher),
  updateTeacher: (id, teacher) => api.put(`/users/teachers/${id}`, teacher),
  deleteTeacher: (id) => api.delete(`/users/teachers/${id}`),
  resetPassword: (id) => api.put(`/users/teachers/${id}/reset-password`),
}

// Batches API
export const batchesAPI = {
  getBatches: () => api.get('/batches'),
  getBatch: (id) => api.get(`/batches/${id}`),
  createBatch: (batch) => api.post('/batches', batch),
  updateBatch: (id, batch) => api.put(`/batches/${id}`, batch),
  deleteBatch: (id) => api.delete(`/batches/${id}`),
  getBatchStudents: (id) => api.get(`/batches/${id}/students`),
}

// Students API
export const studentsAPI = {
  getStudents: (params) => api.get('/students', { params }),
  getStudent: (id) => api.get(`/students/${id}`),
  createStudent: (student) => api.post('/students', student),
  updateStudent: (id, student) => api.put(`/students/${id}`, student),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  bulkCreateStudents: (data) => api.post('/students/bulk', data),
  getStudentsByBatch: (batchId) => api.get(`/batches/${batchId}/students`),
}

// Attendance API
export const attendanceAPI = {
  markAttendance: (attendance) => api.post('/attendance', attendance),
  markBulkAttendance: (data) => api.post('/attendance/bulk', data),
  getBatchAttendance: (batchId, date) =>
    api.get(`/attendance/batch/${batchId}`, { params: { date } }),
  getStudentAttendance: (studentId, params) =>
    api.get(`/attendance/student/${studentId}`, { params }),
  getBatchAttendanceStats: (batchId, params) =>
    api.get(`/attendance/stats/batch/${batchId}`, { params }),
  // Admin analytics endpoints
  getOverallAnalytics: (params) =>
    api.get('/attendance/analytics/overall', { params }),
  getAttendanceTrends: (params) =>
    api.get('/attendance/analytics/trends', { params }),
}

export default api
