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
const { uploadAvatar, cleanupOnError } = require('../middleware/upload');

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