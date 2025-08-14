const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validatePagination
} = require('../middleware/validation');

// Middleware de upload - com fallback caso não exista
let uploadAvatar, cleanupOnError;
try {
  const uploadMiddleware = require('../middleware/upload');
  uploadAvatar = uploadMiddleware.uploadAvatar || ((req, res, next) => next());
  cleanupOnError = uploadMiddleware.cleanupOnError || ((req, res, next) => next());
} catch (error) {
  console.warn('Upload middleware not found, using fallback');
  uploadAvatar = (req, res, next) => next();
  cleanupOnError = (req, res, next) => next();
}

// Public routes (no authentication required)
router.post('/register', validateUserRegister, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected routes (authentication required)
router.use(authenticateToken);

// User profile management
router.get('/profile', authController.getProfile);
router.put('/profile', 
  uploadAvatar, 
  cleanupOnError, 
  validateUserUpdate, 
  authController.updateProfile
);
router.post('/change-password', validateChangePassword, authController.changePassword);
router.post('/logout', authController.logout);
router.get('/stats', authController.getUserStats);
router.post('/deactivate', authController.deactivateAccount);

// Admin routes
router.get('/users', requireAdmin, validatePagination, authController.getAllUsers);
router.put('/users/:userId/status', requireAdmin, authController.updateUserStatus);
router.delete('/users/:userId', requireAdmin, authController.deleteUser);

module.exports = router;