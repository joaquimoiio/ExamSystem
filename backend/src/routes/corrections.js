const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const correctionController = require('../controllers/correctionController');
const { authenticateToken } = require('../middleware/auth');

// Validation for QR code correction
const correctionValidation = [
  body('qrData')
    .notEmpty()
    .withMessage('QR code data is required'),
  body('studentAnswers')
    .isArray()
    .withMessage('Student answers must be an array'),
  body('studentInfo.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Student name must be between 2 and 100 characters'),
  body('studentInfo.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('studentInfo.studentId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Student ID must be at most 50 characters')
];

// Validation for manual grading
const manualGradingValidation = [
  body('essayGrades')
    .isArray()
    .withMessage('Essay grades must be an array'),
  body('essayGrades.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required for each essay grade'),
  body('essayGrades.*.points')
    .isNumeric()
    .withMessage('Points must be a number'),
  body('essayGrades.*.feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be at most 1000 characters')
];

// Apply authentication to all routes
router.use(authenticateToken);

// QR Code validation and correction
router.post('/validate-qr', correctionController.validateAnswerKey);
router.post('/correct-exam', correctionValidation, correctionController.correctExam);

// Correction management for specific exams
router.get('/exam/:examId/history', correctionController.getCorrectionHistory);
router.get('/exam/:examId/stats', correctionController.getCorrectionStats);
router.post('/exam/:examId/export', correctionController.exportCorrections);

// Manual correction for essay questions
router.post('/answer/:answerId/manual-grade', manualGradingValidation, correctionController.manualCorrection);

module.exports = router;