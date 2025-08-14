const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

// Register new user
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role = 'teacher' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
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
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
  }

  // Handle avatar upload if file is present
  let avatarUrl = user.avatar;
  if (req.file) {
    // Simple file URL generation - adjust based on your upload setup
    avatarUrl = `/uploads/avatars/${req.file.filename}`;
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
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set reset token and expiry (10 minutes)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validate: false });

  try {
    // TODO: Send email with reset token
    // For now, we'll just return success (implement email service later)
    res.json({
      success: true,
      message: 'Password reset token sent to email',
      // Remove this in production:
      ...(process.env.NODE_ENV === 'development' && { resetToken })
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
      passwordResetExpires: { [require('sequelize').Op.gt]: new Date() }
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

  try {
    // Import models here to avoid circular dependency
    const { Subject, Question, Exam, Answer } = require('../models');

    const [subjectsCount, questionsCount, examsCount, submissionsCount] = await Promise.all([
      Subject.count({ where: { userId } }).catch(() => 0),
      Question.count({ where: { userId } }).catch(() => 0),
      Exam.count({ where: { userId } }).catch(() => 0),
      Answer.count({ where: { userId } }).catch(() => 0)
    ]);

    // Get recent activity
    const recentExams = await Exam.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['name', 'color']
      }],
      attributes: ['id', 'title', 'createdAt', 'isPublished']
    }).catch(() => []);

    res.json({
      success: true,
      data: {
        stats: {
          subjectsCount,
          questionsCount,
          examsCount,
          submissionsCount
        },
        recentExams
      }
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    res.json({
      success: true,
      data: {
        stats: {
          subjectsCount: 0,
          questionsCount: 0,
          examsCount: 0,
          submissionsCount: 0
        },
        recentExams: []
      }
    });
  }
});

// Deactivate account
const deactivateAccount = catchAsync(async (req, res, next) => {
  const user = req.user;

  // Soft delete - deactivate instead of delete
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
  const { page = 1, limit = 10, search, role, status } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = {};

  // Search filter
  if (search) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Role filter
  if (role) {
    where.role = role;
  }

  // Status filter
  if (status) {
    where.isActive = status === 'active';
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

  try {
    // Check if user has dependent data
    const { Subject, Question, Exam } = require('../models');
    const [subjectsCount, questionsCount, examsCount] = await Promise.all([
      Subject.count({ where: { userId } }).catch(() => 0),
      Question.count({ where: { userId } }).catch(() => 0),
      Exam.count({ where: { userId } }).catch(() => 0)
    ]);

    if (subjectsCount > 0 || questionsCount > 0 || examsCount > 0) {
      return next(new AppError('Cannot delete user with existing content. Deactivate instead.', 400));
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return next(new AppError('Error deleting user', 500));
  }
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