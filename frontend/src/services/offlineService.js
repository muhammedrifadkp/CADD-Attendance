// Offline service for managing offline state and data synchronization
import { indexedDBService } from './indexedDB.js'
import { toast } from 'react-toastify'

class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine
    this.listeners = new Set()
    this.syncInProgress = false
    this.pendingOperations = new Map()

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Initialize service
    this.init()
  }

  async init() {
    try {
      await indexedDBService.init()
      console.log('OfflineService: Initialized successfully')

      // Check for pending sync operations on startup
      if (this.isOnline) {
        this.scheduleSyncCheck()
      }
    } catch (error) {
      console.error('OfflineService: Initialization failed:', error)
    }
  }

  // Event listeners management
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('OfflineService: Listener error:', error)
      }
    })
  }

  // Online/offline event handlers
  handleOnline() {
    console.log('OfflineService: Connection restored')
    this.isOnline = true
    this.notifyListeners({ type: 'online' })

    toast.success('Connection restored! Syncing data...', {
      position: 'top-center',
      autoClose: 3000
    })

    // Start sync process
    this.startSync()
  }

  handleOffline() {
    console.log('OfflineService: Connection lost')
    this.isOnline = false
    this.notifyListeners({ type: 'offline' })

    toast.warning('You are now offline. Changes will be saved locally and synced when connection is restored.', {
      position: 'top-center',
      autoClose: 5000
    })
  }

  // Sync management
  async startSync() {
    if (this.syncInProgress) {
      console.log('OfflineService: Sync already in progress')
      return
    }

    try {
      this.syncInProgress = true
      this.notifyListeners({ type: 'syncStart' })

      const pendingOperations = await indexedDBService.getSyncQueue()
      console.log(`OfflineService: Found ${pendingOperations.length} pending operations`)

      if (pendingOperations.length === 0) {
        this.syncInProgress = false
        this.notifyListeners({ type: 'syncComplete', success: true })
        return
      }

      let successCount = 0
      let failureCount = 0

      for (const operation of pendingOperations) {
        try {
          await this.processSyncOperation(operation)
          await indexedDBService.markSyncComplete(operation.id)
          successCount++
        } catch (error) {
          console.error('OfflineService: Sync operation failed:', error)
          failureCount++
        }
      }

      // Clean up completed operations
      await indexedDBService.clearCompletedSync()

      this.syncInProgress = false
      this.notifyListeners({
        type: 'syncComplete',
        success: failureCount === 0,
        successCount,
        failureCount
      })

      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} operations`, {
          position: 'top-center',
          autoClose: 3000
        })
      }

      if (failureCount > 0) {
        toast.error(`Failed to sync ${failureCount} operations. Will retry later.`, {
          position: 'top-center',
          autoClose: 5000
        })
      }

    } catch (error) {
      console.error('OfflineService: Sync process failed:', error)
      this.syncInProgress = false
      this.notifyListeners({ type: 'syncComplete', success: false, error })
    }
  }

  async processSyncOperation(operation) {
    // Import syncService dynamically to avoid circular dependency
    try {
      const { syncService } = await import('./syncService.js')
      return await syncService.processOperation(operation)
    } catch (error) {
      console.error('OfflineService: Failed to process sync operation:', error)
      throw error
    }
  }

  // Schedule periodic sync checks
  scheduleSyncCheck() {
    setTimeout(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.startSync()
      }
      this.scheduleSyncCheck()
    }, 30000) // Check every 30 seconds
  }

  // Queue operations for offline sync
  async queueOperation(type, method, data, endpoint) {
    const operation = {
      type,
      method,
      data,
      endpoint,
      timestamp: Date.now(),
      retryCount: 0
    }

    await indexedDBService.addToSyncQueue(operation)
    console.log('OfflineService: Queued operation for sync:', type)

    this.notifyListeners({
      type: 'operationQueued',
      operation: { type, method, endpoint }
    })

    return operation
  }

  // Data management methods
  async saveDataLocally(type, data) {
    try {
      switch (type) {
        case 'students':
          return await indexedDBService.saveStudents(data)
        case 'batches':
          return await indexedDBService.saveBatches(data)
        case 'teachers':
          return await indexedDBService.saveTeachers(data)
        case 'attendance':
          return await indexedDBService.saveAttendance(data)
        case 'labBookings':
          return await indexedDBService.saveLabBookings(data)
        case 'pcs':
          return await indexedDBService.savePCs(data)
        default:
          throw new Error(`Unknown data type: ${type}`)
      }
    } catch (error) {
      console.error('OfflineService: Failed to save data locally:', error)
      throw error
    }
  }

  async getDataLocally(type, params = {}) {
    try {
      switch (type) {
        case 'students':
          return await indexedDBService.getStudents()
        case 'batches':
          return await indexedDBService.getBatches()
        case 'teachers':
          return await indexedDBService.getTeachers()
        case 'attendance':
          if (params.date) {
            return await indexedDBService.getAttendanceByDate(params.date)
          }
          if (params.studentId) {
            return await indexedDBService.getAttendanceByStudent(params.studentId)
          }
          return []
        case 'labBookings':
          if (params.date) {
            return await indexedDBService.getLabBookingsByDate(params.date)
          }
          return []
        case 'pcs':
          return await indexedDBService.getPCs()
        default:
          throw new Error(`Unknown data type: ${type}`)
      }
    } catch (error) {
      console.error('OfflineService: Failed to get data locally:', error)
      return []
    }
  }

  // Utility methods
  isOffline() {
    return !this.isOnline
  }

  isSyncing() {
    return this.syncInProgress
  }

  async getPendingOperationsCount() {
    try {
      const operations = await indexedDBService.getSyncQueue()
      return operations.length
    } catch (error) {
      console.error('OfflineService: Failed to get pending operations count:', error)
      return 0
    }
  }

  async clearAllData() {
    try {
      await Promise.all([
        indexedDBService.clear('students'),
        indexedDBService.clear('batches'),
        indexedDBService.clear('teachers'),
        indexedDBService.clear('attendance'),
        indexedDBService.clear('labBookings'),
        indexedDBService.clear('pcs'),
        indexedDBService.clear('syncQueue')
      ])
      console.log('OfflineService: All local data cleared')
    } catch (error) {
      console.error('OfflineService: Failed to clear local data:', error)
      throw error
    }
  }

  // Force sync (manual trigger)
  async forceSync() {
    if (!this.isOnline) {
      toast.warning('Cannot sync while offline')
      return false
    }

    if (this.syncInProgress) {
      toast.info('Sync already in progress')
      return false
    }

    await this.startSync()
    return true
  }
}

// Export singleton instance
export const offlineService = new OfflineService()
export default offlineService
