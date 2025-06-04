const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/labController');
const { protect, teacher, admin } = require('../middleware/authMiddleware');

// PC Management Routes
router.route('/pcs')
  .get(protect, getPCs)
  .post(protect, teacher, createPC);

router.get('/pcs/by-row', protect, getPCsByRow);
router.delete('/pcs/clear-all', protect, admin, clearAllPCs);

router.route('/pcs/:id')
  .get(protect, getPC)
  .put(protect, teacher, updatePC)
  .delete(protect, teacher, deletePC);

// Booking Management Routes
router.route('/bookings')
  .get(protect, getBookings)
  .post(protect, createBooking); // Allow both admin and teacher

router.get('/bookings/with-attendance', protect, getBookingsWithAttendance);
router.get('/bookings/previous', protect, getPreviousBookings);
router.post('/bookings/apply-previous', protect, teacher, applyPreviousBookings);
router.delete('/bookings/clear-bulk', protect, teacher, clearBookedSlotsBulk);

router.route('/bookings/:id')
  .get(protect, getBooking)
  .put(protect, teacher, updateBooking)
  .delete(protect, teacher, deleteBooking);

// Lab Availability Routes
router.get('/availability/:date', protect, getAvailability);

// Lab Information Routes
router.get('/info', protect, getLabInfo);

// Lab Statistics Routes
router.get('/stats/overview', protect, getOverviewStats);

module.exports = router;
