// Service Worker for CADD Attendance Management System
// Provides offline functionality and caching strategies

const CACHE_NAME = 'cadd-attendance-v1'
const STATIC_CACHE = 'cadd-static-v1'
const API_CACHE = 'cadd-api-v1'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logos/cadd_logo.png'
]

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/batches$/,
  /\/api\/students$/,
  /\/api\/users\/teachers$/,
  /\/api\/users\/profile$/,
  /\/api\/lab\/pcs$/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('Service Worker: API cache initialized')
        return cache
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
    return
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url)
  const isCacheable = CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname))
  
  if (!isCacheable) {
    // For non-cacheable requests, try network only
    try {
      return await fetch(request)
    } catch (error) {
      console.log('Service Worker: Network request failed:', error)
      return new Response(
        JSON.stringify({ error: 'Network unavailable', offline: true }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  // Network-first strategy for cacheable API requests
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
      console.log('Service Worker: Cached API response:', url.pathname)
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', url.pathname)
    
    // Try to get from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', url.pathname)
      return cachedResponse
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Data unavailable offline', 
        offline: true,
        message: 'This data is not available offline. Please check your connection.'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Try network
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Static asset not available:', request.url)
    
    // Return a basic offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html')
    }
    
    return new Response('Resource not available offline', { status: 503 })
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendanceData())
  } else if (event.tag === 'booking-sync') {
    event.waitUntil(syncBookingData())
  }
})

// Sync attendance data when online
async function syncAttendanceData() {
  try {
    // This will be implemented with IndexedDB integration
    console.log('Service Worker: Syncing attendance data...')
    
    // Notify the main thread about sync completion
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { type: 'attendance' }
      })
    })
  } catch (error) {
    console.error('Service Worker: Attendance sync failed:', error)
  }
}

// Sync booking data when online
async function syncBookingData() {
  try {
    console.log('Service Worker: Syncing booking data...')
    
    // Notify the main thread about sync completion
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { type: 'booking' }
      })
    })
  } catch (error) {
    console.error('Service Worker: Booking sync failed:', error)
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'CACHE_API_RESPONSE':
      cacheAPIResponse(data.request, data.response)
      break
    default:
      console.log('Service Worker: Unknown message type:', type)
  }
})

// Cache API response manually
async function cacheAPIResponse(requestData, responseData) {
  try {
    const cache = await caches.open(API_CACHE)
    const request = new Request(requestData.url, requestData)
    const response = new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    })
    await cache.put(request, response)
    console.log('Service Worker: Manually cached API response:', requestData.url)
  } catch (error) {
    console.error('Service Worker: Failed to cache API response:', error)
  }
}
