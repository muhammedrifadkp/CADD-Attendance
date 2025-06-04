const Batch = require('../models/batchModel');
const Student = require('../models/studentModel');
const Attendance = require('../models/attendanceModel');

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Private/Teacher
const createBatch = async (req, res) => {
  try {
    const { name, course, academicYear, section, timing, startDate, endDate, maxStudents } = req.body;

    // Validate required fields
    if (!name || !course || !academicYear || !section || !timing || !startDate) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, course, academicYear, section, timing, startDate'
      });
    }

    // Check if course exists
    const Course = require('../models/courseModel');
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Validate start date
    const start = new Date(startDate);

    // Validate end date if provided
    let end = null;
    if (endDate) {
      end = new Date(endDate);
      if (end <= start) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const batchData = {
      name,
      course,
      academicYear,
      section,
      timing,
      startDate: start,
      maxStudents: maxStudents || courseExists.maxStudentsPerBatch || 20,
      createdBy: req.user._id,
    };

    // Only add endDate if provided
    if (end) {
      batchData.endDate = end;
    }

    const batch = await Batch.create(batchData);

    // Populate course information
    await batch.populate('course', 'name code department');
    await batch.populate('course.department', 'name');

    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ message: error.message || 'Server error creating batch' });
  }
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
      .populate({
        path: 'course',
        select: 'name code department',
        populate: {
          path: 'department',
          select: 'name code'
        }
      })
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
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate({
        path: 'course',
        select: 'name code department',
        populate: {
          path: 'department',
          select: 'name code'
        }
      });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if user has access to this batch
    if (req.user.role !== 'admin' && batch.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this batch' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ message: 'Server error fetching batch' });
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private/Teacher
const updateBatch = async (req, res) => {
  try {
    const { name, course, academicYear, section, timing, startDate, endDate, maxStudents, isArchived, isFinished } = req.body;

    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if user has access to update this batch
    if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this batch' });
    }

    // Validate course if provided
    if (course && course !== batch.course.toString()) {
      const Course = require('../models/courseModel');
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(404).json({ message: 'Course not found' });
      }
      batch.course = course;
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      batch.startDate = start;
      batch.endDate = end;
    } else if (startDate) {
      batch.startDate = new Date(startDate);
    } else if (endDate) {
      batch.endDate = new Date(endDate);
    }

    // Update other fields
    batch.name = name || batch.name;
    batch.academicYear = academicYear || batch.academicYear;
    batch.section = section || batch.section;
    batch.timing = timing || batch.timing;

    if (maxStudents !== undefined) {
      batch.maxStudents = maxStudents;
    }

    if (isArchived !== undefined) {
      batch.isArchived = isArchived;
    }

    if (isFinished !== undefined) {
      batch.isFinished = isFinished;
    }

    const updatedBatch = await batch.save();

    // Populate course information for response
    await updatedBatch.populate({
      path: 'course',
      select: 'name code department',
      populate: {
        path: 'department',
        select: 'name code'
      }
    });

    res.json(updatedBatch);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ message: error.message || 'Server error updating batch' });
  }
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

// @desc    Toggle batch finished status
// @route   PUT /api/batches/:id/toggle-finished
// @access  Private/Teacher
const toggleBatchFinished = async (req, res) => {
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

  batch.isFinished = !batch.isFinished;

  // Set end date when marking as finished, remove when marking as active
  if (batch.isFinished) {
    batch.endDate = new Date(); // Set current date as end date
  } else {
    batch.endDate = null; // Remove end date when marking as active
  }

  const updatedBatch = await batch.save();

  res.json({
    message: `Batch ${updatedBatch.isFinished ? 'marked as finished' : 'marked as active'}`,
    batch: updatedBatch
  });
};

// @desc    Get batches by course
// @route   GET /api/batches/course/:courseId
// @access  Private
const getBatchesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { active = true } = req.query;

    // Verify course exists
    const Course = require('../models/courseModel');
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let query = { course: courseId };
    if (active !== undefined) {
      query.isFinished = active === 'true' ? false : undefined;
      query.isArchived = active === 'true' ? false : undefined;
    }

    // For teachers, only show their batches
    if (req.user.role === 'teacher') {
      query.createdBy = req.user._id;
    }

    const batches = await Batch.find(query)
      .populate('createdBy', 'name email role')
      .populate({
        path: 'course',
        select: 'name code department',
        populate: {
          path: 'department',
          select: 'name code'
        }
      })
      .sort({ startDate: -1 });

    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches by course:', error);
    res.status(500).json({ message: 'Server error while fetching batches' });
  }
};

// @desc    Get batches by department
// @route   GET /api/batches/department/:departmentId
// @access  Private
const getBatchesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { active = true } = req.query;

    // Verify department exists
    const Department = require('../models/departmentModel');
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Get all courses in this department
    const Course = require('../models/courseModel');
    const courses = await Course.find({ department: departmentId }).select('_id');
    const courseIds = courses.map(course => course._id);

    let query = { course: { $in: courseIds } };
    if (active !== undefined) {
      query.isFinished = active === 'true' ? false : undefined;
      query.isArchived = active === 'true' ? false : undefined;
    }

    // For teachers, only show their batches
    if (req.user.role === 'teacher') {
      query.createdBy = req.user._id;
    }

    const batches = await Batch.find(query)
      .populate('createdBy', 'name email role')
      .populate({
        path: 'course',
        select: 'name code department',
        populate: {
          path: 'department',
          select: 'name code'
        }
      })
      .sort({ startDate: -1 });

    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches by department:', error);
    res.status(500).json({ message: 'Server error while fetching batches' });
  }
};

// @desc    Get batch statistics
// @route   GET /api/batches/:id/stats
// @access  Private/Teacher
const getBatchStats = async (req, res) => {
  try {
    const batchId = req.params.id;

    // Verify batch exists and user has access
    const batch = await Batch.findById(batchId).populate('course', 'name');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check access permissions
    if (req.user.role === 'teacher' && batch.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get students and attendance data
    const Student = require('../models/studentModel');
    const Attendance = require('../models/attendanceModel');

    const [
      totalStudents,
      activeStudents,
      totalAttendanceRecords,
      attendanceStats
    ] = await Promise.all([
      Student.countDocuments({ batch: batchId }),
      Student.countDocuments({ batch: batchId, isActive: true }),
      Attendance.countDocuments({ batch: batchId }),
      Attendance.aggregate([
        { $match: { batch: mongoose.Types.ObjectId(batchId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate attendance percentages
    const attendanceBreakdown = {
      total: totalAttendanceRecords,
      present: 0,
      absent: 0,
      late: 0
    };

    attendanceStats.forEach(stat => {
      attendanceBreakdown[stat._id] = stat.count;
    });

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((attendanceBreakdown.present / totalAttendanceRecords) * 100)
      : 0;

    // Calculate capacity utilization
    const capacityUtilization = batch.maxStudents > 0
      ? Math.round((totalStudents / batch.maxStudents) * 100)
      : 0;

    const stats = {
      students: {
        total: totalStudents,
        active: activeStudents,
        capacity: batch.maxStudents,
        utilization: capacityUtilization
      },
      attendance: {
        ...attendanceBreakdown,
        rate: attendanceRate
      },
      batch: {
        name: batch.name,
        course: batch.course?.name,
        isFinished: batch.isFinished,
        startDate: batch.startDate,
        endDate: batch.endDate
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    res.status(500).json({
      message: 'Error fetching batch statistics',
      error: error.message
    });
  }
};

// @desc    Get batches overview with analytics
// @route   GET /api/batches/overview
// @access  Private/Admin
const getBatchesOverview = async (req, res) => {
  try {
    const Student = require('../models/studentModel');
    const Attendance = require('../models/attendanceModel');

    // Get all batches with their statistics
    const batches = await Batch.find({})
      .populate('createdBy', 'name email')
      .populate({
        path: 'course',
        select: 'name code department',
        populate: {
          path: 'department',
          select: 'name code'
        }
      })
      .sort('-createdAt');

    const batchesOverview = [];

    for (const batch of batches) {
      const [studentCount, activeStudentCount, attendanceCount] = await Promise.all([
        Student.countDocuments({ batch: batch._id }),
        Student.countDocuments({ batch: batch._id, isActive: true }),
        Attendance.countDocuments({ batch: batch._id })
      ]);

      const capacityUtilization = batch.maxStudents > 0
        ? Math.round((studentCount / batch.maxStudents) * 100)
        : 0;

      batchesOverview.push({
        _id: batch._id,
        name: batch.name,
        course: batch.course,
        academicYear: batch.academicYear,
        section: batch.section,
        timing: batch.timing,
        startDate: batch.startDate,
        endDate: batch.endDate,
        maxStudents: batch.maxStudents,
        isFinished: batch.isFinished,
        createdBy: batch.createdBy,
        studentCount,
        activeStudentCount,
        attendanceCount,
        capacityUtilization,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt
      });
    }

    res.json({ batches: batchesOverview });
  } catch (error) {
    console.error('Error fetching batches overview:', error);
    res.status(500).json({
      message: 'Error fetching batches overview',
      error: error.message
    });
  }
};

module.exports = {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  getBatchStudents,
  toggleBatchFinished,
  getBatchesByCourse,
  getBatchesByDepartment,
  getBatchStats,
  getBatchesOverview,
};
