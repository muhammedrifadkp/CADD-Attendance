import api from './api'

// Helper function to make API requests using the same axios instance
const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, ...config } = options

  try {
    console.log(`📡 API Request: ${method} ${endpoint}`, { body, config })

    let response
    switch (method.toUpperCase()) {
      case 'POST':
        response = await api.post(endpoint, body, config)
        break
      case 'PUT':
        response = await api.put(endpoint, body, config)
        break
      case 'DELETE':
        // For DELETE requests with body, use data property
        if (body) {
          response = await api.delete(endpoint, { ...config, data: body })
        } else {
          response = await api.delete(endpoint, config)
        }
        break
      default:
        response = await api.get(endpoint, config)
    }

    console.log(`✅ API Response: ${method} ${endpoint}`, response.data)
    return response.data
  } catch (error) {
    console.error(`❌ API Error: ${method} ${endpoint}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    throw error
  }
}

// PC Management API
export const pcAPI = {
  // Get all PCs
  getPCs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/lab/pcs${queryString ? `?${queryString}` : ''}`)
  },

  // Get PC by ID
  getPC: (id) => apiRequest(`/lab/pcs/${id}`),

  // Create new PC
  createPC: (pcData) => apiRequest('/lab/pcs', {
    method: 'POST',
    body: pcData,
  }),

  // Update PC
  updatePC: (id, pcData) => apiRequest(`/lab/pcs/${id}`, {
    method: 'PUT',
    body: pcData,
  }),

  // Delete PC
  deletePC: (id) => apiRequest(`/lab/pcs/${id}`, {
    method: 'DELETE',
  }),

  // Get PCs grouped by row
  getPCsByRow: () => apiRequest('/lab/pcs/by-row'),

  // Clear all PCs
  clearAllPCs: () => apiRequest('/lab/pcs/clear-all', {
    method: 'DELETE',
  }),
}

// Booking Management API
export const bookingAPI = {
  // Get all bookings
  getBookings: (params = {}) => {
    // Ensure date is in proper format if provided
    if (params.date) {
      const date = new Date(params.date)
      if (isNaN(date.getTime())) {
        console.error('❌ Invalid date provided to getBookings:', params.date)
        throw new Error('Invalid date format')
      }
      // Format as YYYY-MM-DD
      params.date = date.toISOString().split('T')[0]
    }

    console.log('📡 getBookings called with params:', params)
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/lab/bookings${queryString ? `?${queryString}` : ''}`)
  },

  // Get booking by ID
  getBooking: (id) => apiRequest(`/lab/bookings/${id}`),

  // Create new booking
  createBooking: (bookingData) => apiRequest('/lab/bookings', {
    method: 'POST',
    body: bookingData,
  }),

  // Update booking
  updateBooking: (id, bookingData) => apiRequest(`/lab/bookings/${id}`, {
    method: 'PUT',
    body: bookingData,
  }),

  // Delete booking
  deleteBooking: (id) => apiRequest(`/lab/bookings/${id}`, {
    method: 'DELETE',
  }),

  // Get lab availability for a specific date
  getAvailability: (date) => apiRequest(`/lab/availability/${date}`),

  // Get previous day's bookings
  getPreviousBookings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/lab/bookings/previous${queryString ? `?${queryString}` : ''}`)
  },

  // Apply previous day's bookings to current date
  applyPreviousBookings: (data) => apiRequest('/lab/bookings/apply-previous', {
    method: 'POST',
    body: data,
  }),

  // Clear booked slots in bulk
  clearBookedSlotsBulk: (data) => apiRequest('/lab/bookings/clear-bulk', {
    method: 'DELETE',
    body: data,
  }),
}

// Lab Information API
export const labInfoAPI = {
  // Get lab/institute information
  getLabInfo: () => apiRequest('/lab/info'),
}

// Lab Statistics API
export const labStatsAPI = {
  // Get lab overview statistics
  getOverviewStats: () => apiRequest('/lab/stats/overview'),

  // Get utilization statistics
  getUtilizationStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/lab/stats/utilization${queryString ? `?${queryString}` : ''}`)
  },

  // Get recent activity
  getRecentActivity: (limit = 10) => apiRequest(`/lab/stats/activity?limit=${limit}`),
}

// Combined lab API object
export const labAPI = {
  pcs: pcAPI,
  bookings: bookingAPI,
  info: labInfoAPI,
  stats: labStatsAPI,
}

export default labAPI
