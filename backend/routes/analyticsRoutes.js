const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getAttendanceAnalytics
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Analytics routes for admin dashboard
router.get('/dashboard-summary', protect, admin, getDashboardSummary);
router.get('/attendance', protect, admin, getAttendanceAnalytics);

module.exports = router;
