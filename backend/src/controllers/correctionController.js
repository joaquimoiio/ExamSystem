const { Answer, Exam, ExamVariation, Question, Subject } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { Op } = require('sequelize');

// Submit student answers
const submitAnswers = catchAsync(async (req, res, next) => {
  const { examId, variationId } = req.params;
  const { studentName, studentId, studentEmail, answers, timeSpent, startedAt } = req.body;

  // Get variation with questions
  const variation = await ExamVariation.findOne({
    where: { id: variationId, examId },
    include: [
      {
        model: Exam,
        as: 'exam',
        include: [{ model: Subject, as: 'subject', attributes: ['name'] }]
      },
      {
        model: Question,
        as: 'questions',
        through: { attributes: ['questionOrder'] },
        attributes: ['id', 'correctAnswer', 'difficulty', 'points', 'explanation']
      }
    ]
  });

  if (!variation || !variation.exam.canTakeExam()) {
    return next(new AppError('Exam not available for submission', 404));
  }

  // Validate answers length
  if (!Array.isArray(answers) || answers.length !== variation.questions.length) {
    return next(new AppError('Invalid number of answers', 400));
  }

  // Check for existing submission (if maxAttempts = 1)
  if (variation.exam.maxAttempts <= 1) {
    const existingSubmission = await Answer.findOne({
      where: {
        examId,
        variationId,
        [Op.or]: [
          { studentEmail: studentEmail || null },
          { studentId: studentId || null }
        ]
      }
    });

    if (existingSubmission) {
      return next(new AppError('You have already submitted this exam', 400));
    }
  }

  // Calculate score
  let totalPoints = 0;
  let earnedPoints = 0;
  let correctCount = 0;
  const detailedAnswers = [];

  variation.questions.forEach((question, index) => {
    const studentAnswer = parseInt(answers[index]);
    const isCorrect = studentAnswer === question.correctAnswer;
    const points = isCorrect ? (question.points || 1) : 0;
    const maxPoints = question.points || 1;

    totalPoints += maxPoints;
    earnedPoints += points;
    if (isCorrect) correctCount++;

    detailedAnswers.push({
      questionId: question.id,
      answer: studentAnswer,
      correctAnswer: question.correctAnswer,
      correct: isCorrect,
      points: points,
      maxPoints: maxPoints,
      difficulty: question.difficulty,
      explanation: question.explanation
    });
  });

  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0;
  const isPassed = score >= variation.exam.passingScore;

  // Create answer record
  const answerRecord = await Answer.create({
    userId: req.user?.id || null,
    studentName,
    studentId,
    studentEmail,
    examId,
    variationId,
    answers: detailedAnswers,
    score: parseFloat(score.toFixed(2)),
    totalQuestions: variation.questions.length,
    correctAnswers: correctCount,
    earnedPoints: parseFloat(earnedPoints.toFixed(2)),
    totalPoints: parseFloat(totalPoints.toFixed(2)),
    timeSpent,
    startedAt: startedAt ? new Date(startedAt) : null,
    submittedAt: new Date(),
    isPassed,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'submitted'
  });

  // Update question statistics
  for (const question of variation.questions) {
    const answer = detailedAnswers.find(a => a.questionId === question.id);
    if (answer) {
      await question.increment('timesUsed');
      if (answer.correct) {
        await question.increment('timesCorrect');
      }
    }
  }

  res.status(201).json({
    success: true,
    message: 'Answers submitted successfully',
    data: {
      submissionId: answerRecord.id,
      score: answerRecord.score,
      correctAnswers: answerRecord.correctAnswers,
      totalQuestions: answerRecord.totalQuestions,
      isPassed: answerRecord.isPassed,
      grade: answerRecord.calculateGrade(),
      canViewResults: variation.exam.showResults
    }
  });
});

// Get submission result
const getSubmissionResult = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;

  const submission = await Answer.findByPk(submissionId, {
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['id', 'title', 'showResults', 'showCorrectAnswers', 'allowReview'],
        include: [{ model: Subject, as: 'subject', attributes: ['name', 'color'] }]
      },
      {
        model: ExamVariation,
        as: 'variation',
        attributes: ['id', 'variationNumber']
      }
    ]
  });

  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  // Check if user can view results
  if (!submission.exam.showResults && req.user?.id !== submission.userId) {
    return next(new AppError('Results are not available for viewing', 403));
  }

  const result = {
    id: submission.id,
    studentName: submission.studentName,
    studentId: submission.studentId,
    studentEmail: submission.studentEmail,
    score: submission.score,
    grade: submission.calculateGrade(),
    correctAnswers: submission.correctAnswers,
    totalQuestions: submission.totalQuestions,
    isPassed: submission.isPassed,
    timeSpent: submission.getTimeSpentFormatted(),
    submittedAt: submission.submittedAt,
    exam: submission.exam,
    variation: submission.variation,
    performanceByDifficulty: submission.getPerformanceByDifficulty()
  };

  // Include detailed results if allowed
  if (submission.exam.allowReview && submission.exam.showCorrectAnswers) {
    result.detailedResults = submission.getDetailedResults();
  }

  res.json({
    success: true,
    data: { result }
  });
});

// Get submissions for teacher
const getSubmissions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, examId, search, status, isPassed } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = {};
  
  // Filter by exam ownership for non-admin users
  if (req.user.role !== 'admin') {
    const userExams = await Exam.findAll({
      where: { userId: req.user.id },
      attributes: ['id']
    });
    where.examId = { [Op.in]: userExams.map(exam => exam.id) };
  }

  if (examId) {
    where.examId = examId;
  }

  if (status) {
    where.status = status;
  }

  if (isPassed !== undefined) {
    where.isPassed = isPassed === 'true';
  }

  if (search) {
    where[Op.or] = [
      { studentName: { [Op.iLike]: `%${search}%` } },
      { studentEmail: { [Op.iLike]: `%${search}%` } },
      { studentId: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: submissions } = await Answer.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['submittedAt', 'DESC']],
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['id', 'title', 'passingScore'],
        include: [{ model: Subject, as: 'subject', attributes: ['name', 'color'] }]
      },
      {
        model: ExamVariation,
        as: 'variation',
        attributes: ['id', 'variationNumber']
      }
    ]
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { submissions, pagination }
  });
});

// Get submission details
const getSubmissionDetails = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;

  const submission = await Answer.findByPk(submissionId, {
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['id', 'title', 'userId', 'showCorrectAnswers'],
        include: [{ model: Subject, as: 'subject', attributes: ['name'] }]
      },
      {
        model: ExamVariation,
        as: 'variation',
        attributes: ['id', 'variationNumber']
      }
    ]
  });

  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && submission.exam.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  res.json({
    success: true,
    data: {
      submission: {
        ...submission.toJSON(),
        grade: submission.calculateGrade(),
        timeSpentFormatted: submission.getTimeSpentFormatted(),
        performanceByDifficulty: submission.getPerformanceByDifficulty(),
        detailedResults: submission.getDetailedResults()
      }
    }
  });
});

// Update submission feedback
const updateSubmission = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;
  const { feedback, status } = req.body;

  const submission = await Answer.findByPk(submissionId, {
    include: [{ model: Exam, as: 'exam', attributes: ['userId'] }]
  });

  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && submission.exam.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  await submission.update({
    ...(feedback && { feedback }),
    ...(status && { status })
  });

  res.json({
    success: true,
    message: 'Submission updated successfully',
    data: { submission }
  });
});

// Get exam statistics
const getCorrectionStats = catchAsync(async (req, res, next) => {
  const { examId } = req.params;

  // Check exam ownership
  const exam = await Exam.findByPk(examId);
  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (req.user.role !== 'admin' && exam.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  const stats = await Answer.findAll({
    where: { examId },
    attributes: [
      [Answer.sequelize.fn('COUNT', Answer.sequelize.col('id')), 'totalSubmissions'],
      [Answer.sequelize.fn('AVG', Answer.sequelize.col('score')), 'averageScore'],
      [Answer.sequelize.fn('MIN', Answer.sequelize.col('score')), 'minScore'],
      [Answer.sequelize.fn('MAX', Answer.sequelize.col('score')), 'maxScore'],
      [Answer.sequelize.fn('COUNT', Answer.sequelize.literal('CASE WHEN "isPassed" = true THEN 1 END')), 'passedCount']
    ],
    raw: true
  });

  const result = stats[0] || {};
  const totalSubmissions = parseInt(result.totalSubmissions) || 0;
  const passedCount = parseInt(result.passedCount) || 0;

  // Get score distribution
  const scoreDistribution = await Answer.findAll({
    where: { examId },
    attributes: [
      [Answer.sequelize.fn('FLOOR', Answer.sequelize.col('score')), 'scoreRange'],
      [Answer.sequelize.fn('COUNT', Answer.sequelize.col('id')), 'count']
    ],
    group: [Answer.sequelize.fn('FLOOR', Answer.sequelize.col('score'))],
    order: [[Answer.sequelize.fn('FLOOR', Answer.sequelize.col('score')), 'ASC']],
    raw: true
  });

  res.json({
    success: true,
    data: {
      totalSubmissions,
      averageScore: result.averageScore ? parseFloat(result.averageScore).toFixed(2) : 0,
      minScore: result.minScore ? parseFloat(result.minScore).toFixed(2) : 0,
      maxScore: result.maxScore ? parseFloat(result.maxScore).toFixed(2) : 0,
      passedCount,
      failedCount: totalSubmissions - passedCount,
      passRate: totalSubmissions > 0 ? ((passedCount / totalSubmissions) * 100).toFixed(2) : 0,
      scoreDistribution
    }
  });
});

// Get question analysis
const getQuestionAnalysis = catchAsync(async (req, res, next) => {
  const { examId } = req.params;

  // Check exam ownership
  const exam = await Exam.findByPk(examId);
  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (req.user.role !== 'admin' && exam.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  const answers = await Answer.findAll({
    where: { examId },
    attributes: ['answers']
  });

  const questionStats = {};

  answers.forEach(answer => {
    if (answer.answers && Array.isArray(answer.answers)) {
      answer.answers.forEach((questionAnswer, index) => {
        const questionId = questionAnswer.questionId;
        
        if (!questionStats[questionId]) {
          questionStats[questionId] = {
            questionNumber: index + 1,
            totalAttempts: 0,
            correctAttempts: 0,
            difficulty: questionAnswer.difficulty,
            alternativeDistribution: {}
          };
        }

        questionStats[questionId].totalAttempts++;
        
        if (questionAnswer.correct) {
          questionStats[questionId].correctAttempts++;
        }

        // Track answer distribution
        const studentAnswer = questionAnswer.answer;
        if (!questionStats[questionId].alternativeDistribution[studentAnswer]) {
          questionStats[questionId].alternativeDistribution[studentAnswer] = 0;
        }
        questionStats[questionId].alternativeDistribution[studentAnswer]++;
      });
    }
  });

  // Calculate success rates
  Object.keys(questionStats).forEach(questionId => {
    const stats = questionStats[questionId];
    stats.successRate = stats.totalAttempts > 0 ? 
      ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(2) : 0;
  });

  res.json({
    success: true,
    data: { questionStats }
  });
});

// Bulk grade submissions
const bulkGradeSubmissions = catchAsync(async (req, res, next) => {
  const { submissionIds, action, feedback } = req.body;

  if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
    return next(new AppError('Submission IDs are required', 400));
  }

  const submissions = await Answer.findAll({
    where: { id: { [Op.in]: submissionIds } },
    include: [{ model: Exam, as: 'exam', attributes: ['userId'] }]
  });

  // Check permissions
  const unauthorizedSubmissions = submissions.filter(
    sub => req.user.role !== 'admin' && sub.exam.userId !== req.user.id
  );

  if (unauthorizedSubmissions.length > 0) {
    return next(new AppError('Access denied for some submissions', 403));
  }

  const results = [];

  for (const submission of submissions) {
    try {
      const updates = {};

      if (action === 'approve') {
        updates.status = 'graded';
      } else if (action === 'review') {
        updates.status = 'reviewed';
      }

      if (feedback) {
        updates.feedback = feedback;
      }

      await submission.update(updates);
      
      results.push({
        id: submission.id,
        studentName: submission.studentName,
        status: 'success'
      });
    } catch (error) {
      results.push({
        id: submission.id,
        studentName: submission.studentName,
        status: 'error',
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    message: `Bulk operation completed on ${results.length} submissions`,
    data: { results }
  });
});

// Get submissions by exam
const getSubmissionsByExam = catchAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  // Check exam ownership
  const exam = await Exam.findByPk(examId);
  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (req.user.role !== 'admin' && exam.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  const { count, rows: submissions } = await Answer.findAndCountAll({
    where: { examId },
    limit: queryLimit,
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

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { submissions, pagination }
  });
});

// Get submissions by student
const getSubmissionsByStudent = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = { studentId };

  // Filter by exam ownership for non-admin users
  if (req.user.role !== 'admin') {
    const userExams = await Exam.findAll({
      where: { userId: req.user.id },
      attributes: ['id']
    });
    where.examId = { [Op.in]: userExams.map(exam => exam.id) };
  }

  const { count, rows: submissions } = await Answer.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['submittedAt', 'DESC']],
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['title']
      }
    ]
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { submissions, pagination }
  });
});

// Get pending submissions
const getPendingSubmissions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = { status: 'submitted' };

  // Filter by exam ownership for non-admin users
  if (req.user.role !== 'admin') {
    const userExams = await Exam.findAll({
      where: { userId: req.user.id },
      attributes: ['id']
    });
    where.examId = { [Op.in]: userExams.map(exam => exam.id) };
  }

  const { count, rows: submissions } = await Answer.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['submittedAt', 'ASC']],
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['title']
      }
    ]
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { submissions, pagination }
  });
});

// Add feedback
const addFeedback = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;
  const { feedback } = req.body;

  const submission = await Answer.findByPk(submissionId, {
    include: [{ model: Exam, as: 'exam', attributes: ['userId'] }]
  });

  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  if (req.user.role !== 'admin' && submission.exam.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  await submission.update({ feedback });

  res.json({
    success: true,
    message: 'Feedback added successfully'
  });
});

// Adjust score
const adjustScore = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;
  const { score, reason } = req.body;

  const submission = await Answer.findByPk(submissionId, {
    include: [{ model: Exam, as: 'exam', attributes: ['userId', 'passingScore'] }]
  });

  if (!submission) {
    return next(new AppError('Submission not found', 404));
  }

  if (req.user.role !== 'admin' && submission.exam.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  const isPassed = score >= submission.exam.passingScore;

  await submission.update({
    score: parseFloat(score),
    isPassed,
    feedback: reason ? `${submission.feedback || ''}\n\nScore adjusted: ${reason}`.trim() : submission.feedback
  });

  res.json({
    success: true,
    message: 'Score adjusted successfully',
    data: { newScore: score, isPassed }
  });
});

// Regrade submission
const regradeSubmission = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;

  res.json({
    success: true,
    message: 'Regrade functionality to be implemented'
  });
});

// Export submissions
const exportSubmissions = catchAsync(async (req, res, next) => {
  const { format = 'json' } = req.body;

  res.json({
    success: true,
    message: `Export in ${format} format to be implemented`
  });
});

// Performance analytics
const getPerformanceAnalytics = catchAsync(async (req, res, next) => {
  const { examId } = req.params;

  res.json({
    success: true,
    message: 'Performance analytics to be implemented',
    data: { examId }
  });
});

// Compare students
const compareStudents = catchAsync(async (req, res, next) => {
  res.json({
    success: true,
    message: 'Student comparison to be implemented'
  });
});

// Get suspicious submissions
const getSuspiciousSubmissions = catchAsync(async (req, res, next) => {
  const { examId } = req.params;

  res.json({
    success: true,
    message: 'Suspicious submissions detection to be implemented',
    data: { examId }
  });
});

module.exports = {
  submitAnswers,
  getSubmissionResult,
  getSubmissions,
  getSubmissionsByExam,      // <- ADICIONAR
  getSubmissionsByStudent,   // <- ADICIONAR
  getPendingSubmissions,     // <- ADICIONAR
  getSubmissionDetails,
  updateSubmission,
  addFeedback,               // <- ADICIONAR
  adjustScore,               // <- ADICIONAR
  regradeSubmission,         // <- ADICIONAR
  exportSubmissions,         // <- ADICIONAR
  getCorrectionStats,
  getQuestionAnalysis,
  getPerformanceAnalytics,   // <- ADICIONAR
  compareStudents,           // <- ADICIONAR
  getSuspiciousSubmissions,  // <- ADICIONAR
  bulkGradeSubmissions
};