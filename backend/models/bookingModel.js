const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  pc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PC',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  bookedFor: {
    type: String,
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  studentName: {
    type: String,
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  purpose: {
    type: String,
    default: 'Lab Session'
  },
  notes: String,
  status: {
    type: String,
    enum: ['booked', 'completed', 'cancelled', 'no-show'],
    default: 'booked'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ date: 1, timeSlot: 1 });
bookingSchema.index({ pc: 1, date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookedBy: 1 });
bookingSchema.index({ student: 1 });
bookingSchema.index({ batch: 1 });

// Compound indexes for common queries
bookingSchema.index({ pc: 1, date: 1, timeSlot: 1 }, { unique: true });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ batch: 1, date: 1 });

// Validation middleware
bookingSchema.pre('save', async function(next) {
  // Ensure booking date is not in the past (except for today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.date < today) {
    const error = new Error('Cannot book for past dates');
    return next(error);
  }

  // Validate student belongs to batch if both are provided
  if (this.student && this.batch) {
    const Student = require('./studentModel');
    const student = await Student.findById(this.student);

    if (student && student.batch.toString() !== this.batch.toString()) {
      const error = new Error('Student does not belong to the specified batch');
      return next(error);
    }
  }

  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
