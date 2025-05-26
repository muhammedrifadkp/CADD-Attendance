const mongoose = require('mongoose');

const studentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    rollNo: {
      type: String,
      required: [true, 'Please add a roll number'],
      trim: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Batch',
    },
    contactInfo: {
      email: {
        type: String,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email',
        ],
      },
      phone: {
        type: String,
      },
      address: {
        type: String,
      },
    },
    profilePhoto: {
      type: String,
      default: 'default-profile.jpg',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for attendance
studentSchema.virtual('attendance', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'student',
  justOne: false,
});

module.exports = mongoose.model('Student', studentSchema);
