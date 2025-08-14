const { Question, Subject, Exam } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { Op } = require('sequelize');

// Get questions with pagination and filters
const getQuestions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, subjectId, difficulty } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = { userId: req.user.id, isActive: true };

  if (search) {
    where[Op.or] = [
      { text: { [Op.iLike]: `%${search}%` } },
      { tags: { [Op.overlap]: [search] } }
    ];
  }

  if (subjectId) {
    where.subjectId = subjectId;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  const { count, rows: questions } = await Question.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ]
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { questions, pagination }
  });
});

// Get questions statistics
const getQuestionsStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const stats = await Question.findAll({
    where: { userId, isActive: true },
    attributes: [
      [Question.sequelize.fn('COUNT', Question.sequelize.col('id')), 'total'],
      'difficulty'
    ],
    group: ['difficulty'],
    raw: true
  });

  const result = {
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0
  };

  stats.forEach(stat => {
    result[stat.difficulty] = parseInt(stat.total);
    result.total += parseInt(stat.total);
  });

  // Get recent questions
  const recentQuestions = await Question.findAll({
    where: { userId, isActive: true },
    order: [['createdAt', 'DESC']],
    limit: 5,
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ]
  });

  res.json({
    success: true,
    data: { 
      stats: result,
      recentQuestions
    }
  });
});

// Create question
const createQuestion = catchAsync(async (req, res, next) => {
  const {
    text,
    alternatives,
    correctAnswer,
    difficulty,
    subjectId,
    explanation,
    points = 1,
    tags = []
  } = req.body;

  // Validate subject exists and belongs to user
  const subject = await Subject.findOne({
    where: { id: subjectId, userId: req.user.id }
  });

  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  // Validate alternatives and correct answer
  if (!Array.isArray(alternatives) || alternatives.length < 2 || alternatives.length > 5) {
    return next(new AppError('Must have between 2 and 5 alternatives', 400));
  }

  // Clean empty alternatives
  const cleanAlternatives = alternatives.filter(alt => alt && alt.trim().length > 0);
  if (cleanAlternatives.length < 2) {
    return next(new AppError('Must have at least 2 non-empty alternatives', 400));
  }

  if (correctAnswer < 0 || correctAnswer >= cleanAlternatives.length) {
    return next(new AppError('Correct answer index is invalid', 400));
  }

  const question = await Question.create({
    text: text.trim(),
    alternatives: cleanAlternatives.map(alt => alt.trim()),
    correctAnswer,
    difficulty,
    subjectId,
    userId: req.user.id,
    explanation: explanation?.trim(),
    points: parseFloat(points),
    tags: Array.isArray(tags) ? tags.filter(tag => tag && tag.trim().length > 0) : []
  });

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: { question }
  });
});

// Get question by ID
const getQuestionById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const question = await Question.findByPk(id, {
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ]
  });

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  // Check if user owns the question or is admin
  if (req.user.role !== 'admin' && question.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  res.json({
    success: true,
    data: { question }
  });
});

// Update question
const updateQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const question = await Question.findByPk(id);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  // Check ownership
  if (req.user.role !== 'admin' && question.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  // Check if question is being used in published exams
  const usageCount = await Question.sequelize.query(`
    SELECT COUNT(*) as count 
    FROM exam_questions eq 
    JOIN exams e ON eq.exam_id = e.id 
    WHERE eq.question_id = :questionId AND e.is_published = true
  `, {
    replacements: { questionId: id },
    type: Question.sequelize.QueryTypes.SELECT
  });

  if (usageCount[0]?.count > 0) {
    return next(new AppError('Cannot modify question that is used in published exams', 400));
  }

  // Validate alternatives and correct answer if being updated
  if (updateData.alternatives) {
    const cleanAlternatives = updateData.alternatives.filter(alt => alt && alt.trim().length > 0);
    
    if (cleanAlternatives.length < 2 || cleanAlternatives.length > 5) {
      return next(new AppError('Must have between 2 and 5 non-empty alternatives', 400));
    }
    updateData.alternatives = cleanAlternatives.map(alt => alt.trim());
  }

  if (updateData.correctAnswer !== undefined) {
    const alternatives = updateData.alternatives || question.alternatives;
    if (updateData.correctAnswer < 0 || updateData.correctAnswer >= alternatives.length) {
      return next(new AppError('Correct answer index is invalid', 400));
    }
  }

  // Clean tags
  if (updateData.tags) {
    updateData.tags = Array.isArray(updateData.tags) ? 
      updateData.tags.filter(tag => tag && tag.trim().length > 0) : [];
  }

  await question.update(updateData);

  res.json({
    success: true,
    message: 'Question updated successfully',
    data: { question }
  });
});

// Delete question
const deleteQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const question = await Question.findByPk(id);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  // Check ownership
  if (req.user.role !== 'admin' && question.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  // Check if question is being used in any exams
  const usageCount = await Question.sequelize.query(`
    SELECT COUNT(*) as count 
    FROM exam_questions eq 
    WHERE eq.question_id = :questionId
  `, {
    replacements: { questionId: id },
    type: Question.sequelize.QueryTypes.SELECT
  });

  if (usageCount[0]?.count > 0) {
    return next(new AppError('Cannot delete question that is used in exams', 400));
  }

  // Soft delete by setting isActive to false
  await question.update({ isActive: false });

  res.json({
    success: true,
    message: 'Question deleted successfully'
  });
});

// Get questions by difficulty for a subject
const getQuestionsByDifficulty = catchAsync(async (req, res, next) => {
  const { subjectId, difficulty } = req.params;

  // Validate subject belongs to user
  const subject = await Subject.findOne({
    where: { id: subjectId, userId: req.user.id }
  });

  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  const questions = await Question.findAll({
    where: {
      subjectId,
      difficulty,
      isActive: true
    },
    order: [['createdAt', 'DESC']],
    limit: 50 // Limit for performance
  });

  res.json({
    success: true,
    data: { questions }
  });
});

// Search questions
const searchQuestions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, q, subjectId, difficulty } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = { userId: req.user.id, isActive: true };

  if (q) {
    where[Op.or] = [
      { text: { [Op.iLike]: `%${q}%` } },
      { tags: { [Op.overlap]: [q] } }
    ];
  }

  if (subjectId) {
    where.subjectId = subjectId;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  const { count, rows: questions } = await Question.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ]
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { questions, pagination }
  });
});

// Duplicate question
const duplicateQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const originalQuestion = await Question.findByPk(id);

  if (!originalQuestion) {
    return next(new AppError('Question not found', 404));
  }

  // Check ownership
  if (req.user.role !== 'admin' && originalQuestion.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  const duplicatedQuestion = await Question.create({
    text: `${originalQuestion.text} (Copy)`,
    alternatives: originalQuestion.alternatives,
    correctAnswer: originalQuestion.correctAnswer,
    difficulty: originalQuestion.difficulty,
    subjectId: originalQuestion.subjectId,
    userId: req.user.id,
    explanation: originalQuestion.explanation,
    points: originalQuestion.points,
    tags: originalQuestion.tags
  });

  res.status(201).json({
    success: true,
    message: 'Question duplicated successfully',
    data: { question: duplicatedQuestion }
  });
});

// Bulk delete questions
const bulkDeleteQuestions = catchAsync(async (req, res, next) => {
  const { questionIds } = req.body;

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return next(new AppError('Question IDs are required', 400));
  }

  // Check ownership for all questions
  const questions = await Question.findAll({
    where: {
      id: { [Op.in]: questionIds },
      userId: req.user.id
    }
  });

  if (questions.length !== questionIds.length) {
    return next(new AppError('Some questions not found or access denied', 403));
  }

  // Check if any questions are being used in exams
  const usageCount = await Question.sequelize.query(`
    SELECT COUNT(*) as count 
    FROM exam_questions eq 
    WHERE eq.question_id IN (:questionIds)
  `, {
    replacements: { questionIds },
    type: Question.sequelize.QueryTypes.SELECT
  });

  if (usageCount[0]?.count > 0) {
    return next(new AppError('Cannot delete questions that are used in exams', 400));
  }

  await Question.update(
    { isActive: false },
    {
      where: {
        id: { [Op.in]: questionIds },
        userId: req.user.id
      }
    }
  );

  res.json({
    success: true,
    message: `${questionIds.length} questions deleted successfully`
  });
});

// Import questions from file
const importQuestions = catchAsync(async (req, res, next) => {
  const { subjectId } = req.body;

  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  // Validate subject
  const subject = await Subject.findOne({
    where: { id: subjectId, userId: req.user.id }
  });

  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  // For now, return a placeholder response
  // TODO: Implement actual file parsing logic
  res.json({
    success: true,
    message: 'Import functionality will be implemented based on file format',
    data: {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      subjectId
    }
  });
});

// Export questions
const exportQuestions = catchAsync(async (req, res, next) => {
  const { subjectId, format = 'json' } = req.body;

  const where = { userId: req.user.id, isActive: true };
  
  if (subjectId) {
    where.subjectId = subjectId;
  }

  const questions = await Question.findAll({
    where,
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['name']
      }
    ]
  });

  res.json({
    success: true,
    message: `Export format ${format} ready`,
    data: {
      questions: questions.map(q => ({
        text: q.text,
        alternatives: q.alternatives,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        subject: q.subject.name,
        explanation: q.explanation,
        points: q.points,
        tags: q.tags
      })),
      format,
      count: questions.length
    }
  });
});

// Get question usage statistics
const getQuestionStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const question = await Question.findByPk(id);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  // Check ownership
  if (req.user.role !== 'admin' && question.userId !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  // Get usage statistics
  const usageStats = await Question.sequelize.query(`
    SELECT 
      COUNT(DISTINCT eq.exam_id) as exams_count,
      COUNT(DISTINCT eq.variation_id) as variations_count,
      COUNT(a.id) as total_attempts,
      COUNT(CASE WHEN a.answers::jsonb @> '[{"questionId": "' || :questionId || '", "correct": true}]' THEN 1 END) as correct_attempts
    FROM exam_questions eq
    LEFT JOIN answers a ON eq.exam_id = a.exam_id
    WHERE eq.question_id = :questionId
  `, {
    replacements: { questionId: id },
    type: Question.sequelize.QueryTypes.SELECT
  });

  const stats = usageStats[0] || {};
  const successRate = stats.total_attempts > 0 ? 
    ((stats.correct_attempts / stats.total_attempts) * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      question: {
        id: question.id,
        text: question.text,
        difficulty: question.difficulty,
        timesUsed: question.timesUsed || 0,
        timesCorrect: question.timesCorrect || 0,
        averageScore: question.averageScore || 0
      },
      usage: {
        examsCount: parseInt(stats.exams_count) || 0,
        variationsCount: parseInt(stats.variations_count) || 0,
        totalAttempts: parseInt(stats.total_attempts) || 0,
        correctAttempts: parseInt(stats.correct_attempts) || 0,
        successRate: parseFloat(successRate)
      }
    }
  });
});

module.exports = {
  getQuestions,
  getQuestionsStats,
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsByDifficulty,
  searchQuestions,
  duplicateQuestion,
  bulkDeleteQuestions,
  importQuestions,
  exportQuestions,
  getQuestionStats
};