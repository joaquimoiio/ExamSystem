const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { User } = require('../models')
const { catchAsync } = require('../utils/catchAsync')
const { AppError } = require('../utils/AppError')
const { sendEmail } = require('../services/emailService')
const { Op } = require('sequelize')
const winston = require('winston')

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'auth-controller.log' })
  ]
})

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  )

  return { accessToken, refreshToken }
}

/**
 * Register new user
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password, role = 'teacher' } = req.body

  // Validation
  if (!name || !name.trim()) {
    throw new AppError('Nome é obrigatório', 400)
  }

  if (!email || !email.trim()) {
    throw new AppError('Email é obrigatório', 400)
  }

  if (!password || password.length < 6) {
    throw new AppError('Senha deve ter pelo menos 6 caracteres', 400)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new AppError('Email inválido', 400)
  }

  if (!['teacher', 'admin'].includes(role)) {
    throw new AppError('Papel de usuário inválido', 400)
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    })

    if (existingUser) {
      throw new AppError('Email já está em uso', 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isActive: true,
      emailVerified: false, // In a real app, you'd send verification email
      lastLogin: new Date(),
      metadata: {
        registrationIP: req.ip,
        userAgent: req.get('User-Agent'),
        registeredAt: new Date()
      }
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id)

    // Update user with refresh token
    await user.update({ 
      refreshToken: await bcrypt.hash(refreshToken, 10),
      lastLogin: new Date()
    })

    logger.info(`User registered: ${user.id}`, { 
      email: user.email, 
      role: user.role 
    })

    // Return user data without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    })

  } catch (error) {
    logger.error('Error registering user:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao registrar usuário', 500)
  }
})

/**
 * Login user
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body

  // Validation
  if (!email || !password) {
    throw new AppError('Email e senha são obrigatórios', 400)
  }

  try {
    // Find user by email
    const user = await User.findOne({
      where: { 
        email: email.toLowerCase(),
        isActive: true
      }
    })

    if (!user) {
      throw new AppError('Credenciais inválidas', 401)
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas', 401)
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id)

    // Update user with refresh token and last login
    await user.update({
      refreshToken: await bcrypt.hash(refreshToken, 10),
      lastLogin: new Date(),
      metadata: {
        ...user.metadata,
        lastLoginIP: req.ip,
        lastLoginUserAgent: req.get('User-Agent'),
        lastLoginAt: new Date()
      }
    })

    logger.info(`User logged in: ${user.id}`, { email: user.email })

    // Return user data without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    })

  } catch (error) {
    logger.error('Error logging in user:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro no login', 500)
  }
})

/**
 * Refresh access token
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body

  if (!token) {
    throw new AppError('Refresh token é obrigatório', 400)
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    )

    if (decoded.type !== 'refresh') {
      throw new AppError('Token inválido', 401)
    }

    // Find user
    const user = await User.findByPk(decoded.id)
    if (!user || !user.isActive) {
      throw new AppError('Usuário não encontrado', 404)
    }

    // Verify stored refresh token
    const isTokenValid = await bcrypt.compare(token, user.refreshToken || '')
    if (!isTokenValid) {
      throw new AppError('Refresh token inválido', 401)
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id)

    // Update stored refresh token
    await user.update({
      refreshToken: await bcrypt.hash(newRefreshToken, 10)
    })

    logger.info(`Token refreshed: ${user.id}`)

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      }
    })

  } catch (error) {
    logger.error('Error refreshing token:', error)
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AppError('Token inválido ou expirado', 401)
    }
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao renovar token', 500)
  }
})

/**
 * Logout user
 */
const logout = catchAsync(async (req, res) => {
  const userId = req.user.id

  try {
    // Clear refresh token
    await User.update(
      { refreshToken: null },
      { where: { id: userId } }
    )

    logger.info(`User logged out: ${userId}`)

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })

  } catch (error) {
    logger.error('Error logging out user:', error)
    throw new AppError('Erro no logout', 500)
  }
})

/**
 * Get user profile
 */
const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id

  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    })

    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    res.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    logger.error('Error getting user profile:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao obter perfil do usuário', 500)
  }
})

/**
 * Update user profile
 */
const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id
  const { name, email } = req.body

  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    const updateData = {}

    // Validate and update name
    if (name !== undefined) {
      if (!name.trim()) {
        throw new AppError('Nome não pode estar vazio', 400)
      }
      if (name.length > 100) {
        throw new AppError('Nome deve ter no máximo 100 caracteres', 400)
      }
      updateData.name = name.trim()
    }

    // Validate and update email
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new AppError('Email inválido', 400)
      }

      // Check if email is already in use by another user
      if (email.toLowerCase() !== user.email) {
        const existingUser = await User.findOne({
          where: { 
            email: email.toLowerCase(),
            id: { [Op.ne]: userId }
          }
        })

        if (existingUser) {
          throw new AppError('Email já está em uso', 409)
        }

        updateData.email = email.toLowerCase().trim()
        updateData.emailVerified = false // Reset verification when email changes
      }
    }

    // Update user
    await user.update(updateData)

    logger.info(`User profile updated: ${userId}`, { 
      changes: Object.keys(updateData) 
    })

    // Return updated user data
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    })

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: { user: updatedUser }
    })

  } catch (error) {
    logger.error('Error updating user profile:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao atualizar perfil', 500)
  }
})

/**
 * Change password
 */
const changePassword = catchAsync(async (req, res) => {
  const userId = req.user.id
  const { currentPassword, newPassword, confirmPassword } = req.body

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('Todos os campos de senha são obrigatórios', 400)
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Nova senha e confirmação não coincidem', 400)
  }

  if (newPassword.length < 6) {
    throw new AppError('Nova senha deve ter pelo menos 6 caracteres', 400)
  }

  if (newPassword === currentPassword) {
    throw new AppError('Nova senha deve ser diferente da senha atual', 400)
  }

  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new AppError('Senha atual incorreta', 400)
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear refresh tokens (force re-login)
    await user.update({
      password: hashedNewPassword,
      refreshToken: null,
      metadata: {
        ...user.metadata,
        passwordChangedAt: new Date(),
        passwordChangedBy: user.id
      }
    })

    logger.info(`Password changed: ${userId}`)

    res.json({
      success: true,
      message: 'Senha alterada com sucesso. Faça login novamente.'
    })

  } catch (error) {
    logger.error('Error changing password:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao alterar senha', 500)
  }
})

/**
 * Forgot password - send reset email
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new AppError('Email é obrigatório', 400)
  }

  try {
    const user = await User.findOne({
      where: { 
        email: email.toLowerCase(),
        isActive: true
      }
    })

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token
    await user.update({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: resetTokenExpires
    })

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Redefinir Senha - Sistema de Provas',
        template: 'password-reset',
        data: {
          name: user.name,
          resetUrl,
          expiresIn: '1 hora'
        }
      })

      logger.info(`Password reset email sent: ${user.id}`)

    } catch (emailError) {
      // Reset the token if email fails
      await user.update({
        passwordResetToken: null,
        passwordResetExpires: null
      })

      logger.error('Error sending password reset email:', emailError)
      throw new AppError('Erro ao enviar email de redefinição', 500)
    }

    res.json({
      success: true,
      message: 'Instruções para redefinir senha enviadas por email'
    })

  } catch (error) {
    logger.error('Error in forgot password:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao processar solicitação', 500)
  }
})

/**
 * Reset password with token
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body

  // Validation
  if (!token || !newPassword || !confirmPassword) {
    throw new AppError('Token, nova senha e confirmação são obrigatórios', 400)
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Nova senha e confirmação não coincidem', 400)
  }

  if (newPassword.length < 6) {
    throw new AppError('Nova senha deve ter pelo menos 6 caracteres', 400)
  }

  try {
    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { [Op.gt]: new Date() },
        isActive: true
      }
    })

    if (!user) {
      throw new AppError('Token inválido ou expirado', 400)
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear reset token
    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null, // Force re-login
      metadata: {
        ...user.metadata,
        passwordResetAt: new Date(),
        passwordResetBy: 'token'
      }
    })

    logger.info(`Password reset completed: ${user.id}`)

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso. Faça login com sua nova senha.'
    })

  } catch (error) {
    logger.error('Error resetting password:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao redefinir senha', 500)
  }
})

/**
 * Get user statistics
 */
const getUserStats = catchAsync(async (req, res) => {
  const userId = req.user.id

  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] }
    })

    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    // Get user activity stats (you can expand this based on your needs)
    const stats = {
      profile: {
        memberSince: user.createdAt,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified,
        role: user.role
      },
      activity: {
        // These would be calculated from other tables
        totalSubjects: 0, // await Subject.count({ where: { userId } })
        totalQuestions: 0, // await Question.count({ where: { userId } })
        totalExams: 0, // await Exam.count({ where: { userId } })
        loginCount: user.metadata?.loginCount || 0
      },
      security: {
        lastPasswordChange: user.metadata?.passwordChangedAt,
        lastLoginIP: user.metadata?.lastLoginIP,
        registrationIP: user.metadata?.registrationIP
      }
    }

    res.json({
      success: true,
      data: { stats }
    })

  } catch (error) {
    logger.error('Error getting user statistics:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao obter estatísticas do usuário', 500)
  }
})

/**
 * Deactivate account
 */
const deactivateAccount = catchAsync(async (req, res) => {
  const userId = req.user.id
  const { password, reason } = req.body

  if (!password) {
    throw new AppError('Senha é obrigatória para desativar a conta', 400)
  }

  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new AppError('Senha incorreta', 400)
    }

    // Deactivate account
    await user.update({
      isActive: false,
      refreshToken: null,
      deactivatedAt: new Date(),
      metadata: {
        ...user.metadata,
        deactivatedAt: new Date(),
        deactivationReason: reason || 'user_request'
      }
    })

    logger.info(`Account deactivated: ${userId}`, { reason })

    res.json({
      success: true,
      message: 'Conta desativada com sucesso'
    })

  } catch (error) {
    logger.error('Error deactivating account:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao desativar conta', 500)
  }
})

/**
 * Get all users (admin only)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    role, 
    status,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query

  const offset = (page - 1) * limit
  const where = {}

  // Search by name or email
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ]
  }

  // Filter by role
  if (role) {
    where.role = role
  }

  // Filter by status
  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  }

  // Validate sort parameters
  const allowedSortFields = ['createdAt', 'name', 'email', 'lastLogin']
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
  const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  try {
    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[finalSortBy, finalSortOrder]],
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] }
    })

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
    })

  } catch (error) {
    logger.error('Error getting all users:', error)
    throw new AppError('Erro ao buscar usuários', 500)
  }
})

/**
 * Update user status (admin only)
 */
const updateUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params
  const { isActive, reason } = req.body

  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    // Prevent self-deactivation
    if (userId === req.user.id && !isActive) {
      throw new AppError('Você não pode desativar sua própria conta', 400)
    }

    await user.update({
      isActive,
      refreshToken: !isActive ? null : user.refreshToken, // Clear token if deactivating
      metadata: {
        ...user.metadata,
        statusChangedAt: new Date(),
        statusChangedBy: req.user.id,
        statusChangeReason: reason
      }
    })

    logger.info(`User status updated: ${userId}`, { 
      isActive, 
      changedBy: req.user.id 
    })

    res.json({
      success: true,
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`
    })

  } catch (error) {
    logger.error('Error updating user status:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao atualizar status do usuário', 500)
  }
})

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserStats,
  deactivateAccount,
  getAllUsers,
  updateUserStatus
}