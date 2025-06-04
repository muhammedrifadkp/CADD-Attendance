const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getStudentsByDepartment,
  getStudentsByBatch,
  getStudentStats,
  getStudentsOverview,
} = require('../controllers/studentController');
const { protect, teacher } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, teacher, createStudent)
  .get(protect, teacher, getStudents);

router.get('/overview', protect, getStudentsOverview);

router.post('/bulk', protect, teacher, bulkCreateStudents);

router.route('/department/:departmentId')
  .get(protect, getStudentsByDepartment);

router.route('/batch/:batchId')
  .get(protect, getStudentsByBatch);

router.route('/:id')
  .get(protect, getStudentById)
  .put(protect, updateStudent)
  .delete(protect, deleteStudent);

router.get('/:id/stats', protect, getStudentStats);

module.exports = router;
