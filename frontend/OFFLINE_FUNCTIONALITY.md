# Offline Functionality Documentation

## Overview

The CADD Attendance Management System now includes comprehensive offline functionality that allows users to continue working even when internet connectivity is unavailable. The system automatically syncs data when the connection is restored.

## Features

### 🔄 Automatic Data Synchronization
- **Background Sync**: Automatically syncs data when connection is restored
- **Queue Management**: Offline operations are queued and processed when online
- **Conflict Resolution**: Handles data conflicts intelligently
- **Retry Logic**: Failed sync operations are automatically retried

### 💾 Local Data Storage
- **IndexedDB Integration**: Uses browser's IndexedDB for robust local storage
- **Structured Data**: Organized storage for students, batches, teachers, attendance, and lab bookings
- **Efficient Queries**: Fast data retrieval with indexed searches
- **Data Persistence**: Data survives browser restarts and updates

### 🌐 Service Worker Caching
- **Static Asset Caching**: App shell and resources cached for offline use
- **API Response Caching**: Frequently accessed data cached locally
- **Network-First Strategy**: Always tries network first, falls back to cache
- **Cache Management**: Automatic cleanup of old cache versions

### 📱 Progressive Web App (PWA)
- **Offline Indicator**: Visual feedback about connection status
- **Install Prompt**: Can be installed as a native app
- **Background Sync**: Syncs data even when app is closed
- **Push Notifications**: (Future enhancement for sync status)

## Architecture

### Service Worker (`frontend/public/sw.js`)
- Handles network requests and caching strategies
- Manages background synchronization
- Provides offline fallbacks for API requests
- Implements cache-first for static assets, network-first for API calls

### IndexedDB Service (`frontend/src/services/indexedDB.js`)
- Provides abstraction layer over IndexedDB
- Handles data storage, retrieval, and management
- Supports bulk operations and indexed queries
- Manages sync queue for offline operations

### Offline Service (`frontend/src/services/offlineService.js`)
- Manages offline state detection
- Handles operation queuing for sync
- Provides event-driven architecture for status updates
- Coordinates between different offline components

### Sync Service (`frontend/src/services/syncService.js`)
- Handles actual data synchronization with server
- Processes queued operations when online
- Manages conflict resolution and retry logic
- Provides sync status and progress information

### React Hooks (`frontend/src/hooks/useOffline.js`)
- `useOffline()`: Main hook for offline state management
- `useOfflineData()`: Hook for specific data type management
- Provides reactive state updates for UI components
- Handles local data operations and sync triggers

## Usage

### Basic Implementation

```jsx
import { useOffline } from '../hooks/useOffline'

function MyComponent() {
  const {
    isOnline,
    isOffline,
    isSyncing,
    pendingOperations,
    forceSync
  } = useOffline()

  return (
    <div>
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      {pendingOperations > 0 && (
        <p>{pendingOperations} operations pending sync</p>
      )}
      {isOnline && (
        <button onClick={forceSync}>Force Sync</button>
      )}
    </div>
  )
}
```

### Data Management

```jsx
import { useOfflineData } from '../hooks/useOffline'

function StudentsList() {
  const {
    data: students,
    loading,
    error,
    reload
  } = useOfflineData('students')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {students.map(student => (
        <div key={student._id}>{student.name}</div>
      ))}
    </div>
  )
}
```

### API Integration

The existing API services automatically handle offline scenarios:

```jsx
import { attendanceAPI } from '../services/api'

// This will work offline - operations are queued for sync
const markAttendance = async (attendanceData) => {
  try {
    await attendanceAPI.markAttendance(attendanceData)
    // Success - either sent to server or queued for sync
  } catch (error) {
    // Handle error
  }
}
```

## Data Storage Structure

### IndexedDB Stores

1. **students**: Student records with indexes on rollNo, batch, and name
2. **batches**: Batch information with indexes on name and createdBy
3. **teachers**: Teacher records with indexes on email and name
4. **attendance**: Attendance records with indexes on student, batch, and date
5. **labBookings**: Lab booking records with indexes on PC, date, and timeSlot
6. **pcs**: PC information with indexes on pcNumber, rowNumber, and status
7. **syncQueue**: Pending operations for synchronization
8. **metadata**: App metadata including sync timestamps

### Sync Queue Operations

Operations are stored with the following structure:
```javascript
{
  id: 'auto-generated',
  type: 'attendance|labBooking|student',
  method: 'POST|PUT|DELETE',
  data: { /* operation data */ },
  endpoint: '/api/endpoint',
  timestamp: 1234567890,
  status: 'pending|completed|failed',
  retryCount: 0
}
```

## Testing

### Manual Testing

1. **Go Offline**: Disable network in browser dev tools
2. **Perform Operations**: Mark attendance, book lab slots, etc.
3. **Check Offline Indicator**: Should show pending operations
4. **Go Online**: Re-enable network
5. **Verify Sync**: Operations should sync automatically

### Test Page

Access the test page at `/test-offline` (when added to routes) to:
- View connection status
- Test offline storage
- Test operation queuing
- Test sync functionality
- View sample data

### Browser Developer Tools

Monitor offline functionality using:
- **Application Tab**: View IndexedDB data and Service Worker status
- **Network Tab**: Simulate offline conditions
- **Console**: View sync logs and error messages

## Configuration

### Cache Settings

Modify cache settings in `frontend/public/sw.js`:
```javascript
const CACHE_NAME = 'cadd-attendance-v1'
const STATIC_CACHE = 'cadd-static-v1'
const API_CACHE = 'cadd-api-v1'
```

### Sync Intervals

Adjust sync check intervals in `frontend/src/services/offlineService.js`:
```javascript
// Check every 30 seconds
setTimeout(() => {
  if (this.isOnline && !this.syncInProgress) {
    this.startSync()
  }
  this.scheduleSyncCheck()
}, 30000)
```

### Cacheable API Patterns

Configure which API endpoints are cached in `frontend/src/services/api.js`:
```javascript
const CACHEABLE_API_PATTERNS = [
  /\/api\/batches$/,
  /\/api\/students$/,
  /\/api\/users\/teachers$/,
  /\/api\/users\/profile$/,
  /\/api\/lab\/pcs$/
]
```

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check browser console for registration errors
   - Ensure HTTPS or localhost for service worker support
   - Verify `sw.js` file is accessible

2. **Data Not Syncing**
   - Check network connectivity
   - Verify sync queue in IndexedDB
   - Check browser console for sync errors

3. **Cache Issues**
   - Clear browser cache and storage
   - Update cache version numbers
   - Check Application tab in dev tools

4. **IndexedDB Errors**
   - Check browser support for IndexedDB
   - Verify database schema in dev tools
   - Clear IndexedDB data if corrupted

### Debug Information

Enable debug logging by setting:
```javascript
localStorage.setItem('debug-offline', 'true')
```

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11.3+)
- **Edge**: Full support
- **Internet Explorer**: Not supported

## Security Considerations

- All offline data is stored locally in the browser
- No sensitive authentication tokens are cached
- Data is automatically cleared when user logs out
- Service worker only caches public assets and user-specific data

## Performance

- **Initial Load**: Slightly slower due to service worker registration
- **Subsequent Loads**: Faster due to caching
- **Offline Performance**: Near-native speed for cached operations
- **Sync Performance**: Batched operations for efficiency

## Future Enhancements

- Push notifications for sync status
- Conflict resolution UI for data conflicts
- Advanced caching strategies
- Offline-first architecture improvements
- Background app refresh capabilities
