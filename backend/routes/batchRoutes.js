const express = require('express');
const router = express.Router();
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  getBatchStudents,
} = require('../controllers/batchController');
const { protect, teacher } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, teacher, createBatch)
  .get(protect, teacher, getBatches);

router.route('/:id')
  .get(protect, teacher, getBatchById)
  .put(protect, teacher, updateBatch)
  .delete(protect, teacher, deleteBatch);

router.get('/:id/students', protect, teacher, getBatchStudents);

module.exports = router;
