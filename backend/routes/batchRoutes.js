const express = require('express');
const router = express.Router();
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  getBatchStudents,
  toggleBatchFinished,
  getBatchesByCourse,
  getBatchesByDepartment,
  getBatchStats,
  getBatchesOverview,
} = require('../controllers/batchController');
const { protect, teacher } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, teacher, createBatch)
  .get(protect, teacher, getBatches);

router.get('/overview', protect, getBatchesOverview);

router.route('/course/:courseId')
  .get(protect, getBatchesByCourse);

router.route('/department/:departmentId')
  .get(protect, getBatchesByDepartment);

router.route('/:id')
  .get(protect, teacher, getBatchById)
  .put(protect, teacher, updateBatch)
  .delete(protect, teacher, deleteBatch);

router.get('/:id/stats', protect, teacher, getBatchStats);

router.get('/:id/students', protect, teacher, getBatchStudents);
router.put('/:id/toggle-finished', protect, teacher, toggleBatchFinished);

module.exports = router;
