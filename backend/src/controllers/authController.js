const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { getFileUrl } = require('../middleware/upload');

// Register new user
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role = 'teacher' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Create new user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role
  });

  // Generate tokens
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token,
      refreshToken
    }
  });
});

// Login user
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password for validation
  const user = await User.findOne({ 
    where: { email: email.toLowerCase() },
    attributes: { include: ['password'] }
  });

  if (!user || !(await user.validatePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  
  // Generate tokens
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token,
      refreshToken
    }
  });
});

// Refresh access token
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 401));
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid refresh token', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 401));
    }

    // Generate new tokens
    const newToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

// Get user profile
const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken'] }
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    data: { user }
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res, next) => {
  const { name, email, phone, bio } = req.body;
  const user = req.user;

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
  }

  // Handle avatar upload
  let avatarUrl = user.avatar;
  if (req.file) {
    avatarUrl = getFileUrl(req.file.filename, 'avatar');
  }

  // Update user
  await user.update({
    ...(name && { name }),
    ...(email && { email: email.toLowerCase() }),
    ...(phone && { phone }),
    ...(bio && { bio }),
    ...(avatarUrl && { avatar: avatarUrl })
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toJSON() }
  });
});

// Change password
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findByPk(req.user.id, {
    attributes: { include: ['password'] }
  });

  // Verify current password
  if (!(await user.validatePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Forgot password
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  
  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validate: false });

  try {
    // TODO: Send email with reset token
    // For now, we'll just return the token (remove in production)
    res.json({
      success: true,
      message: 'Password reset token sent to email',
      // Remove this in production:
      resetToken: resetToken
    });
  } catch (error) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save({ validate: false });

    return next(new AppError('Error sending email. Try again later.', 500));
  }
});

// Reset password
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;

  // Hash the token and find user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [require('sequelize').Op.gt]: Date.now() }
    }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update password and clear reset token
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// Logout
const logout = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  // Clear refresh token
  user.refreshToken = null;
  await user.save();

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get user statistics
const getUserStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { Subject, Question, Exam, Answer } = require('../models');

  const [subjectsCount, questionsCount, examsCount, submissionsCount] = await Promise.all([
    Subject.count({ where: { userId } }),
    Question.count({ where: { userId } }),
    Exam.count({ where: { userId } }),
    Answer.count({ where: { userId } })
  ]);

  // Get recent activity
  const recentExams = await Exam.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 5,
    include: [{
      model: Subject,
      as: 'subject',
      attributes: ['id', 'name', 'color']
    }]
  });

  const recentQuestions = await Question.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 5,
    include: [{
      model: Subject,
      as: 'subject',
      attributes: ['id', 'name', 'color']
    }]
  });

  res.json({
    success: true,
    data: {
      stats: {
        subjects: subjectsCount,
        questions: questionsCount,
        exams: examsCount,
        submissions: submissionsCount
      },
      recentActivity: {
        exams: recentExams,
        questions: recentQuestions
      }
    }
  });
});

// Deactivate account
const deactivateAccount = catchAsync(async (req, res, next) => {
  const user = req.user;

  user.isActive = false;
  user.refreshToken = null;
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// Admin: Get all users
const getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = {};
  
  if (search) {
    where[require('sequelize').Op.or] = [
      { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['createdAt', 'DESC']],
    attributes: { exclude: ['password', 'refreshToken'] }
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: {
      users,
      pagination
    }
  });
});

// Admin: Update user status
const updateUserStatus = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { isActive, role } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from deactivating themselves
  if (req.user.id === userId && isActive === false) {
    return next(new AppError('Cannot deactivate your own account', 400));
  }

  await user.update({
    ...(isActive !== undefined && { isActive }),
    ...(role && { role })
  });

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: { user: user.toJSON() }
  });
});

// Admin: Delete user
const deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from deleting themselves
  if (req.user.id === userId) {
    return next(new AppError('Cannot delete your own account', 400));
  }

  // Check if user has dependent data
  const { Subject, Question, Exam } = require('../models');
  const [subjectsCount, questionsCount, examsCount] = await Promise.all([
    Subject.count({ where: { userId } }),
    Question.count({ where: { userId } }),
    Exam.count({ where: { userId } })
  ]);

  if (subjectsCount > 0 || questionsCount > 0 || examsCount > 0) {
    return next(new AppError('Cannot delete user with existing content. Deactivate instead.', 400));
  }

  await user.destroy();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  getUserStats,
  deactivateAccount,
  getAllUsers,
  updateUserStatus,
  deleteUser
};