const Course = require('../models/courseModel');
const Department = require('../models/departmentModel');
const Batch = require('../models/batchModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    department,
    description,
    duration,
    fees,
    prerequisites,
    syllabus,
    certification,
    level,
    category,
    software,
    maxStudentsPerBatch
  } = req.body;

  // Check if department exists
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if course code already exists in this department
  const courseExists = await Course.findOne({ department, code });
  if (courseExists) {
    res.status(400);
    throw new Error('Course with this code already exists in this department');
  }

  const course = await Course.create({
    name,
    code,
    department,
    description,
    duration,
    fees,
    prerequisites,
    syllabus,
    certification,
    level,
    category,
    software,
    maxStudentsPerBatch,
    createdBy: req.user._id,
  });

  // Populate department info
  await course.populate('department', 'name code');

  res.status(201).json(course);
});

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
  const {
    department,
    active,
    level,
    category,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 10
  } = req.query;

  let query = {};

  // Filter by department
  if (department) {
    query.department = department;
  }

  // Filter by active status
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  // Filter by level
  if (level) {
    query.level = level;
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const courses = await Course.find(query)
    .populate('department', 'name code')
    .populate('batchCount')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Course.countDocuments(query);

  res.json({
    courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('department', 'name code description')
    .populate('batches');

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  res.json(course);
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check for duplicate code in the same department (excluding current course)
  const { code, department } = req.body;
  if (code && department) {
    const duplicateCheck = await Course.findOne({
      _id: { $ne: req.params.id },
      department,
      code
    });

    if (duplicateCheck) {
      res.status(400);
      throw new Error('Course with this code already exists in this department');
    }
  }

  // If department is being changed, verify it exists
  if (department && department !== course.department.toString()) {
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      res.status(404);
      throw new Error('Department not found');
    }
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('department', 'name code');

  res.json(updatedCourse);
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if course has batches
  const batchCount = await Batch.countDocuments({ course: req.params.id });
  if (batchCount > 0) {
    res.status(400);
    throw new Error('Cannot delete course with existing batches. Please delete or reassign batches first.');
  }

  await course.deleteOne();
  res.json({ message: 'Course removed successfully' });
});

// @desc    Get courses by department
// @route   GET /api/courses/department/:departmentId
// @access  Private
const getCoursesByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { active = true } = req.query;

  // Verify department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  let query = { department: departmentId };
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const courses = await Course.find(query)
    .populate('department', 'name code')
    .sort({ name: 1 });

  res.json(courses);
});

// @desc    Get course statistics
// @route   GET /api/courses/:id/stats
// @access  Private/Admin
const getCourseStats = asyncHandler(async (req, res) => {
  try {
    const courseId = req.params.id;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    // Get batches for this course
    const Batch = require('../models/batchModel');
    const Student = require('../models/studentModel');

    const batches = await Batch.find({ course: courseId });
    const batchIds = batches.map(batch => batch._id);

    // Calculate statistics
    const [
      totalBatches,
      activeBatches,
      finishedBatches,
      totalStudents,
      activeStudents
    ] = await Promise.all([
      Batch.countDocuments({ course: courseId }),
      Batch.countDocuments({ course: courseId, isFinished: false }),
      Batch.countDocuments({ course: courseId, isFinished: true }),
      Student.countDocuments({ batch: { $in: batchIds } }),
      Student.countDocuments({ batch: { $in: batchIds }, isActive: true })
    ]);

    // Calculate average batch size and utilization
    const averageBatchSize = totalBatches > 0 ? Math.round(totalStudents / totalBatches) : 0;
    const utilizationRate = course.maxStudentsPerBatch > 0
      ? Math.round((averageBatchSize / course.maxStudentsPerBatch) * 100)
      : 0;

    // Calculate revenue metrics
    const totalRevenue = totalStudents * (course.fees?.amount || 0);
    const potentialRevenue = totalBatches * course.maxStudentsPerBatch * (course.fees?.amount || 0);

    const stats = {
      totalBatches,
      activeBatches,
      finishedBatches,
      totalStudents,
      activeStudents,
      averageBatchSize,
      utilizationRate,
      revenue: {
        total: totalRevenue,
        potential: potentialRevenue,
        efficiency: potentialRevenue > 0 ? Math.round((totalRevenue / potentialRevenue) * 100) : 0
      },
      capacity: {
        maxStudentsPerBatch: course.maxStudentsPerBatch,
        currentUtilization: utilizationRate,
        availableSlots: (totalBatches * course.maxStudentsPerBatch) - totalStudents
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({
      message: 'Error fetching course statistics',
      error: error.message
    });
  }
});

// @desc    Get course overview with analytics
// @route   GET /api/courses/overview
// @access  Private/Admin
const getCourseOverview = asyncHandler(async (req, res) => {
  try {
    const Batch = require('../models/batchModel');
    const Student = require('../models/studentModel');

    // Get all courses with their statistics
    const courses = await Course.find({}).populate('department', 'name code');
    const courseOverview = [];

    for (const course of courses) {
      const batches = await Batch.find({ course: course._id });
      const batchIds = batches.map(batch => batch._id);

      const [batchCount, studentCount, activeBatchCount] = await Promise.all([
        Batch.countDocuments({ course: course._id }),
        Student.countDocuments({ batch: { $in: batchIds } }),
        Batch.countDocuments({ course: course._id, isFinished: false })
      ]);

      const averageBatchSize = batchCount > 0 ? Math.round(studentCount / batchCount) : 0;
      const utilizationRate = course.maxStudentsPerBatch > 0
        ? Math.round((averageBatchSize / course.maxStudentsPerBatch) * 100)
        : 0;

      courseOverview.push({
        _id: course._id,
        name: course.name,
        code: course.code,
        department: course.department,
        level: course.level,
        category: course.category,
        isActive: course.isActive,
        batchCount,
        studentCount,
        activeBatchCount,
        averageBatchSize,
        utilizationRate,
        fees: course.fees,
        duration: course.duration,
        maxStudentsPerBatch: course.maxStudentsPerBatch,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      });
    }

    res.json({ courses: courseOverview });
  } catch (error) {
    console.error('Error fetching course overview:', error);
    res.status(500).json({
      message: 'Error fetching course overview',
      error: error.message
    });
  }
});

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByDepartment,
  getCourseStats,
  getCourseOverview
};
