const express = require('express');
const router = express.Router();

const correctionController = require('../controllers/correctionController');
const { optionalAuth, authenticateToken, requireTeacher } = require('../middleware/auth');
const {
  validateAnswerSubmission,
  validateUUIDParam,
  validatePagination
} = require('../middleware/validation');

// Public route for submitting answers
router.post('/submit/:examId/:variationId',
  validateUUIDParam('examId'),
  validateUUIDParam('variationId'),
  validateAnswerSubmission,
  correctionController.submitAnswers
);

// Get submission result (public with optional auth for security)
router.get('/result/:submissionId',
  validateUUIDParam('submissionId'),
  optionalAuth,
  correctionController.getSubmissionResult
);

// Protected routes (authentication required)
router.use(authenticateToken);

// Get all submissions for teacher/admin
router.get('/submissions', 
  validatePagination, 
  correctionController.getSubmissions
);

// Get submissions by exam
router.get('/submissions/exam/:examId',
  validateUUIDParam('examId'),
  validatePagination,
  correctionController.getSubmissionsByExam
);

// Get submissions by student
router.get('/submissions/student/:studentId',
  validatePagination,
  correctionController.getSubmissionsByStudent
);

// Get pending submissions for grading
router.get('/pending',
  validatePagination,
  correctionController.getPendingSubmissions
);

// Get specific submission details
router.get('/submissions/:submissionId',
  validateUUIDParam('submissionId'),
  correctionController.getSubmissionDetails
);

// Update submission (manual grading)
router.put('/submissions/:submissionId',
  validateUUIDParam('submissionId'),
  requireTeacher,
  correctionController.updateSubmission
);

// Add feedback to submission
router.post('/submissions/:submissionId/feedback',
  validateUUIDParam('submissionId'),
  requireTeacher,
  correctionController.addFeedback
);

// Manual score adjustment
router.post('/submissions/:submissionId/adjust-score',
  validateUUIDParam('submissionId'),
  requireTeacher,
  correctionController.adjustScore
);

// Bulk grade submissions
router.post('/bulk-grade',
  requireTeacher,
  correctionController.bulkGradeSubmissions
);

// Regrade submission
router.post('/submissions/:submissionId/regrade',
  validateUUIDParam('submissionId'),
  requireTeacher,
  correctionController.regradeSubmission
);

// Export submissions data
router.post('/export',
  requireTeacher,
  correctionController.exportSubmissions
);

// Get correction statistics
router.get('/stats/:examId',
  validateUUIDParam('examId'),
  correctionController.getCorrectionStats
);

// Question analysis for exam
router.get('/question-analysis/:examId',
  validateUUIDParam('examId'),
  correctionController.getQuestionAnalysis
);

// Performance analytics
router.get('/analytics/:examId',
  validateUUIDParam('examId'),
  correctionController.getPerformanceAnalytics
);

// Compare student performances
router.post('/compare-students',
  requireTeacher,
  correctionController.compareStudents
);

// Flag suspicious submissions
router.get('/suspicious/:examId',
  validateUUIDParam('examId'),
  requireTeacher,
  correctionController.getSuspiciousSubmissions
);

module.exports = router;