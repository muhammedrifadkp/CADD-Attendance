const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Batch = require('../models/batchModel');
const Course = require('../models/courseModel');
const Department = require('../models/departmentModel');
const Attendance = require('../models/attendanceModel');
const PC = require('../models/pcModel');
const Booking = require('../models/bookingModel');

// @desc    Get comprehensive dashboard summary for admin
// @route   GET /api/analytics/dashboard-summary
// @access  Private/Admin
const getDashboardSummary = asyncHandler(async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get last 7 days for trends
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel data fetching for better performance
    const [
      totalStudents,
      totalTeachers,
      totalBatches,
      totalCourses,
      totalDepartments,
      activeBatches,
      totalPCs,
      activePCs,
      todayAttendance,
      todayBookings,
      weeklyTrends
    ] = await Promise.all([
      // Basic counts
      Student.countDocuments({}),
      User.countDocuments({ role: 'teacher' }),
      Batch.countDocuments({}),
      Course.countDocuments({}),
      Department.countDocuments({}),
      Batch.countDocuments({ isFinished: false }),

      // Lab statistics
      PC.countDocuments({}),
      PC.countDocuments({ status: 'active' }),

      // Today's attendance
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Today's lab bookings
      Booking.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),

      // Weekly trends data
      generateWeeklyTrends(sevenDaysAgo, today)
    ]);

    // Process today's attendance data
    const attendanceStats = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0
    };

    todayAttendance.forEach(stat => {
      attendanceStats.total += stat.count;
      attendanceStats[stat._id] = stat.count;
    });

    if (attendanceStats.total > 0) {
      attendanceStats.percentage = Math.round((attendanceStats.present / attendanceStats.total) * 100);
    }

    // Calculate lab utilization
    const labUtilization = activePCs > 0 ? Math.round((todayBookings / activePCs) * 100) : 0;

    // Get department-wise statistics
    const departmentStats = await getDepartmentWiseStats();

    // Prepare response data
    const dashboardData = {
      overview: {
        totalStudents,
        totalTeachers,
        totalBatches,
        totalCourses,
        totalDepartments,
        activeBatches,
        totalPCs,
        activePCs
      },
      today: {
        attendance: {
          total: attendanceStats.total,
          present: attendanceStats.present,
          absent: attendanceStats.absent,
          late: attendanceStats.late,
          percentage: attendanceStats.percentage
        },
        lab: {
          bookings: todayBookings,
          utilization: labUtilization,
          activePCs
        },
        activeClasses: activeBatches
      },
      trends: weeklyTrends,
      departments: departmentStats,
      lastUpdated: new Date().toISOString()
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
});

// Helper function to generate weekly trends
const generateWeeklyTrends = async (startDate, endDate) => {
  const trends = [];

  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const [attendanceCount, bookingCount] = await Promise.all([
      Attendance.countDocuments({
        date: { $gte: dayStart, $lte: dayEnd },
        status: 'present'
      }),
      Booking.countDocuments({
        date: { $gte: dayStart, $lte: dayEnd },
        status: { $ne: 'cancelled' }
      })
    ]);

    trends.push({
      date: dayStart.toISOString().split('T')[0],
      attendance: attendanceCount,
      bookings: bookingCount
    });
  }

  return trends;
};

// Helper function to get department-wise statistics
const getDepartmentWiseStats = async () => {
  try {
    const departments = await Department.find({});
    const departmentStats = [];

    for (const dept of departments) {
      // Get courses for this department
      const courses = await Course.find({ department: dept._id });
      const courseIds = courses.map(course => course._id);

      const [courseCount, batchCount, studentCount] = await Promise.all([
        Course.countDocuments({ department: dept._id }),
        // Batches are related to department through course
        Batch.countDocuments({ course: { $in: courseIds } }),
        Student.countDocuments({ department: dept._id })
      ]);

      departmentStats.push({
        _id: dept._id,
        name: dept.name,
        courses: courseCount,
        batches: batchCount,
        students: studentCount
      });
    }

    return departmentStats;
  } catch (error) {
    console.error('Error fetching department stats:', error);
    return [];
  }
};

// @desc    Get attendance analytics for admin
// @route   GET /api/analytics/attendance
// @access  Private/Admin
const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, department } = req.query;

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

  try {
    let batchIds = [];

    if (department) {
      // Get courses for the specified department
      const courses = await Course.find({ department: department });
      const courseIds = courses.map(course => course._id);

      // Get batches for those courses
      const batches = await Batch.find({ course: { $in: courseIds } });
      batchIds = batches.map(batch => batch._id);
    } else {
      // Get all batches if no department filter
      const batches = await Batch.find({});
      batchIds = batches.map(batch => batch._id);
    }

    // Get attendance records
    const attendanceQuery = {
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      ...(batchIds.length > 0 && { batch: { $in: batchIds } })
    };

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('student', 'name department')
      .populate('batch', 'name department');

    // Calculate analytics
    const analytics = {
      totalRecords: attendanceRecords.length,
      presentCount: attendanceRecords.filter(r => r.status === 'present').length,
      absentCount: attendanceRecords.filter(r => r.status === 'absent').length,
      lateCount: attendanceRecords.filter(r => r.status === 'late').length,
    };

    analytics.presentPercentage = analytics.totalRecords > 0
      ? Math.round((analytics.presentCount / analytics.totalRecords) * 100)
      : 0;

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching attendance analytics:', error);
    res.status(500).json({
      message: 'Error fetching attendance analytics',
      error: error.message
    });
  }
});

module.exports = {
  getDashboardSummary,
  getAttendanceAnalytics
};
