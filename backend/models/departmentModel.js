const mongoose = require('mongoose');

const departmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a department name'],
      trim: true,
      unique: true,
      enum: ['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'],
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Please add a department code'],
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: [10, 'Department code cannot exceed 10 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    establishedYear: {
      type: Number,
      min: [1900, 'Established year must be after 1900'],
      max: [new Date().getFullYear(), 'Established year cannot be in the future'],
    },
    contactInfo: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email',
        ],
      },
      phone: {
        type: String,
        trim: true,
      },
      extension: {
        type: String,
        trim: true,
      },
    },
    location: {
      building: {
        type: String,
        trim: true,
      },
      floor: {
        type: String,
        trim: true,
      },
      roomNumbers: [{
        type: String,
        trim: true,
      }],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for courses
departmentSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'department',
  justOne: false,
});

// Virtual for course count
departmentSchema.virtual('courseCount', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'department',
  count: true,
});

// Index for efficient queries (unique indexes are handled by schema)
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);
