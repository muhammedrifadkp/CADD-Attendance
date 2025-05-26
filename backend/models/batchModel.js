const mongoose = require('mongoose');

const batchSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a batch name'],
      trim: true,
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
        '09:00-10:30',
        '10:30-12:00',
        '12:00-13:30',
        '14:00-15:30',
        '15:30-17:00'
      ],
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

module.exports = mongoose.model('Batch', batchSchema);
