import axios from 'axios'
import { toast } from 'react-toastify'
import { offlineService } from './offlineService.js'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:5001/api'
    : import.meta.env.VITE_API_URL || 'https://cadd-attendance.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Secure token management
const getToken = () => {
  try {
    const token = localStorage.getItem('authToken')
    // Basic token validation
    if (token && token.split('.').length === 3) {
      return token
    }
    return null
  } catch (error) {
    console.error('Error accessing token:', error)
    return null
  }
}

const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('authToken', token)
    }
  } catch (error) {
    console.error('Error storing token:', error)
  }
}

const removeToken = () => {
  try {
    localStorage.removeItem('authToken')
    localStorage.removeItem('isLoggedIn')
  } catch (error) {
    console.error('Error removing token:', error)
  }
}

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Cache successful responses for offline use
    if (response.config.method === 'get' && response.status === 200) {
      try {
        const url = response.config.url
        const isCacheable = [
          '/students',
          '/batches',
          '/users/teachers',
          '/users/profile',
          '/lab/pcs'
        ].some(pattern => url.includes(pattern))

        if (isCacheable) {
          // Save data locally for offline access
          const dataType = getDataTypeFromUrl(url)
          if (dataType) {
            offlineService.saveDataLocally(dataType, response.data)
              .catch(error => console.error('Failed to cache response:', error))
          }
        }
      } catch (error) {
        console.error('Error caching response:', error)
      }
    }
    return response
  },
  async (error) => {
    // Handle errors globally
    const message = error.response?.data?.message || 'Something went wrong'

    // Check if this is a network error and we're offline
    if (!error.response && offlineService.isOffline()) {
      // Try to get data from local storage
      const url = error.config?.url
      if (url && error.config?.method === 'get') {
        try {
          const dataType = getDataTypeFromUrl(url)
          if (dataType) {
            const localData = await offlineService.getDataLocally(dataType)
            if (localData && localData.length > 0) {
              console.log('Serving data from offline cache:', dataType)
              return { data: localData, fromCache: true }
            }
          }
        } catch (cacheError) {
          console.error('Error retrieving cached data:', cacheError)
        }
      }

      toast.warning('You are offline. Some data may not be available.')
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      // Handle token expiration or invalid token
      if (error.response?.data?.error === 'TokenExpiredError' ||
          error.response?.data?.error === 'NoTokenError') {
        // Clear all auth data securely
        removeToken()
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

// Helper function to determine data type from URL
function getDataTypeFromUrl(url) {
  if (url.includes('/students')) return 'students'
  if (url.includes('/batches')) return 'batches'
  if (url.includes('/users/teachers')) return 'teachers'
  if (url.includes('/lab/pcs')) return 'pcs'
  if (url.includes('/attendance')) return 'attendance'
  if (url.includes('/lab/bookings')) return 'labBookings'
  return null
}

// Offline-aware API wrapper
async function offlineAwareRequest(requestFn, fallbackData = null, operationType = null) {
  try {
    const response = await requestFn()
    return response
  } catch (error) {
    if (offlineService.isOffline() && operationType) {
      // Queue the operation for later sync
      const config = error.config || {}
      await offlineService.queueOperation(
        operationType,
        config.method?.toUpperCase() || 'GET',
        config.data,
        config.url
      )

      if (fallbackData) {
        return { data: fallbackData, offline: true }
      }
    }
    throw error
  }
}

// Export token management functions for use in other components
export { getToken, setToken, removeToken }

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),
}

// Admins API
export const adminsAPI = {
  getAdmins: () => api.get('/users/admins'),
  createAdmin: (admin) => api.post('/users/admins', admin),
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

// Attendance API with offline support
export const attendanceAPI = {
  markAttendance: async (attendance) => {
    return offlineAwareRequest(
      () => api.post('/attendance', attendance),
      null,
      'attendance'
    )
  },
  markBulkAttendance: async (data) => {
    return offlineAwareRequest(
      () => api.post('/attendance/bulk', data),
      null,
      'attendance'
    )
  },
  getBatchAttendance: async (batchId, date) => {
    try {
      return await api.get(`/attendance/batch/${batchId}`, { params: { date } })
    } catch (error) {
      if (offlineService.isOffline()) {
        // Get attendance from local storage
        const localAttendance = await offlineService.getDataLocally('attendance', { date })
        const batchAttendance = localAttendance.filter(att => att.batch === batchId)
        return { data: batchAttendance, fromCache: true }
      }
      throw error
    }
  },
  getStudentAttendance: async (studentId, params) => {
    try {
      return await api.get(`/attendance/student/${studentId}`, { params })
    } catch (error) {
      if (offlineService.isOffline()) {
        const localAttendance = await offlineService.getDataLocally('attendance', { studentId })
        return { data: localAttendance, fromCache: true }
      }
      throw error
    }
  },
  getBatchAttendanceStats: (batchId, params) =>
    api.get(`/attendance/stats/batch/${batchId}`, { params }),
  // Admin analytics endpoints
  getOverallAnalytics: (params) =>
    api.get('/attendance/analytics/overall', { params }),
  getAttendanceTrends: (params) =>
    api.get('/attendance/analytics/trends', { params }),
}

export default api
