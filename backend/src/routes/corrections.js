const express = require('express');
const router = express.Router();

const correctionController = require('../controllers/correctionController');
const { authenticateToken, requireTeacher, optionalAuth } = require('../middleware/auth');
const { uploadOCRImage, handleUploadError } = require('../middleware/upload');
const {
  validateAnswerSubmit,
  validateAnswerReview,
  validatePagination
} = require('../middleware/validation');

// Public routes (no authentication required) - for student submissions
router.post('/submit/:examId/:variationId', validateAnswerSubmit, correctionController.submitAnswers);
router.get('/submission/:submissionId', correctionController.getSubmission);
router.post('/validate-qr', correctionController.validateQRCode);

// Protected routes (teacher access required)
router.use(authenticateToken, requireTeacher);

// Teacher submission management
router.get('/exams/:examId/submissions', validatePagination, correctionController.getExamSubmissions);
router.get('/exams/:examId/statistics', correctionController.getSubmissionStatistics);
router.put('/submissions/:submissionId/review', validateAnswerReview, correctionController.reviewSubmission);

// Export functionality
router.get('/exams/:examId/export', correctionController.exportSubmissions);

// OCR processing routes
router.post('/ocr/process', uploadOCRImage, handleUploadError, async (req, res) => {
  try {
    const { totalQuestions } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const ocrService = require('../services/ocrService');
    const imagePaths = req.files.map(file => file.path);
    
    const results = await ocrService.batchProcessAnswerSheets(
      imagePaths, 
      parseInt(totalQuestions)
    );

    // Clean up uploaded files
    ocrService.cleanupFiles(imagePaths);

    res.json({
      success: true,
      message: 'OCR processing completed',
      data: results
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing images',
      error: error.message
    });
  }
});

module.exports = router;