/**
 * Model validation utilities to ensure data integrity across relationships
 */

const mongoose = require('mongoose');

/**
 * Validate that referenced documents exist
 * @param {string} modelName - Name of the model to check
 * @param {string|ObjectId} id - ID to validate
 * @returns {Promise<boolean>} Whether the document exists
 */
async function validateDocumentExists(modelName, id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  try {
    const Model = mongoose.model(modelName);
    const document = await Model.findById(id).select('_id').lean();
    return !!document;
  } catch (error) {
    console.error(`Error validating ${modelName} existence:`, error);
    return false;
  }
}

/**
 * Validate student-batch relationship
 * @param {string|ObjectId} studentId - Student ID
 * @param {string|ObjectId} batchId - Batch ID
 * @returns {Promise<Object>} Validation result
 */
async function validateStudentBatchRelationship(studentId, batchId) {
  try {
    const Student = mongoose.model('Student');
    const student = await Student.findById(studentId).select('batch').lean();
    
    if (!student) {
      return { valid: false, error: 'Student not found' };
    }

    if (student.batch.toString() !== batchId.toString()) {
      return { valid: false, error: 'Student does not belong to the specified batch' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate course-department relationship
 * @param {string|ObjectId} courseId - Course ID
 * @param {string|ObjectId} departmentId - Department ID
 * @returns {Promise<Object>} Validation result
 */
async function validateCourseDepartmentRelationship(courseId, departmentId) {
  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(courseId).select('department').lean();
    
    if (!course) {
      return { valid: false, error: 'Course not found' };
    }

    if (course.department.toString() !== departmentId.toString()) {
      return { valid: false, error: 'Course does not belong to the specified department' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate batch-course relationship
 * @param {string|ObjectId} batchId - Batch ID
 * @param {string|ObjectId} courseId - Course ID
 * @returns {Promise<Object>} Validation result
 */
async function validateBatchCourseRelationship(batchId, courseId) {
  try {
    const Batch = mongoose.model('Batch');
    const batch = await Batch.findById(batchId).select('course').lean();
    
    if (!batch) {
      return { valid: false, error: 'Batch not found' };
    }

    if (batch.course.toString() !== courseId.toString()) {
      return { valid: false, error: 'Batch does not belong to the specified course' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate complete student hierarchy (Department -> Course -> Batch -> Student)
 * @param {Object} studentData - Student data to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateStudentHierarchy(studentData) {
  const { department, course, batch } = studentData;

  try {
    // Validate all documents exist
    const [deptExists, courseExists, batchExists] = await Promise.all([
      validateDocumentExists('Department', department),
      validateDocumentExists('Course', course),
      validateDocumentExists('Batch', batch)
    ]);

    if (!deptExists) {
      return { valid: false, error: 'Department not found' };
    }
    if (!courseExists) {
      return { valid: false, error: 'Course not found' };
    }
    if (!batchExists) {
      return { valid: false, error: 'Batch not found' };
    }

    // Validate relationships
    const [courseDeptValid, batchCourseValid] = await Promise.all([
      validateCourseDepartmentRelationship(course, department),
      validateBatchCourseRelationship(batch, course)
    ]);

    if (!courseDeptValid.valid) {
      return courseDeptValid;
    }
    if (!batchCourseValid.valid) {
      return batchCourseValid;
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate user permissions for batch access
 * @param {Object} user - User object
 * @param {string|ObjectId} batchId - Batch ID
 * @returns {Promise<Object>} Validation result
 */
async function validateUserBatchAccess(user, batchId) {
  try {
    // Admin has access to all batches
    if (user.role === 'admin') {
      return { valid: true };
    }

    // Teachers can only access batches they created
    if (user.role === 'teacher') {
      const Batch = mongoose.model('Batch');
      const batch = await Batch.findById(batchId).select('createdBy').lean();
      
      if (!batch) {
        return { valid: false, error: 'Batch not found' };
      }

      if (batch.createdBy.toString() !== user._id.toString()) {
        return { valid: false, error: 'Access denied: You can only access batches you created' };
      }

      return { valid: true };
    }

    return { valid: false, error: 'Invalid user role' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate batch capacity
 * @param {string|ObjectId} batchId - Batch ID
 * @param {number} additionalStudents - Number of students to add (default: 1)
 * @returns {Promise<Object>} Validation result
 */
async function validateBatchCapacity(batchId, additionalStudents = 1) {
  try {
    const Batch = mongoose.model('Batch');
    const Student = mongoose.model('Student');

    const [batch, currentStudentCount] = await Promise.all([
      Batch.findById(batchId).select('maxStudents').lean(),
      Student.countDocuments({ batch: batchId, isActive: true })
    ]);

    if (!batch) {
      return { valid: false, error: 'Batch not found' };
    }

    const newTotal = currentStudentCount + additionalStudents;
    if (newTotal > batch.maxStudents) {
      return { 
        valid: false, 
        error: `Batch capacity exceeded. Current: ${currentStudentCount}, Max: ${batch.maxStudents}, Trying to add: ${additionalStudents}` 
      };
    }

    return { 
      valid: true, 
      data: { 
        currentStudents: currentStudentCount, 
        maxStudents: batch.maxStudents, 
        availableSlots: batch.maxStudents - currentStudentCount 
      } 
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate unique constraints across related models
 * @param {string} modelName - Model name
 * @param {Object} data - Data to validate
 * @param {string|ObjectId} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<Object>} Validation result
 */
async function validateUniqueConstraints(modelName, data, excludeId = null) {
  try {
    const Model = mongoose.model(modelName);
    const errors = [];

    // Define unique field checks for each model
    const uniqueChecks = {
      Student: [
        { field: 'email', value: data.email },
        { field: 'rollNo', value: data.rollNo }
      ],
      Course: [
        { field: 'code', value: data.code, additionalFilter: { department: data.department } }
      ],
      Department: [
        { field: 'name', value: data.name },
        { field: 'code', value: data.code }
      ],
      User: [
        { field: 'email', value: data.email }
      ]
    };

    const checks = uniqueChecks[modelName] || [];

    for (const check of checks) {
      if (!check.value) continue;

      const query = { [check.field]: check.value };
      
      // Add additional filters if specified
      if (check.additionalFilter) {
        Object.assign(query, check.additionalFilter);
      }

      // Exclude current document if updating
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existing = await Model.findOne(query).select('_id').lean();
      if (existing) {
        errors.push(`${check.field} '${check.value}' already exists`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Comprehensive validation for model operations
 * @param {string} modelName - Model name
 * @param {Object} data - Data to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
async function validateModelOperation(modelName, data, options = {}) {
  const { operation = 'create', user, excludeId } = options;
  const errors = [];

  try {
    // Validate unique constraints
    const uniqueValidation = await validateUniqueConstraints(modelName, data, excludeId);
    if (!uniqueValidation.valid) {
      errors.push(...(uniqueValidation.errors || [uniqueValidation.error]));
    }

    // Model-specific validations
    if (modelName === 'Student') {
      const hierarchyValidation = await validateStudentHierarchy(data);
      if (!hierarchyValidation.valid) {
        errors.push(hierarchyValidation.error);
      }

      if (operation === 'create') {
        const capacityValidation = await validateBatchCapacity(data.batch);
        if (!capacityValidation.valid) {
          errors.push(capacityValidation.error);
        }
      }
    }

    // User permission validations
    if (user && data.batch) {
      const accessValidation = await validateUserBatchAccess(user, data.batch);
      if (!accessValidation.valid) {
        errors.push(accessValidation.error);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  validateDocumentExists,
  validateStudentBatchRelationship,
  validateCourseDepartmentRelationship,
  validateBatchCourseRelationship,
  validateStudentHierarchy,
  validateUserBatchAccess,
  validateBatchCapacity,
  validateUniqueConstraints,
  validateModelOperation
};
