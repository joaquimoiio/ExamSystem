const { Answer, Exam, ExamVariation, Question } = require('../models');
const { catchAsync, AppError } = require('../utils/appError');
const qrService = require('../services/qrService');

// Validate QR code answer key
const validateAnswerKey = catchAsync(async (req, res, next) => {
  const { qrData } = req.body;

  if (!qrData) {
    return next(new AppError('QR code data is required', 400));
  }

  const validation = qrService.validateAnswerKeyQR(qrData);

  if (!validation.valid) {
    return next(new AppError(validation.message, 400));
  }

  res.json({
    success: true,
    message: 'QR code is valid',
    data: {
      exam: {
        id: validation.data.examId,
        title: validation.data.examTitle,
        variation: validation.data.variationNumber,
        totalQuestions: validation.data.totalQuestions,
        totalPoints: validation.data.totalPoints
      },
      answerKey: validation.data.answerKey
    }
  });
});

// Correct exam using QR code and student answers
const correctExam = catchAsync(async (req, res, next) => {
  const { qrData, studentAnswers, studentInfo } = req.body;

  if (!qrData || !studentAnswers) {
    return next(new AppError('QR code data and student answers are required', 400));
  }

  // Validate QR code
  const validation = qrService.validateAnswerKeyQR(qrData);
  if (!validation.valid) {
    return next(new AppError(validation.message, 400));
  }

  // Validate student answers format
  if (!Array.isArray(studentAnswers)) {
    return next(new AppError('Student answers must be an array', 400));
  }

  if (studentAnswers.length !== validation.data.totalQuestions) {
    return next(new AppError(
      `Expected ${validation.data.totalQuestions} answers, got ${studentAnswers.length}`, 
      400
    ));
  }

  // Perform correction
  const correctionResult = qrService.correctExam(validation.data, studentAnswers);

  // Save correction result to database
  const answerRecord = await Answer.create({
    examId: validation.data.examId,
    variationId: validation.data.variationId,
    studentName: studentInfo?.name || 'Anonymous',
    studentEmail: studentInfo?.email || null,
    studentId: studentInfo?.studentId || null,
    answers: studentAnswers,
    score: correctionResult.score,
    earnedPoints: correctionResult.earnedPoints,
    totalPoints: correctionResult.totalPoints,
    isPassed: correctionResult.score >= 6.0, // Assuming 6.0 is passing score
    submittedAt: new Date(),
    correctionMethod: 'qr_scan',
    correctionData: {
      qrCodeVersion: validation.data.version,
      correctedBy: req.user?.id || 'teacher',
      results: correctionResult.results
    }
  });

  res.status(201).json({
    success: true,
    message: 'Exam corrected successfully',
    data: {
      answer: {
        id: answerRecord.id,
        score: correctionResult.score,
        totalPoints: correctionResult.totalPoints,
        earnedPoints: correctionResult.earnedPoints,
        isPassed: correctionResult.score >= 6.0,
        submittedAt: answerRecord.submittedAt
      },
      correction: correctionResult,
      student: studentInfo
    }
  });
});

// Get correction history
const getCorrectionHistory = catchAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  const { count, rows: corrections } = await Answer.findAndCountAll({
    where: { 
      examId,
      correctionMethod: 'qr_scan'
    },
    limit: parseInt(limit),
    offset,
    order: [['submittedAt', 'DESC']],
    include: [
      {
        model: ExamVariation,
        as: 'variation',
        attributes: ['variationNumber']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      corrections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get correction statistics
const getCorrectionStats = catchAsync(async (req, res, next) => {
  const { examId } = req.params;

  const corrections = await Answer.findAll({
    where: { 
      examId,
      correctionMethod: 'qr_scan'
    },
    attributes: ['score', 'totalPoints', 'earnedPoints', 'isPassed', 'submittedAt']
  });

  const totalCorrections = corrections.length;
  
  if (totalCorrections === 0) {
    return res.json({
      success: true,
      data: {
        totalCorrections: 0,
        averageScore: 0,
        passRate: 0,
        stats: {}
      }
    });
  }

  const totalScore = corrections.reduce((sum, c) => sum + c.score, 0);
  const averageScore = totalScore / totalCorrections;
  const passedCount = corrections.filter(c => c.isPassed).length;
  const passRate = (passedCount / totalCorrections) * 100;

  // Score distribution
  const scoreRanges = {
    'excellent': corrections.filter(c => c.score >= 9).length,
    'good': corrections.filter(c => c.score >= 7 && c.score < 9).length,
    'satisfactory': corrections.filter(c => c.score >= 6 && c.score < 7).length,
    'needs_improvement': corrections.filter(c => c.score < 6).length
  };

  res.json({
    success: true,
    data: {
      totalCorrections,
      averageScore: parseFloat(averageScore.toFixed(2)),
      passRate: parseFloat(passRate.toFixed(2)),
      passedCount,
      failedCount: totalCorrections - passedCount,
      scoreDistribution: scoreRanges,
      stats: {
        minScore: Math.min(...corrections.map(c => c.score)),
        maxScore: Math.max(...corrections.map(c => c.score)),
        avgEarnedPoints: corrections.reduce((sum, c) => sum + c.earnedPoints, 0) / totalCorrections,
        avgTotalPoints: corrections.reduce((sum, c) => sum + c.totalPoints, 0) / totalCorrections
      }
    }
  });
});

// Manual correction for essay questions
const manualCorrection = catchAsync(async (req, res, next) => {
  const { answerId } = req.params;
  const { essayGrades } = req.body;

  const answer = await Answer.findByPk(answerId);
  
  if (!answer) {
    return next(new AppError('Answer not found', 404));
  }

  if (!Array.isArray(essayGrades)) {
    return next(new AppError('Essay grades must be an array', 400));
  }

  // Update essay question scores
  let additionalPoints = 0;
  const updatedResults = answer.correctionData.results.map(result => {
    if (result.type === 'essay') {
      const essayGrade = essayGrades.find(g => g.questionId === result.questionId);
      if (essayGrade) {
        result.points = Math.min(essayGrade.points, result.maxPoints);
        result.isCorrect = result.points > 0;
        result.feedback = essayGrade.feedback || null;
        additionalPoints += result.points;
      }
    }
    return result;
  });

  // Recalculate total score
  const totalEarnedPoints = answer.earnedPoints + additionalPoints;
  const newScore = (totalEarnedPoints / answer.totalPoints) * 10;

  await answer.update({
    earnedPoints: totalEarnedPoints,
    score: parseFloat(newScore.toFixed(2)),
    isPassed: newScore >= 6.0,
    correctionData: {
      ...answer.correctionData,
      results: updatedResults,
      manuallyGraded: true,
      gradedBy: req.user?.id || 'teacher',
      gradedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Manual correction completed successfully',
    data: {
      answer: {
        id: answer.id,
        score: answer.score,
        earnedPoints: answer.earnedPoints,
        isPassed: answer.isPassed,
        manuallyGraded: true
      }
    }
  });
});

// Bulk export corrections
const exportCorrections = catchAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { format = 'json' } = req.body;

  const corrections = await Answer.findAll({
    where: { 
      examId,
      correctionMethod: 'qr_scan'
    },
    include: [
      {
        model: ExamVariation,
        as: 'variation',
        attributes: ['variationNumber']
      }
    ],
    order: [['submittedAt', 'DESC']]
  });

  const exportData = corrections.map(correction => ({
    id: correction.id,
    studentName: correction.studentName,
    studentEmail: correction.studentEmail,
    studentId: correction.studentId,
    variation: correction.variation?.variationNumber,
    score: correction.score,
    earnedPoints: correction.earnedPoints,
    totalPoints: correction.totalPoints,
    isPassed: correction.isPassed,
    submittedAt: correction.submittedAt,
    correctionMethod: correction.correctionMethod
  }));

  res.json({
    success: true,
    message: `Corrections exported in ${format} format`,
    data: {
      corrections: exportData,
      format,
      count: exportData.length,
      exportedAt: new Date()
    }
  });
});

module.exports = {
  validateAnswerKey,
  correctExam,
  getCorrectionHistory,
  getCorrectionStats,
  manualCorrection,
  exportCorrections
};