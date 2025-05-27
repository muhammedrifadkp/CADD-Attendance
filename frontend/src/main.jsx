import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Initialize offline services
import { offlineService } from './services/offlineService.js'
import { indexedDBService } from './services/indexedDB.js'
import { dataPreloader } from './services/dataPreloader.js'
// Debug utilities will be imported conditionally in development

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                console.log('New service worker available')
                // You could show a notification to the user here
              }
            })
          }
        })
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Initialize offline services
async function initializeOfflineServices() {
  try {
    console.log('Initializing offline services...')
    await indexedDBService.init()
    await offlineService.init()

    // Setup data preloader
    dataPreloader.setupAutoPreload()

    console.log('✅ Offline services initialized successfully')

    // Load development utilities only in development mode
    if (import.meta.env.DEV) {
      console.log('🔍 Development mode detected - loading debug utilities...')

      // Dynamically import development utilities to avoid production build issues
      import('./dev-utils.js').catch(error => {
        console.warn('Development utilities not available:', error)
      })
    }

    // Preload essential data if online
    if (navigator.onLine) {
      setTimeout(() => {
        dataPreloader.preloadEssentialData()
      }, 2000) // Wait 2 seconds for app to settle
    }
  } catch (error) {
    console.error('❌ Failed to initialize offline services:', error)
  }
}

// Initialize offline services when the app starts
initializeOfflineServices()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
