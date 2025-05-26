const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getBatchAttendance,
  getStudentAttendance,
  getBatchAttendanceStats,
  getOverallAttendanceAnalytics,
  getAttendanceTrends,
} = require('../controllers/attendanceController');
const { protect, teacher, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, teacher, markAttendance);

router.post('/bulk', protect, teacher, markBulkAttendance);

router.get('/batch/:batchId', protect, teacher, getBatchAttendance);
router.get('/student/:studentId', protect, teacher, getStudentAttendance);
router.get('/stats/batch/:batchId', protect, teacher, getBatchAttendanceStats);

// Admin analytics routes
router.get('/analytics/overall', protect, admin, getOverallAttendanceAnalytics);
router.get('/analytics/trends', protect, admin, getAttendanceTrends);

module.exports = router;
