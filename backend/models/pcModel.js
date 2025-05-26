const mongoose = require('mongoose');

const pcSchema = mongoose.Schema(
  {
    pcNumber: {
      type: String,
      required: [true, 'Please add a PC number'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Allow any format like CS-01, SS-05, MS-67, etc.
          return /^[A-Z]{1,3}-\d{1,3}$/.test(v);
        },
        message: 'PC number must be in format XX-XX (e.g., CS-01, SS-05, MS-67)'
      }
    },
    rowNumber: {
      type: Number,
      required: [true, 'Please add a row number'],
      min: 1,
      max: 4,
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active',
    },
    specifications: {
      processor: {
        type: String,
        trim: true,
      },
      ram: {
        type: String,
        trim: true,
      },
      storage: {
        type: String,
        trim: true,
      },
      graphics: {
        type: String,
        trim: true,
      },
      monitor: {
        type: String,
        trim: true,
      },
    },
    lastMaintenance: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
pcSchema.index({ rowNumber: 1, pcNumber: 1 });

module.exports = mongoose.model('PC', pcSchema);
