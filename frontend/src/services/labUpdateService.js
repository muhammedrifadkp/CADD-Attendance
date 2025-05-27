import { toast } from 'react-toastify'

// Lab Update Service - Handles real-time lab availability updates
class LabUpdateService {
  constructor() {
    this.listeners = new Map()
    this.isInitialized = false
    this.updateQueue = []
    this.processingQueue = false
  }

  // Initialize the service
  init() {
    if (this.isInitialized) return
    
    console.log('🚀 Initializing Lab Update Service')
    this.setupEventListeners()
    this.isInitialized = true
  }

  // Setup event listeners for lab updates
  setupEventListeners() {
    // Listen for attendance-based lab updates
    window.addEventListener('labAvailabilityUpdate', this.handleLabUpdate.bind(this))
    
    // Listen for direct booking updates
    window.addEventListener('bookingUpdate', this.handleBookingUpdate.bind(this))
    
    // Listen for PC status updates
    window.addEventListener('pcStatusUpdate', this.handlePCUpdate.bind(this))
    
    console.log('✅ Lab update event listeners registered')
  }

  // Handle lab availability updates
  handleLabUpdate(event) {
    const { date, updates, type } = event.detail
    
    console.log('🔄 Lab availability update received:', {
      date,
      updates,
      type,
      timestamp: new Date().toISOString()
    })

    // Add to update queue
    this.queueUpdate({
      type: 'lab_availability',
      date,
      updates,
      timestamp: Date.now()
    })

    // Show user notification
    if (updates && updates.length > 0) {
      toast.info(`Lab availability updated - ${updates.length} booking(s) affected`, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    }
  }

  // Handle booking updates
  handleBookingUpdate(event) {
    const { booking, action } = event.detail
    
    console.log('📋 Booking update received:', { booking, action })
    
    this.queueUpdate({
      type: 'booking',
      booking,
      action,
      timestamp: Date.now()
    })
  }

  // Handle PC status updates
  handlePCUpdate(event) {
    const { pc, oldStatus, newStatus } = event.detail
    
    console.log('💻 PC status update received:', { pc, oldStatus, newStatus })
    
    this.queueUpdate({
      type: 'pc_status',
      pc,
      oldStatus,
      newStatus,
      timestamp: Date.now()
    })
  }

  // Queue updates for processing
  queueUpdate(update) {
    this.updateQueue.push(update)
    
    if (!this.processingQueue) {
      this.processUpdateQueue()
    }
  }

  // Process queued updates
  async processUpdateQueue() {
    if (this.processingQueue || this.updateQueue.length === 0) return
    
    this.processingQueue = true
    console.log('⚙️ Processing update queue:', this.updateQueue.length, 'updates')
    
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift()
      await this.processUpdate(update)
      
      // Small delay to prevent overwhelming the UI
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.processingQueue = false
    console.log('✅ Update queue processed')
  }

  // Process individual update
  async processUpdate(update) {
    const { type, timestamp } = update
    
    // Skip old updates (older than 30 seconds)
    if (Date.now() - timestamp > 30000) {
      console.log('⏰ Skipping old update:', type)
      return
    }
    
    // Notify all registered listeners
    this.notifyListeners(type, update)
  }

  // Notify all listeners for a specific update type
  notifyListeners(type, update) {
    const typeListeners = this.listeners.get(type) || []
    const allListeners = this.listeners.get('all') || []
    
    const allRelevantListeners = [...typeListeners, ...allListeners]
    
    console.log(`📢 Notifying ${allRelevantListeners.length} listeners for ${type}`)
    
    allRelevantListeners.forEach(listener => {
      try {
        listener(update)
      } catch (error) {
        console.error('❌ Error in update listener:', error)
      }
    })
  }

  // Register a listener for specific update types
  subscribe(types, callback) {
    if (!Array.isArray(types)) {
      types = [types]
    }
    
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    types.forEach(type => {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, [])
      }
      
      this.listeners.get(type).push(callback)
    })
    
    console.log(`✅ Subscribed to updates:`, types, 'ID:', listenerId)
    
    // Return unsubscribe function
    return () => {
      types.forEach(type => {
        const typeListeners = this.listeners.get(type) || []
        const index = typeListeners.indexOf(callback)
        if (index > -1) {
          typeListeners.splice(index, 1)
        }
      })
      console.log(`🔌 Unsubscribed from updates:`, types, 'ID:', listenerId)
    }
  }

  // Subscribe to all update types
  subscribeToAll(callback) {
    return this.subscribe(['all'], callback)
  }

  // Manually trigger a lab refresh (for testing or manual refresh)
  triggerLabRefresh(reason = 'manual') {
    console.log('🔄 Manually triggering lab refresh:', reason)
    
    const event = new CustomEvent('labAvailabilityUpdate', {
      detail: {
        date: new Date().toISOString().split('T')[0],
        updates: [],
        type: 'manual_refresh',
        reason
      }
    })
    
    window.dispatchEvent(event)
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.isInitialized,
      queueLength: this.updateQueue.length,
      processingQueue: this.processingQueue,
      listenerCount: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0)
    }
  }

  // Cleanup
  destroy() {
    console.log('🧹 Destroying Lab Update Service')
    
    window.removeEventListener('labAvailabilityUpdate', this.handleLabUpdate.bind(this))
    window.removeEventListener('bookingUpdate', this.handleBookingUpdate.bind(this))
    window.removeEventListener('pcStatusUpdate', this.handlePCUpdate.bind(this))
    
    this.listeners.clear()
    this.updateQueue = []
    this.isInitialized = false
  }
}

// Create singleton instance
const labUpdateService = new LabUpdateService()

export default labUpdateService
