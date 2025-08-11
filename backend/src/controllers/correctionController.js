const { Answer, Exam, ExamVariation, Subject, User } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const qrService = require('../services/qrService');

// Submit student answers
const submitAnswers = catchAsync(async (req, res) => {
  const { examId, variationId } = req.params;
  const { 
    studentName, 
    studentId, 
    studentEmail, 
    answers, 
    timeSpent, 
    startedAt 
  } = req.body;

  // Validate exam and variation
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
    throw new AppError('Exam variation not found', 404);
  }

  if (!variation.exam.canTakeExam()) {
    throw new AppError('Exam is not available for submission', 400);
  }

  // Validate answers array length
  if (answers.length !== variation.questions.length) {
    throw new AppError('Number of answers must match number of questions', 400);
  }

  // Calculate score using variation's method
  const result = variation.calculateScore(answers);

  // Determine if student passed
  const isPassed = result.score >= variation.exam.passingScore;

  // Create detailed answers array with question info
  const detailedAnswers = result.detailedResults.map(detail => ({
    questionId: detail.questionId,
    answer: detail.studentAnswer,
    correct: detail.isCorrect,
    difficulty: detail.difficulty
  }));

  // Create answer record
  const answerRecord = await Answer.create({
    studentName,
    studentId,
    studentEmail,
    examId,
    examVariationId: variationId,
    answers: detailedAnswers,
    score: result.score,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctCount,
    timeSpent,
    startedAt: startedAt ? new Date(startedAt) : null,
    submittedAt: new Date(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    isPassed
  });

  // Update question statistics
  await Promise.all(
    variation.questions.map(async (question) => {
      const studentAnswer = detailedAnswers.find(a => a.questionId === question.id);
      if (studentAnswer) {
        const questionModel = await require('../models').Question.findByPk(question.id);
        if (questionModel) {
          await questionModel.updateAverageScore(studentAnswer.correct ? 100 : 0);
        }
      }
    })
  );

  // Prepare response data
  const responseData = {
    submissionId: answerRecord.id,
    score: result.score,
    correctAnswers: result.correctCount,
    totalQuestions: result.totalQuestions,
    percentage: result.percentage,
    isPassed,
    passingScore: variation.exam.passingScore,
    submittedAt: answerRecord.submittedAt
  };

  // Include detailed results if exam allows review
  if (variation.exam.allowReview) {
    responseData.detailedResults = result.detailedResults;
  }

  // Include correct answers if configured
  if (variation.exam.showCorrectAnswers && variation.exam.allowReview) {
    responseData.correctAnswers = variation.answerKey;
  }

  res.status(201).json({
    success: true,
    message: `Answers submitted successfully. ${isPassed ? 'Congratulations, you passed!' : 'You did not reach the passing score.'}`,
    data: responseData
  });
});

// Get submission by ID
const getSubmission = catchAsync(async (req, res) => {
  const { submissionId } = req.params;

  const answer = await Answer.findByPk(submissionId, {
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['id', 'title', 'passingScore', 'allowReview', 'showCorrectAnswers'],
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name']
          }
        ]
      },
      {
        model: ExamVariation,
        as: 'examVariation',
        attributes: ['id', 'variationLetter', 'answerKey']
      }
    ]
  });

  if (!answer) {
    throw new AppError('Submission not found', 404);
  }

  const responseData = {
    ...answer.toJSON()
  };

  // Include correct answers if exam allows it
  if (answer.exam.showCorrectAnswers && answer.exam.allowReview) {
    responseData.correctAnswers = answer.examVariation.answerKey;
  }

  res.json({
    success: true,
    data: {
      submission: responseData
    }
  });
});

// Get all submissions for an exam (teacher access)
const getExamSubmissions = catchAsync(async (req, res) => {
  const { examId } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'submittedAt', 
    sortOrder = 'DESC',
    variationId,
    passed,
    search
  } = req.query;
  const userId = req.user.id;
  const offset = (page - 1) * limit;

  // Verify user owns the exam
  const exam = await Exam.findOne({
    where: { id: examId, userId }
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  const whereClause = { examId };

  // Filter by variation
  if (variationId) {
    whereClause.examVariationId = variationId;
  }

  // Filter by pass status
  if (passed !== undefined) {
    whereClause.isPassed = passed === 'true';
  }

  // Search by student name
  if (search) {
    whereClause[Op.or] = [
      { studentName: { [Op.iLike]: `%${search}%` } },
      { studentId: { [Op.iLike]: `%${search}%` } },
      { studentEmail: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const validSortFields = ['submittedAt', 'score', 'studentName', 'timeSpent'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';
  const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

  const { count, rows: submissions } = await Answer.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: ExamVariation,
        as: 'examVariation',
        attributes: ['id', 'variationLetter', 'variationNumber']
      }
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortField, sortDirection]]
  });

  res.json({
    success: true,
    data: {
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get submission statistics for an exam
const getSubmissionStatistics = catchAsync(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.id;

  // Verify user owns the exam
  const exam = await Exam.findOne({
    where: { id: examId, userId },
    include: [
      {
        model: ExamVariation,
        as: 'variations',
        attributes: ['id', 'variationLetter', 'variationNumber']
      }
    ]
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Get overall statistics
  const overallStats = await Answer.findAll({
    where: { examId },
    attributes: [
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalSubmissions'],
      [require('sequelize').fn('AVG', require('sequelize').col('score')), 'averageScore'],
      [require('sequelize').fn('MIN', require('sequelize').col('score')), 'minScore'],
      [require('sequelize').fn('MAX', require('sequelize').col('score')), 'maxScore'],
      [require('sequelize').fn('COUNT', 
        require('sequelize').literal('CASE WHEN "isPassed" = true THEN 1 END')
      ), 'passedCount'],
      [require('sequelize').fn('AVG', require('sequelize').col('timeSpent')), 'averageTime']
    ],
    raw: true
  });

  // Get statistics by variation
  const variationStats = await Answer.findAll({
    where: { examId },
    attributes: [
      'examVariationId',
      [require('sequelize').fn('COUNT', require('sequelize').col('Answer.id')), 'submissions'],
      [require('sequelize').fn('AVG', require('sequelize').col('Answer.score')), 'averageScore'],
      [require('sequelize').fn('COUNT', 
        require('sequelize').literal('CASE WHEN "Answer"."isPassed" = true THEN 1 END')
      ), 'passedCount']
    ],
    include: [
      {
        model: ExamVariation,
        as: 'examVariation',
        attributes: ['variationLetter', 'variationNumber']
      }
    ],
    group: ['Answer.examVariationId', 'examVariation.id'],
    raw: true
  });

  // Get score distribution
  const scoreDistribution = await Answer.findAll({
    where: { examId },
    attributes: [
      [require('sequelize').fn('FLOOR', 
        require('sequelize').literal('score / 10')
      ), 'scoreRange'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: [require('sequelize').literal('FLOOR(score / 10)')],
    order: [[require('sequelize').literal('FLOOR(score / 10)'), 'ASC']],
    raw: true
  });

  // Get difficulty performance
  const difficultyStats = {};
  const submissions = await Answer.findAll({
    where: { examId },
    attributes: ['answers']
  });

  submissions.forEach(submission => {
    submission.answers.forEach(answer => {
      const difficulty = answer.difficulty || 'medium';
      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { total: 0, correct: 0 };
      }
      difficultyStats[difficulty].total++;
      if (answer.correct) {
        difficultyStats[difficulty].correct++;
      }
    });
  });

  // Calculate percentages for difficulty stats
  Object.keys(difficultyStats).forEach(difficulty => {
    const stats = difficultyStats[difficulty];
    stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
  });

  const totalSubmissions = parseInt(overallStats[0]?.totalSubmissions || 0);
  const passedCount = parseInt(overallStats[0]?.passedCount || 0);

  res.json({
    success: true,
    data: {
      exam: {
        id: exam.id,
        title: exam.title,
        passingScore: exam.passingScore
      },
      overallStatistics: {
        totalSubmissions,
        averageScore: parseFloat(overallStats[0]?.averageScore || 0),
        minScore: parseFloat(overallStats[0]?.minScore || 0),
        maxScore: parseFloat(overallStats[0]?.maxScore || 0),
        passedCount,
        passRate: totalSubmissions > 0 ? (passedCount / totalSubmissions) * 100 : 0,
        averageTime: parseFloat(overallStats[0]?.averageTime || 0)
      },
      variationStatistics: variationStats.map(stat => ({
        variationId: stat.examVariationId,
        variationLetter: stat['examVariation.variationLetter'],
        variationNumber: stat['examVariation.variationNumber'],
        submissions: parseInt(stat.submissions),
        averageScore: parseFloat(stat.averageScore),
        passedCount: parseInt(stat.passedCount),
        passRate: stat.submissions > 0 ? (parseInt(stat.passedCount) / parseInt(stat.submissions)) * 100 : 0
      })),
      scoreDistribution: scoreDistribution.map(dist => ({
        range: `${parseInt(dist.scoreRange) * 10}-${(parseInt(dist.scoreRange) + 1) * 10}`,
        count: parseInt(dist.count)
      })),
      difficultyPerformance: difficultyStats
    }
  });
});

// Review/grade a submission (add feedback)
const reviewSubmission = catchAsync(async (req, res) => {
  const { submissionId } = req.params;
  const { feedback } = req.body;
  const userId = req.user.id;

  const answer = await Answer.findOne({
    where: { id: submissionId },
    include: [
      {
        model: Exam,
        as: 'exam',
        where: { userId }, // Ensure user owns the exam
        attributes: ['id', 'title']
      }
    ]
  });

  if (!answer) {
    throw new AppError('Submission not found or access denied', 404);
  }

  await answer.markAsReviewed(userId, feedback);

  res.json({
    success: true,
    message: 'Submission reviewed successfully',
    data: {
      submission: answer.toJSON()
    }
  });
});

// Export submissions to CSV/Excel
const exportSubmissions = catchAsync(async (req, res) => {
  const { examId } = req.params;
  const { format = 'json', variationId } = req.query;
  const userId = req.user.id;

  // Verify user owns the exam
  const exam = await Exam.findOne({
    where: { id: examId, userId },
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['name']
      }
    ]
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  const whereClause = { examId };
  if (variationId) {
    whereClause.examVariationId = variationId;
  }

  const submissions = await Answer.findAll({
    where: whereClause,
    include: [
      {
        model: ExamVariation,
        as: 'examVariation',
        attributes: ['variationLetter', 'variationNumber']
      }
    ],
    order: [['submittedAt', 'DESC']]
  });

  if (format === 'json') {
    res.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          subject: exam.subject?.name
        },
        submissions: submissions.map(s => ({
          studentName: s.studentName,
          studentId: s.studentId,
          studentEmail: s.studentEmail,
          variationLetter: s.examVariation?.variationLetter,
          score: s.score,
          correctAnswers: s.correctAnswers,
          totalQuestions: s.totalQuestions,
          percentage: s.getPercentage(),
          grade: s.getGrade(),
          isPassed: s.isPassed,
          timeSpent: s.getFormattedDuration(),
          submittedAt: s.submittedAt
        })),
        exportedAt: new Date().toISOString(),
        totalSubmissions: submissions.length
      }
    });
  } else {
    throw new AppError('Only JSON format is currently supported', 400);
  }
});

// Validate QR code
const validateQRCode = catchAsync(async (req, res) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    throw new AppError('QR code is required', 400);
  }

  // Validate QR code format
  const isValid = qrService.validateQRData(qrCode);
  
  if (!isValid) {
    return res.json({
      success: false,
      message: 'Invalid QR code format',
      data: { isValid: false }
    });
  }

  // Extract exam data
  const examData = qrService.extractExamData(qrCode);
  
  if (!examData) {
    return res.json({
      success: false,
      message: 'Could not extract exam data from QR code',
      data: { isValid: false }
    });
  }

  // Check if variation exists
  const variation = await ExamVariation.findOne({
    where: { 
      id: examData.variationId,
      examId: examData.examId 
    },
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['id', 'title', 'isActive', 'isPublished', 'expiresAt']
      }
    ]
  });

  if (!variation) {
    return res.json({
      success: false,
      message: 'Exam variation not found',
      data: { isValid: false }
    });
  }

  const canTakeExam = variation.exam.canTakeExam();

  res.json({
    success: true,
    message: 'QR code is valid',
    data: {
      isValid: true,
      canTakeExam,
      exam: {
        id: variation.exam.id,
        title: variation.exam.title,
        isActive: variation.exam.isActive,
        isPublished: variation.exam.isPublished,
        isExpired: variation.exam.isExpired()
      },
      variation: {
        id: variation.id,
        variationLetter: variation.variationLetter,
        variationNumber: variation.variationNumber
      }
    }
  });
});

module.exports = {
  submitAnswers,
  getSubmission,
  getExamSubmissions,
  getSubmissionStatistics,
  reviewSubmission,
  exportSubmissions,
  validateQRCode
};