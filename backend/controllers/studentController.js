const Student = require('../models/studentModel');
const Batch = require('../models/batchModel');
const Attendance = require('../models/attendanceModel');

// @desc    Create a new student
// @route   POST /api/students
// @access  Private/Teacher
const createStudent = async (req, res) => {
  try {
    const { name, rollNo, batchId, contactInfo, profilePhoto } = req.body;

    // Check if batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if user has access to this batch
    if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add students to this batch' });
    }

    // Check if roll number already exists in this batch
    const rollNoExists = await Student.findOne({ batch: batchId, rollNo });
    if (rollNoExists) {
      return res.status(400).json({ message: 'Roll number already exists in this batch' });
    }

    const student = await Student.create({
      name,
      rollNo,
      batch: batchId,
      contactInfo: contactInfo || {},
      profilePhoto: profilePhoto || 'default-profile.jpg',
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server error while creating student' });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Teacher
const getStudents = async (req, res) => {
  try {
    let filter = {};

    // Filter by batch if provided
    if (req.query.batch) {
      filter.batch = req.query.batch;
    }

    // Filter by teacher if not admin
    if (req.user.role !== 'admin') {
      // Get all batches created by this teacher
      const batches = await Batch.find({ createdBy: req.user._id }).select('_id');
      const batchIds = batches.map(batch => batch._id);

      // Add batch filter
      filter.batch = { $in: batchIds };
    }

    const students = await Student.find(filter)
      .populate({
        path: 'batch',
        select: 'name academicYear section createdBy',
        populate: {
          path: 'createdBy',
          select: 'name email role'
        }
      })
      .sort('name');

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error while fetching students' });
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private/Teacher
const getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('batch', 'name academicYear section createdBy');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Check if user has access to this student's batch
  if (
    req.user.role !== 'admin' &&
    student.batch.createdBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this student');
  }

  res.json(student);
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Teacher
const updateStudent = async (req, res) => {
  const { name, rollNo, batchId, contactInfo, profilePhoto, isActive } = req.body;

  const student = await Student.findById(req.params.id)
    .populate('batch', 'createdBy');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Check if user has access to this student's batch
  if (
    req.user.role !== 'admin' &&
    student.batch.createdBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update this student');
  }

  // If changing batch, check if user has access to the new batch
  if (batchId && batchId !== student.batch._id.toString()) {
    const newBatch = await Batch.findById(batchId);

    if (!newBatch) {
      res.status(404);
      throw new Error('New batch not found');
    }

    if (
      req.user.role !== 'admin' &&
      newBatch.createdBy.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to move student to this batch');
    }

    // Check if roll number already exists in the new batch
    if (rollNo) {
      const rollNoExists = await Student.findOne({
        batch: batchId,
        rollNo,
        _id: { $ne: req.params.id }
      });

      if (rollNoExists) {
        res.status(400);
        throw new Error('Roll number already exists in the target batch');
      }
    }

    student.batch = batchId;
  }

  student.name = name || student.name;
  student.rollNo = rollNo || student.rollNo;

  if (contactInfo) {
    student.contactInfo = {
      ...student.contactInfo,
      ...contactInfo,
    };
  }

  if (profilePhoto) {
    student.profilePhoto = profilePhoto;
  }

  if (isActive !== undefined) {
    student.isActive = isActive;
  }

  const updatedStudent = await student.save();

  res.json(updatedStudent);
};

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

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
};
