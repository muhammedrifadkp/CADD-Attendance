const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  getDepartmentOverview
} = require('../controllers/departmentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/departments
router.route('/')
  .post(protect, admin, createDepartment)
  .get(protect, getDepartments);

router.get('/overview', protect, admin, getDepartmentOverview);

router.route('/:id')
  .get(protect, getDepartmentById)
  .put(protect, admin, updateDepartment)
  .delete(protect, admin, deleteDepartment);

router.get('/:id/stats', protect, getDepartmentStats);

module.exports = router;
