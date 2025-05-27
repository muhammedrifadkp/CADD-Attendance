const Attendance = require('../models/attendanceModel');
const Student = require('../models/studentModel');
const Batch = require('../models/batchModel');
const LabBooking = require('../models/labBookingModel');

// Helper function to restore lab bookings when student is marked present/late after being absent
const restoreLabBookingsForStudent = async (studentId, attendanceDate, batchTiming) => {
  try {
    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      return { updated: 0, message: 'Student not found' };
    }

    // Find completed lab bookings for this student on this date with the batch timing
    const targetDate = new Date(attendanceDate);
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const completedBookings = await LabBooking.find({
      studentName: student.name,
      date: {
        $gte: targetDate,
        $lte: endDate
      },
      timeSlot: batchTiming,
      status: 'completed'
    }).populate('pc', 'pcNumber rowNumber');

    let restoredCount = 0;
    const restoredBookings = [];

    // Restore each completed booking back to confirmed
    for (const booking of completedBookings) {
      // Check if the slot is still available (no new confirmed booking)
      const conflictBooking = await LabBooking.findOne({
        pc: booking.pc._id,
        date: {
          $gte: targetDate,
          $lte: endDate
        },
        timeSlot: booking.timeSlot,
        status: 'confirmed',
        _id: { $ne: booking._id }
      });

      if (!conflictBooking) {
        booking.status = 'confirmed';
        booking.notes = booking.notes ?
          `${booking.notes} - Booking restored (student marked present/late) at ${new Date().toLocaleTimeString()}` :
          `Booking restored (student marked present/late) at ${new Date().toLocaleTimeString()}`;

        await booking.save();
        restoredCount++;
        restoredBookings.push({
          pcNumber: booking.pc?.pcNumber,
          timeSlot: booking.timeSlot,
          studentName: booking.studentName
        });
      }
    }

    return {
      updated: restoredCount,
      message: restoredCount > 0 ?
        `Restored ${restoredCount} lab booking(s) for ${student.name}` :
        'No bookings to restore or slots already taken',
      bookings: restoredBookings
    };
  } catch (error) {
    console.error('Error restoring lab bookings:', error);
    return { updated: 0, message: 'Error restoring lab bookings', error: error.message };
  }
};

// Helper function to update lab bookings based on attendance
const updateLabBookingsBasedOnAttendance = async (studentId, attendanceStatus, attendanceDate, batchTiming) => {
  try {
    console.log('🔄 updateLabBookingsBasedOnAttendance called:', {
      studentId,
      attendanceStatus,
      attendanceDate,
      batchTiming
    });

    // Only process if student is marked as absent (late students might still come)
    if (attendanceStatus !== 'absent') {
      console.log('⏭️ Skipping lab booking update - student not absent');
      return { updated: 0, message: 'No lab booking updates needed for present/late students' };
    }

    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      console.log('❌ Student not found:', studentId);
      return { updated: 0, message: 'Student not found' };
    }

    console.log('👤 Found student:', student.name);

    // Find lab bookings for this student on this date with the batch timing
    const targetDate = new Date(attendanceDate);
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    console.log('🔍 Searching for lab bookings with criteria:', {
      studentName: student.name,
      dateRange: { from: targetDate, to: endDate },
      timeSlot: batchTiming,
      status: 'confirmed'
    });

    const labBookings = await LabBooking.find({
      studentName: student.name,
      date: {
        $gte: targetDate,
        $lte: endDate
      },
      timeSlot: batchTiming,
      status: 'confirmed'
    }).populate('pc', 'pcNumber rowNumber');

    console.log('📋 Found lab bookings:', labBookings.length, labBookings.map(b => ({
      id: b._id,
      pc: b.pc?.pcNumber,
      timeSlot: b.timeSlot,
      status: b.status
    })));

    let updatedCount = 0;
    const updatedBookings = [];

    // Update each matching booking
    for (const booking of labBookings) {
      console.log('🔄 Updating booking:', booking._id, 'from', booking.status, 'to completed');

      booking.status = 'completed';
      booking.notes = booking.notes ?
        `${booking.notes} - Student marked absent in attendance at ${new Date().toLocaleTimeString()}` :
        `Student marked absent in attendance at ${new Date().toLocaleTimeString()}`;

      await booking.save();
      updatedCount++;
      updatedBookings.push({
        pcNumber: booking.pc?.pcNumber,
        timeSlot: booking.timeSlot,
        studentName: booking.studentName
      });

      console.log('✅ Updated booking successfully:', booking._id);
    }

    console.log('📊 Lab booking update summary:', {
      updatedCount,
      updatedBookings
    });

    return {
      updated: updatedCount,
      message: updatedCount > 0 ?
        `Updated ${updatedCount} lab booking(s) for ${student.name} (marked absent)` :
        'No matching lab bookings found',
      bookings: updatedBookings
    };
  } catch (error) {
    console.error('Error updating lab bookings based on attendance:', error);
    return { updated: 0, message: 'Error updating lab bookings', error: error.message };
  }
};

// @desc    Mark attendance for a student
// @route   POST /api/attendance
// @access  Private/Teacher
const markAttendance = async (req, res) => {
  const { studentId, batchId, date, status, remarks } = req.body;

  // Check if student exists
  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
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
    throw new Error('Not authorized to mark attendance for this batch');
  }

  // Check if student belongs to this batch
  if (student.batch.toString() !== batchId) {
    res.status(400);
    throw new Error('Student does not belong to this batch');
  }

  // Format the date to remove time component
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Check if attendance already exists for this student on this date
  const existingAttendance = await Attendance.findOne({
    student: studentId,
    date: {
      $gte: attendanceDate,
      $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  let attendanceRecord;
  if (existingAttendance) {
    // Update existing attendance
    existingAttendance.status = status;
    existingAttendance.remarks = remarks;
    existingAttendance.markedBy = req.user._id;

    attendanceRecord = await existingAttendance.save();
  } else {
    // Create new attendance record
    attendanceRecord = await Attendance.create({
      student: studentId,
      batch: batchId,
      date: attendanceDate,
      status,
      remarks,
      markedBy: req.user._id,
    });
  }

  // Update lab bookings based on attendance status
  let labBookingUpdate = null;
  console.log('🎯 Processing lab booking updates for attendance status:', status);

  if (status === 'absent') {
    console.log('❌ Student marked absent - completing lab bookings');
    // Complete bookings for absent students
    labBookingUpdate = await updateLabBookingsBasedOnAttendance(
      studentId,
      status,
      attendanceDate,
      batch.timing
    );
  } else if (status === 'present' || status === 'late') {
    console.log('✅ Student marked present/late - restoring lab bookings');
    // Restore bookings for present/late students (in case they were previously marked absent)
    labBookingUpdate = await restoreLabBookingsForStudent(
      studentId,
      attendanceDate,
      batch.timing
    );
  }

  console.log('📋 Lab booking update result:', labBookingUpdate);

  // Prepare response
  const response = {
    attendance: attendanceRecord,
    labBookingUpdate: labBookingUpdate
  };

  res.status(existingAttendance ? 200 : 201).json(response);
};

// @desc    Mark attendance for multiple students
// @route   POST /api/attendance/bulk
// @access  Private/Teacher
const markBulkAttendance = async (req, res) => {
  const { attendanceRecords, batchId, date } = req.body;

  if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of attendance records');
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
    throw new Error('Not authorized to mark attendance for this batch');
  }

  // Format the date to remove time component
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Process each attendance record
  const operations = attendanceRecords.map(async (record) => {
    const { studentId, status, remarks } = record;

    // Check if student exists and belongs to this batch
    const student = await Student.findOne({ _id: studentId, batch: batchId });
    if (!student) {
      return { error: `Student with ID ${studentId} not found or does not belong to this batch` };
    }

    // Update or create attendance record
    const filter = {
      student: studentId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
      },
    };

    const update = {
      student: studentId,
      batch: batchId,
      date: attendanceDate,
      status,
      remarks,
      markedBy: req.user._id,
    };

    const options = { upsert: true, new: true };

    return Attendance.findOneAndUpdate(filter, update, options);
  });

  try {
    const results = await Promise.all(operations);

    // After attendance is marked, update lab bookings based on status
    const labBookingUpdates = [];
    for (const record of attendanceRecords) {
      if (record.status === 'absent') {
        // Complete bookings for absent students
        const labUpdate = await updateLabBookingsBasedOnAttendance(
          record.studentId,
          record.status,
          attendanceDate,
          batch.timing
        );
        if (labUpdate.updated > 0) {
          labBookingUpdates.push(labUpdate);
        }
      } else if (record.status === 'present' || record.status === 'late') {
        // Restore bookings for present/late students (in case they were previously marked absent)
        const labRestore = await restoreLabBookingsForStudent(
          record.studentId,
          attendanceDate,
          batch.timing
        );
        if (labRestore.updated > 0) {
          labBookingUpdates.push(labRestore);
        }
      }
    }

    // Prepare response with lab booking updates
    const response = {
      attendanceResults: results,
      labBookingUpdates: labBookingUpdates,
      summary: {
        attendanceRecordsProcessed: results.length,
        labBookingsUpdated: labBookingUpdates.reduce((sum, update) => sum + update.updated, 0)
      }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500);
    throw new Error(`Error marking bulk attendance: ${error.message}`);
  }
};

// @desc    Get attendance for a batch on a specific date
// @route   GET /api/attendance/batch/:batchId
// @access  Private/Teacher
const getBatchAttendance = async (req, res) => {
  const { batchId } = req.params;
  const { date } = req.query;

  // Check if batch exists
  const batch = await Batch.findById(batchId);
  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to this batch
  if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view attendance for this batch');
  }

  // Format the date to remove time component
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Get all students in the batch
  const students = await Student.find({ batch: batchId }).sort('rollNo');

  // Get attendance records for the batch on the specified date
  const attendanceRecords = await Attendance.find({
    batch: batchId,
    date: {
      $gte: attendanceDate,
      $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
    },
  }).populate('student', 'name rollNo');

  // Create a map of student ID to attendance record
  const attendanceMap = {};
  attendanceRecords.forEach((record) => {
    attendanceMap[record.student._id.toString()] = record;
  });

  // Create response with attendance status for each student
  const response = students.map((student) => {
    const attendanceRecord = attendanceMap[student._id.toString()];
    return {
      student: {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
      },
      attendance: attendanceRecord
        ? {
            _id: attendanceRecord._id,
            status: attendanceRecord.status,
            remarks: attendanceRecord.remarks,
            date: attendanceRecord.date,
          }
        : null,
    };
  });

  res.json(response);
};

// @desc    Get attendance for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private/Teacher
const getStudentAttendance = async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  // Check if student exists
  const student = await Student.findById(studentId).populate('batch', 'createdBy');
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
    throw new Error('Not authorized to view attendance for this student');
  }

  // Build date filter
  const dateFilter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  // Get attendance records for the student
  const query = { student: studentId };
  if (Object.keys(dateFilter).length > 0) {
    query.date = dateFilter;
  }

  const attendanceRecords = await Attendance.find(query)
    .sort('-date')
    .populate('markedBy', 'name');

  res.json(attendanceRecords);
};

// @desc    Get attendance statistics for a batch
// @route   GET /api/attendance/stats/batch/:batchId
// @access  Private/Teacher
const getBatchAttendanceStats = async (req, res) => {
  const { batchId } = req.params;
  const { startDate, endDate } = req.query;

  // Check if batch exists
  const batch = await Batch.findById(batchId);
  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  // Check if user has access to this batch
  if (req.user.role !== 'admin' && batch.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view attendance stats for this batch');
  }

  // Build date filter
  const dateFilter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  // Get attendance records for the batch
  const query = { batch: batchId };
  if (Object.keys(dateFilter).length > 0) {
    query.date = dateFilter;
  }

  const attendanceRecords = await Attendance.find(query);

  // Calculate statistics
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
  const lateCount = attendanceRecords.filter(record => record.status === 'late').length;

  // Get unique dates
  const uniqueDates = [...new Set(attendanceRecords.map(record =>
    record.date.toISOString().split('T')[0]
  ))];

  // Get student count
  const studentCount = await Student.countDocuments({ batch: batchId });

  // Calculate expected total records (students × class days)
  const expectedTotalRecords = studentCount * uniqueDates.length;

  res.json({
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    presentPercentage: expectedTotalRecords > 0 ? (presentCount / expectedTotalRecords) * 100 : 0,
    absentPercentage: expectedTotalRecords > 0 ? (absentCount / expectedTotalRecords) * 100 : 0,
    latePercentage: expectedTotalRecords > 0 ? (lateCount / expectedTotalRecords) * 100 : 0,
    uniqueDatesCount: uniqueDates.length,
    studentCount,
    expectedTotalRecords,
    averageAttendance: expectedTotalRecords > 0 ? (presentCount / expectedTotalRecords) * 100 : 0,
  });
};

// @desc    Get overall attendance analytics for admin
// @route   GET /api/attendance/analytics/overall
// @access  Private/Admin
const getOverallAttendanceAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  // Get all attendance records in date range
  const query = {};
  if (Object.keys(dateFilter).length > 0) {
    query.date = dateFilter;
  }

  const attendanceRecords = await Attendance.find(query);

  // Calculate overall statistics
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
  const lateCount = attendanceRecords.filter(record => record.status === 'late').length;

  // Get unique dates and students for more accurate calculations
  const uniqueDates = [...new Set(attendanceRecords.map(record => record.date.toDateString()))];
  const uniqueStudents = [...new Set(attendanceRecords.map(record => record.student.toString()))];

  // Calculate trends (simplified - comparing with previous period)
  const periodDays = Math.max(1, uniqueDates.length);
  const previousPeriodStart = new Date(startDate);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

  const previousPeriodRecords = await Attendance.find({
    date: {
      $gte: previousPeriodStart,
      $lt: new Date(startDate)
    }
  });

  const currentPeriodAttendance = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
  const previousPeriodAttendance = previousPeriodRecords.length > 0
    ? (previousPeriodRecords.filter(r => r.status === 'present').length / previousPeriodRecords.length) * 100
    : 0;

  const trend = currentPeriodAttendance - previousPeriodAttendance;

  res.json({
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    presentPercentage: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
    absentPercentage: totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0,
    latePercentage: totalRecords > 0 ? (lateCount / totalRecords) * 100 : 0,
    uniqueDatesCount: uniqueDates.length,
    uniqueStudentsCount: uniqueStudents.length,
    averageAttendance: currentPeriodAttendance,
    trend: trend,
    periodComparison: {
      current: currentPeriodAttendance,
      previous: previousPeriodAttendance,
      improvement: trend
    }
  });
};

// @desc    Get attendance trends over time
// @route   GET /api/attendance/analytics/trends
// @access  Private/Admin
const getAttendanceTrends = async (req, res) => {
  const { days = 14 } = req.query;
  const trends = [];

  for (let i = parseInt(days) - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayRecords = await Attendance.find({
      date: {
        $gte: date,
        $lt: nextDay
      }
    });

    const totalRecords = dayRecords.length;
    const presentCount = dayRecords.filter(record => record.status === 'present').length;
    const percentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    trends.push({
      date: date.toISOString().split('T')[0],
      percentage: Math.round(percentage * 10) / 10,
      present: presentCount,
      total: totalRecords,
      absent: dayRecords.filter(record => record.status === 'absent').length,
      late: dayRecords.filter(record => record.status === 'late').length
    });
  }

  res.json(trends);
};

module.exports = {
  markAttendance,
  markBulkAttendance,
  getBatchAttendance,
  getStudentAttendance,
  getBatchAttendanceStats,
  getOverallAttendanceAnalytics,
  getAttendanceTrends,
};
