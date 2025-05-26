const mongoose = require('mongoose');

const labBookingSchema = mongoose.Schema(
  {
    pc: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'PC',
    },
    date: {
      type: Date,
      required: [true, 'Please add a booking date'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Please add a time slot'],
      enum: [
        '09:00-10:30',
        '10:30-12:00',
        '12:00-13:30',
        '14:00-15:30',
        '15:30-17:00'
      ],
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    bookedFor: {
      type: String,
      required: [true, 'Please specify who the booking is for'],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Please add the purpose of booking'],
      trim: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    studentName: {
      type: String,
      trim: true,
    },
    teacherName: {
      type: String,
      trim: true,
    },
    studentCount: {
      type: Number,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    notes: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent double booking
labBookingSchema.index({ pc: 1, date: 1, timeSlot: 1 }, { unique: true });

// Index for efficient queries
labBookingSchema.index({ date: 1, timeSlot: 1 });
labBookingSchema.index({ bookedBy: 1 });

// Index for student conflict checking
labBookingSchema.index({ studentName: 1, date: 1, timeSlot: 1 });

module.exports = mongoose.model('LabBooking', labBookingSchema);
