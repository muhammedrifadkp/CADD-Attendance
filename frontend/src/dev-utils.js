// Development utilities - only loaded in development mode
// This file is excluded from production builds

import offlineDebug from './utils/offlineDebug.js'
import offlineTestData from './utils/offlineTestData.js'
import systemHealth from './utils/systemHealthCheck.js'

// Initialize debug utilities
export function initializeDevUtils() {
  try {
    // Enable offline debug
    offlineDebug.enable()
    
    // Make utilities available globally
    window.offlineDebug = offlineDebug
    window.offlineTestData = offlineTestData
    window.systemHealth = systemHealth
    
    console.log('🔍 Offline debug mode enabled for development')
    console.log('💡 Use window.offlineDebug.help() for debugging commands')
    console.log('🧪 Use window.offlineTestData.help() for test data commands')
    console.log('🏥 Use window.systemHealth.help() for system health checks')
    
    return true
  } catch (error) {
    console.warn('Debug utilities not available:', error)
    return false
  }
}

// Auto-initialize if in development
if (import.meta.env.DEV) {
  // Small delay to ensure other services are initialized first
  setTimeout(() => {
    initializeDevUtils()
  }, 1000)
}
