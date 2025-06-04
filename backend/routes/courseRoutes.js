const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByDepartment,
  getCourseStats,
  getCourseOverview
} = require('../controllers/courseController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/courses
router.route('/')
  .post(protect, admin, createCourse)
  .get(protect, getCourses);

router.get('/overview', protect, admin, getCourseOverview);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, admin, updateCourse)
  .delete(protect, admin, deleteCourse);

router.get('/:id/stats', protect, admin, getCourseStats);
router.get('/department/:departmentId', protect, getCoursesByDepartment);

module.exports = router;
