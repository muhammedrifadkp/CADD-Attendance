const mongoose = require('mongoose');

const courseSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a course name'],
      trim: true,
      maxlength: [200, 'Course name cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Please add a course code'],
      trim: true,
      uppercase: true,
      maxlength: [20, 'Course code cannot exceed 20 characters'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a department'],
      ref: 'Department',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    duration: {
      months: {
        type: Number,
        required: [true, 'Please add course duration in months'],
        min: [1, 'Duration must be at least 1 month'],
        max: [60, 'Duration cannot exceed 60 months'],
      },
      hours: {
        type: Number,
        min: [1, 'Total hours must be at least 1'],
      },
    },
    fees: {
      amount: {
        type: Number,
        required: [true, 'Please add course fees'],
        min: [0, 'Fees cannot be negative'],
      },
      currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR'],
      },
      installments: {
        allowed: {
          type: Boolean,
          default: true,
        },
        numberOfInstallments: {
          type: Number,
          min: [1, 'Must have at least 1 installment'],
          max: [12, 'Cannot exceed 12 installments'],
          default: 1,
        },
      },
    },
    prerequisites: [{
      type: String,
      trim: true,
    }],
    syllabus: [{
      module: {
        type: String,
        required: true,
        trim: true,
      },
      topics: [{
        type: String,
        trim: true,
      }],
      duration: {
        type: String,
        trim: true,
      },
    }],
    certification: {
      provided: {
        type: Boolean,
        default: true,
      },
      certificateName: {
        type: String,
        trim: true,
      },
      issuingAuthority: {
        type: String,
        trim: true,
      },
    },
    level: {
      type: String,
      required: [true, 'Please select course level'],
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner',
    },
    category: {
      type: String,
      required: [true, 'Please select course category'],
      enum: [
        'Design',
        'Programming',
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Digital Marketing',
        'Graphics',
        'Animation',
        'CAD',
        'Other'
      ],
    },
    software: [{
      name: {
        type: String,
        trim: true,
      },
      version: {
        type: String,
        trim: true,
      },
      required: {
        type: Boolean,
        default: true,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    maxStudentsPerBatch: {
      type: Number,
      min: [1, 'Must allow at least 1 student per batch'],
      max: [50, 'Cannot exceed 50 students per batch'],
      default: 20,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for batches
courseSchema.virtual('batches', {
  ref: 'Batch',
  localField: '_id',
  foreignField: 'course',
  justOne: false,
});

// Virtual for batch count
courseSchema.virtual('batchCount', {
  ref: 'Batch',
  localField: '_id',
  foreignField: 'course',
  count: true,
});

// Compound index for department and course code uniqueness
courseSchema.index({ department: 1, code: 1 }, { unique: true });
courseSchema.index({ department: 1, name: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ category: 1 });

module.exports = mongoose.model('Course', courseSchema);
