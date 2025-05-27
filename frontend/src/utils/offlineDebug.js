// Debug utilities for offline functionality
import { indexedDBService } from '../services/indexedDB.js'
import { offlineService } from '../services/offlineService.js'

class OfflineDebug {
  constructor() {
    this.isDebugEnabled = localStorage.getItem('debug-offline') === 'true'
  }

  log(...args) {
    if (this.isDebugEnabled) {
      console.log('[OFFLINE DEBUG]', ...args)
    }
  }

  error(...args) {
    if (this.isDebugEnabled) {
      console.error('[OFFLINE DEBUG]', ...args)
    }
  }

  warn(...args) {
    if (this.isDebugEnabled) {
      console.warn('[OFFLINE DEBUG]', ...args)
    }
  }

  // Enable debug mode
  enable() {
    localStorage.setItem('debug-offline', 'true')
    this.isDebugEnabled = true
    console.log('🔍 Offline debug mode enabled')
  }

  // Disable debug mode
  disable() {
    localStorage.setItem('debug-offline', 'false')
    this.isDebugEnabled = false
    console.log('🔍 Offline debug mode disabled')
  }

  // Get comprehensive offline status
  async getStatus() {
    try {
      const status = {
        online: navigator.onLine,
        serviceWorker: {
          supported: 'serviceWorker' in navigator,
          registered: false,
          active: false
        },
        indexedDB: {
          supported: 'indexedDB' in window,
          initialized: indexedDBService.isInitialized,
          stores: {}
        },
        offlineService: {
          initialized: offlineService.isInitialized || false,
          syncing: offlineService.isSyncing(),
          pendingOps: await offlineService.getPendingOperationsCount()
        }
      }

      // Check service worker status
      if (status.serviceWorker.supported) {
        const registration = await navigator.serviceWorker.getRegistration()
        status.serviceWorker.registered = !!registration
        status.serviceWorker.active = !!(registration && registration.active)
      }

      // Check IndexedDB stores
      if (status.indexedDB.initialized) {
        const stores = ['students', 'batches', 'teachers', 'attendance', 'labBookings', 'pcs']
        for (const store of stores) {
          try {
            const data = await offlineService.getDataLocally(store)
            status.indexedDB.stores[store] = Array.isArray(data) ? data.length : Object.keys(data).length
          } catch (error) {
            status.indexedDB.stores[store] = 'error'
          }
        }
      }

      return status
    } catch (error) {
      this.error('Failed to get status:', error)
      return null
    }
  }

  // Print status to console
  async printStatus() {
    const status = await this.getStatus()
    if (status) {
      console.group('🔍 Offline Functionality Status')
      console.log('📡 Online:', status.online ? '✅ Yes' : '❌ No')
      
      console.group('🔧 Service Worker')
      console.log('Supported:', status.serviceWorker.supported ? '✅' : '❌')
      console.log('Registered:', status.serviceWorker.registered ? '✅' : '❌')
      console.log('Active:', status.serviceWorker.active ? '✅' : '❌')
      console.groupEnd()
      
      console.group('💾 IndexedDB')
      console.log('Supported:', status.indexedDB.supported ? '✅' : '❌')
      console.log('Initialized:', status.indexedDB.initialized ? '✅' : '❌')
      console.log('Data stores:')
      Object.entries(status.indexedDB.stores).forEach(([store, count]) => {
        console.log(`  ${store}: ${count}`)
      })
      console.groupEnd()
      
      console.group('⚡ Offline Service')
      console.log('Initialized:', status.offlineService.initialized ? '✅' : '❌')
      console.log('Syncing:', status.offlineService.syncing ? '🔄 Yes' : '⏸️ No')
      console.log('Pending operations:', status.offlineService.pendingOps)
      console.groupEnd()
      
      console.groupEnd()
    }
  }

  // Test offline functionality
  async testOffline() {
    console.group('🧪 Testing Offline Functionality')
    
    try {
      // Test IndexedDB
      console.log('Testing IndexedDB...')
      const testData = { _id: 'test-' + Date.now(), name: 'Test Item', timestamp: Date.now() }
      await indexedDBService.put('students', testData)
      const retrieved = await indexedDBService.get('students', testData._id)
      console.log('IndexedDB test:', retrieved ? '✅ Pass' : '❌ Fail')
      
      // Clean up test data
      await indexedDBService.delete('students', testData._id)
      
      // Test offline service
      console.log('Testing offline service...')
      const localData = await offlineService.getDataLocally('students')
      console.log('Offline service test:', Array.isArray(localData) ? '✅ Pass' : '❌ Fail')
      
      // Test operation queuing
      if (!navigator.onLine) {
        console.log('Testing operation queuing...')
        await offlineService.queueOperation('test', 'POST', { test: true }, '/test')
        const pendingOps = await offlineService.getPendingOperationsCount()
        console.log('Operation queuing test:', pendingOps > 0 ? '✅ Pass' : '❌ Fail')
      } else {
        console.log('⚠️ Cannot test operation queuing while online')
      }
      
      console.log('🎉 All tests completed')
      
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
    
    console.groupEnd()
  }

  // Clear all offline data
  async clearAllData() {
    try {
      console.log('🗑️ Clearing all offline data...')
      await offlineService.clearAllData()
      console.log('✅ All offline data cleared')
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error)
    }
  }

  // Force sync
  async forceSync() {
    try {
      console.log('🔄 Forcing sync...')
      const result = await offlineService.forceSync()
      console.log('Sync result:', result ? '✅ Success' : '❌ Failed')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    }
  }

  // Get help
  help() {
    console.group('🔍 Offline Debug Help')
    console.log('Available commands:')
    console.log('  offlineDebug.enable() - Enable debug mode')
    console.log('  offlineDebug.disable() - Disable debug mode')
    console.log('  offlineDebug.printStatus() - Show current status')
    console.log('  offlineDebug.testOffline() - Run offline tests')
    console.log('  offlineDebug.clearAllData() - Clear all offline data')
    console.log('  offlineDebug.forceSync() - Force synchronization')
    console.log('  offlineDebug.help() - Show this help')
    console.groupEnd()
  }
}

// Create global instance
const offlineDebug = new OfflineDebug()

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.offlineDebug = offlineDebug
}

export default offlineDebug
