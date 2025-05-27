// System health check utility to verify all APIs and functions are working
import { authAPI, studentsAPI, batchesAPI, teachersAPI, attendanceAPI } from '../services/api.js'
import { pcAPI, bookingAPI, labStatsAPI } from '../services/labAPI.js'
import { offlineService } from '../services/offlineService.js'
import { indexedDBService } from '../services/indexedDB.js'

class SystemHealthCheck {
  constructor() {
    this.results = {
      backend: {},
      frontend: {},
      offline: {},
      overall: 'unknown'
    }
  }

  // Run comprehensive health check
  async runFullHealthCheck() {
    console.group('🏥 System Health Check Starting...')
    
    try {
      // Check backend connectivity
      await this.checkBackendHealth()
      
      // Check frontend APIs
      await this.checkFrontendAPIs()
      
      // Check offline functionality
      await this.checkOfflineFunctionality()
      
      // Calculate overall health
      this.calculateOverallHealth()
      
      // Display results
      this.displayResults()
      
      return this.results
    } catch (error) {
      console.error('❌ Health check failed:', error)
      this.results.overall = 'critical'
      return this.results
    } finally {
      console.groupEnd()
    }
  }

  // Check backend server connectivity
  async checkBackendHealth() {
    console.group('🔧 Backend Health Check')
    
    try {
      // Test basic server connectivity
      const response = await fetch('/api/test')
      if (response.ok) {
        const data = await response.json()
        this.results.backend.connectivity = 'healthy'
        this.results.backend.serverTime = data.timestamp
        console.log('✅ Backend server is responding')
      } else {
        this.results.backend.connectivity = 'unhealthy'
        console.log('❌ Backend server not responding properly')
      }
    } catch (error) {
      this.results.backend.connectivity = 'critical'
      this.results.backend.error = error.message
      console.log('❌ Backend server unreachable:', error.message)
    }
    
    console.groupEnd()
  }

  // Check frontend API endpoints
  async checkFrontendAPIs() {
    console.group('🌐 Frontend API Health Check')
    
    const apiTests = [
      { name: 'Auth Profile', test: () => authAPI.getProfile() },
      { name: 'Students List', test: () => studentsAPI.getStudents() },
      { name: 'Batches List', test: () => batchesAPI.getBatches() },
      { name: 'Teachers List', test: () => teachersAPI.getTeachers() },
      { name: 'PCs List', test: () => pcAPI.getPCs() },
      { name: 'Lab Stats', test: () => labStatsAPI.getOverviewStats() }
    ]

    for (const apiTest of apiTests) {
      try {
        await apiTest.test()
        this.results.frontend[apiTest.name] = 'healthy'
        console.log(`✅ ${apiTest.name} API working`)
      } catch (error) {
        this.results.frontend[apiTest.name] = 'unhealthy'
        this.results.frontend[`${apiTest.name}_error`] = error.message
        console.log(`❌ ${apiTest.name} API failed:`, error.message)
      }
    }
    
    console.groupEnd()
  }

  // Check offline functionality
  async checkOfflineFunctionality() {
    console.group('📱 Offline Functionality Check')
    
    try {
      // Check IndexedDB
      await indexedDBService.init()
      this.results.offline.indexedDB = 'healthy'
      console.log('✅ IndexedDB initialized')
      
      // Check offline service
      await offlineService.ensureInitialized()
      this.results.offline.offlineService = 'healthy'
      console.log('✅ Offline service initialized')
      
      // Test data storage
      const testData = { _id: 'health-check-' + Date.now(), name: 'Test Item' }
      await offlineService.saveDataLocally('students', [testData])
      const retrievedData = await offlineService.getDataLocally('students')
      
      if (retrievedData.some(item => item._id === testData._id)) {
        this.results.offline.dataStorage = 'healthy'
        console.log('✅ Offline data storage working')
        
        // Clean up test data
        const filteredData = retrievedData.filter(item => item._id !== testData._id)
        await offlineService.saveDataLocally('students', filteredData)
      } else {
        this.results.offline.dataStorage = 'unhealthy'
        console.log('❌ Offline data storage not working')
      }
      
      // Check service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration && registration.active) {
          this.results.offline.serviceWorker = 'healthy'
          console.log('✅ Service worker active')
        } else {
          this.results.offline.serviceWorker = 'unhealthy'
          console.log('❌ Service worker not active')
        }
      } else {
        this.results.offline.serviceWorker = 'unsupported'
        console.log('⚠️ Service worker not supported')
      }
      
    } catch (error) {
      this.results.offline.error = error.message
      console.log('❌ Offline functionality check failed:', error.message)
    }
    
    console.groupEnd()
  }

  // Calculate overall system health
  calculateOverallHealth() {
    const allResults = [
      ...Object.values(this.results.backend),
      ...Object.values(this.results.frontend),
      ...Object.values(this.results.offline)
    ].filter(result => typeof result === 'string' && ['healthy', 'unhealthy', 'critical'].includes(result))

    const healthyCount = allResults.filter(r => r === 'healthy').length
    const unhealthyCount = allResults.filter(r => r === 'unhealthy').length
    const criticalCount = allResults.filter(r => r === 'critical').length

    if (criticalCount > 0) {
      this.results.overall = 'critical'
    } else if (unhealthyCount > healthyCount) {
      this.results.overall = 'unhealthy'
    } else if (healthyCount > 0) {
      this.results.overall = 'healthy'
    } else {
      this.results.overall = 'unknown'
    }
  }

  // Display formatted results
  displayResults() {
    console.group('📊 Health Check Results')
    
    const getStatusEmoji = (status) => {
      switch (status) {
        case 'healthy': return '✅'
        case 'unhealthy': return '⚠️'
        case 'critical': return '❌'
        case 'unsupported': return '🚫'
        default: return '❓'
      }
    }

    console.log(`${getStatusEmoji(this.results.overall)} Overall System Health: ${this.results.overall.toUpperCase()}`)
    
    console.group('🔧 Backend')
    Object.entries(this.results.backend).forEach(([key, value]) => {
      if (!key.endsWith('_error')) {
        console.log(`${getStatusEmoji(value)} ${key}: ${value}`)
      }
    })
    console.groupEnd()
    
    console.group('🌐 Frontend APIs')
    Object.entries(this.results.frontend).forEach(([key, value]) => {
      if (!key.endsWith('_error')) {
        console.log(`${getStatusEmoji(value)} ${key}: ${value}`)
      }
    })
    console.groupEnd()
    
    console.group('📱 Offline Features')
    Object.entries(this.results.offline).forEach(([key, value]) => {
      if (!key.endsWith('_error')) {
        console.log(`${getStatusEmoji(value)} ${key}: ${value}`)
      }
    })
    console.groupEnd()
    
    console.groupEnd()
  }

  // Quick health check (essential services only)
  async quickHealthCheck() {
    console.log('🏥 Quick Health Check...')
    
    const checks = [
      { name: 'Backend', test: () => fetch('/api/test') },
      { name: 'IndexedDB', test: () => indexedDBService.init() },
      { name: 'Offline Service', test: () => offlineService.ensureInitialized() }
    ]

    const results = {}
    for (const check of checks) {
      try {
        await check.test()
        results[check.name] = '✅ Healthy'
      } catch (error) {
        results[check.name] = '❌ Failed'
      }
    }

    console.table(results)
    return results
  }

  // Get system information
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      indexedDBSupported: 'indexedDB' in window,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test')
          localStorage.removeItem('test')
          return true
        } catch {
          return false
        }
      })(),
      currentTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  // Help function
  help() {
    console.group('🏥 System Health Check Help')
    console.log('Available commands:')
    console.log('  systemHealth.runFullHealthCheck() - Complete system health check')
    console.log('  systemHealth.quickHealthCheck() - Quick essential services check')
    console.log('  systemHealth.getSystemInfo() - Get system information')
    console.log('  systemHealth.checkBackendHealth() - Check backend only')
    console.log('  systemHealth.checkOfflineFunctionality() - Check offline features only')
    console.log('  systemHealth.help() - Show this help')
    console.groupEnd()
  }
}

// Create global instance
const systemHealth = new SystemHealthCheck()

// Make it available globally
if (typeof window !== 'undefined') {
  window.systemHealth = systemHealth
}

export default systemHealth
