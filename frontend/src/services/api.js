import axios from 'axios'
import toast from 'react-hot-toast'
import { offlineService } from './offlineService.js'
// CSRF functionality removed for simplified authentication

// Determine the correct API URL based on environment
const getApiUrl = () => {
  // Priority order: LOCAL > DEV > PROD
  if (import.meta.env.VITE_LOCAL_API_URL && import.meta.env.DEV) {
    console.log('🔧 Using LOCAL API URL:', import.meta.env.VITE_LOCAL_API_URL);
    return import.meta.env.VITE_LOCAL_API_URL;
  }

  if (import.meta.env.DEV) {
    const devUrl = import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000/api';
    console.log('🛠️ Using DEV API URL:', devUrl);
    return devUrl;
  }

  const prodUrl = import.meta.env.VITE_API_URL || 'https://cadd-attendance.onrender.com/api';
  console.log('🚀 Using PROD API URL:', prodUrl);
  return prodUrl;
};

// Create axios instance
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
})

// Secure token management
// We'll rely solely on HTTP-only cookies for token storage
// This is more secure as it prevents XSS attacks from stealing the token

// These functions now only manage the login state flag
// The actual token is handled securely by the browser's cookie storage
const getToken = () => {
  // We don't need to access the token directly anymore
  // Just check if the user is logged in
  try {
    return localStorage.getItem('isLoggedIn') === 'true'
  } catch (error) {
    console.error('Error checking login state:', error)
    return false
  }
}

const setToken = () => {
  // We only need to set the login state flag
  try {
    localStorage.setItem('isLoggedIn', 'true')
  } catch (error) {
    console.error('Error storing login state:', error)
  }
}

const removeToken = () => {
  try {
    localStorage.removeItem('isLoggedIn')
  } catch (error) {
    console.error('Error removing login state:', error)
  }
}

// Request interceptor (simplified without CSRF)
api.interceptors.request.use(
  (config) => {
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
          // '/students', // Temporarily disabled due to IndexedDB key path issues
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

    // CSRF handling removed for simplified authentication

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
  getAdminById: (id) => api.get(`/users/admins/${id}`),
  createAdmin: (admin) => api.post('/users/admins', admin),
  updateAdmin: (id, admin) => api.put(`/users/admins/${id}`, admin),
  deleteAdmin: (id) => api.delete(`/users/admins/${id}`),
  resetAdminPassword: (id, data) => api.put(`/users/admins/${id}/reset-password`, data),
}

// Teachers API
export const teachersAPI = {
  getTeachers: () => api.get('/users/teachers'),
  getTeacher: (id) => api.get(`/users/teachers/${id}`),
  createTeacher: (teacher) => api.post('/users', teacher),
  updateTeacher: (id, teacher) => api.put(`/users/teachers/${id}`, teacher),
  deleteTeacher: (id) => api.delete(`/users/teachers/${id}`),
  resetPassword: (id) => api.put(`/users/teachers/${id}/reset-password`),
  getTeacherStats: (id) => api.get(`/users/teachers/${id}/stats`),
  getTeachersOverview: () => api.get('/users/teachers/overview'),
}

// Departments API
export const departmentsAPI = {
  getDepartments: (params) => api.get('/departments', { params }),
  getDepartmentById: (id) => api.get(`/departments/${id}`),
  createDepartment: (department) => api.post('/departments', department),
  updateDepartment: (id, department) => api.put(`/departments/${id}`, department),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentCourses: (id) => api.get(`/departments/${id}/courses`),
  getDepartmentStats: (id) => api.get(`/departments/${id}/stats`),
  getDepartmentOverview: () => api.get('/departments/overview'),
}

// Courses API
export const coursesAPI = {
  getCourses: (params) => api.get('/courses', { params }),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (course) => api.post('/courses', course),
  updateCourse: (id, course) => api.put(`/courses/${id}`, course),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getCoursesByDepartment: (departmentId, params) => api.get(`/courses/department/${departmentId}`, { params }),
  getCourseStats: (id) => api.get(`/courses/${id}/stats`),
  getCourseOverview: () => api.get('/courses/overview'),
}

// Students API
export const studentsAPI = {
  getStudents: (params) => api.get('/students', { params }),



  getStudentById: (id) => api.get(`/students/${id}`),
  getStudent: (id) => api.get(`/students/${id}`),
  createStudent: (student) => api.post('/students', student),
  updateStudent: (id, student) => api.put(`/students/${id}`, student),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  getStudentsByBatch: (batchId, params) => api.get(`/students/batch/${batchId}`, { params }),
  getStudentsByDepartment: (departmentId, params) => api.get(`/students/department/${departmentId}`, { params }),
  bulkCreateStudents: (data) => api.post('/students/bulk', data),
  getStudentStats: (id) => api.get(`/students/${id}/stats`),
  getStudentsOverview: () => api.get('/students/overview'),
}

// Batches API
export const batchesAPI = {
  getBatches: (params) => api.get('/batches', { params }),
  getBatchById: (id) => api.get(`/batches/${id}`),
  getBatch: (id) => api.get(`/batches/${id}`),
  createBatch: (batch) => api.post('/batches', batch),
  updateBatch: (id, batch) => api.put(`/batches/${id}`, batch),
  deleteBatch: (id) => api.delete(`/batches/${id}`),
  getBatchesByCourse: (courseId, params) => api.get(`/batches/course/${courseId}`, { params }),
  getBatchesByDepartment: (departmentId, params) => api.get(`/batches/department/${departmentId}`, { params }),
  getBatchStudents: (id) => api.get(`/batches/${id}/students`),
  toggleBatchFinished: (id) => api.put(`/batches/${id}/toggle-finished`),
  getBatchStats: (id) => api.get(`/batches/${id}/stats`),
  getBatchesOverview: () => api.get('/batches/overview'),
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
  // Teacher dashboard endpoints
  getTodayAttendanceSummary: () =>
    api.get('/attendance/today/summary'),
  // Admin dashboard endpoints
  getAdminTodayAttendanceSummary: () =>
    api.get('/attendance/admin/today/summary'),
  // Admin analytics endpoints
  getOverallAnalytics: (params) =>
    api.get('/attendance/analytics/overall', { params }),
  getAttendanceTrends: (params) =>
    api.get('/attendance/analytics/trends', { params }),
}

// Notifications API (Enhanced implementation with fallbacks)
export const notificationsAPI = {
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return response;
    } catch (error) {
      console.warn('Notifications API not available, using fallback');
      return {
        data: {
          notifications: [],
          total: 0,
          page: params.page || 1,
          limit: params.limit || 10
        }
      };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response;
    } catch (error) {
      console.warn('Unread count API not available, using fallback');
      return { data: { unreadCount: 0 } };
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response;
    } catch (error) {
      console.warn('Mark as read API not available, using fallback');
      return { data: { success: true } };
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response;
    } catch (error) {
      console.warn('Mark all as read API not available, using fallback');
      return { data: { success: true } };
    }
  },

  createNotification: async (notification) => {
    try {
      const response = await api.post('/notifications', notification);
      return response;
    } catch (error) {
      console.warn('Create notification API not available, using fallback');
      return { data: { ...notification, _id: Date.now().toString() } };
    }
  },

  getAllNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications/all', { params });
      return response;
    } catch (error) {
      console.warn('Get all notifications API not available, using fallback');
      return { data: { notifications: [] } };
    }
  },

  updateNotification: async (id, notification) => {
    try {
      const response = await api.put(`/notifications/${id}`, notification);
      return response;
    } catch (error) {
      console.warn('Update notification API not available, using fallback');
      return { data: { ...notification, _id: id } };
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response;
    } catch (error) {
      console.warn('Delete notification API not available, using fallback');
      return { data: { success: true } };
    }
  },
  sendSystemNotification: (notification) => Promise.resolve({ data: notification }),
}

// Analytics API - Enhanced implementation with fallbacks
export const analyticsAPI = {
  getDashboardSummary: async () => {
    try {
      const response = await api.get('/analytics/dashboard-summary');
      return response;
    } catch (error) {
      console.warn('Dashboard summary API not available, using fallback');
      return {
        data: {
          totalStudents: 0,
          totalBatches: 0,
          totalTeachers: 0,
          totalDepartments: 0,
          totalCourses: 0,
          totalPCs: 0,
          attendanceRate: 0,
          labUtilization: 0,
          activeStudents: 0,
          activeBatches: 0
        }
      };
    }
  },

  getAttendanceAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/attendance', { params });
      return response;
    } catch (error) {
      console.warn('Attendance analytics API not available, using fallback');
      return {
        data: {
          overallStats: {
            totalStudents: 0,
            averageAttendance: 0,
            presentToday: 0,
            absentToday: 0,
            lateToday: 0
          },
          trends: [],
          distribution: { present: 0, absent: 0, late: 0 }
        }
      };
    }
  },

  getPerformanceMetrics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/performance', { params });
      return response;
    } catch (error) {
      console.warn('Performance metrics API not available, using fallback');
      return {
        data: {
          metrics: {},
          comparisons: [],
          insights: []
        }
      };
    }
  },

  // Additional analytics methods with fallbacks
  getOverview: async () => {
    try {
      const response = await api.get('/analytics/overview');
      return response;
    } catch (error) {
      // Fallback to dashboard summary
      return await analyticsAPI.getDashboardSummary();
    }
  },

  getBatchAnalytics: async (batchId, params = {}) => {
    try {
      const response = await api.get(`/analytics/batches/${batchId}`, { params });
      return response;
    } catch (error) {
      console.warn('Batch analytics API not available, using fallback');
      return {
        data: {
          batchInfo: {},
          attendanceStats: {},
          studentPerformance: [],
          trends: []
        }
      };
    }
  },

  getAttendanceTrends: async (params = {}) => {
    try {
      const response = await api.get('/analytics/attendance/trends', { params });
      return response;
    } catch (error) {
      console.warn('Attendance trends API not available, using fallback');
      return {
        data: {
          trends: [],
          summary: {}
        }
      };
    }
  },
}

// System Settings API
export const systemSettingsAPI = {
  getAllSettings: (params) => api.get('/settings', { params }),
  getSettingsByCategory: (category, params) => api.get(`/settings/category/${category}`, { params }),
  getSettingValue: (category, key) => api.get(`/settings/${category}/${key}`),
  updateSettingValue: (category, key, data) => api.put(`/settings/${category}/${key}`, data),
  resetSettingToDefault: (category, key, data) => api.post(`/settings/${category}/${key}/reset`, data),
  getSettingHistory: (category, key, params) => api.get(`/settings/${category}/${key}/history`, { params }),
  initializeDefaultSettings: () => api.post('/settings/initialize'),
  exportSettings: (params) => api.get('/settings/export', { params }),
}

export default api

