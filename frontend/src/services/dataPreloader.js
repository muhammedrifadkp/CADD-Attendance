// Data preloader service to cache essential data for offline use
import api from './api.js'
import { offlineService } from './offlineService.js'

class DataPreloader {
  constructor() {
    this.isPreloading = false
    this.preloadedData = new Set()
  }

  // Preload essential data for offline use
  async preloadEssentialData() {
    if (this.isPreloading) {
      console.log('DataPreloader: Preload already in progress')
      return
    }

    // Only preload if online
    if (!navigator.onLine) {
      console.log('DataPreloader: Skipping preload - offline')
      return
    }

    try {
      this.isPreloading = true
      console.log('📦 DataPreloader: Starting essential data preload...')

      const preloadPromises = []

      // Preload students if not already cached
      if (!this.preloadedData.has('students')) {
        preloadPromises.push(
          this.preloadStudents().then(() => {
            this.preloadedData.add('students')
            console.log('✅ Students data preloaded')
          }).catch(error => {
            console.error('❌ Failed to preload students:', error)
          })
        )
      }

      // Preload batches if not already cached
      if (!this.preloadedData.has('batches')) {
        preloadPromises.push(
          this.preloadBatches().then(() => {
            this.preloadedData.add('batches')
            console.log('✅ Batches data preloaded')
          }).catch(error => {
            console.error('❌ Failed to preload batches:', error)
          })
        )
      }

      // Preload teachers if not already cached
      if (!this.preloadedData.has('teachers')) {
        preloadPromises.push(
          this.preloadTeachers().then(() => {
            this.preloadedData.add('teachers')
            console.log('✅ Teachers data preloaded')
          }).catch(error => {
            console.error('❌ Failed to preload teachers:', error)
          })
        )
      }

      // Wait for all preloads to complete
      await Promise.allSettled(preloadPromises)

      console.log('📦 DataPreloader: Essential data preload completed')

    } catch (error) {
      console.error('DataPreloader: Preload failed:', error)
    } finally {
      this.isPreloading = false
    }
  }

  // Preload students data
  async preloadStudents() {
    try {
      // Use direct API call to avoid offline wrapper during preload
      const response = await api.get('/students')
      const students = response.data || []

      if (students.length > 0) {
        await offlineService.saveDataLocally('students', students)
        console.log(`📚 Cached ${students.length} students for offline use`)
      } else {
        console.log('📚 No students data to cache')
      }
    } catch (error) {
      console.error('Failed to preload students:', error)
      throw error
    }
  }

  // Preload batches data
  async preloadBatches() {
    try {
      // Use direct API call to avoid offline wrapper during preload
      const response = await api.get('/batches')
      const batches = response.data || []

      if (batches.length > 0) {
        await offlineService.saveDataLocally('batches', batches)
        console.log(`📚 Cached ${batches.length} batches for offline use`)
      } else {
        console.log('📚 No batches data to cache')
      }
    } catch (error) {
      console.error('Failed to preload batches:', error)
      throw error
    }
  }

  // Preload teachers data
  async preloadTeachers() {
    try {
      // Use direct API call to avoid offline wrapper during preload
      const response = await api.get('/users/teachers')
      const teachers = response.data || []

      if (teachers.length > 0) {
        await offlineService.saveDataLocally('teachers', teachers)
        console.log(`📚 Cached ${teachers.length} teachers for offline use`)
      } else {
        console.log('📚 No teachers data to cache')
      }
    } catch (error) {
      console.error('Failed to preload teachers:', error)
      throw error
    }
  }

  // Check if data is already cached
  async isDataCached(dataType) {
    try {
      const data = await offlineService.getDataLocally(dataType)
      return data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)
    } catch (error) {
      return false
    }
  }

  // Get preload status
  getPreloadStatus() {
    return {
      isPreloading: this.isPreloading,
      preloadedData: Array.from(this.preloadedData),
      online: navigator.onLine
    }
  }

  // Force refresh all cached data
  async refreshAllData() {
    if (!navigator.onLine) {
      console.log('DataPreloader: Cannot refresh data while offline')
      return false
    }

    try {
      console.log('🔄 DataPreloader: Refreshing all cached data...')

      // Clear preloaded flags to force refresh
      this.preloadedData.clear()

      // Preload fresh data
      await this.preloadEssentialData()

      console.log('✅ DataPreloader: All data refreshed')
      return true
    } catch (error) {
      console.error('❌ DataPreloader: Failed to refresh data:', error)
      return false
    }
  }

  // Auto-preload when user logs in
  async onUserLogin() {
    console.log('DataPreloader: User logged in, starting auto-preload...')

    // Small delay to let the app settle
    setTimeout(() => {
      this.preloadEssentialData()
    }, 1000)
  }

  // Setup automatic preloading
  setupAutoPreload() {
    // Preload when coming online
    window.addEventListener('online', () => {
      console.log('DataPreloader: Connection restored, starting preload...')
      setTimeout(() => {
        this.preloadEssentialData()
      }, 2000) // Wait 2 seconds for connection to stabilize
    })

    // Preload on page visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        // Check if we need to refresh data (e.g., if it's been a while)
        const lastPreload = localStorage.getItem('lastDataPreload')
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (!lastPreload || (now - parseInt(lastPreload)) > fiveMinutes) {
          console.log('DataPreloader: Refreshing data due to time elapsed...')
          this.preloadEssentialData()
          localStorage.setItem('lastDataPreload', now.toString())
        }
      }
    })

    console.log('DataPreloader: Auto-preload setup completed')
  }

  // Clear all preloaded data
  async clearPreloadedData() {
    try {
      await offlineService.clearAllData()
      this.preloadedData.clear()
      localStorage.removeItem('lastDataPreload')
      console.log('DataPreloader: All preloaded data cleared')
    } catch (error) {
      console.error('DataPreloader: Failed to clear preloaded data:', error)
    }
  }
}

// Export singleton instance
export const dataPreloader = new DataPreloader()
export default dataPreloader
