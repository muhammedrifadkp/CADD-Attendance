const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');
const emailService = require('../utils/emailService');

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Generate JWT with enhanced security
const generateToken = (id, userAgent = '', ip = '') => {
  return jwt.sign(
    {
      id,
      iat: Math.floor(Date.now() / 1000),
      // Add fingerprinting for additional security
      fp: crypto.createHash('sha256').update(`${userAgent}-${ip}`).digest('hex').substring(0, 16)
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m', // Shorter expiry for better security
      issuer: 'cadd-attendance',
      audience: 'cadd-attendance-users'
    }
  );
};

// Generate refresh token with enhanced security
const generateRefreshToken = (id, userAgent = '', ip = '') => {
  return jwt.sign(
    {
      id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      fp: crypto.createHash('sha256').update(`${userAgent}-${ip}`).digest('hex').substring(0, 16)
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      issuer: 'cadd-attendance',
      audience: 'cadd-attendance-users'
    }
  );
};

// Validate password complexity
const validatePassword = (password) => {
  if (!PASSWORD_REGEX.test(password)) {
    throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
  }
  return true;
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'student'
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Normalize input - could be email or employee ID
  const normalizedInput = email.toLowerCase().trim();

  // Check if input is email format or employee ID format
  const isEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(normalizedInput);
  const isEmployeeId = /^(CADD|LW|DZ|SY)-\d{3}$/i.test(normalizedInput);

  let searchQuery;
  if (isEmail) {
    searchQuery = { email: normalizedInput };
  } else if (isEmployeeId) {
    searchQuery = { employeeId: normalizedInput.toUpperCase() };
  } else {
    res.status(400);
    throw new Error('Please provide a valid email address or Employee ID');
  }

  // Check for user and include password field
  const user = await User.findOne(searchQuery).select('+password +failedLoginAttempts +lockUntil');

  if (!user) {
    // Use same error message to prevent user enumeration
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
    res.status(423); // 423 Locked
    throw new Error(`Account is locked. Please try again in ${lockTimeRemaining} minutes.`);
  }

  // Check if user is active
  if (!user.active) {
    res.status(401);
    throw new Error('Account is inactive');
  }

  // Use the model's matchPassword method which handles failed attempts
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Generate tokens with fingerprinting
  const userAgent = req.get('User-Agent') || '';
  const clientIP = req.ip || req.connection.remoteAddress || '';

  const accessToken = generateToken(user._id, userAgent, clientIP);
  const refreshTokenValue = generateRefreshToken(user._id, userAgent, clientIP);

  // Hash refresh token before storing
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

  // Save hashed refresh token to user document
  user.refreshToken = hashedRefreshToken;
  user.lastLogin = new Date();
  await user.save();

  // Set secure cookies
  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  res.cookie('refreshToken', refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/users/refresh-token',
  });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: accessToken
  });
});

// @desc    Refresh access token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not provided' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateToken(user._id);

    // Set new JWT cookie
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Logout user / clear cookies
// @route   POST /api/users/logout
// @access  Public (works with or without authentication)
const logoutUser = async (req, res) => {
  try {
    // Clear the JWT cookie
    res.cookie('jwt', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
      expires: new Date(0),
      path: '/',
    });

    // Clear the refresh token cookie
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
      expires: new Date(0),
      path: '/api/users/refresh-token',
    });

    // Clear refresh token from user document (if user is authenticated)
    if (req.user && req.user._id) {
      try {
        const user = await User.findById(req.user._id);
        if (user) {
          user.refreshToken = undefined;
          await user.save();
        }
      } catch (userError) {
        console.warn('Could not clear refresh token from user document:', userError.message);
        // Don't fail logout if we can't update user document
      }
    }

    console.log('User logged out, cookies cleared');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      generateAlert(SecurityEventType.UNAUTHORIZED_ACCESS, {
        message: 'Profile access attempt for non-existent user',
        userId: req.user._id,
        ip: req.ip
      });
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    generateAlert(SecurityEventType.SYSTEM_ERROR, {
      message: 'Error fetching user profile',
      error: error.message,
      userId: req.user._id,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new teacher
// @route   POST /api/users
// @access  Private/Admin
const createTeacher = async (req, res) => {
  const {
    name,
    email,
    password,
    role = 'teacher',
    department,
    phone,
    address,
    dateOfJoining,
    qualification,
    experience,
    specialization,
    active = true
  } = req.body;

  try {
    // Validate role
    if (role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid role. Must be teacher' });
    }

    // Validate required fields for teachers
    if (!department) {
      return res.status(400).json({ message: 'Department is required for teachers' });
    }

    // Validate password complexity
    try {
      validatePassword(password);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Verify department exists
    const Department = require('../models/departmentModel');
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Auto-generate unique Employee ID based on department
    const employeeId = await generateEmployeeId(department);

    // Store the plain password before it gets hashed (for email)
    const plainPassword = password;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      employeeId,
      phone,
      address,
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
      qualification,
      experience: experience ? Number(experience) : undefined,
      specialization,
      active,
    });

    if (user) {
      // Populate department information
      await user.populate('department', 'name code');

      // Prepare teacher data for email
      const teacherEmailData = {
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        password: plainPassword, // Send the original password
        department: user.department
      };

      // Send welcome email with credentials
      let emailResult = { success: false };
      try {
        emailResult = await emailService.sendTeacherWelcomeEmail(teacherEmailData);
        if (emailResult.success) {
          console.log(`Welcome email sent to ${user.email} (${user.employeeId})`);
        } else {
          console.warn(`Failed to send welcome email to ${user.email}:`, emailResult.message);
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        emailResult = { success: false, message: emailError.message };
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        phone: user.phone,
        address: user.address,
        dateOfJoining: user.dateOfJoining,
        qualification: user.qualification,
        experience: user.experience,
        specialization: user.specialization,
        active: user.active,
        message: 'Teacher created successfully',
        emailSent: emailResult.success,
        emailMessage: emailResult.message || (emailResult.success ? 'Welcome email sent successfully' : 'Failed to send welcome email'),
        ...(process.env.NODE_ENV === 'development' && emailResult.previewUrl && { emailPreviewUrl: emailResult.previewUrl })
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Server error during teacher creation' });
  }
};

// @desc    Create a new admin
// @route   POST /api/users/admins
// @access  Private/Admin
const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'Admin created successfully'
      });
    } else {
      res.status(400).json({
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      message: 'Server error during admin creation',
      error: error.message
    });
  }
};

// @desc    Get all admins
// @route   GET /api/users/admins
// @access  Private/Admin
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      message: 'Server error fetching admins',
      error: error.message
    });
  }
};

// @desc    Get admin by ID
// @route   GET /api/users/admins/:id
// @access  Private/Admin
const getAdminById = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id).select('-password');

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching admin',
      error: error.message
    });
  }
};

// @desc    Update admin
// @route   PUT /api/users/admins/:id
// @access  Private/Admin
const updateAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { name, email, active, password } = req.body;

    // Check if email is unique (if being changed)
    if (email && email !== admin.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update fields
    if (name) admin.name = name.trim();
    if (email) admin.email = email.toLowerCase().trim();
    if (typeof active === 'boolean') admin.active = active;
    if (password) admin.password = password;

    const updatedAdmin = await admin.save();

    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      active: updatedAdmin.active,
      createdAt: updatedAdmin.createdAt,
      updatedAt: updatedAdmin.updatedAt,
      message: 'Admin updated successfully'
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      message: 'Server error updating admin',
      error: error.message
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/users/admins/:id
// @access  Private/Admin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent deleting the last admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({
        message: 'Cannot delete the last admin. At least one admin must exist.'
      });
    }

    // Prevent self-deletion
    if (admin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own admin account.'
      });
    }

    await admin.deleteOne();
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      message: 'Server error deleting admin',
      error: error.message
    });
  }
};

// @desc    Reset admin password
// @route   PUT /api/users/admins/:id/reset-password
// @access  Private/Admin
const resetAdminPassword = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long'
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Admin password reset successfully' });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({
      message: 'Server error resetting admin password',
      error: error.message
    });
  }
};

// @desc    Get all teachers
// @route   GET /api/users/teachers
// @access  Private/Admin
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error fetching teachers' });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/users/teachers/:id
// @access  Private/Admin
const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('department', 'name code');

    if (teacher && teacher.role === 'teacher') {
      res.json(teacher);
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    console.error('Get teacher by ID error:', error);
    res.status(500).json({ message: 'Server error fetching teacher' });
  }
};

// @desc    Update teacher
// @route   PUT /api/users/teachers/:id
// @access  Private/Admin
const updateTeacher = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const {
      name,
      email,
      department,
      phone,
      address,
      dateOfJoining,
      qualification,
      experience,
      specialization,
      active,
      password
    } = req.body;

    // Handle department change - regenerate Employee ID if department changes
    let newEmployeeId = teacher.employeeId;
    if (department && department !== teacher.department?.toString()) {
      const Department = require('../models/departmentModel');
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({ message: 'Department not found' });
      }

      // Generate new Employee ID for the new department
      newEmployeeId = await generateEmployeeId(department);
    }

    // Update fields
    teacher.name = name || teacher.name;
    teacher.email = email || teacher.email;
    teacher.department = department || teacher.department;
    teacher.employeeId = newEmployeeId; // Use the new or existing Employee ID
    teacher.phone = phone !== undefined ? phone : teacher.phone;
    teacher.address = address !== undefined ? address : teacher.address;
    teacher.dateOfJoining = dateOfJoining ? new Date(dateOfJoining) : teacher.dateOfJoining;
    teacher.qualification = qualification !== undefined ? qualification : teacher.qualification;
    teacher.experience = experience !== undefined ? Number(experience) : teacher.experience;
    teacher.specialization = specialization !== undefined ? specialization : teacher.specialization;
    teacher.active = active !== undefined ? active : teacher.active;

    // Role is fixed as teacher
    teacher.role = 'teacher';

    if (password) {
      teacher.password = password;
    }

    const updatedTeacher = await teacher.save();

    // Populate department information
    await updatedTeacher.populate('department', 'name code');

    res.json({
      _id: updatedTeacher._id,
      name: updatedTeacher.name,
      email: updatedTeacher.email,
      role: updatedTeacher.role,
      department: updatedTeacher.department,
      employeeId: updatedTeacher.employeeId,
      phone: updatedTeacher.phone,
      address: updatedTeacher.address,
      dateOfJoining: updatedTeacher.dateOfJoining,
      qualification: updatedTeacher.qualification,
      experience: updatedTeacher.experience,
      specialization: updatedTeacher.specialization,
      active: updatedTeacher.active,
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Server error updating teacher' });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/users/teachers/:id
// @access  Private/Admin
const deleteTeacher = async (req, res) => {
  const teacher = await User.findById(req.params.id);

  if (teacher && teacher.role === 'teacher') {
    await teacher.deleteOne();
    res.json({ message: 'Teacher removed' });
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
};

// @desc    Reset teacher password
// @route   PUT /api/users/teachers/:id/reset-password
// @access  Private/Admin
const resetTeacherPassword = async (req, res) => {
  const teacher = await User.findById(req.params.id);

  if (teacher && teacher.role === 'teacher') {
    // Generate a more secure random password
    // This includes uppercase, lowercase, numbers, and special characters
    const generateSecurePassword = (length = 12) => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

      let password = '';
      // Ensure at least one of each character type
      password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
      password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
      password += symbols.charAt(Math.floor(Math.random() * symbols.length));

      // Fill the rest with random characters
      const allChars = lowercase + uppercase + numbers + symbols;
      for (let i = 4; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }

      // Shuffle the password
      return password.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const newPassword = generateSecurePassword(12);

    // Store the original password before it gets hashed
    const originalPassword = newPassword;

    teacher.password = newPassword;
    await teacher.save();

    // Return the new password in the response
    res.json({
      message: 'Password reset successful',
      temporaryPassword: originalPassword,
      instructions: 'Please provide this password to the teacher securely and advise them to change it immediately after logging in.'
    });
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
};

// @desc    Change user's own password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Check if all required fields are provided
  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if new password and confirm password match
  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('New password and confirm password do not match');
  }

  // Get user from database
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if current password is correct
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Check if new password is different from current password
  const isSamePassword = await user.matchPassword(newPassword);

  if (isSamePassword) {
    res.status(400);
    throw new Error('New password must be different from current password');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    message: 'Password changed successfully',
    success: true
  });
};

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide email address');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Don't reveal if user exists or not
    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    return;
  }

  if (!user.active) {
    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    return;
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // In a real application, you would send an email here
  // For now, we'll log it (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Password reset token for', email, ':', resetToken);
  }

  res.status(200).json({
    message: 'If an account with that email exists, a password reset link has been sent.',
    // Only include token in development
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
});

// @desc    Reset password
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error('Please provide reset token and new password');
  }

  // Validate password complexity
  if (!validatePassword(password)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;

  await user.save();

  res.status(200).json({
    message: 'Password has been reset successfully'
  });
});

// @desc    Get teacher statistics
// @route   GET /api/users/teachers/:id/stats
// @access  Private/Admin
const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.params.id;

    // Verify teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get batches created by this teacher
    const Batch = require('../models/batchModel');
    const Student = require('../models/studentModel');
    const Attendance = require('../models/attendanceModel');

    const batches = await Batch.find({ createdBy: teacherId });
    const batchIds = batches.map(batch => batch._id);

    // Calculate statistics
    const [
      totalBatches,
      activeBatches,
      finishedBatches,
      totalStudents,
      activeStudents,
      totalAttendanceRecords
    ] = await Promise.all([
      Batch.countDocuments({ createdBy: teacherId }),
      Batch.countDocuments({ createdBy: teacherId, isFinished: false }),
      Batch.countDocuments({ createdBy: teacherId, isFinished: true }),
      Student.countDocuments({ batch: { $in: batchIds } }),
      Student.countDocuments({ batch: { $in: batchIds }, isActive: true }),
      Attendance.countDocuments({ batch: { $in: batchIds } })
    ]);

    // Calculate average batch size and teaching load
    const averageBatchSize = totalBatches > 0 ? Math.round(totalStudents / totalBatches) : 0;
    const teachingLoad = activeBatches; // Number of active batches as teaching load

    // Get recent attendance data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttendance = await Attendance.aggregate([
      {
        $match: {
          batch: { $in: batchIds },
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const attendanceStats = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0
    };

    recentAttendance.forEach(stat => {
      attendanceStats.total += stat.count;
      attendanceStats[stat._id] = stat.count;
    });

    attendanceStats.presentPercentage = attendanceStats.total > 0
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

    const stats = {
      batches: {
        total: totalBatches,
        active: activeBatches,
        finished: finishedBatches
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        averageBatchSize
      },
      attendance: {
        totalRecords: totalAttendanceRecords,
        recent: attendanceStats
      },
      performance: {
        teachingLoad,
        attendanceRate: attendanceStats.presentPercentage,
        experienceYears: teacher.experience || 0
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({
      message: 'Error fetching teacher statistics',
      error: error.message
    });
  }
};

// @desc    Get teachers overview with analytics
// @route   GET /api/users/teachers/overview
// @access  Private/Admin
const getTeachersOverview = async (req, res) => {
  try {
    const Batch = require('../models/batchModel');
    const Student = require('../models/studentModel');

    // Get all teachers with their statistics
    const teachers = await User.find({ role: 'teacher' })
      .populate('department', 'name code')
      .select('-password -refreshToken');

    const teachersOverview = [];

    for (const teacher of teachers) {
      const batches = await Batch.find({ createdBy: teacher._id });
      const batchIds = batches.map(batch => batch._id);

      const [batchCount, studentCount, activeBatchCount] = await Promise.all([
        Batch.countDocuments({ createdBy: teacher._id }),
        Student.countDocuments({ batch: { $in: batchIds } }),
        Batch.countDocuments({ createdBy: teacher._id, isFinished: false })
      ]);

      const averageBatchSize = batchCount > 0 ? Math.round(studentCount / batchCount) : 0;

      teachersOverview.push({
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        employeeId: teacher.employeeId,
        department: teacher.department,
        active: teacher.active,
        batchCount,
        studentCount,
        activeBatchCount,
        averageBatchSize,
        experience: teacher.experience,
        specialization: teacher.specialization,
        dateOfJoining: teacher.dateOfJoining,
        lastLogin: teacher.lastLogin,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      });
    }

    res.json({ teachers: teachersOverview });
  } catch (error) {
    console.error('Error fetching teachers overview:', error);
    res.status(500).json({
      message: 'Error fetching teachers overview',
      error: error.message
    });
  }
};

// @desc    Preview Employee ID for department
// @route   GET /api/users/preview-employee-id/:departmentId
// @access  Private/Admin
const previewEmployeeId = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Verify department exists
    const Department = require('../models/departmentModel');
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Generate preview Employee ID
    const employeeId = await generateEmployeeId(departmentId);

    res.json({
      employeeId,
      department: {
        _id: department._id,
        name: department.name,
        code: department.code
      }
    });
  } catch (error) {
    console.error('Error previewing employee ID:', error);
    res.status(500).json({
      message: 'Error generating employee ID preview',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
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
};

