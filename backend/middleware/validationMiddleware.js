// Validation middleware for request data
const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

// Student validation rules
const validateStudent = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('rollNo')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Roll number must be between 1 and 20 characters'),
  body('batchId')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('contactInfo.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Batch validation rules
const validateBatch = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Batch name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('timing')
    .matches(/^(0[9]|1[0-2]):[0-5][0-9]-(0[9]|1[0-7]):[0-5][0-9] (AM|PM)$/)
    .withMessage('Timing must be in format HH:MM-HH:MM AM/PM'),
  handleValidationErrors
];

// PC validation rules
const validatePC = [
  body('pcNumber')
    .matches(/^[A-Z]{1,3}-\d{1,3}$/)
    .withMessage('PC number must be in format XX-XX (e.g., CS-01, SS-05)'),
  body('rowNumber')
    .isInt({ min: 1, max: 4 })
    .withMessage('Row number must be between 1 and 4'),
  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'inactive'])
    .withMessage('Status must be active, maintenance, or inactive'),
  handleValidationErrors
];

// Lab booking validation rules
const validateLabBooking = [
  body('pc')
    .isMongoId()
    .withMessage('Invalid PC ID'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('timeSlot')
    .isIn(['09:00-10:30 AM', '10:30-12:00 PM', '12:00-01:30 PM', '02:00-03:30 PM', '03:30-05:00 PM'])
    .withMessage('Invalid time slot'),
  body('bookedFor')
    .isIn(['student', 'teacher', 'batch'])
    .withMessage('Booked for must be student, teacher, or batch'),
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Purpose must not exceed 200 characters'),
  handleValidationErrors
];

// Attendance validation rules
const validateAttendance = [
  body('student')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('batch')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Status must be present, absent, or late'),
  body('timeIn')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid time in'),
  body('timeOut')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid time out'),
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateStudent,
  validateBatch,
  validatePC,
  validateLabBooking,
  validateAttendance,
  validateLogin,
  handleValidationErrors
};
