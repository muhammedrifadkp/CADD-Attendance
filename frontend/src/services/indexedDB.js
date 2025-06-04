// IndexedDB service for offline data storage
// Handles local storage of attendance, students, batches, and lab booking data

const DB_NAME = 'CADDAttendanceDB'
const DB_VERSION = 1

// Object store names
const STORES = {
  STUDENTS: 'students',
  BATCHES: 'batches',
  TEACHERS: 'teachers',
  ATTENDANCE: 'attendance',
  LAB_BOOKINGS: 'labBookings',
  PCS: 'pcs',
  SYNC_QUEUE: 'syncQueue',
  METADATA: 'metadata'
}

class IndexedDBService {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  // Initialize the database
  async init() {
    if (this.isInitialized && this.db) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('IndexedDB: Failed to open database')
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('IndexedDB: Database opened successfully')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('IndexedDB: Upgrading database schema')

        // Students store
        if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
          const studentsStore = db.createObjectStore(STORES.STUDENTS, { keyPath: '_id' })
          studentsStore.createIndex('rollNo', 'rollNo', { unique: false })
          studentsStore.createIndex('batchId', 'batch', { unique: false })
          studentsStore.createIndex('name', 'name', { unique: false })
        }

        // Batches store
        if (!db.objectStoreNames.contains(STORES.BATCHES)) {
          const batchesStore = db.createObjectStore(STORES.BATCHES, { keyPath: '_id' })
          batchesStore.createIndex('name', 'name', { unique: false })
          batchesStore.createIndex('createdBy', 'createdBy', { unique: false })
        }

        // Teachers store
        if (!db.objectStoreNames.contains(STORES.TEACHERS)) {
          const teachersStore = db.createObjectStore(STORES.TEACHERS, { keyPath: '_id' })
          teachersStore.createIndex('email', 'email', { unique: true })
          teachersStore.createIndex('name', 'name', { unique: false })
        }

        // Attendance store
        if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
          const attendanceStore = db.createObjectStore(STORES.ATTENDANCE, { keyPath: '_id' })
          attendanceStore.createIndex('studentId', 'student', { unique: false })
          attendanceStore.createIndex('batchId', 'batch', { unique: false })
          attendanceStore.createIndex('date', 'date', { unique: false })
          attendanceStore.createIndex('dateStudent', ['date', 'student'], { unique: false })
        }

        // Lab bookings store
        if (!db.objectStoreNames.contains(STORES.LAB_BOOKINGS)) {
          const bookingsStore = db.createObjectStore(STORES.LAB_BOOKINGS, { keyPath: '_id' })
          bookingsStore.createIndex('pcId', 'pc', { unique: false })
          bookingsStore.createIndex('date', 'date', { unique: false })
          bookingsStore.createIndex('timeSlot', 'timeSlot', { unique: false })
          bookingsStore.createIndex('dateTimeSlot', ['date', 'timeSlot'], { unique: false })
        }

        // PCs store
        if (!db.objectStoreNames.contains(STORES.PCS)) {
          const pcsStore = db.createObjectStore(STORES.PCS, { keyPath: '_id' })
          pcsStore.createIndex('pcNumber', 'pcNumber', { unique: false })
          pcsStore.createIndex('rowNumber', 'rowNumber', { unique: false })
          pcsStore.createIndex('status', 'status', { unique: false })
        }

        // Sync queue store for offline operations
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('type', 'type', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('status', 'status', { unique: false })
        }

        // Metadata store for sync timestamps and app state
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
        }
      }
    })
  }

  // Generic method to add/update data
  async put(storeName, data) {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Generic method to get data by key
  async get(storeName, key) {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Generic method to get all data from a store
  async getAll(storeName) {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Generic method to delete data
  async delete(storeName, key) {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Clear all data from a store
  async clear(storeName) {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Bulk insert/update data
  async bulkPut(storeName, dataArray) {
    await this.init()

    // Validate input
    if (!dataArray || !Array.isArray(dataArray)) {
      console.warn('bulkPut received non-array data:', dataArray)
      return Promise.resolve([])
    }

    // Filter out invalid items (without _id or null/undefined)
    const validData = dataArray.filter(item => {
      if (!item || typeof item !== 'object') {
        return false
      }
      // Check if item has the required key path (_id)
      if (!item._id) {
        console.warn('bulkPut: Skipping item without _id:', item)
        return false
      }
      return true
    })

    if (validData.length === 0) {
      console.log('bulkPut: No valid data to store')
      return Promise.resolve([])
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      let completed = 0
      const total = validData.length
      const results = []

      transaction.onerror = () => {
        reject(transaction.error)
      }

      validData.forEach((data, index) => {
        try {
          const request = store.put(data)

          request.onsuccess = () => {
            results[index] = request.result
            completed++
            if (completed === total) {
              resolve(results)
            }
          }

          request.onerror = (event) => {
            console.error('Error in bulkPut for item:', data, event.target.error)
            // Don't reject immediately, continue with other items
            completed++
            if (completed === total) {
              resolve(results)
            }
          }
        } catch (error) {
          console.error('Error processing item in bulkPut:', error)
          // Don't reject immediately, continue with other items
          completed++
          if (completed === total) {
            resolve(results)
          }
        }
      })
    })
  }

  // Query data by index
  async getByIndex(storeName, indexName, value) {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Get data within a range (useful for date queries)
  async getByRange(storeName, indexName, lowerBound, upperBound) {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const range = IDBKeyRange.bound(lowerBound, upperBound)
      const request = index.getAll(range)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Store-specific methods
  async saveStudents(students) {
    return this.bulkPut(STORES.STUDENTS, students)
  }

  async getStudents() {
    return this.getAll(STORES.STUDENTS)
  }

  async saveBatches(batches) {
    return this.bulkPut(STORES.BATCHES, batches)
  }

  async getBatches() {
    return this.getAll(STORES.BATCHES)
  }

  async saveTeachers(teachers) {
    return this.bulkPut(STORES.TEACHERS, teachers)
  }

  async getTeachers() {
    return this.getAll(STORES.TEACHERS)
  }

  async saveAttendance(attendance) {
    if (Array.isArray(attendance)) {
      return this.bulkPut(STORES.ATTENDANCE, attendance)
    }
    return this.put(STORES.ATTENDANCE, attendance)
  }

  async getAttendanceByDate(date) {
    return this.getByIndex(STORES.ATTENDANCE, 'date', date)
  }

  async getAttendanceByStudent(studentId) {
    return this.getByIndex(STORES.ATTENDANCE, 'studentId', studentId)
  }

  async saveLabBookings(bookings) {
    if (Array.isArray(bookings)) {
      return this.bulkPut(STORES.LAB_BOOKINGS, bookings)
    }
    return this.put(STORES.LAB_BOOKINGS, bookings)
  }

  async getLabBookingsByDate(date) {
    return this.getByIndex(STORES.LAB_BOOKINGS, 'date', date)
  }

  async savePCs(pcs) {
    return this.bulkPut(STORES.PCS, pcs)
  }

  async getPCs() {
    return this.getAll(STORES.PCS)
  }

  // Sync queue methods
  async addToSyncQueue(operation) {
    const queueItem = {
      ...operation,
      timestamp: Date.now(),
      status: 'pending'
    }
    return this.put(STORES.SYNC_QUEUE, queueItem)
  }

  async getSyncQueue() {
    return this.getByIndex(STORES.SYNC_QUEUE, 'status', 'pending')
  }

  async markSyncComplete(id) {
    const item = await this.get(STORES.SYNC_QUEUE, id)
    if (item) {
      item.status = 'completed'
      item.completedAt = Date.now()
      return this.put(STORES.SYNC_QUEUE, item)
    }
  }

  async clearCompletedSync() {
    const completed = await this.getByIndex(STORES.SYNC_QUEUE, 'status', 'completed')
    const promises = completed.map(item => this.delete(STORES.SYNC_QUEUE, item.id))
    return Promise.all(promises)
  }

  // Metadata methods
  async setMetadata(key, value) {
    return this.put(STORES.METADATA, { key, value, timestamp: Date.now() })
  }

  async getMetadata(key) {
    const result = await this.get(STORES.METADATA, key)
    return result ? result.value : null
  }

  // Get last sync timestamp
  async getLastSyncTime(type) {
    return this.getMetadata(`lastSync_${type}`)
  }

  async setLastSyncTime(type, timestamp = Date.now()) {
    return this.setMetadata(`lastSync_${type}`, timestamp)
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService()
export { STORES }
export default indexedDBService
