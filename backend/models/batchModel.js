const mongoose = require('mongoose');

const batchSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a batch name'],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a course'],
      ref: 'Course',
    },
    academicYear: {
      type: String,
      required: [true, 'Please add an academic year'],
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Please add a section'],
      trim: true,
    },
    timing: {
      type: String,
      required: [true, 'Please add batch timing'],
      enum: [
        '09:00 AM - 10:30 AM',
        '10:30 AM - 12:00 PM',
        '12:00 PM - 01:30 PM',
        '02:00 PM - 03:30 PM',
        '03:30 PM - 05:00 PM'
      ],
    },
    startDate: {
      type: Date,
      required: [true, 'Please add batch start date'],
    },
    endDate: {
      type: Date,
      required: false, // End date will be set when batch is marked as finished
    },
    maxStudents: {
      type: Number,
      min: [1, 'Must allow at least 1 student'],
      max: [50, 'Cannot exceed 50 students'],
      default: 20,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for students
batchSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'batch',
  justOne: false,
});

// Virtual for student count
batchSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'batch',
  count: true,
});

// Indexes for performance
batchSchema.index({ course: 1 });
batchSchema.index({ createdBy: 1 });
batchSchema.index({ academicYear: 1 });
batchSchema.index({ isArchived: 1 });
batchSchema.index({ isFinished: 1 });
batchSchema.index({ startDate: 1 });
batchSchema.index({ timing: 1 });

// Compound indexes for common queries
batchSchema.index({ course: 1, academicYear: 1 });
batchSchema.index({ course: 1, isArchived: 1 });
batchSchema.index({ createdBy: 1, isArchived: 1 });

// Validation middleware
batchSchema.pre('save', function(next) {
  // Ensure end date is after start date
  if (this.endDate && this.endDate <= this.startDate) {
    const error = new Error('End date must be after start date');
    return next(error);
  }

  // Auto-set end date when batch is marked as finished
  if (this.isFinished && !this.endDate) {
    this.endDate = new Date();
  }

  next();
});

module.exports = mongoose.model('Batch', batchSchema);
