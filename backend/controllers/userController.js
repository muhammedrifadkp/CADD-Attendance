const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`Login failed: User with email ${email} not found`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`Login failed: Password does not match for user ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.active) {
      console.log(`Login failed: User ${email} is not active`);
      return res.status(401).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    // Set JWT as HTTP-Only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (increased from 15 minutes)
      path: '/',
    });

    console.log('Login successful, cookie set');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Private
const logoutUser = (req, res) => {
  // Clear the JWT cookie with the same settings as when it was set
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });

  console.log('User logged out, cookie cleared');

  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Create a new teacher
// @route   POST /api/users
// @access  Private/Admin
const createTeacher = async (req, res) => {
  const { name, email, password, role = 'teacher' } = req.body;

  // Validate role
  if (role !== 'teacher') {
    res.status(400);
    throw new Error('Invalid role. Must be teacher');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
};

// @desc    Get all teachers
// @route   GET /api/users/teachers
// @access  Private/Admin
const getTeachers = async (req, res) => {
  const teachers = await User.find({ role: 'teacher' }).select('-password');
  res.json(teachers);
};

// @desc    Get teacher by ID
// @route   GET /api/users/teachers/:id
// @access  Private/Admin
const getTeacherById = async (req, res) => {
  const teacher = await User.findById(req.params.id).select('-password');

  if (teacher && teacher.role === 'teacher') {
    res.json(teacher);
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
};

// @desc    Update teacher
// @route   PUT /api/users/teachers/:id
// @access  Private/Admin
const updateTeacher = async (req, res) => {
  const teacher = await User.findById(req.params.id);

  if (teacher && teacher.role === 'teacher') {
    teacher.name = req.body.name || teacher.name;
    teacher.email = req.body.email || teacher.email;
    teacher.active = req.body.active !== undefined ? req.body.active : teacher.active;

    // Role is fixed as teacher
    teacher.role = 'teacher';

    if (req.body.password) {
      teacher.password = req.body.password;
    }

    const updatedTeacher = await teacher.save();

    res.json({
      _id: updatedTeacher._id,
      name: updatedTeacher.name,
      email: updatedTeacher.email,
      role: updatedTeacher.role,
      active: updatedTeacher.active,
    });
  } else {
    res.status(404);
    throw new Error('Teacher not found');
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
    // Generate a random password
    const newPassword = Math.random().toString(36).slice(-8);
    teacher.password = newPassword;

    await teacher.save();

    res.json({
      message: 'Password reset successful',
      newPassword,
    });
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
};

module.exports = {
  loginUser,
  logoutUser,
  getUserProfile,
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
};
