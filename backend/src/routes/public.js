const express = require('express');
const router = express.Router();

const examController = require('../controllers/examController');
const correctionController = require('../controllers/correctionController');

// Public route to get exam by QR code (for students)
router.get('/exam/qr/:qrCode', examController.getExamByQR);

// Alternative route for QR code scanning
router.get('/scan/:examId/:variationId', async (req, res) => {
  try {
    const { examId, variationId } = req.params;
    
    const { ExamVariation, Exam, Subject } = require('../models');
    
    const variation = await ExamVariation.findOne({
      where: { 
        id: variationId,
        examId 
      },
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [
            {
              model: Subject,
              as: 'subject',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!variation) {
      return res.status(404).json({
        success: false,
        message: 'Exam variation not found'
      });
    }

    if (!variation.exam.canTakeExam()) {
      return res.status(400).json({
        success: false,
        message: 'Exam is not available for taking'
      });
    }

    // Return exam info without correct answers
    const examForStudent = {
      id: variation.exam.id,
      title: variation.exam.title,
      description: variation.exam.description,
      instructions: variation.exam.instructions,
      timeLimit: variation.exam.timeLimit,
      totalQuestions: variation.exam.totalQuestions,
      subject: variation.exam.subject,
      variation: {
        id: variation.id,
        variationLetter: variation.variationLetter,
        questions: variation.questions.map(q => ({
          id: q.id,
          order: q.order,
          text: q.text,
          alternatives: q.alternatives
        }))
      }
    };

    res.json({
      success: true,
      data: {
        exam: examForStudent
      }
    });
  } catch (error) {
    console.error('Error getting exam for student:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading exam'
    });
  }
});

// Public route to submit answers
router.post('/submit/:examId/:variationId', correctionController.submitAnswers);

// Public route to get submission results
router.get('/submission/:submissionId', correctionController.getSubmission);

// Public route to validate QR codes
router.post('/validate-qr', correctionController.validateQRCode);

// Health check for public API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Public API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;