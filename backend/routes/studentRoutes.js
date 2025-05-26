const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
} = require('../controllers/studentController');
const { protect, teacher } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, teacher, createStudent)
  .get(protect, teacher, getStudents);

router.post('/bulk', protect, teacher, bulkCreateStudents);

router.route('/:id')
  .get(protect, teacher, getStudentById)
  .put(protect, teacher, updateStudent)
  .delete(protect, teacher, deleteStudent);

module.exports = router;
