const User = require('../models/userModel');
const Department = require('../models/departmentModel');

/**
 * Department code mapping for Employee ID generation
 */
const DEPARTMENT_CODE_MAP = {
  'CADD': 'CADD',
  'LIVEWIRE': 'LW',
  'DREAMZONE': 'DZ',
  'SYNERGY': 'SY'
};

/**
 * Generate unique Employee ID based on department
 * Format: {DEPT_CODE}-{SEQUENTIAL_NUMBER}
 * Examples: CADD-001, LW-001, LW-002, DZ-001, SY-001
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

    // Get department code from mapping
    const deptCode = DEPARTMENT_CODE_MAP[department.name];
    if (!deptCode) {
      throw new Error(`Department code mapping not found for: ${department.name}`);
    }

    // Find the highest existing employee ID for this department
    const existingEmployees = await User.find({
      employeeId: { $regex: `^${deptCode}-\\d+$` },
      role: 'teacher'
    }).sort({ employeeId: -1 });

    let nextNumber = 1;

    if (existingEmployees.length > 0) {
      // Extract the number from the highest employee ID
      const highestId = existingEmployees[0].employeeId;
      const numberPart = highestId.split('-')[1];
      nextNumber = parseInt(numberPart, 10) + 1;
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

  // Check format: DEPT-NNN (e.g., CADD-001, LW-001)
  const pattern = /^(CADD|LW|DZ|SY)-\d{3}$/;
  return pattern.test(employeeId);
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
  DEPARTMENT_CODE_MAP
};
