const Batch = require('../models/batchModel');
const Student = require('../models/studentModel');
const Attendance = require('../models/attendanceModel');

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Private/Teacher
const createBatch = async (req, res) => {
  const { name, academicYear, section, timing } = req.body;

  const batch = await Batch.create({
    name,
    academicYear,
    section,
    timing,
    createdBy: req.user._id,
  });

  res.status(201).json(batch);
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private/Teacher
const getBatches = async (req, res) => {
  try {
    // For admin, get all batches
    // For teacher, get only their batches
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    const batches = await Batch.find(filter)
      .populate('createdBy', 'name email role')
      .sort('-createdAt');

    // Get student count and attendance stats for each batch
    const batchesWithStats = await Promise.all(
      batches.map(async (batch) => {
        try {
          // Get student count for this batch
          const studentCount = await Student.countDocuments({ batch: batch._id });

          // Get recent attendance stats (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const attendanceRecords = await Attendance.find({
            batch: batch._id,
            date: { $gte: thirtyDaysAgo }
          });

          // Calculate accurate attendance percentage
          let attendancePercentage = 0;
          if (attendanceRecords.length > 0 && studentCount > 0) {
            // Get unique dates when attendance was marked for this batch
            const uniqueDates = [...new Set(attendanceRecords.map(record =>
              record.date.toISOString().split('T')[0]
            ))];

            // Calculate expected total attendance records (students × class days)
            const expectedTotalRecords = studentCount * uniqueDates.length;

            // Count present records
            const presentCount = attendanceRecords.filter(record => record.status === 'present').length;

            // Calculate percentage: (actual present) / (expected total) * 100
            attendancePercentage = expectedTotalRecords > 0 ? (presentCount / expectedTotalRecords) * 100 : 0;
          }

          const batchObj = batch.toObject()
          return {
            ...batchObj,
            studentCount,
            attendancePercentage: Math.round(attendancePercentage * 10) / 10, // Round to 1 decimal place
            createdBy: batch.createdBy // Ensure createdBy is preserved
          };
        } catch (error) {
          console.error(`Error fetching stats for batch ${batch._id}:`, error);
          return {
            ...batch.toObject(),
            studentCount: 0,
            attendancePercentage: 0,
            createdBy: batch.createdBy // Ensure createdBy is preserved
          };
        }
      })
    );

    res.json(batchesWithStats);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Server error while fetching batches' });
  }
};

// @desc    Get batch by ID
// @route   GET /api/batches/:id
// @access  Private/Teacher
const getBatchById = async (req, res) => {
  const batch = await Batch.findById(req.params.id)
    .populate('createdBy', 'name email role');

  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to this batch
  if (req.user.role !== 'admin' && batch.createdBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this batch');
  }

  res.json(batch);
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private/Teacher
const updateBatch = async (req, res) => {
  const { name, academicYear, section, timing, isArchived } = req.body;

  const batch = await Batch.findById(req.params.id);

  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to update this batch
  if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this batch');
  }

  batch.name = name || batch.name;
  batch.academicYear = academicYear || batch.academicYear;
  batch.section = section || batch.section;
  batch.timing = timing || batch.timing;

  if (isArchived !== undefined) {
    batch.isArchived = isArchived;
  }

  const updatedBatch = await batch.save();

  res.json(updatedBatch);
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private/Teacher
const deleteBatch = async (req, res) => {
  const batch = await Batch.findById(req.params.id);

  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to delete this batch
  if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this batch');
  }

  // Delete all students in this batch
  await Student.deleteMany({ batch: batch._id });

  // Delete all attendance records for this batch
  await Attendance.deleteMany({ batch: batch._id });

  // Delete the batch
  await batch.deleteOne();

  res.json({ message: 'Batch removed' });
};

// @desc    Get students in a batch
// @route   GET /api/batches/:id/students
// @access  Private/Teacher
const getBatchStudents = async (req, res) => {
  const batch = await Batch.findById(req.params.id);

  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to this batch
  if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this batch');
  }

  const students = await Student.find({ batch: batch._id }).sort('rollNo');

  res.json(students);
};

module.exports = {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  getBatchStudents,
};
