const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Student',
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Batch',
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
      default: Date.now,
    },
    status: {
      type: String,
      required: [true, 'Please add a status'],
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a student can only have one attendance record per day per batch
attendanceSchema.index({ student: 1, batch: 1, date: 1 }, { unique: true });

// Additional indexes for performance
attendanceSchema.index({ batch: 1, date: 1 });
attendanceSchema.index({ markedBy: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ date: 1 });

// Validation middleware
attendanceSchema.pre('save', async function(next) {
  // Ensure date is not in the future
  if (this.date > new Date()) {
    const error = new Error('Attendance date cannot be in the future');
    return next(error);
  }

  // Ensure student belongs to the batch
  const Student = require('./studentModel');
  const student = await Student.findById(this.student);

  if (student && student.batch.toString() !== this.batch.toString()) {
    const error = new Error('Student does not belong to the specified batch');
    return next(error);
  }

  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
