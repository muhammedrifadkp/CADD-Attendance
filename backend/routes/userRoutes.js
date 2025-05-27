const express = require('express');
const router = express.Router();
const {
  loginUser,
  logoutUser,
  getUserProfile,
  createTeacher,
  createAdmin,
  getAdmins,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', loginUser);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);

// Admin routes
router.route('/')
  .post(protect, admin, createTeacher);

// Admin management routes
router.route('/admins')
  .post(protect, admin, createAdmin)
  .get(protect, admin, getAdmins);

// Teacher management routes
router.route('/teachers')
  .get(protect, admin, getTeachers);

router.route('/teachers/:id')
  .get(protect, admin, getTeacherById)
  .put(protect, admin, updateTeacher)
  .delete(protect, admin, deleteTeacher);

router.put('/teachers/:id/reset-password', protect, admin, resetTeacherPassword);

module.exports = router;
