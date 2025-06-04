const asyncHandler = require('express-async-handler');
const PC = require('../models/pcModel');
const Booking = require('../models/bookingModel');
const LabInfo = require('../models/labInfoModel');

// @desc    Get all PCs
// @route   GET /api/lab/pcs
// @access  Private
const getPCs = asyncHandler(async (req, res) => {
  const pcs = await PC.find({}).sort({ row: 1, position: 1 });
  res.json(pcs);
});

// @desc    Get PCs grouped by row
// @route   GET /api/lab/pcs/by-row
// @access  Private
const getPCsByRow = asyncHandler(async (req, res) => {
  const pcs = await PC.find({}).sort({ row: 1, position: 1 });

  // Group PCs by row
  const pcsByRow = {};
  pcs.forEach(pc => {
    if (!pcsByRow[pc.row]) {
      pcsByRow[pc.row] = [];
    }
    pcsByRow[pc.row].push(pc);
  });

  res.json(pcsByRow);
});

// @desc    Get PC by ID
// @route   GET /api/lab/pcs/:id
// @access  Private
const getPC = asyncHandler(async (req, res) => {
  const pc = await PC.findById(req.params.id);

  if (!pc) {
    res.status(404);
    throw new Error('PC not found');
  }

  res.json(pc);
});

// @desc    Create new PC
// @route   POST /api/lab/pcs
// @access  Private (Admin/Teacher)
const createPC = asyncHandler(async (req, res) => {
  const { pcNumber, row, position, specifications, notes } = req.body;

  // Check if PC number already exists
  const existingPC = await PC.findOne({ pcNumber });
  if (existingPC) {
    res.status(400);
    throw new Error('PC number already exists');
  }

  const pc = await PC.create({
    pcNumber,
    row,
    position,
    specifications,
    notes
  });

  res.status(201).json(pc);
});

// @desc    Update PC
// @route   PUT /api/lab/pcs/:id
// @access  Private (Admin/Teacher)
const updatePC = asyncHandler(async (req, res) => {
  const pc = await PC.findById(req.params.id);

  if (!pc) {
    res.status(404);
    throw new Error('PC not found');
  }

  const updatedPC = await PC.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedPC);
});

// @desc    Delete PC
// @route   DELETE /api/lab/pcs/:id
// @access  Private (Admin/Teacher)
const deletePC = asyncHandler(async (req, res) => {
  const pc = await PC.findById(req.params.id);

  if (!pc) {
    res.status(404);
    throw new Error('PC not found');
  }

  await PC.findByIdAndDelete(req.params.id);
  res.json({ message: 'PC removed' });
});

// @desc    Clear all PCs
// @route   DELETE /api/lab/pcs/clear-all
// @access  Private (Admin)
const clearAllPCs = asyncHandler(async (req, res) => {
  await PC.deleteMany({});
  res.json({ message: 'All PCs cleared' });
});

// @desc    Get all bookings
// @route   GET /api/lab/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
  const { date } = req.query;

  let query = {};
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    query.date = {
      $gte: startDate,
      $lt: endDate
    };
  }

  const bookings = await Booking.find(query)
    .populate('pc', 'pcNumber row position')
    .populate('student', 'name rollNo email')
    .populate('batch', 'name timing')
    .populate('bookedBy', 'name email')
    .sort({ date: 1, timeSlot: 1 });

  res.json(bookings);
});

// @desc    Get bookings with attendance status
// @route   GET /api/lab/bookings/with-attendance
// @access  Private
const getBookingsWithAttendance = asyncHandler(async (req, res) => {
  const { date, timeSlot } = req.query;
  const Attendance = require('../models/attendanceModel');

  console.log('📡 getBookingsWithAttendance called with:', { date, timeSlot });

  let query = {};
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    query.date = {
      $gte: startDate,
      $lt: endDate
    };
  }

  // Add timeSlot filter if provided
  if (timeSlot) {
    query.timeSlot = timeSlot;
  }

  // Only get active bookings
  query.status = { $ne: 'cancelled' };

  const bookings = await Booking.find(query)
    .populate('pc', 'pcNumber row position status')
    .populate('student', 'name rollNo email batch')
    .populate('batch', 'name timing teacher')
    .populate('bookedBy', 'name email')
    .sort({ date: 1, timeSlot: 1 });

  console.log(`📋 Found ${bookings.length} bookings for date: ${date}, timeSlot: ${timeSlot || 'all'}`);

  // Get attendance data for the same date
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Enhance bookings with attendance status
  const bookingsWithAttendance = await Promise.all(
    bookings.map(async (booking) => {
      let attendanceStatus = 'not-marked';

      if (booking.student) {
        try {
          const attendance = await Attendance.findOne({
            student: booking.student._id,
            date: {
              $gte: attendanceDate,
              $lt: nextDay
            }
          });

          if (attendance) {
            attendanceStatus = attendance.status;
            console.log(`👤 Student ${booking.student.name} attendance: ${attendanceStatus}`);
          } else {
            console.log(`⏳ No attendance marked for student ${booking.student.name}`);
          }
        } catch (error) {
          console.error('Error fetching attendance for student:', booking.student._id, error);
        }
      } else {
        console.log('⚠️ Booking without student reference:', booking._id);
      }

      return {
        ...booking.toObject(),
        attendanceStatus,
        // Ensure we have the date in the correct format
        date: booking.date.toISOString().split('T')[0]
      };
    })
  );

  console.log('✅ Returning bookings with attendance status');
  res.json(bookingsWithAttendance);
});

// @desc    Get booking by ID
// @route   GET /api/lab/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('pc', 'pcNumber row position')
    .populate('bookedBy', 'name email');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  res.json(booking);
});

// @desc    Create new booking
// @route   POST /api/lab/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const {
    pc,
    date,
    timeSlot,
    bookedFor,
    student,
    studentName,
    teacherName,
    batch,
    purpose,
    notes
  } = req.body;

  console.log('📝 Creating booking with data:', req.body);
  console.log('👤 User making request:', req.user?.name || req.user?.email);

  // Validate required fields
  if (!pc || !date || !timeSlot || !studentName) {
    res.status(400);
    throw new Error('Missing required fields: pc, date, timeSlot, and studentName are required');
  }

  // Validate PC exists and is available
  const PC = require('../models/pcModel');
  const pcExists = await PC.findById(pc);
  if (!pcExists) {
    res.status(404);
    throw new Error('PC not found');
  }

  // Check if PC is active
  if (pcExists.status !== 'active') {
    res.status(400);
    throw new Error(`PC ${pcExists.pcNumber} is ${pcExists.status} and not available for booking`);
  }

  // Check if PC is already booked for this date and time slot
  const existingBooking = await Booking.findOne({
    pc,
    date: new Date(date),
    timeSlot,
    status: { $ne: 'cancelled' }
  });

  if (existingBooking) {
    res.status(400);
    throw new Error(`PC ${pcExists.pcNumber} is already booked for ${timeSlot} on ${date}`);
  }

  // Validate student if provided
  let studentRecord = null;
  if (student) {
    const Student = require('../models/studentModel');
    studentRecord = await Student.findById(student).populate('batch');

    if (!studentRecord) {
      res.status(404);
      throw new Error('Student not found');
    }

    if (!studentRecord.isActive) {
      res.status(400);
      throw new Error('Student is not active and cannot be booked');
    }

    // Check if student already has a booking for this date and time slot
    const studentExistingBooking = await Booking.findOne({
      student,
      date: new Date(date),
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (studentExistingBooking) {
      res.status(400);
      throw new Error(`Student ${studentRecord.name} already has a booking for ${timeSlot} on ${date}`);
    }
  }

  try {
    const booking = await Booking.create({
      pc,
      date: new Date(date),
      timeSlot,
      bookedFor: bookedFor || studentName,
      student: student || null,
      studentName,
      teacherName: teacherName || 'Unknown Teacher',
      batch: batch || (studentRecord?.batch?._id) || null,
      purpose: purpose || 'Lab Session',
      notes: notes || '',
      bookedBy: req.user._id
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('pc', 'pcNumber row position status')
      .populate('student', 'name rollNo email batch')
      .populate('batch', 'name timing teacher')
      .populate('bookedBy', 'name email');

    console.log('✅ Booking created successfully:', {
      id: populatedBooking._id,
      pc: populatedBooking.pc.pcNumber,
      student: populatedBooking.studentName,
      timeSlot: populatedBooking.timeSlot,
      date: populatedBooking.date
    });

    // Trigger real-time update event
    const updateEvent = {
      type: 'booking_created',
      booking: populatedBooking,
      pc: populatedBooking.pc,
      date: date,
      timeSlot: timeSlot,
      timestamp: new Date().toISOString()
    };

    // Emit lab availability update event (if using WebSocket or similar)
    // This would be handled by your real-time service
    console.log('🔄 Triggering lab availability update:', updateEvent);

    res.status(201).json({
      success: true,
      message: `PC ${pcExists.pcNumber} booked successfully for ${studentName}`,
      booking: populatedBooking,
      updateEvent
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500);
    throw new Error('Failed to create booking: ' + error.message);
  }
});

// @desc    Update booking
// @route   PUT /api/lab/bookings/:id
// @access  Private
const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  ).populate('pc', 'pcNumber row position')
   .populate('bookedBy', 'name email');

  res.json(updatedBooking);
});

// @desc    Delete booking
// @route   DELETE /api/lab/bookings/:id
// @access  Private
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('pc', 'pcNumber row position status')
    .populate('student', 'name rollNo email')
    .populate('batch', 'name timing');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  console.log('🗑️ Deleting booking:', {
    id: booking._id,
    pc: booking.pc.pcNumber,
    student: booking.studentName,
    timeSlot: booking.timeSlot,
    date: booking.date
  });

  // Store booking info for update event before deletion
  const deletedBookingInfo = {
    id: booking._id,
    pc: booking.pc,
    studentName: booking.studentName,
    timeSlot: booking.timeSlot,
    date: booking.date.toISOString().split('T')[0]
  };

  await Booking.findByIdAndDelete(req.params.id);

  // Trigger real-time update event
  const updateEvent = {
    type: 'booking_deleted',
    booking: deletedBookingInfo,
    pc: booking.pc,
    date: deletedBookingInfo.date,
    timeSlot: booking.timeSlot,
    timestamp: new Date().toISOString()
  };

  console.log('🔄 Triggering lab availability update after deletion:', updateEvent);

  res.json({
    success: true,
    message: `Booking for PC ${booking.pc.pcNumber} removed successfully`,
    deletedBooking: deletedBookingInfo,
    updateEvent
  });
});

// @desc    Get lab availability for a specific date
// @route   GET /api/lab/availability/:date
// @access  Private
const getAvailability = asyncHandler(async (req, res) => {
  const { date } = req.params;

  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const bookings = await Booking.find({
    date: {
      $gte: startDate,
      $lt: endDate
    },
    status: { $ne: 'cancelled' }
  }).populate('pc', 'pcNumber row position');

  const pcs = await PC.find({ status: 'active' });

  res.json({
    date,
    totalPCs: pcs.length,
    bookings: bookings.length,
    availablePCs: pcs.length - bookings.length,
    pcs,
    bookings
  });
});

// @desc    Get previous day's bookings
// @route   GET /api/lab/bookings/previous
// @access  Private
const getPreviousBookings = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const targetDate = new Date(date);
  const previousDate = new Date(targetDate);
  previousDate.setDate(previousDate.getDate() - 1);

  const startDate = new Date(previousDate);
  const endDate = new Date(previousDate);
  endDate.setDate(endDate.getDate() + 1);

  const bookings = await Booking.find({
    date: {
      $gte: startDate,
      $lt: endDate
    },
    status: { $ne: 'cancelled' }
  }).populate('pc', 'pcNumber row position')
   .populate('bookedBy', 'name email');

  res.json({
    date: previousDate.toISOString().split('T')[0],
    bookings
  });
});

// @desc    Apply previous day's bookings to current date
// @route   POST /api/lab/bookings/apply-previous
// @access  Private
const applyPreviousBookings = asyncHandler(async (req, res) => {
  const { targetDate, bookings } = req.body;

  let appliedCount = 0;
  const errors = [];

  for (const booking of bookings) {
    try {
      // Check if PC is already booked for this date and time slot
      const existingBooking = await Booking.findOne({
        pc: booking.pc._id,
        date: new Date(targetDate),
        timeSlot: booking.timeSlot,
        status: { $ne: 'cancelled' }
      });

      if (!existingBooking) {
        await Booking.create({
          pc: booking.pc._id,
          date: new Date(targetDate),
          timeSlot: booking.timeSlot,
          bookedFor: booking.bookedFor,
          studentName: booking.studentName,
          teacherName: booking.teacherName,
          batch: booking.batch,
          purpose: booking.purpose,
          notes: `Applied from ${booking.date}`,
          bookedBy: req.user._id
        });
        appliedCount++;
      }
    } catch (error) {
      errors.push(`Failed to apply booking for PC ${booking.pc.pcNumber}: ${error.message}`);
    }
  }

  res.json({
    message: `Applied ${appliedCount} bookings successfully`,
    appliedCount,
    errors
  });
});

// @desc    Clear booked slots in bulk
// @route   DELETE /api/lab/bookings/clear-bulk
// @access  Private
const clearBookedSlotsBulk = asyncHandler(async (req, res) => {
  const { date, timeSlots, pcs } = req.body;

  let query = {};

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    query.date = {
      $gte: startDate,
      $lt: endDate
    };
  }

  if (timeSlots && timeSlots.length > 0) {
    query.timeSlot = { $in: timeSlots };
  }

  if (pcs && pcs.length > 0) {
    query.pc = { $in: pcs };
  }

  const result = await Booking.deleteMany(query);

  res.json({
    message: `Cleared ${result.deletedCount} bookings`,
    deletedCount: result.deletedCount
  });
});

// @desc    Get lab information
// @route   GET /api/lab/info
// @access  Private
const getLabInfo = asyncHandler(async (req, res) => {
  let labInfo = await LabInfo.findOne({});

  if (!labInfo) {
    // Create default lab info if none exists
    labInfo = await LabInfo.create({
      instituteName: 'CADD Centre',
      labName: 'Computer Lab',
      address: {
        city: 'Your City',
        state: 'Your State',
        country: 'India'
      },
      contact: {
        phone: '+91-XXXXXXXXXX',
        email: 'info@caddcentre.com'
      },
      capacity: {
        totalPCs: 0,
        totalRows: 4
      },
      timeSlots: [
        { name: 'Morning', startTime: '09:00', endTime: '12:00', duration: 180 },
        { name: 'Afternoon', startTime: '13:00', endTime: '16:00', duration: 180 },
        { name: 'Evening', startTime: '17:00', endTime: '20:00', duration: 180 }
      ]
    });
  }

  res.json(labInfo);
});

// @desc    Get lab overview statistics
// @route   GET /api/lab/stats/overview
// @access  Private
const getOverviewStats = asyncHandler(async (req, res) => {
  const totalPCs = await PC.countDocuments({});
  const activePCs = await PC.countDocuments({ status: 'active' });
  const maintenancePCs = await PC.countDocuments({ status: 'maintenance' });
  const inactivePCs = await PC.countDocuments({ status: 'inactive' });

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const todayBookings = await Booking.countDocuments({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $ne: 'cancelled' }
  });

  res.json({
    totalPCs,
    activePCs,
    maintenancePCs,
    inactivePCs,
    todayBookings
  });
});

module.exports = {
  getPCs,
  getPCsByRow,
  getPC,
  createPC,
  updatePC,
  deletePC,
  clearAllPCs,
  getBookings,
  getBookingsWithAttendance,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  getAvailability,
  getPreviousBookings,
  applyPreviousBookings,
  clearBookedSlotsBulk,
  getLabInfo,
  getOverviewStats
};
