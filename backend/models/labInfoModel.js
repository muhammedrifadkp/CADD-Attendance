const mongoose = require('mongoose');

const labInfoSchema = mongoose.Schema({
  instituteName: {
    type: String,
    required: true,
    default: 'CADD Centre'
  },
  labName: {
    type: String,
    required: true,
    default: 'Computer Lab'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  capacity: {
    totalPCs: {
      type: Number,
      default: 0
    },
    totalRows: {
      type: Number,
      default: 0
    }
  },
  operatingHours: {
    weekdays: {
      open: {
        type: String,
        default: '09:00'
      },
      close: {
        type: String,
        default: '18:00'
      }
    },
    weekends: {
      open: {
        type: String,
        default: '09:00'
      },
      close: {
        type: String,
        default: '17:00'
      }
    }
  },
  timeSlots: [{
    name: String,
    startTime: String,
    endTime: String,
    duration: Number // in minutes
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LabInfo', labInfoSchema);
