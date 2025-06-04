const express = require('express');
const router = express.Router();
const {
  authRateLimiter,
  passwordResetRateLimiter,
  sensitiveOperationsRateLimiter
} = require('../middleware/rateLimitMiddleware');
const {
  loginUser,
  logoutUser,
  getUserProfile,
  createTeacher,
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
  getTeacherStats,
  getTeachersOverview,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  previewEmployeeId,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes with enhanced rate limiting
router.post('/login', authRateLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', authRateLimiter, refreshToken);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetRateLimiter, resetPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword);

// Admin routes
router.route('/')
  .post(protect, admin, createTeacher)
  .get(protect, admin, getTeachers);

// Admin management routes
router.route('/admins')
  .post(protect, admin, createAdmin)
  .get(protect, admin, getAdmins);

router.route('/admins/:id')
  .get(protect, admin, getAdminById)
  .put(protect, admin, updateAdmin)
  .delete(protect, admin, deleteAdmin);

router.put('/admins/:id/reset-password', protect, admin, resetAdminPassword);

// Teacher management routes
router.route('/teachers')
  .get(protect, admin, getTeachers);

router.get('/teachers/overview', protect, admin, getTeachersOverview);

router.route('/teachers/:id')
  .get(protect, admin, getTeacherById)
  .put(protect, admin, updateTeacher)
  .delete(protect, admin, deleteTeacher);

router.get('/teachers/:id/stats', protect, admin, getTeacherStats);
router.put('/teachers/:id/reset-password', protect, admin, resetTeacherPassword);

// Employee ID preview route
router.get('/preview-employee-id/:departmentId', protect, admin, previewEmployeeId);

module.exports = router;

