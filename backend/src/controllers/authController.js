const { User } = require('../models');
const { 
  generateToken, 
  generateRefreshToken, 
  generateResetToken,
  verifyResetToken 
} = require('../middleware/auth');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// Register new user
const register = catchAsync(async (req, res) => {
  const { name, email, password, role = 'teacher' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Update last login
  await user.updateLastLogin();

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
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ 
    where: { email },
    attributes: { include: ['password'] }
  });

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact administrator.', 401);
  }

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Update last login
  await user.updateLastLogin();

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

// Get current user profile
const getProfile = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      {
        association: 'subjects',
        attributes: ['id', 'name', 'color', 'createdAt']
      }
    ]
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: user.toJSON()
    }
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ 
      where: { 
        email,
        id: { [require('sequelize').Op.ne]: userId }
      }
    });

    if (existingUser) {
      throw new AppError('Email already exists', 409);
    }
  }

  // Update user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.update({
    ...(name && { name }),
    ...(email && { email })
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toJSON()
    }
  });
});

// Change password
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Find user with password
  const user = await User.findByPk(userId, {
    attributes: { include: ['password'] }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  await user.update({ password: newPassword });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Forgot password
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal whether user exists or not
    return res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 400);
  }

  // Generate reset token
  const resetToken = user.generateResetToken();
  await user.save();

  try {
    // Send reset email
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email'
    });
  } catch (error) {
    // Reset the token fields if email sending fails
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    throw new AppError('Error sending email. Please try again later.', 500);
  }
});

// Reset password
const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify reset token
    const decoded = verifyResetToken(token);
    
    // Find user
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password and clear reset token
    await user.update({
      password,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AppError('Invalid or expired reset token', 400);
    }
    throw error;
  }
});

// Refresh token
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token required', 400);
  }

  try {
    const decoded = jwt.verify(token, require('../config/jwt').secret);
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 400);
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
});

// Logout (client-side token invalidation)
const logout = catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get user statistics
const getUserStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { Subject, Question, Exam, Answer } = require('../models');

  const stats = await Promise.all([
    // Count subjects
    Subject.count({ where: { userId, isActive: true } }),
    
    // Count questions
    Question.count({ where: { userId, isActive: true } }),
    
    // Count exams
    Exam.count({ where: { userId, isActive: true } }),
    
    // Count answers/submissions
    Answer.count({
      include: [{
        model: Exam,
        as: 'exam',
        where: { userId },
        attributes: []
      }]
    })
  ]);

  const [subjectsCount, questionsCount, examsCount, answersCount] = stats;

  // Get recent activity
  const recentExams = await Exam.findAll({
    where: { userId, isActive: true },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'title', 'createdAt', 'isPublished']
  });

  const recentAnswers = await Answer.findAll({
    include: [{
      model: Exam,
      as: 'exam',
      where: { userId },
      attributes: ['id', 'title']
    }],
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'studentName', 'score', 'createdAt']
  });

  res.json({
    success: true,
    data: {
      stats: {
        subjects: subjectsCount,
        questions: questionsCount,
        exams: examsCount,
        submissions: answersCount
      },
      recentActivity: {
        exams: recentExams,
        answers: recentAnswers
      }
    }
  });
});

// Deactivate account
const deactivateAccount = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.update({ isActive: false });

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// Admin: Get all users
const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  
  if (search) {
    whereClause[require('sequelize').Op.or] = [
      { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
    ];
  }

  if (role) {
    whereClause.role = role;
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset,
    order: [['createdAt', 'DESC']],
    attributes: { exclude: ['password'] }
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Admin: Update user role/status
const updateUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { role, isActive } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (req.user.id === userId && isActive === false) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  await user.update({
    ...(role && { role }),
    ...(isActive !== undefined && { isActive })
  });

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: {
      user: user.toJSON()
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getUserStats,
  deactivateAccount,
  getAllUsers,
  updateUserStatus
};