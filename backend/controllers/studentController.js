const Student = require('../models/studentModel');
const Batch = require('../models/batchModel');
const Course = require('../models/courseModel');
const Department = require('../models/departmentModel');
const Attendance = require('../models/attendanceModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { applyPopulation, applyRoleBasedPopulation, optimizeQuery } = require('../utils/populationHelpers');
const { validateModelOperation, validateStudentHierarchy } = require('../utils/modelValidation');

// @desc    Create a new student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = asyncHandler(async (req, res) => {
  const {
    name,
    rollNumber,
    rollNo,
    email,
    phone,
    address,
    dateOfBirth,
    gender,
    guardianName,
    guardianPhone,
    emergencyContact,
    qualification,
    admissionDate,
    department,
    course,
    batch,
    feesPaid = 0,
    totalFees = 0,
    paymentStatus = 'pending',
    isActive = true,
    profilePhoto
  } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !department || !course || !batch) {
    res.status(400);
    throw new Error('Please provide all required fields: name, email, phone, department, course, batch');
  }

  // Validate fees
  if (feesPaid < 0 || totalFees < 0) {
    res.status(400);
    throw new Error('Fees cannot be negative');
  }

  if (feesPaid > totalFees) {
    res.status(400);
    throw new Error('Fees paid cannot exceed total fees');
  }

  // Use comprehensive validation helper
  const validation = await validateModelOperation('Student', {
    name,
    rollNo,
    email,
    department,
    course,
    batch
  }, {
    operation: 'create',
    user: req.user
  });

  if (!validation.valid) {
    res.status(400);
    throw new Error(validation.errors ? validation.errors.join(', ') : validation.error);
  }

  const student = await Student.create({
    name,
    rollNumber,
    rollNo: rollNo || `STU${Date.now()}`, // Generate if not provided
    email,
    phone,
    address,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender,
    guardianName,
    guardianPhone,
    emergencyContact,
    qualification,
    admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
    department,
    course,
    batch,
    feesPaid: Number(feesPaid),
    totalFees: Number(totalFees),
    paymentStatus,
    isActive,
    profilePhoto: profilePhoto || 'default-profile.jpg',
    // Keep legacy contactInfo for backward compatibility
    contactInfo: {
      email,
      phone,
      address
    }
  });

  // Use optimized population
  const populatedStudent = await applyPopulation(
    Student.findById(student._id),
    'student',
    'basic'
  );

  res.status(201).json(populatedStudent);
});

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const {
    department,
    course,
    batch,
    active,
    paymentStatus,
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

  // Filter by course
  if (course) {
    query.course = course;
  }

  // Filter by batch
  if (batch) {
    query.batch = batch;
  }

  // Filter by active status
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  // Filter by payment status
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNo: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // For teachers, only show students from their batches
  if (req.user.role === 'teacher') {
    const teacherBatches = await Batch.find({ createdBy: req.user._id }).select('_id');
    const batchIds = teacherBatches.map(batch => batch._id);

    if (query.batch) {
      // If batch filter is provided, ensure it's one of teacher's batches
      if (!batchIds.some(id => id.toString() === query.batch)) {
        return res.status(403).json({ message: 'Not authorized to access students from this batch' });
      }
    } else {
      // If no batch filter, limit to teacher's batches
      query.batch = { $in: batchIds };
    }
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const students = await Student.find(query)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate({
      path: 'batch',
      select: 'name academicYear section timing createdBy',
      populate: {
        path: 'createdBy',
        select: 'name email role'
      }
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Student.countDocuments(query);

  res.json({
    students,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('batch', 'name academicYear section timing createdBy');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Check if user has access to this student
  if (req.user.role === 'teacher') {
    // Teachers can only access students from their batches
    const teacherBatches = await Batch.find({ createdBy: req.user._id }).select('_id');
    const batchIds = teacherBatches.map(batch => batch._id.toString());

    if (!batchIds.includes(student.batch._id.toString())) {
      res.status(403);
      throw new Error('Not authorized to access this student');
    }
  }

  res.json(student);
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  const {
    name,
    rollNumber,
    rollNo,
    email,
    phone,
    address,
    dateOfBirth,
    gender,
    guardianName,
    guardianPhone,
    emergencyContact,
    qualification,
    admissionDate,
    department,
    course,
    batch,
    feesPaid,
    totalFees,
    paymentStatus,
    isActive,
    profilePhoto
  } = req.body;

  const student = await Student.findById(req.params.id)
    .populate('batch', 'createdBy course')
    .populate('course', 'department')
    .populate('department');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Check if user has access to this student
  if (req.user.role === 'teacher') {
    const teacherBatches = await Batch.find({ createdBy: req.user._id }).select('_id');
    const batchIds = teacherBatches.map(batch => batch._id.toString());

    if (!batchIds.includes(student.batch._id.toString())) {
      res.status(403);
      throw new Error('Not authorized to update this student');
    }
  }

  // Check if email is being changed and if it already exists
  if (email && email !== student.email) {
    const emailExists = await Student.findOne({
      email,
      _id: { $ne: req.params.id }
    });
    if (emailExists) {
      res.status(400);
      throw new Error('Student with this email already exists');
    }
  }

  // If changing department/course/batch, validate the hierarchy
  if (department || course || batch) {
    const newDepartment = department || student.department._id;
    const newCourse = course || student.course._id;
    const newBatch = batch || student.batch._id;

    // Verify department exists
    if (department) {
      const departmentExists = await Department.findById(newDepartment);
      if (!departmentExists) {
        res.status(404);
        throw new Error('Department not found');
      }
    }

    // Verify course exists and belongs to the department
    if (course || department) {
      const courseExists = await Course.findOne({ _id: newCourse, department: newDepartment });
      if (!courseExists) {
        res.status(404);
        throw new Error('Course not found or does not belong to the selected department');
      }
    }

    // Verify batch exists and belongs to the course
    if (batch || course || department) {
      const batchExists = await Batch.findOne({ _id: newBatch, course: newCourse });
      if (!batchExists) {
        res.status(404);
        throw new Error('Batch not found or does not belong to the selected course');
      }

      // For teachers, ensure they have access to the new batch
      if (req.user.role === 'teacher' && batch && batch !== student.batch._id.toString()) {
        const teacherBatches = await Batch.find({ createdBy: req.user._id }).select('_id');
        const batchIds = teacherBatches.map(b => b._id.toString());

        if (!batchIds.includes(batch)) {
          res.status(403);
          throw new Error('Not authorized to move student to this batch');
        }
      }
    }
  }

  // Check if roll number already exists in the target batch
  if (rollNo && rollNo !== student.rollNo) {
    const targetBatch = batch || student.batch._id;
    const rollNoExists = await Student.findOne({
      batch: targetBatch,
      rollNo,
      _id: { $ne: req.params.id }
    });

    if (rollNoExists) {
      res.status(400);
      throw new Error('Roll number already exists in the target batch');
    }
  }

  // Validate fees
  const newFeesPaid = feesPaid !== undefined ? Number(feesPaid) : student.feesPaid;
  const newTotalFees = totalFees !== undefined ? Number(totalFees) : student.totalFees;

  if (newFeesPaid < 0 || newTotalFees < 0) {
    res.status(400);
    throw new Error('Fees cannot be negative');
  }

  if (newFeesPaid > newTotalFees) {
    res.status(400);
    throw new Error('Fees paid cannot exceed total fees');
  }

  // Update fields
  student.name = name || student.name;
  student.rollNumber = rollNumber !== undefined ? rollNumber : student.rollNumber;
  student.rollNo = rollNo || student.rollNo;
  student.email = email || student.email;
  student.phone = phone || student.phone;
  student.address = address !== undefined ? address : student.address;
  student.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : student.dateOfBirth;
  student.gender = gender !== undefined ? gender : student.gender;
  student.guardianName = guardianName !== undefined ? guardianName : student.guardianName;
  student.guardianPhone = guardianPhone !== undefined ? guardianPhone : student.guardianPhone;
  student.emergencyContact = emergencyContact !== undefined ? emergencyContact : student.emergencyContact;
  student.qualification = qualification !== undefined ? qualification : student.qualification;
  student.admissionDate = admissionDate ? new Date(admissionDate) : student.admissionDate;
  student.department = department || student.department;
  student.course = course || student.course;
  student.batch = batch || student.batch;
  student.feesPaid = newFeesPaid;
  student.totalFees = newTotalFees;
  student.paymentStatus = paymentStatus || student.paymentStatus;
  student.isActive = isActive !== undefined ? isActive : student.isActive;
  student.profilePhoto = profilePhoto || student.profilePhoto;

  // Update legacy contactInfo for backward compatibility
  student.contactInfo = {
    email: student.email,
    phone: student.phone,
    address: student.address
  };

  const updatedStudent = await student.save();

  // Populate related fields for response
  await updatedStudent.populate([
    { path: 'department', select: 'name code' },
    { path: 'course', select: 'name code' },
    { path: 'batch', select: 'name academicYear section timing' }
  ]);

  res.json(updatedStudent);
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Teacher
const deleteStudent = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('batch', 'createdBy');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Check if user has access to this student's batch
  // Admin can delete any student
  if (
    req.user.role !== 'admin' &&
    student.batch.createdBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this student');
  }

  // Delete all attendance records for this student
  await Attendance.deleteMany({ student: student._id });

  // Delete the student
  await student.deleteOne();

  res.json({ message: 'Student removed' });
};

// @desc    Bulk create students
// @route   POST /api/students/bulk
// @access  Private/Teacher
const bulkCreateStudents = async (req, res) => {
  const { students, batchId } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of students');
  }

  // Check if batch exists
  const batch = await Batch.findById(batchId);
  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to this batch
  if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to add students to this batch');
  }

  // Prepare students data
  const studentsToCreate = students.map(student => ({
    ...student,
    batch: batchId,
    contactInfo: student.contactInfo || {},
    profilePhoto: student.profilePhoto || 'default-profile.jpg',
  }));

  // Create students
  const createdStudents = await Student.insertMany(studentsToCreate);

  res.status(201).json(createdStudents);
};

// @desc    Get students by department
// @route   GET /api/students/department/:departmentId
// @access  Private
const getStudentsByDepartment = asyncHandler(async (req, res) => {
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

  // For teachers, only show students from their batches
  if (req.user.role === 'teacher') {
    const teacherBatches = await Batch.find({ createdBy: req.user._id }).select('_id');
    const batchIds = teacherBatches.map(batch => batch._id);
    query.batch = { $in: batchIds };
  }

  const students = await Student.find(query)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate({
      path: 'batch',
      select: 'name academicYear section timing createdBy',
      populate: {
        path: 'createdBy',
        select: 'name email role'
      }
    })
    .sort({ name: 1 });

  res.json(students);
});

// @desc    Get students by batch
// @route   GET /api/students/batch/:batchId
// @access  Private
const getStudentsByBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { active = true } = req.query;

  // Verify batch exists
  const batch = await Batch.findById(batchId);
  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to this batch
  if (req.user.role === 'teacher' && batch.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access students from this batch');
  }

  let query = { batch: batchId };
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const students = await Student.find(query)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate({
      path: 'batch',
      select: 'name academicYear section timing createdBy',
      populate: {
        path: 'createdBy',
        select: 'name email role'
      }
    })
    .sort({ rollNo: 1, name: 1 });

  res.json(students);
});

// @desc    Get student statistics
// @route   GET /api/students/:id/stats
// @access  Private/Admin
const getStudentStats = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Verify student exists
    const student = await Student.findById(studentId)
      .populate('department', 'name')
      .populate('course', 'name')
      .populate('batch', 'name');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get attendance data
    const Attendance = require('../models/attendanceModel');

    const [
      totalAttendanceRecords,
      attendanceStats
    ] = await Promise.all([
      Attendance.countDocuments({ student: studentId }),
      Attendance.aggregate([
        { $match: { student: mongoose.Types.ObjectId(studentId) } },
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

    // Calculate fee information
    const feeInfo = {
      totalFees: student.totalFees || 0,
      paidFees: student.feesPaid || 0,
      pendingFees: (student.totalFees || 0) - (student.feesPaid || 0),
      paymentStatus: student.paymentStatus || 'pending'
    };

    const stats = {
      student: {
        name: student.name,
        rollNo: student.rollNo || student.rollNumber,
        email: student.email,
        isActive: student.isActive,
        department: student.department?.name,
        course: student.course?.name,
        batch: student.batch?.name
      },
      attendance: {
        ...attendanceBreakdown,
        rate: attendanceRate
      },
      fees: feeInfo,
      enrollment: {
        admissionDate: student.admissionDate,
        createdAt: student.createdAt
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({
      message: 'Error fetching student statistics',
      error: error.message
    });
  }
};

// @desc    Get students overview with analytics
// @route   GET /api/students/overview
// @access  Private/Admin
const getStudentsOverview = async (req, res) => {
  try {
    const Attendance = require('../models/attendanceModel');

    // Get all students with their statistics
    const students = await Student.find({})
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('batch', 'name academicYear section')
      .sort({ name: 1 });

    const studentsOverview = [];

    for (const student of students) {
      const [attendanceCount, attendanceStats] = await Promise.all([
        Attendance.countDocuments({ student: student._id }),
        Attendance.aggregate([
          { $match: { student: mongoose.Types.ObjectId(student._id) } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const attendanceBreakdown = {
        total: attendanceCount,
        present: 0,
        absent: 0,
        late: 0
      };

      attendanceStats.forEach(stat => {
        attendanceBreakdown[stat._id] = stat.count;
      });

      const attendanceRate = attendanceCount > 0
        ? Math.round((attendanceBreakdown.present / attendanceCount) * 100)
        : 0;

      studentsOverview.push({
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo || student.rollNumber,
        email: student.email,
        phone: student.phone,
        department: student.department,
        course: student.course,
        batch: student.batch,
        isActive: student.isActive,
        totalFees: student.totalFees || 0,
        feesPaid: student.feesPaid || 0,
        paymentStatus: student.paymentStatus || 'pending',
        attendanceCount,
        attendanceRate,
        attendanceBreakdown,
        admissionDate: student.admissionDate,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      });
    }

    res.json({ students: studentsOverview });
  } catch (error) {
    console.error('Error fetching students overview:', error);
    res.status(500).json({
      message: 'Error fetching students overview',
      error: error.message
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getStudentsByDepartment,
  getStudentsByBatch,
  getStudentStats,
  getStudentsOverview,
};
