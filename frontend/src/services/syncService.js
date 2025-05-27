// Sync service for handling data synchronization between local and remote storage
import api, { attendanceAPI, studentsAPI, batchesAPI, teachersAPI } from './api.js'
import { pcAPI, bookingAPI } from './labAPI.js'
import { indexedDBService } from './indexedDB.js'
import { toast } from 'react-toastify'

class SyncService {
  constructor() {
    this.syncInProgress = false
    this.lastSyncTimes = new Map()
  }

  // Main sync method - syncs all data types
  async syncAllData() {
    if (this.syncInProgress) {
      console.log('SyncService: Sync already in progress')
      return false
    }

    try {
      this.syncInProgress = true
      console.log('SyncService: Starting full data sync')

      // Sync reference data first (students, batches, teachers, PCs)
      await this.syncReferenceData()

      // Then sync transactional data (attendance, bookings)
      await this.syncTransactionalData()

      // Finally, process pending operations
      await this.processPendingOperations()

      console.log('SyncService: Full sync completed successfully')
      return true

    } catch (error) {
      console.error('SyncService: Full sync failed:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  // Sync reference data (students, batches, teachers, PCs)
  async syncReferenceData() {
    console.log('SyncService: Syncing reference data')

    try {
      // Fetch all reference data from API
      const [studentsRes, batchesRes, teachersRes, pcsRes] = await Promise.all([
        studentsAPI.getStudents(),
        batchesAPI.getBatches(),
        teachersAPI.getTeachers(),
        pcAPI.getPCsByRow()
      ])

      // Extract data from responses
      const students = studentsRes?.data || studentsRes || []
      const batches = batchesRes?.data || batchesRes || []
      const teachers = teachersRes?.data || teachersRes || []
      const pcsData = pcsRes?.data || pcsRes || {}

      // Convert PCs object to array for storage
      const pcs = Object.values(pcsData).flat().filter(pc => pc && pc._id)

      // Save to IndexedDB
      await Promise.all([
        indexedDBService.saveStudents(Array.isArray(students) ? students : []),
        indexedDBService.saveBatches(Array.isArray(batches) ? batches : []),
        indexedDBService.saveTeachers(Array.isArray(teachers) ? teachers : []),
        indexedDBService.savePCs(Array.isArray(pcs) ? pcs : [])
      ])

      // Update sync timestamps
      const now = Date.now()
      await Promise.all([
        indexedDBService.setLastSyncTime('students', now),
        indexedDBService.setLastSyncTime('batches', now),
        indexedDBService.setLastSyncTime('teachers', now),
        indexedDBService.setLastSyncTime('pcs', now)
      ])

      console.log('SyncService: Reference data synced successfully')

    } catch (error) {
      console.error('SyncService: Reference data sync failed:', error)
      throw error
    }
  }

  // Sync transactional data (attendance, bookings)
  async syncTransactionalData() {
    console.log('SyncService: Syncing transactional data')

    try {
      // Get current date and recent dates for sync
      const today = new Date().toISOString().split('T')[0]
      const dates = this.getRecentDates(7) // Last 7 days

      // Sync attendance data for recent dates
      const attendancePromises = dates.map(async (date) => {
        try {
          // This would need to be implemented in the backend
          // For now, we'll sync attendance by batch for the current date
          const batches = await indexedDBService.getBatches()
          const attendanceData = []

          for (const batch of batches) {
            try {
              const response = await attendanceAPI.getBatchAttendance(batch._id, date)
              const batchAttendance = response?.data || response || []
              attendanceData.push(...(Array.isArray(batchAttendance) ? batchAttendance : []))
            } catch (error) {
              // Skip if no attendance data for this batch/date
              console.log(`No attendance data for batch ${batch._id} on ${date}`)
            }
          }

          if (attendanceData.length > 0) {
            await indexedDBService.saveAttendance(attendanceData)
          }

        } catch (error) {
          console.error(`Failed to sync attendance for ${date}:`, error)
        }
      })

      // Sync lab bookings for recent dates
      const bookingPromises = dates.map(async (date) => {
        try {
          const response = await bookingAPI.getBookings({ date })
          const bookings = response?.data || response || []

          if (Array.isArray(bookings) && bookings.length > 0) {
            await indexedDBService.saveLabBookings(bookings)
          }

        } catch (error) {
          console.error(`Failed to sync bookings for ${date}:`, error)
        }
      })

      // Wait for all sync operations to complete
      await Promise.all([...attendancePromises, ...bookingPromises])

      // Update sync timestamps
      const now = Date.now()
      await Promise.all([
        indexedDBService.setLastSyncTime('attendance', now),
        indexedDBService.setLastSyncTime('labBookings', now)
      ])

      console.log('SyncService: Transactional data synced successfully')

    } catch (error) {
      console.error('SyncService: Transactional data sync failed:', error)
      throw error
    }
  }

  // Process pending operations from sync queue
  async processPendingOperations() {
    console.log('SyncService: Processing pending operations')

    try {
      const pendingOps = await indexedDBService.getSyncQueue()

      if (pendingOps.length === 0) {
        console.log('SyncService: No pending operations')
        return
      }

      console.log(`SyncService: Processing ${pendingOps.length} pending operations`)

      let successCount = 0
      let failureCount = 0

      for (const operation of pendingOps) {
        try {
          await this.processOperation(operation)
          await indexedDBService.markSyncComplete(operation.id)
          successCount++
        } catch (error) {
          console.error('SyncService: Operation failed:', error)
          failureCount++

          // Increment retry count
          operation.retryCount = (operation.retryCount || 0) + 1
          operation.lastError = error.message
          operation.lastRetry = Date.now()

          // If too many retries, mark as failed
          if (operation.retryCount >= 3) {
            operation.status = 'failed'
            await indexedDBService.put('syncQueue', operation)
          }
        }
      }

      // Clean up completed operations
      await indexedDBService.clearCompletedSync()

      console.log(`SyncService: Processed operations - Success: ${successCount}, Failed: ${failureCount}`)

      if (successCount > 0) {
        toast.success(`Synced ${successCount} offline changes`)
      }

      if (failureCount > 0) {
        toast.warning(`${failureCount} changes failed to sync and will be retried`)
      }

    } catch (error) {
      console.error('SyncService: Failed to process pending operations:', error)
      throw error
    }
  }

  // Process individual operation
  async processOperation(operation) {
    const { type, method, data, endpoint } = operation

    console.log(`SyncService: Processing ${type} operation: ${method} ${endpoint}`)

    switch (type) {
      case 'attendance':
        return await this.syncAttendanceOperation(method, data, endpoint)

      case 'labBooking':
        return await this.syncLabBookingOperation(method, data, endpoint)

      case 'student':
        return await this.syncStudentOperation(method, data, endpoint)

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
  }

  // Sync attendance operations
  async syncAttendanceOperation(method, data, endpoint) {
    switch (method) {
      case 'POST':
        if (data.bulk) {
          // Use direct API call to avoid offline wrapper during sync
          return await api.post('/attendance/bulk', data)
        } else {
          return await api.post('/attendance', data)
        }

      default:
        throw new Error(`Unsupported attendance method: ${method}`)
    }
  }

  // Sync lab booking operations
  async syncLabBookingOperation(method, data, endpoint) {
    switch (method) {
      case 'POST':
        // Use direct API call to avoid offline wrapper during sync
        return await api.post('/lab/bookings', data)

      case 'PUT':
        return await api.put(`/lab/bookings/${data.id}`, data)

      case 'DELETE':
        return await api.delete(`/lab/bookings/${data.id}`)

      default:
        throw new Error(`Unsupported booking method: ${method}`)
    }
  }

  // Sync student operations
  async syncStudentOperation(method, data, endpoint) {
    switch (method) {
      case 'POST':
        // Use direct API call to avoid offline wrapper during sync
        return await api.post('/students', data)

      case 'PUT':
        return await api.put(`/students/${data.id}`, data)

      case 'DELETE':
        return await api.delete(`/students/${data.id}`)

      default:
        throw new Error(`Unsupported student method: ${method}`)
    }
  }

  // Utility methods
  getRecentDates(days) {
    const dates = []
    const today = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    return dates
  }

  // Check if sync is needed based on last sync time
  async isSyncNeeded(type, maxAge = 5 * 60 * 1000) { // 5 minutes default
    try {
      const lastSync = await indexedDBService.getLastSyncTime(type)
      if (!lastSync) return true

      const now = Date.now()
      return (now - lastSync) > maxAge
    } catch (error) {
      console.error('SyncService: Failed to check sync status:', error)
      return true
    }
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const [
        studentsLastSync,
        batchesLastSync,
        teachersLastSync,
        attendanceLastSync,
        bookingsLastSync,
        pendingOps
      ] = await Promise.all([
        indexedDBService.getLastSyncTime('students'),
        indexedDBService.getLastSyncTime('batches'),
        indexedDBService.getLastSyncTime('teachers'),
        indexedDBService.getLastSyncTime('attendance'),
        indexedDBService.getLastSyncTime('labBookings'),
        indexedDBService.getSyncQueue()
      ])

      return {
        lastSync: {
          students: studentsLastSync,
          batches: batchesLastSync,
          teachers: teachersLastSync,
          attendance: attendanceLastSync,
          bookings: bookingsLastSync
        },
        pendingOperations: pendingOps.length,
        inProgress: this.syncInProgress
      }
    } catch (error) {
      console.error('SyncService: Failed to get sync status:', error)
      return null
    }
  }
}

// Export singleton instance
export const syncService = new SyncService()
export default syncService
