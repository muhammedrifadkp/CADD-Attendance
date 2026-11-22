const User = require('../models/userModel');
const Department = require('../models/departmentModel');

/**
 * Employee IDs use the department's own code as prefix (Department.code, e.g. "CS").
 * Allowed prefix: 1-10 letters or digits.
 */
const EMPLOYEE_ID_PATTERN = /^[A-Z0-9]{1,10}-\d{3,}$/;

function departmentPrefix(department) {
  return String(department.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

/**
 * Generate unique Employee ID based on department
 * Format: {DEPT_CODE}-{SEQUENTIAL_NUMBER}
 * Examples: CS-001, CS-002, MECH-001
 * 
 * @param {string} departmentId - MongoDB ObjectId of the department
 * @returns {Promise<string>} - Generated unique Employee ID
 */
async function generateEmployeeId(departmentId) {
  try {
    // Get department information
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // The department's code is the prefix
    const deptCode = departmentPrefix(department);
    if (!deptCode) {
      throw new Error(`Department "${department.name}" has no code`);
    }

    // Find the highest existing employee ID for this department
    const existingEmployees = await User.find({
      employeeId: { $regex: `^${deptCode}-\\d+$` },
      role: 'teacher'
    });

    // Highest number so far (compared as numbers, so 1000 sorts after 999)
    let nextNumber = 1;
    for (const emp of existingEmployees) {
      const num = parseInt(emp.employeeId.split('-')[1], 10);
      if (num >= nextNumber) nextNumber = num + 1;
    }

    // Format the number with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    const employeeId = `${deptCode}-${formattedNumber}`;

    // Double-check uniqueness (in case of race conditions)
    const existingEmployee = await User.findOne({ employeeId });
    if (existingEmployee) {
      // If collision detected, try the next number
      const nextFormattedNumber = (nextNumber + 1).toString().padStart(3, '0');
      return `${deptCode}-${nextFormattedNumber}`;
    }

    return employeeId;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw new Error(`Failed to generate employee ID: ${error.message}`);
  }
}

/**
 * Validate Employee ID format
 * @param {string} employeeId - Employee ID to validate
 * @returns {boolean} - True if valid format
 */
function validateEmployeeIdFormat(employeeId) {
  if (!employeeId || typeof employeeId !== 'string') {
    return false;
  }

  // Check format: CODE-NNN (e.g., CS-001)
  return EMPLOYEE_ID_PATTERN.test(employeeId);
}

/**
 * Get department code from Employee ID
 * @param {string} employeeId - Employee ID
 * @returns {string|null} - Department code or null if invalid
 */
function getDepartmentCodeFromEmployeeId(employeeId) {
  if (!validateEmployeeIdFormat(employeeId)) {
    return null;
  }

  return employeeId.split('-')[0];
}

module.exports = {
  generateEmployeeId,
  validateEmployeeIdFormat,
  getDepartmentCodeFromEmployeeId,
  EMPLOYEE_ID_PATTERN
};
