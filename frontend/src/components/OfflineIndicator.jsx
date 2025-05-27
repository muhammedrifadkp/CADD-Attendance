// Offline indicator component to show connection status and sync information
import { useState } from 'react'
import {
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useOffline } from '../hooks/useOffline'

const OfflineIndicator = () => {
  const {
    isOnline,
    isOffline,
    isSyncing,
    pendingOperations,
    lastSyncFormatted,
    syncError,
    hasPendingOperations,
    forceSync
  } = useOffline()

  const [showDetails, setShowDetails] = useState(false)

  // Don't show anything if online and no pending operations
  if (isOnline && !hasPendingOperations && !isSyncing) {
    return null
  }

  const handleForceSync = async () => {
    await forceSync()
  }

  const getStatusColor = () => {
    if (isOffline) return 'bg-red-500'
    if (isSyncing) return 'bg-blue-500'
    if (hasPendingOperations) return 'bg-yellow-500'
    if (syncError) return 'bg-red-500'
    return 'bg-green-500'
  }

  const getStatusIcon = () => {
    if (isOffline) return <ExclamationTriangleIcon className="h-4 w-4" />
    if (isSyncing) return <ArrowPathIcon className="h-4 w-4 animate-spin" />
    if (hasPendingOperations) return <ClockIcon className="h-4 w-4" />
    if (syncError) return <XCircleIcon className="h-4 w-4" />
    return <CheckCircleIcon className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isOffline) return 'Offline'
    if (isSyncing) return 'Syncing...'
    if (hasPendingOperations) return `${pendingOperations} pending`
    if (syncError) return 'Sync failed'
    return 'Online'
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Main indicator */}
      <div
        className={`${getStatusColor()} text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          <InformationCircleIcon className="h-4 w-4 opacity-70" />
        </div>
      </div>

      {/* Details panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="space-y-3">
            {/* Connection status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Connection</span>
              <div className="flex items-center space-x-2">
                <WifiIcon className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Sync status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Sync Status</span>
              <div className="flex items-center space-x-2">
                {isSyncing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
                    <span className="text-sm text-blue-600">Syncing...</span>
                  </>
                ) : syncError ? (
                  <>
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Failed</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Up to date</span>
                  </>
                )}
              </div>
            </div>

            {/* Pending operations */}
            {hasPendingOperations && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Pending Changes</span>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600">{pendingOperations} items</span>
                </div>
              </div>
            )}

            {/* Last sync time */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Last Sync</span>
              <span className="text-sm text-gray-600">{lastSyncFormatted}</span>
            </div>

            {/* Error message */}
            {syncError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Sync Error</p>
                    <p className="text-sm text-red-600 mt-1">{syncError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Offline message */}
            {isOffline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Working Offline</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Changes will be saved locally and synced when connection is restored.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending operations info */}
            {hasPendingOperations && isOnline && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Pending Sync</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {pendingOperations} change{pendingOperations > 1 ? 's' : ''} waiting to be synced to the server.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              {isOnline && (
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSyncing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Syncing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>Sync Now</span>
                    </div>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setShowDetails(false)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close details */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  )
}

export default OfflineIndicator
