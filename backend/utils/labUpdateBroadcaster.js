const EventEmitter = require('events');

// Create a global event emitter for lab updates
class LabUpdateBroadcaster extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Allow many listeners
  }

  // Broadcast lab availability update
  broadcastLabUpdate(data) {
    console.log('📡 Broadcasting lab update:', data);
    this.emit('labAvailabilityUpdate', data);
  }

  // Broadcast PC status change
  broadcastPCUpdate(data) {
    console.log('📡 Broadcasting PC update:', data);
    this.emit('pcStatusUpdate', data);
  }

  // Broadcast booking change
  broadcastBookingUpdate(data) {
    console.log('📡 Broadcasting booking update:', data);
    this.emit('bookingUpdate', data);
  }

  // Subscribe to lab updates
  onLabUpdate(callback) {
    this.on('labAvailabilityUpdate', callback);
  }

  // Subscribe to PC updates
  onPCUpdate(callback) {
    this.on('pcStatusUpdate', callback);
  }

  // Subscribe to booking updates
  onBookingUpdate(callback) {
    this.on('bookingUpdate', callback);
  }
}

// Create a singleton instance
const labUpdateBroadcaster = new LabUpdateBroadcaster();

module.exports = labUpdateBroadcaster;
