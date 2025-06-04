import api from './api'

// PC Management API
export const pcAPI = {
  // Get all PCs grouped by row
  getPCsByRow: async () => {
    try {
      console.log('📡 API Request: GET /lab/pcs/by-row')
      const response = await api.get('/lab/pcs/by-row')
      console.log('✅ API Response: GET /lab/pcs/by-row', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: GET /lab/pcs/by-row', error)
      throw error
    }
  },

  // Get all PCs
  getPCs: async (params = {}) => {
    try {
      console.log('📡 API Request: GET /lab/pcs', params)
      const response = await api.get('/lab/pcs', { params })
      console.log('✅ API Response: GET /lab/pcs', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: GET /lab/pcs', error)
      throw error
    }
  },

  // Get single PC
  getPC: async (id) => {
    try {
      console.log('📡 API Request: GET /lab/pcs/' + id)
      const response = await api.get(`/lab/pcs/${id}`)
      console.log('✅ API Response: GET /lab/pcs/' + id, response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: GET /lab/pcs/' + id, error)
      throw error
    }
  },

  // Create new PC
  createPC: async (pcData) => {
    try {
      console.log('📡 API Request: POST /lab/pcs', pcData)
      const response = await api.post('/lab/pcs', pcData)
      console.log('✅ API Response: POST /lab/pcs', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: POST /lab/pcs', error)
      throw error
    }
  },

  // Update PC
  updatePC: async (id, pcData) => {
    try {
      console.log('📡 API Request: PUT /lab/pcs/' + id, pcData)
      const response = await api.put(`/lab/pcs/${id}`, pcData)
      console.log('✅ API Response: PUT /lab/pcs/' + id, response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: PUT /lab/pcs/' + id, error)
      throw error
    }
  },

  // Delete PC
  deletePC: async (id) => {
    try {
      console.log('📡 API Request: DELETE /lab/pcs/' + id)
      const response = await api.delete(`/lab/pcs/${id}`)
      console.log('✅ API Response: DELETE /lab/pcs/' + id, response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: DELETE /lab/pcs/' + id, error)
      throw error
    }
  }
}

// Booking Management API
export const bookingAPI = {
  // Get bookings for a specific date
  getBookings: async (params = {}) => {
    try {
      console.log('📡 API Request: GET /lab/bookings', params)
      const response = await api.get('/lab/bookings', { params })
      console.log('✅ API Response: GET /lab/bookings', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: GET /lab/bookings', error)
      throw error
    }
  },

  // Get bookings with attendance status
  getBookingsWithAttendance: async (params = {}) => {
    try {
      console.log('📡 getBookingsWithAttendance called with params:', params)
      console.log('📡 API Request: GET /lab/bookings/with-attendance', params)
      const response = await api.get('/lab/bookings/with-attendance', { params })
      console.log('✅ API Response: GET /lab/bookings/with-attendance', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: GET /lab/bookings/with-attendance', error)
      throw error
    }
  },

  // Create new booking
  createBooking: async (bookingData) => {
    try {
      console.log('📡 API Request: POST /lab/bookings', bookingData)
      const response = await api.post('/lab/bookings', bookingData)
      console.log('✅ API Response: POST /lab/bookings', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: POST /lab/bookings', error)
      throw error
    }
  },

  // Update booking
  updateBooking: async (bookingId, bookingData) => {
    try {
      console.log('📡 API Request: PUT /lab/bookings/' + bookingId, bookingData)
      const response = await api.put(`/lab/bookings/${bookingId}`, bookingData)
      console.log('✅ API Response: PUT /lab/bookings/' + bookingId, response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: PUT /lab/bookings/' + bookingId, error)
      throw error
    }
  },

  // Delete booking
  deleteBooking: async (bookingId) => {
    try {
      console.log('📡 API Request: DELETE /lab/bookings/' + bookingId)
      const response = await api.delete(`/lab/bookings/${bookingId}`)
      console.log('✅ API Response: DELETE /lab/bookings/' + bookingId, response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: DELETE /lab/bookings/' + bookingId, error)
      throw error
    }
  },

  // Get previous bookings for a specific date
  getPreviousBookings: async (params = {}) => {
    try {
      console.log('📡 API Request: GET /lab/bookings/previous', params)
      const response = await api.get('/lab/bookings/previous', { params })
      console.log('✅ API Response: GET /lab/bookings/previous', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: GET /lab/bookings/previous', error)
      throw error
    }
  },

  // Apply previous bookings to target date
  applyPreviousBookings: async (data) => {
    try {
      console.log('📡 API Request: POST /lab/bookings/apply-previous', data)
      const response = await api.post('/lab/bookings/apply-previous', data)
      console.log('✅ API Response: POST /lab/bookings/apply-previous', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: POST /lab/bookings/apply-previous', error)
      throw error
    }
  },

  // Clear booked slots in bulk
  clearBookedSlotsBulk: async (data) => {
    try {
      console.log('📡 API Request: DELETE /lab/bookings/clear-bulk', data)
      const response = await api.delete('/lab/bookings/clear-bulk', { data })
      console.log('✅ API Response: DELETE /lab/bookings/clear-bulk', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API Error: DELETE /lab/bookings/clear-bulk', error)
      throw error
    }
  }
}

// Lab Information API
export const labAPI = {
  pcs: pcAPI,
  info: {
    getLabInfo: async () => {
      try {
        const response = await api.get('/lab/info')
        return response.data
      } catch (error) {
        console.error('Error fetching lab info:', error)
        throw error
      }
    }
  }
}

// Lab Statistics API
export const labStatsAPI = {
  getStats: async (params = {}) => {
    try {
      const response = await api.get('/lab/stats', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching lab stats:', error)
      throw error
    }
  }
}

// Lab Information API (alternative export)
export const labInfoAPI = {
  getLabInfo: async () => {
    try {
      const response = await api.get('/lab/info')
      return response.data
    } catch (error) {
      console.error('Error fetching lab info:', error)
      throw error
    }
  }
}

export default {
  pcAPI,
  bookingAPI,
  labAPI,
  labStatsAPI,
  labInfoAPI
}
