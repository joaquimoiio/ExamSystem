const express = require('express');
const router = express.Router();

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// System statistics
router.get('/stats', async (req, res) => {
  try {
    const { User, Subject, Question, Exam, Answer } = require('../models');
    
    const [
      totalUsers,
      totalSubjects,
      totalQuestions,
      totalExams,
      totalSubmissions,
      activeUsers,
      publishedExams
    ] = await Promise.all([
      User.count(),
      Subject.count({ where: { isActive: true } }),
      Question.count({ where: { isActive: true } }),
      Exam.count({ where: { isActive: true } }),
      Answer.count(),
      User.count({ where: { isActive: true } }),
      Exam.count({ where: { isActive: true, isPublished: true } })
    ]);

    // Get recent activity
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'lastLogin']
    });

    const recentExams = await Exam.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['name']
        }
      ],
      attributes: ['id', 'title', 'isPublished', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalSubjects,
          totalQuestions,
          totalExams,
          totalSubmissions,
          activeUsers,
          publishedExams
        },
        recentActivity: {
          users: recentUsers,
          exams: recentExams
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving system statistics'
    });
  }
});

// User management
router.get('/users', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const { User } = require('../models');
    const { Op } = require('sequelize');
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
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
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
});

// Update user status
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;
    const { User } = require('../models');

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === userId && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    await user.update({
      ...(isActive !== undefined && { isActive }),
      ...(role && { role })
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// System health check
router.get('/health', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    // Test database connection
    await sequelize.authenticate();
    
    // Test email service
    const emailService = require('../services/emailService');
    const emailReady = await emailService.testConnection();
    
    // Get system info
    const systemInfo = {
      database: 'connected',
      email: emailReady ? 'connected' : 'error',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      data: {
        status: 'healthy',
        services: systemInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'System health check failed',
      error: error.message
    });
  }
});

// System logs (basic implementation)
router.get('/logs', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { limit = 100 } = req.query;
    
    const logPath = path.join(process.cwd(), 'error.log');
    
    if (!fs.existsSync(logPath)) {
      return res.json({
        success: true,
        data: {
          logs: [],
          message: 'No log file found'
        }
      });
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    const logLines = logContent.split('\n')
      .filter(line => line.trim())
      .slice(-parseInt(limit))
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, timestamp: new Date().toISOString() };
        }
      });

    res.json({
      success: true,
      data: {
        logs: logLines.reverse(), // Most recent first
        total: logLines.length
      }
    });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading system logs'
    });
  }
});

// Clear system logs
router.delete('/logs', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const logFiles = ['error.log', 'combined.log'];
    
    logFiles.forEach(filename => {
      const logPath = path.join(process.cwd(), filename);
      if (fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '');
      }
    });

    res.json({
      success: true,
      message: 'System logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing system logs'
    });
  }
});

module.exports = router;