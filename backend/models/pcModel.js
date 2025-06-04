const mongoose = require('mongoose');

const pcSchema = mongoose.Schema({
  pcNumber: {
    type: String,
    required: true,
    unique: true
  },
  row: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4'],
    validate: {
      validator: function(v) {
        return ['1', '2', '3', '4'].includes(v);
      },
      message: 'Row must be 1, 2, 3, or 4'
    }
  },
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  specifications: {
    processor: String,
    ram: String,
    storage: String,
    graphics: String,
    monitor: String
  },
  lastMaintenance: {
    type: Date,
    default: Date.now
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
pcSchema.index({ row: 1, position: 1 });
pcSchema.index({ status: 1 });

module.exports = mongoose.model('PC', pcSchema);
