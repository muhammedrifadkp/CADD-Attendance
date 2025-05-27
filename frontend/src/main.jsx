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
import offlineDebug from './utils/offlineDebug.js'

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
    console.log('✅ Offline services initialized successfully')

    // Enable debug mode in development
    if (import.meta.env.DEV) {
      offlineDebug.enable()
      console.log('🔍 Offline debug mode enabled for development')
      console.log('💡 Use window.offlineDebug.help() for debugging commands')
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
