const LabBooking = require('../models/labBookingModel');
const PC = require('../models/pcModel');

// @desc    Create a new lab booking
// @route   POST /api/lab/bookings
// @access  Private/Admin/Lab-Teacher
const createBooking = async (req, res) => {
  try {
    const { pc, date, timeSlot, bookedFor, purpose, batch, student, teacher, studentName, teacherName, studentCount, notes, priority, isActive } = req.body;

    // Check if PC exists and is active
    const pcExists = await PC.findById(pc);
    if (!pcExists || pcExists.status !== 'active') {
      return res.status(400).json({ message: 'PC not found or not active' });
    }

    // Check if slot is already booked for this PC
    const existingBooking = await LabBooking.findOne({
      pc,
      date: new Date(date),
      timeSlot,
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is already booked for this PC' });
    }

    // Check if the same student already has a booking for this date and time slot
    if (studentName) {
      const studentConflict = await LabBooking.findOne({
        studentName: studentName.trim(),
        date: new Date(date),
        timeSlot,
        status: 'confirmed'
      });

      if (studentConflict) {
        return res.status(400).json({
          message: `Student "${studentName}" is already booked for this time slot on this date`
        });
      }
    }

    const booking = await LabBooking.create({
      pc,
      date: new Date(date),
      timeSlot,
      bookedBy: req.user._id,
      bookedFor,
      purpose,
      batch,
      student,
      teacher,
      studentName,
      teacherName,
      studentCount,
      notes,
      priority: priority || 'normal',
      isActive: isActive !== undefined ? isActive : true,
    });

    await booking.populate([
      { path: 'pc', select: 'pcNumber rowNumber' },
      { path: 'bookedBy', select: 'name email' },
      { path: 'batch', select: 'name section' },
      { path: 'student', select: 'name rollNo' },
      { path: 'teacher', select: 'name email' }
    ]);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

// @desc    Get all bookings
// @route   GET /api/lab/bookings
// @access  Private/Lab Access
const getBookings = async (req, res) => {
  try {
    const { date, timeSlot, pc, status } = req.query;

    let filter = {};
    if (date) filter.date = new Date(date);
    if (timeSlot) filter.timeSlot = timeSlot;
    if (pc) filter.pc = pc;
    if (status) filter.status = status;

    const bookings = await LabBooking.find(filter)
      .populate('pc', 'pcNumber rowNumber')
      .populate('bookedBy', 'name email')
      .populate('batch', 'name section')
      .populate('student', 'name rollNo')
      .populate('teacher', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/lab/bookings/:id
// @access  Private/Lab Access
const getBookingById = async (req, res) => {
  try {
    const booking = await LabBooking.findById(req.params.id)
      .populate('pc', 'pcNumber rowNumber specifications')
      .populate('bookedBy', 'name email')
      .populate('batch', 'name section');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error fetching booking' });
  }
};

// @desc    Update booking
// @route   PUT /api/lab/bookings/:id
// @access  Private/Admin/Teacher
const updateBooking = async (req, res) => {
  try {
    const { pc, date, timeSlot, bookedFor, purpose, batch, studentCount, status, notes } = req.body;

    const booking = await LabBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can update this booking
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && booking.bookedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // If changing PC, date, or timeSlot, check for conflicts
    if ((pc && booking.pc && pc !== booking.pc.toString()) ||
        (date && new Date(date).getTime() !== booking.date.getTime()) ||
        (timeSlot && timeSlot !== booking.timeSlot)) {

      const conflictBooking = await LabBooking.findOne({
        pc: pc || (booking.pc ? booking.pc : null),
        date: date ? new Date(date) : booking.date,
        timeSlot: timeSlot || booking.timeSlot,
        status: 'confirmed',
        _id: { $ne: booking._id }
      });

      if (conflictBooking) {
        return res.status(400).json({ message: 'This time slot is already booked for this PC' });
      }
    }

    // Check for student conflicts when updating student, date, or timeSlot
    const updatedStudentName = req.body.studentName || booking.studentName;
    if (updatedStudentName &&
        ((date && new Date(date).getTime() !== booking.date.getTime()) ||
         (timeSlot && timeSlot !== booking.timeSlot) ||
         (req.body.studentName && req.body.studentName !== booking.studentName))) {

      const studentConflict = await LabBooking.findOne({
        studentName: updatedStudentName.trim(),
        date: date ? new Date(date) : booking.date,
        timeSlot: timeSlot || booking.timeSlot,
        status: 'confirmed',
        _id: { $ne: booking._id }
      });

      if (studentConflict) {
        return res.status(400).json({
          message: `Student "${updatedStudentName}" is already booked for this time slot on this date`
        });
      }
    }

    // Update fields
    if (pc) booking.pc = pc;
    if (date) booking.date = new Date(date);
    if (timeSlot) booking.timeSlot = timeSlot;
    if (bookedFor) booking.bookedFor = bookedFor;
    if (purpose) booking.purpose = purpose;
    if (batch) booking.batch = batch;
    if (studentCount) booking.studentCount = studentCount;
    if (status) booking.status = status;
    if (notes !== undefined) booking.notes = notes;

    const updatedBooking = await booking.save();
    await updatedBooking.populate([
      { path: 'pc', select: 'pcNumber rowNumber' },
      { path: 'bookedBy', select: 'name email' },
      { path: 'batch', select: 'name section' }
    ]);

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error updating booking' });
  }
};

// @desc    Delete booking
// @route   DELETE /api/lab/bookings/:id
// @access  Private/Admin/Teacher
const deleteBooking = async (req, res) => {
  try {
    const booking = await LabBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can delete this booking
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && booking.bookedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    await LabBooking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error deleting booking' });
  }
};

// @desc    Get lab availability for a specific date
// @route   GET /api/lab/availability/:date
// @access  Private/Lab Access
const getLabAvailability = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    // Get all active PCs
    const pcs = await PC.find({ status: 'active' }).sort({ rowNumber: 1, pcNumber: 1 });

    // Get all bookings for the date (confirmed and completed for history)
    const confirmedBookings = await LabBooking.find({
      date: targetDate,
      status: 'confirmed'
    }).populate('pc', 'pcNumber rowNumber').populate('bookedBy', 'name');

    const completedBookings = await LabBooking.find({
      date: targetDate,
      status: 'completed'
    }).populate('pc', 'pcNumber rowNumber').populate('bookedBy', 'name');

    // Define standard time slots
    const standardTimeSlots = [
      '09:00-10:30',
      '10:30-12:00',
      '12:00-13:30',
      '14:00-15:30',
      '15:30-17:00'
    ];

    // Get unique time slots from existing bookings and merge with standard slots
    const allBookings = [...confirmedBookings, ...completedBookings];
    const bookingTimeSlots = [...new Set(allBookings.map(booking => booking.timeSlot))];
    const uniqueTimeSlots = [...new Set([...standardTimeSlots, ...bookingTimeSlots])].sort();

    // Create availability matrix
    const availability = {};

    // Initialize all slots as available
    pcs.forEach(pc => {
      availability[pc._id] = {
        pc: {
          _id: pc._id,
          pcNumber: pc.pcNumber,
          rowNumber: pc.rowNumber,
          status: pc.status
        },
        slots: {}
      };

      // Initialize all standard time slots as available
      uniqueTimeSlots.forEach(slot => {
        availability[pc._id].slots[slot] = {
          available: true,
          booking: null
        };
      });
    });

    // Mark confirmed bookings as occupied
    confirmedBookings.forEach(booking => {
      if (booking.pc && booking.pc._id && availability[booking.pc._id]) {
        availability[booking.pc._id].slots[booking.timeSlot] = {
          available: false,
          booking: {
            _id: booking._id,
            bookedFor: booking.bookedFor,
            purpose: booking.purpose,
            bookedBy: booking.bookedBy?.name || 'Unknown',
            status: 'confirmed'
          }
        };
      }
    });

    // Mark completed bookings as recently freed (for history/context)
    completedBookings.forEach(booking => {
      if (booking.pc && booking.pc._id && availability[booking.pc._id]) {
        // Only mark as recently freed if not already occupied by confirmed booking
        if (availability[booking.pc._id].slots[booking.timeSlot].available) {
          availability[booking.pc._id].slots[booking.timeSlot] = {
            available: true,
            recentlyFreed: true,
            lastBooking: {
              _id: booking._id,
              bookedFor: booking.bookedFor,
              studentName: booking.studentName,
              completedAt: booking.updatedAt,
              status: 'completed'
            }
          };
        }
      }
    });

    res.json({
      date: targetDate,
      timeSlots: uniqueTimeSlots,
      availability: Object.values(availability),
      totalPCs: pcs.length,
      bookedSlots: confirmedBookings.length,
      completedSlots: completedBookings.length
    });
  } catch (error) {
    console.error('Error fetching lab availability:', error);
    res.status(500).json({ message: 'Server error fetching lab availability' });
  }
};

// @desc    Get previous day's bookings
// @route   GET /api/lab/bookings/previous
// @access  Private/Admin/Lab-Teacher
const getPreviousBookings = async (req, res) => {
  try {
    const { date } = req.query;

    // Calculate previous day
    let targetDate;
    if (date) {
      // Parse the date string and create a proper date object
      targetDate = new Date(date + 'T00:00:00.000Z');
      targetDate.setUTCDate(targetDate.getUTCDate() - 1);
    } else {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }

    // Set time to start of day (UTC)
    targetDate.setUTCHours(0, 0, 0, 0);

    // Set end of day (UTC)
    const endDate = new Date(targetDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const bookings = await LabBooking.find({
      date: {
        $gte: targetDate,
        $lte: endDate
      },
      isActive: true
    })
    .populate('pc', 'pcNumber rowNumber status')
    .populate('bookedBy', 'name email')
    .populate('batch', 'name section')
    .populate('student', 'name rollNo')
    .populate('teacher', 'name email')
    .sort({ timeSlot: 1, 'pc.rowNumber': 1, 'pc.pcNumber': 1 });

    res.json({
      date: targetDate.toISOString().split('T')[0],
      bookings,
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('Error fetching previous bookings:', error);
    res.status(500).json({ message: 'Server error fetching previous bookings' });
  }
};

// @desc    Apply previous day's bookings to current date
// @route   POST /api/lab/bookings/apply-previous
// @access  Private/Admin/Lab-Teacher
const applyPreviousBookings = async (req, res) => {
  try {
    console.log('🔄 Apply Previous Bookings - Request received');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.name, req.user?.role);

    const { targetDate, sourceDate } = req.body;

    if (!targetDate) {
      console.log('❌ Target date is missing');
      return res.status(400).json({ message: 'Target date is required' });
    }

    // Calculate source date (previous day) if not provided
    let previousDate;
    if (sourceDate) {
      previousDate = new Date(sourceDate + 'T00:00:00.000Z');
    } else {
      previousDate = new Date(targetDate + 'T00:00:00.000Z');
      previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    }

    // Set time boundaries for source date (UTC)
    const sourceStart = new Date(previousDate);
    sourceStart.setUTCHours(0, 0, 0, 0);
    const sourceEnd = new Date(previousDate);
    sourceEnd.setUTCHours(23, 59, 59, 999);

    // Set time boundaries for target date (UTC)
    const targetStart = new Date(targetDate + 'T00:00:00.000Z');
    targetStart.setUTCHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate + 'T00:00:00.000Z');
    targetEnd.setUTCHours(23, 59, 59, 999);

    console.log('📅 Date boundaries:');
    console.log('  Source:', sourceStart, 'to', sourceEnd);
    console.log('  Target:', targetStart, 'to', targetEnd);

    // Get previous day's bookings
    console.log('📅 Searching for bookings between:', sourceStart, 'and', sourceEnd);
    const previousBookings = await LabBooking.find({
      date: {
        $gte: sourceStart,
        $lte: sourceEnd
      },
      isActive: true,
      status: 'confirmed'
    }).populate('pc', 'pcNumber rowNumber status');

    console.log(`📊 Found ${previousBookings.length} previous bookings`);

    if (previousBookings.length === 0) {
      console.log('❌ No previous bookings found to apply');
      return res.status(404).json({ message: 'No previous bookings found to apply' });
    }

    // Check for existing bookings on target date
    const existingBookings = await LabBooking.find({
      date: {
        $gte: targetStart,
        $lte: targetEnd
      },
      isActive: true,
      status: 'confirmed'
    });

    // Create a map of existing bookings for conflict checking
    const existingBookingsMap = new Map();
    const existingStudentBookingsMap = new Map();
    existingBookings.forEach(booking => {
      const pcKey = `${booking.pc}_${booking.timeSlot}`;
      existingBookingsMap.set(pcKey, booking);

      // Also track student bookings for student conflict checking
      if (booking.studentName) {
        const studentKey = `${booking.studentName.trim()}_${booking.timeSlot}`;
        existingStudentBookingsMap.set(studentKey, booking);
      }
    });

    const newBookings = [];
    const conflicts = [];
    const unavailablePCs = [];
    const studentConflicts = [];

    // Process each previous booking
    for (const prevBooking of previousBookings) {
      // Check if PC still exists and is active
      if (!prevBooking.pc || prevBooking.pc.status !== 'active') {
        unavailablePCs.push({
          pcNumber: prevBooking.pc?.pcNumber || 'Unknown',
          reason: 'PC not active or not found'
        });
        continue;
      }

      // Check for PC conflicts
      const conflictKey = `${prevBooking.pc._id}_${prevBooking.timeSlot}`;
      if (existingBookingsMap.has(conflictKey)) {
        conflicts.push({
          pcNumber: prevBooking.pc.pcNumber,
          timeSlot: prevBooking.timeSlot,
          studentName: prevBooking.studentName,
          existingBooking: existingBookingsMap.get(conflictKey),
          conflictType: 'PC'
        });
        continue;
      }

      // Check for student conflicts
      if (prevBooking.studentName) {
        const studentConflictKey = `${prevBooking.studentName.trim()}_${prevBooking.timeSlot}`;
        if (existingStudentBookingsMap.has(studentConflictKey)) {
          studentConflicts.push({
            pcNumber: prevBooking.pc.pcNumber,
            timeSlot: prevBooking.timeSlot,
            studentName: prevBooking.studentName,
            existingBooking: existingStudentBookingsMap.get(studentConflictKey),
            conflictType: 'Student'
          });
          continue;
        }
      }

      // Create new booking data
      const newBookingData = {
        pc: prevBooking.pc._id,
        date: new Date(targetDate),
        timeSlot: prevBooking.timeSlot,
        bookedBy: req.user._id,
        bookedFor: prevBooking.bookedFor,
        purpose: prevBooking.purpose || 'Applied from previous day',
        batch: prevBooking.batch,
        student: prevBooking.student,
        teacher: prevBooking.teacher,
        studentName: prevBooking.studentName,
        teacherName: prevBooking.teacherName,
        studentCount: prevBooking.studentCount,
        notes: `Applied from ${previousDate.toISOString().split('T')[0]} - ${prevBooking.notes || ''}`.trim(),
        priority: prevBooking.priority || 'normal',
        isActive: true,
        status: 'confirmed'
      };

      newBookings.push(newBookingData);
    }

    // Create new bookings if there are any
    let createdBookings = [];
    console.log(`📝 Attempting to create ${newBookings.length} new bookings`);

    if (newBookings.length > 0) {
      createdBookings = await LabBooking.insertMany(newBookings);
      console.log(`✅ Successfully created ${createdBookings.length} bookings`);

      // Populate the created bookings
      await LabBooking.populate(createdBookings, [
        { path: 'pc', select: 'pcNumber rowNumber' },
        { path: 'bookedBy', select: 'name email' },
        { path: 'batch', select: 'name section' },
        { path: 'student', select: 'name rollNo' },
        { path: 'teacher', select: 'name email' }
      ]);
    } else {
      console.log('⚠️ No new bookings to create (all had conflicts or unavailable PCs)');
    }

    // Prepare response
    const response = {
      success: true,
      message: `Applied ${createdBookings.length} bookings from ${previousDate.toISOString().split('T')[0]} to ${targetDate}`,
      sourceDate: previousDate.toISOString().split('T')[0],
      targetDate: targetDate,
      summary: {
        totalPreviousBookings: previousBookings.length,
        appliedBookings: createdBookings.length,
        conflicts: conflicts.length,
        studentConflicts: studentConflicts.length,
        unavailablePCs: unavailablePCs.length
      },
      createdBookings,
      conflicts,
      studentConflicts,
      unavailablePCs
    };

    console.log('📤 Sending response:', {
      appliedBookings: response.summary.appliedBookings,
      conflicts: response.summary.conflicts,
      studentConflicts: response.summary.studentConflicts,
      unavailablePCs: response.summary.unavailablePCs
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Error applying previous bookings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error applying previous bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Clear booked slots in bulk
// @route   DELETE /api/lab/bookings/clear-bulk
// @access  Private/Admin/Lab-Teacher
const clearBookedSlotsBulk = async (req, res) => {
  try {
    console.log('🗑️ Clear Booked Slots Bulk - Request received');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.name, req.user?.role);

    const {
      date,
      timeSlot,
      pcIds,
      clearAll = false,
      confirmClear = false
    } = req.body;

    if (!confirmClear) {
      return res.status(400).json({
        message: 'Confirmation required to clear bookings',
        error: 'ConfirmationRequired'
      });
    }

    // Build filter based on provided criteria
    let filter = {
      isActive: true,
      status: 'confirmed'
    };

    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date);
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Add time slot filter if provided
    if (timeSlot && timeSlot !== 'all') {
      filter.timeSlot = timeSlot;
    }

    // Add PC filter if provided
    if (pcIds && pcIds.length > 0) {
      filter.pc = { $in: pcIds };
    }

    console.log('🔍 Filter criteria:', JSON.stringify(filter, null, 2));

    // Get bookings to be cleared (for reporting)
    const bookingsToDelete = await LabBooking.find(filter)
      .populate('pc', 'pcNumber rowNumber')
      .populate('bookedBy', 'name email')
      .populate('student', 'name rollNo')
      .sort({ timeSlot: 1, 'pc.rowNumber': 1, 'pc.pcNumber': 1 });

    console.log(`📊 Found ${bookingsToDelete.length} bookings to clear`);

    if (bookingsToDelete.length > 0) {
      console.log('📋 Bookings to be cleared:');
      bookingsToDelete.forEach((booking, index) => {
        console.log(`  ${index + 1}. PC: ${booking.pc?.pcNumber}, Time: ${booking.timeSlot}, Student: ${booking.studentName}`);
      });
    }

    if (bookingsToDelete.length === 0) {
      return res.status(404).json({
        message: 'No bookings found matching the criteria',
        clearedCount: 0
      });
    }

    // Perform bulk deletion
    const deleteResult = await LabBooking.deleteMany(filter);
    console.log(`✅ Successfully cleared ${deleteResult.deletedCount} bookings`);

    // Prepare detailed response
    const response = {
      success: true,
      message: `Successfully cleared ${deleteResult.deletedCount} booked slots`,
      clearedCount: deleteResult.deletedCount,
      criteria: {
        date: date || 'All dates',
        timeSlot: timeSlot || 'All time slots',
        pcCount: pcIds?.length || 'All PCs'
      },
      clearedBookings: bookingsToDelete.map(booking => ({
        id: booking._id,
        pcNumber: booking.pc?.pcNumber,
        timeSlot: booking.timeSlot,
        studentName: booking.studentName || booking.bookedFor,
        date: booking.date?.toISOString().split('T')[0],
        bookedBy: booking.bookedBy?.name
      }))
    };

    console.log('📤 Sending response:', {
      clearedCount: response.clearedCount,
      criteria: response.criteria
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Error clearing booked slots:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error clearing booked slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getLabAvailability,
  getPreviousBookings,
  applyPreviousBookings,
  clearBookedSlotsBulk,
};
