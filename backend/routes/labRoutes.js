const express = require('express');
const router = express.Router();

// Import controllers
const {
  createPC,
  getPCs,
  getPCById,
  updatePC,
  deletePC,
  getPCsByRow,
  clearAllPCs,
} = require('../controllers/pcController');

const {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getLabAvailability,
  getPreviousBookings,
  applyPreviousBookings,
  clearBookedSlotsBulk,
} = require('../controllers/labBookingController');

const { protect, admin, labAccess } = require('../middleware/authMiddleware');

// PC Routes
router.route('/pcs')
  .post(protect, admin, createPC)
  .get(protect, labAccess, getPCs);

router.get('/pcs/by-row', protect, labAccess, getPCsByRow);
router.delete('/pcs/clear-all', protect, admin, clearAllPCs);

router.route('/pcs/:id')
  .get(protect, labAccess, getPCById)
  .put(protect, admin, updatePC)
  .delete(protect, admin, deletePC);

// Booking Routes
router.route('/bookings')
  .post(protect, labAccess, createBooking)
  .get(protect, labAccess, getBookings);

// Previous bookings route
router.get('/bookings/previous', protect, labAccess, getPreviousBookings);

// Apply previous bookings route
router.post('/bookings/apply-previous', protect, labAccess, applyPreviousBookings);

// Clear booked slots bulk route
router.delete('/bookings/clear-bulk', protect, labAccess, clearBookedSlotsBulk);

router.route('/bookings/:id')
  .get(protect, labAccess, getBookingById)
  .put(protect, labAccess, updateBooking)
  .delete(protect, labAccess, deleteBooking);

// Availability Route
router.get('/availability/:date', protect, labAccess, getLabAvailability);

// Lab Information Route (public for all authenticated users)
router.get('/info', protect, async (req, res) => {
  try {
    const labInfo = {
      instituteName: 'CADD Centre',
      instituteType: 'Software Training Institute',
      logo: '/logos/cadd_logo.png',
      description: 'Leading Computer Aided Design and Development Training Institute',
      location: {
        address: 'Main Campus, Technology Park',
        city: 'Your City',
        state: 'Your State',
        country: 'India'
      },
      contact: {
        phone: '+91-XXXXXXXXXX',
        email: 'info@caddcentre.com',
        website: 'www.caddcentre.com'
      },
      facilities: {
        totalLabs: 3,
        totalPCs: 50,
        softwareAvailable: [
          'AutoCAD',
          'SolidWorks',
          'CATIA',
          'Ansys',
          'MATLAB',
          'Adobe Creative Suite',
          'Microsoft Office'
        ],
        operatingHours: {
          weekdays: '9:00 AM - 6:00 PM',
          weekends: '10:00 AM - 4:00 PM'
        }
      },
      courses: [
        'Mechanical CAD',
        'Civil CAD',
        'Electrical CAD',
        'Web Development',
        'Mobile App Development',
        'Data Science',
        'Digital Marketing'
      ],
      stats: {
        studentsEnrolled: 500,
        coursesOffered: 25,
        yearsOfExperience: 15,
        successRate: 95
      }
    }

    res.json(labInfo)
  } catch (error) {
    console.error('Error fetching lab info:', error)
    res.status(500).json({ message: 'Error fetching lab information' })
  }
})

// Lab Statistics Routes (for lab teachers and admins)
router.get('/stats/overview', protect, labAccess, async (req, res) => {
  try {
    const PC = require('../models/pcModel');
    const LabBooking = require('../models/labBookingModel');

    // Get PC statistics
    const totalPCs = await PC.countDocuments();
    const activePCs = await PC.countDocuments({ status: 'active' });
    const maintenancePCs = await PC.countDocuments({ status: 'maintenance' });
    const inactivePCs = await PC.countDocuments({ status: 'inactive' });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await LabBooking.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'confirmed'
    });

    // Get this week's bookings
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyBookings = await LabBooking.countDocuments({
      date: { $gte: weekStart, $lt: weekEnd },
      status: 'confirmed'
    });

    // Calculate utilization rate (simplified)
    const utilizationRate = totalPCs > 0 ? Math.round((activePCs / totalPCs) * 100) : 0;

    const stats = {
      totalPCs,
      activePCs,
      maintenancePCs,
      inactivePCs,
      todayBookings,
      weeklyBookings,
      utilizationRate
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching lab statistics:', error);
    res.status(500).json({ message: 'Error fetching lab statistics' });
  }
});

// Get PCs grouped by row
router.get('/pcs/by-row', protect, labAccess, async (req, res) => {
  try {
    const PC = require('../models/pcModel');
    const pcs = await PC.find({}).sort({ rowNumber: 1, pcNumber: 1 });

    // Group PCs by row
    const pcsByRow = {};
    pcs.forEach(pc => {
      if (!pcsByRow[pc.rowNumber]) {
        pcsByRow[pc.rowNumber] = [];
      }
      pcsByRow[pc.rowNumber].push({
        _id: pc._id,
        pcNumber: pc.pcNumber,
        status: pc.status,
        rowNumber: pc.rowNumber
      });
    });

    res.json(pcsByRow);
  } catch (error) {
    console.error('Error fetching PCs by row:', error);
    res.status(500).json({ message: 'Error fetching PCs by row' });
  }
});

// Bulk PC operations (for admins)
router.post('/pcs/bulk-update', protect, admin, async (req, res) => {
  try {
    // TODO: Implement bulk update logic
    res.json({ message: 'Bulk update completed' });
  } catch (error) {
    res.status(500).json({ message: 'Error performing bulk update' });
  }
});

// Lab maintenance schedule (for admins)
router.get('/maintenance/schedule', protect, admin, async (req, res) => {
  try {
    // TODO: Implement maintenance schedule logic
    const schedule = [];
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance schedule' });
  }
});

module.exports = router;
