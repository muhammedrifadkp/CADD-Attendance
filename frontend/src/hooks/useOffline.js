// React hook for managing offline state and synchronization
import { useState, useEffect, useCallback } from 'react'
import { offlineService } from '../services/offlineService.js'
import { syncService } from '../services/syncService.js'

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingOperations, setPendingOperations] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [syncError, setSyncError] = useState(null)

  // Update pending operations count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineService.getPendingOperationsCount()
      setPendingOperations(count)
    } catch (error) {
      console.error('useOffline: Failed to get pending operations count:', error)
    }
  }, [])

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await syncService.getSyncStatus()
      if (status) {
        setIsSyncing(status.inProgress)
        setPendingOperations(status.pendingOperations)
        
        // Get the most recent sync time
        const syncTimes = Object.values(status.lastSync).filter(Boolean)
        if (syncTimes.length > 0) {
          setLastSyncTime(Math.max(...syncTimes))
        }
      }
    } catch (error) {
      console.error('useOffline: Failed to get sync status:', error)
    }
  }, [])

  // Handle offline service events
  useEffect(() => {
    const handleOfflineEvent = (event) => {
      switch (event.type) {
        case 'online':
          setIsOnline(true)
          setSyncError(null)
          break
          
        case 'offline':
          setIsOnline(false)
          break
          
        case 'syncStart':
          setIsSyncing(true)
          setSyncError(null)
          break
          
        case 'syncComplete':
          setIsSyncing(false)
          if (event.success) {
            setLastSyncTime(Date.now())
            setSyncError(null)
          } else {
            setSyncError(event.error || 'Sync failed')
          }
          updatePendingCount()
          break
          
        case 'operationQueued':
          updatePendingCount()
          break
          
        default:
          break
      }
    }

    // Subscribe to offline service events
    const unsubscribe = offlineService.addListener(handleOfflineEvent)
    
    // Initial status update
    setIsOnline(offlineService.isOnline)
    setIsSyncing(offlineService.isSyncing())
    updateSyncStatus()
    
    return unsubscribe
  }, [updatePendingCount, updateSyncStatus])

  // Force sync function
  const forceSync = useCallback(async () => {
    try {
      setSyncError(null)
      const success = await offlineService.forceSync()
      return success
    } catch (error) {
      setSyncError(error.message)
      return false
    }
  }, [])

  // Queue operation for offline sync
  const queueOperation = useCallback(async (type, method, data, endpoint) => {
    try {
      await offlineService.queueOperation(type, method, data, endpoint)
      updatePendingCount()
    } catch (error) {
      console.error('useOffline: Failed to queue operation:', error)
      throw error
    }
  }, [updatePendingCount])

  // Save data locally
  const saveDataLocally = useCallback(async (type, data) => {
    try {
      await offlineService.saveDataLocally(type, data)
    } catch (error) {
      console.error('useOffline: Failed to save data locally:', error)
      throw error
    }
  }, [])

  // Get data locally
  const getDataLocally = useCallback(async (type, params = {}) => {
    try {
      return await offlineService.getDataLocally(type, params)
    } catch (error) {
      console.error('useOffline: Failed to get data locally:', error)
      return []
    }
  }, [])

  // Clear all local data
  const clearLocalData = useCallback(async () => {
    try {
      await offlineService.clearAllData()
      setPendingOperations(0)
      setLastSyncTime(null)
    } catch (error) {
      console.error('useOffline: Failed to clear local data:', error)
      throw error
    }
  }, [])

  // Get formatted last sync time
  const getLastSyncFormatted = useCallback(() => {
    if (!lastSyncTime) return 'Never'
    
    const now = Date.now()
    const diff = now - lastSyncTime
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now'
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diff / 86400000)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }, [lastSyncTime])

  // Check if data is stale (needs sync)
  const isDataStale = useCallback((maxAge = 5 * 60 * 1000) => { // 5 minutes default
    if (!lastSyncTime) return true
    return (Date.now() - lastSyncTime) > maxAge
  }, [lastSyncTime])

  return {
    // State
    isOnline,
    isOffline: !isOnline,
    isSyncing,
    pendingOperations,
    lastSyncTime,
    syncError,
    
    // Computed values
    lastSyncFormatted: getLastSyncFormatted(),
    isDataStale: isDataStale(),
    hasPendingOperations: pendingOperations > 0,
    
    // Actions
    forceSync,
    queueOperation,
    saveDataLocally,
    getDataLocally,
    clearLocalData,
    updateSyncStatus,
    
    // Utilities
    isDataStaleCheck: isDataStale
  }
}

// Hook for specific data type offline management
export const useOfflineData = (dataType, params = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isOffline, getDataLocally, saveDataLocally } = useOffline()

  // Load data (from local storage if offline)
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (isOffline) {
        // Load from local storage
        const localData = await getDataLocally(dataType, params)
        setData(localData)
      } else {
        // This would typically load from API and save locally
        // For now, just load from local storage
        const localData = await getDataLocally(dataType, params)
        setData(localData)
      }
    } catch (err) {
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [dataType, params, isOffline, getDataLocally])

  // Save data locally
  const saveData = useCallback(async (newData) => {
    try {
      await saveDataLocally(dataType, newData)
      setData(Array.isArray(newData) ? newData : [newData])
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [dataType, saveDataLocally])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    loading,
    error,
    reload: loadData,
    save: saveData
  }
}

export default useOffline
