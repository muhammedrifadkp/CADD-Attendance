const Department = require('../models/departmentModel');
const Course = require('../models/courseModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, headOfDepartment, establishedYear, contactInfo, location } = req.body;

  // Check if department already exists
  const departmentExists = await Department.findOne({
    $or: [{ name }, { code }]
  });

  if (departmentExists) {
    res.status(400);
    throw new Error('Department with this name or code already exists');
  }

  const department = await Department.create({
    name,
    code,
    description,
    headOfDepartment,
    establishedYear,
    contactInfo,
    location,
    createdBy: req.user._id,
  });

  res.status(201).json(department);
});

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = asyncHandler(async (req, res) => {
  const { active, search } = req.query;

  let query = {};

  // Filter by active status
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const departments = await Department.find(query)
    .populate('headOfDepartment', 'name email')
    .populate('courseCount')
    .sort({ name: 1 });

  res.json(departments);
});

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id)
    .populate('headOfDepartment', 'name email')
    .populate('courses');

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  res.json(department);
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check for duplicate name or code (excluding current department)
  const { name, code } = req.body;
  if (name || code) {
    const duplicateCheck = await Department.findOne({
      _id: { $ne: req.params.id },
      $or: [
        ...(name ? [{ name }] : []),
        ...(code ? [{ code }] : [])
      ]
    });

    if (duplicateCheck) {
      res.status(400);
      throw new Error('Department with this name or code already exists');
    }
  }

  const updatedDepartment = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('headOfDepartment', 'name email');

  res.json(updatedDepartment);
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if department has courses
  const courseCount = await Course.countDocuments({ department: req.params.id });
  if (courseCount > 0) {
    res.status(400);
    throw new Error('Cannot delete department with existing courses. Please delete or reassign courses first.');
  }

  await department.deleteOne();
  res.json({ message: 'Department removed successfully' });
});

// @desc    Get department statistics
// @route   GET /api/departments/:id/stats
// @access  Private
const getDepartmentStats = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Get course statistics
  const courseStats = await Course.aggregate([
    { $match: { department: department._id } },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        activeCourses: { $sum: { $cond: ['$isActive', 1, 0] } },
        averageFees: { $avg: '$fees.amount' },
        totalFees: { $sum: '$fees.amount' },
      }
    }
  ]);

  const stats = courseStats[0] || {
    totalCourses: 0,
    activeCourses: 0,
    averageFees: 0,
    totalFees: 0,
  };

  res.json({
    department,
    stats
  });
});

// @desc    Get department overview with analytics
// @route   GET /api/departments/overview
// @access  Private/Admin
const getDepartmentOverview = async (req, res) => {
  try {
    const Course = require('../models/courseModel');
    const Student = require('../models/studentModel');
    const Batch = require('../models/batchModel');

    // Get all departments with their statistics
    const departments = await Department.find({});
    const departmentOverview = [];

    for (const dept of departments) {
      const courses = await Course.find({ department: dept._id });
      const courseIds = courses.map(course => course._id);

      const [courseCount, studentCount, batchCount] = await Promise.all([
        Course.countDocuments({ department: dept._id }),
        Student.countDocuments({ department: dept._id }),
        Batch.countDocuments({ course: { $in: courseIds } })
      ]);

      departmentOverview.push({
        _id: dept._id,
        name: dept.name,
        code: dept.code,
        isActive: dept.isActive,
        courseCount,
        studentCount,
        batchCount,
        description: dept.description,
        establishedYear: dept.establishedYear,
        headOfDepartment: dept.headOfDepartment,
        contactInfo: dept.contactInfo,
        location: dept.location,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt
      });
    }

    res.json({ departments: departmentOverview });
  } catch (error) {
    console.error('Error fetching department overview:', error);
    res.status(500).json({
      message: 'Error fetching department overview',
      error: error.message
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  getDepartmentOverview
};
