const { Exam, ExamVariation, ExamQuestion, Question, Subject, Answer } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { paginate, buildPaginationMeta, generateAccessCode, shuffleArray } = require('../utils/helpers');
const qrService = require('../services/qrService');
const { Op } = require('sequelize');

// Get public exams
const getPublicExams = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = {
    isPublished: true,
    [Op.or]: [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ]
  };

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: exams } = await Exam.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['publishedAt', 'DESC']],
    attributes: ['id', 'title', 'description', 'totalQuestions', 'timeLimit', 'accessCode', 'publishedAt'],
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
    data: { exams, pagination }
  });
});

// Get exam by access code
const getExamByAccessCode = catchAsync(async (req, res, next) => {
  const { accessCode } = req.params;

  const exam = await Exam.findOne({
    where: {
      accessCode: accessCode.toUpperCase(),
      isPublished: true,
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ]
    },
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      },
      {
        model: ExamVariation,
        as: 'variations',
        attributes: ['id', 'variationNumber', 'qrCode']
      }
    ]
  });

  if (!exam) {
    return next(new AppError('Exam not found or not available', 404));
  }

  res.json({
    success: true,
    data: { exam }
  });
});

// Get exam for taking
const getExamForTaking = catchAsync(async (req, res, next) => {
  const { examId, variationId } = req.params;

  const variation = await ExamVariation.findOne({
    where: { id: variationId, examId },
    include: [
      {
        model: Exam,
        as: 'exam',
        include: [{ model: Subject, as: 'subject', attributes: ['name', 'color'] }]
      },
      {
        model: Question,
        as: 'questions',
        through: { attributes: ['questionOrder'] },
        attributes: ['id', 'text', 'alternatives', 'difficulty', 'points']
      }
    ]
  });

  if (!variation || !variation.exam.canTakeExam()) {
    return next(new AppError('Exam not available', 404));
  }

  // Prepare questions without correct answers
  const questions = variation.questions
    .sort((a, b) => a.ExamQuestion.questionOrder - b.ExamQuestion.questionOrder)
    .map((question, index) => {
      let alternatives = question.alternatives;
      
      // Shuffle alternatives if required
      if (variation.exam.randomizeAlternatives) {
        alternatives = shuffleArray([...question.alternatives]);
      }

      return {
        id: question.id,
        text: question.text,
        alternatives,
        difficulty: question.difficulty,
        points: question.points,
        order: index
      };
    });

  res.json({
    success: true,
    data: {
      exam: {
        id: variation.exam.id,
        title: variation.exam.title,
        description: variation.exam.description,
        instructions: variation.exam.instructions,
        totalQuestions: variation.exam.totalQuestions,
        timeLimit: variation.exam.timeLimit,
        requireFullScreen: variation.exam.requireFullScreen,
        preventCopyPaste: variation.exam.preventCopyPaste,
        subject: variation.exam.subject
      },
      variation: {
        id: variation.id,
        variationNumber: variation.variationNumber
      },
      questions
    }
  });
});

// Get user's exams
const getExams = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, subjectId, status } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const where = { userId: req.user.id };

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (subjectId) {
    where.subjectId = subjectId;
  }

  if (status) {
    if (status === 'published') {
      where.isPublished = true;
    } else if (status === 'draft') {
      where.isPublished = false;
    }
  }

  const { count, rows: exams } = await Exam.findAndCountAll({
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
    ],
    attributes: {
      include: [
        [
          Exam.sequelize.literal(`(
            SELECT COUNT(*)
            FROM answers
            WHERE answers.exam_id = "Exam".id
          )`),
          'submissionsCount'
        ],
        [
          Exam.sequelize.literal(`(
            SELECT COUNT(*)
            FROM exam_variations
            WHERE exam_variations.exam_id = "Exam".id
          )`),
          'variationsCount'
        ]
      ]
    }
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { exams, pagination }
  });
});

// Get exam statistics
const getExamsStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const [totalExams, publishedExams, totalSubmissions] = await Promise.all([
    Exam.count({ where: { userId } }),
    Exam.count({ where: { userId, isPublished: true } }),
    Answer.count({
      include: [{ model: Exam, as: 'exam', where: { userId }, attributes: [] }]
    })
  ]);

  // Get recent exams
  const recentExams = await Exam.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 5,
    include: [{ model: Subject, as: 'subject', attributes: ['name', 'color'] }],
    attributes: {
      include: [
        [
          Exam.sequelize.literal(`(
            SELECT COUNT(*)
            FROM answers
            WHERE answers.exam_id = "Exam".id
          )`),
          'submissionsCount'
        ]
      ]
    }
  });

  res.json({
    success: true,
    data: {
      stats: {
        totalExams,
        publishedExams,
        draftExams: totalExams - publishedExams,
        totalSubmissions
      },
      recentExams
    }
  });
});

// Create exam
const createExam = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    subjectId,
    totalQuestions,
    easyQuestions = 0,
    mediumQuestions = 0,
    hardQuestions = 0,
    totalVariations = 1,
    timeLimit,
    passingScore = 6.0,
    instructions,
    allowReview = true,
    showCorrectAnswers = true,
    randomizeQuestions = true,
    randomizeAlternatives = true,
    maxAttempts = 1,
    showResults = true,
    requireFullScreen = false,
    preventCopyPaste = false
  } = req.body;

  // Validate subject exists and belongs to user
  const subject = await Subject.findOne({
    where: { id: subjectId, userId: req.user.id }
  });

  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  // Validate question distribution
  if (easyQuestions + mediumQuestions + hardQuestions !== totalQuestions) {
    return next(new AppError('Questions distribution must sum to total questions', 400));
  }

  // Check if enough questions available
  const [easyCount, mediumCount, hardCount] = await Promise.all([
    Question.count({ where: { subjectId, difficulty: 'easy', isActive: true } }),
    Question.count({ where: { subjectId, difficulty: 'medium', isActive: true } }),
    Question.count({ where: { subjectId, difficulty: 'hard', isActive: true } })
  ]);

  if (easyCount < easyQuestions || mediumCount < mediumQuestions || hardCount < hardQuestions) {
    return next(new AppError('Not enough questions available for this distribution', 400));
  }

  const exam = await Exam.create({
    title: title.trim(),
    description: description?.trim(),
    subjectId,
    userId: req.user.id,
    totalQuestions,
    easyQuestions,
    mediumQuestions,
    hardQuestions,
    totalVariations,
    timeLimit,
    passingScore,
    instructions: instructions?.trim(),
    allowReview,
    showCorrectAnswers,
    randomizeQuestions,
    randomizeAlternatives,
    maxAttempts,
    showResults,
    requireFullScreen,
    preventCopyPaste
  });

  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
    data: { exam }
  });
});

// Get exam by ID
const getExamById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id, {
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      },
      {
        model: ExamVariation,
        as: 'variations',
        attributes: ['id', 'variationNumber', 'qrCode']
      }
    ],
    attributes: {
      include: [
        [
          Exam.sequelize.literal(`(
            SELECT COUNT(*)
            FROM answers
            WHERE answers.exam_id = "Exam".id
          )`),
          'submissionsCount'
        ]
      ]
    }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  res.json({
    success: true,
    data: { exam }
  });
});

// Update exam
const updateExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const exam = await Exam.findByPk(id);

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Don't allow critical updates to published exams
  if (exam.isPublished) {
    const restrictedFields = ['totalQuestions', 'easyQuestions', 'mediumQuestions', 'hardQuestions', 'subjectId'];
    const hasRestrictedChanges = restrictedFields.some(field => 
      updateData[field] !== undefined && updateData[field] !== exam[field]
    );

    if (hasRestrictedChanges) {
      return next(new AppError('Cannot modify question distribution of published exam', 400));
    }
  }

  // Validate question distribution if changed
  if (updateData.totalQuestions || updateData.easyQuestions !== undefined || 
      updateData.mediumQuestions !== undefined || updateData.hardQuestions !== undefined) {
    const total = updateData.totalQuestions || exam.totalQuestions;
    const easy = updateData.easyQuestions !== undefined ? updateData.easyQuestions : exam.easyQuestions;
    const medium = updateData.mediumQuestions !== undefined ? updateData.mediumQuestions : exam.mediumQuestions;
    const hard = updateData.hardQuestions !== undefined ? updateData.hardQuestions : exam.hardQuestions;

    if (easy + medium + hard !== total) {
      return next(new AppError('Questions distribution must sum to total questions', 400));
    }
  }

  await exam.update(updateData);

  res.json({
    success: true,
    message: 'Exam updated successfully',
    data: { exam }
  });
});

// Delete exam
const deleteExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id);

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Check if exam has submissions
  const submissionsCount = await Answer.count({ where: { examId: id } });

  if (submissionsCount > 0) {
    return next(new AppError('Cannot delete exam with existing submissions', 400));
  }

  await exam.destroy();

  res.json({
    success: true,
    message: 'Exam deleted successfully'
  });
});

// Publish exam
const publishExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id);

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (exam.isPublished) {
    return next(new AppError('Exam is already published', 400));
  }

  // Check if enough questions available
  const [easyCount, mediumCount, hardCount] = await Promise.all([
    Question.count({ where: { subjectId: exam.subjectId, difficulty: 'easy', isActive: true } }),
    Question.count({ where: { subjectId: exam.subjectId, difficulty: 'medium', isActive: true } }),
    Question.count({ where: { subjectId: exam.subjectId, difficulty: 'hard', isActive: true } })
  ]);

  if (easyCount < exam.easyQuestions || mediumCount < exam.mediumQuestions || hardCount < exam.hardQuestions) {
    return next(new AppError('Not enough questions available to publish this exam', 400));
  }

  // Generate access code and publish
  exam.accessCode = generateAccessCode();
  exam.isPublished = true;
  exam.publishedAt = new Date();
  await exam.save();

  // Generate variations
  await generateExamVariations(exam);

  res.json({
    success: true,
    message: 'Exam published successfully',
    data: { exam, accessCode: exam.accessCode }
  });
});

// Unpublish exam
const unpublishExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id);

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (!exam.isPublished) {
    return next(new AppError('Exam is not published', 400));
  }

  // Check if exam has submissions
  const submissionsCount = await Answer.count({ where: { examId: id } });

  if (submissionsCount > 0) {
    return next(new AppError('Cannot unpublish exam with existing submissions', 400));
  }

  exam.isPublished = false;
  exam.publishedAt = null;
  await exam.save();

  res.json({
    success: true,
    message: 'Exam unpublished successfully',
    data: { exam }
  });
});

// Duplicate exam
const duplicateExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;

  const originalExam = await Exam.findByPk(id);

  if (!originalExam) {
    return next(new AppError('Exam not found', 404));
  }

  const duplicatedExam = await Exam.create({
    title: title || `${originalExam.title} (Copy)`,
    description: originalExam.description,
    subjectId: originalExam.subjectId,
    userId: req.user.id,
    totalQuestions: originalExam.totalQuestions,
    easyQuestions: originalExam.easyQuestions,
    mediumQuestions: originalExam.mediumQuestions,
    hardQuestions: originalExam.hardQuestions,
    totalVariations: originalExam.totalVariations,
    timeLimit: originalExam.timeLimit,
    passingScore: originalExam.passingScore,
    instructions: originalExam.instructions,
    allowReview: originalExam.allowReview,
    showCorrectAnswers: originalExam.showCorrectAnswers,
    randomizeQuestions: originalExam.randomizeQuestions,
    randomizeAlternatives: originalExam.randomizeAlternatives,
    maxAttempts: originalExam.maxAttempts,
    showResults: originalExam.showResults,
    requireFullScreen: originalExam.requireFullScreen,
    preventCopyPaste: originalExam.preventCopyPaste
  });

  res.status(201).json({
    success: true,
    message: 'Exam duplicated successfully',
    data: { exam: duplicatedExam }
  });
});

// Get exam variations
const getExamVariations = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const variations = await ExamVariation.findAll({
    where: { examId: id },
    order: [['variationNumber', 'ASC']],
    attributes: {
      include: [
        [
          ExamVariation.sequelize.literal(`(
            SELECT COUNT(*)
            FROM answers
            WHERE answers.variation_id = "ExamVariation".id
          )`),
          'submissionsCount'
        ]
      ]
    }
  });

  res.json({
    success: true,
    data: { variations }
  });
});

// Get exam analytics
const getExamAnalytics = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id);

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Get basic statistics
  const stats = await Answer.findAll({
    where: { examId: id },
    attributes: [
      [Answer.sequelize.fn('COUNT', Answer.sequelize.col('id')), 'totalSubmissions'],
      [Answer.sequelize.fn('AVG', Answer.sequelize.col('score')), 'averageScore'],
      [Answer.sequelize.fn('COUNT', Answer.sequelize.literal('CASE WHEN "isPassed" = true THEN 1 END')), 'passedCount']
    ],
    raw: true
  });

  const result = stats[0] || {};
  const totalSubmissions = parseInt(result.totalSubmissions) || 0;
  const passedCount = parseInt(result.passedCount) || 0;

  res.json({
    success: true,
    data: {
      examId: id,
      examTitle: exam.title,
      totalSubmissions,
      averageScore: result.averageScore ? parseFloat(result.averageScore).toFixed(2) : 0,
      passedCount,
      failedCount: totalSubmissions - passedCount,
      passRate: totalSubmissions > 0 ? ((passedCount / totalSubmissions) * 100).toFixed(2) : 0
    }
  });
});

// Download QR codes
const downloadQRCodes = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id, {
    include: [{ model: ExamVariation, as: 'variations', attributes: ['id', 'variationNumber', 'qrCode'] }]
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Return QR codes data
  res.json({
    success: true,
    data: {
      exam: { id: exam.id, title: exam.title },
      qrCodes: exam.variations.map(variation => ({
        variationNumber: variation.variationNumber,
        qrCode: variation.qrCode
      }))
    }
  });
});

// Helper function to generate exam variations
const generateExamVariations = async (exam) => {
  // Get questions for each difficulty
  const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
    Question.findAll({
      where: { subjectId: exam.subjectId, difficulty: 'easy', isActive: true },
      order: [Question.sequelize.random()],
      limit: Math.max(exam.easyQuestions * exam.totalVariations, exam.easyQuestions * 2)
    }),
    Question.findAll({
      where: { subjectId: exam.subjectId, difficulty: 'medium', isActive: true },
      order: [Question.sequelize.random()],
      limit: Math.max(exam.mediumQuestions * exam.totalVariations, exam.mediumQuestions * 2)
    }),
    Question.findAll({
      where: { subjectId: exam.subjectId, difficulty: 'hard', isActive: true },
      order: [Question.sequelize.random()],
      limit: Math.max(exam.hardQuestions * exam.totalVariations, exam.hardQuestions * 2)
    })
  ]);

  if (easyQuestions.length < exam.easyQuestions || 
      mediumQuestions.length < exam.mediumQuestions || 
      hardQuestions.length < exam.hardQuestions) {
    throw new AppError('Not enough questions available', 400);
  }

  // Create variations
  for (let i = 0; i < exam.totalVariations; i++) {
    // Select unique questions for this variation
    const selectedQuestions = [
      ...shuffleArray(easyQuestions).slice(0, exam.easyQuestions),
      ...shuffleArray(mediumQuestions).slice(0, exam.mediumQuestions),
      ...shuffleArray(hardQuestions).slice(0, exam.hardQuestions)
    ];

    // Shuffle final question order if required
    const finalQuestions = exam.randomizeQuestions ? 
      shuffleArray(selectedQuestions) : selectedQuestions;

    // Create variation
    const variation = await ExamVariation.create({
      examId: exam.id,
      variationNumber: i + 1
    });

    // Add questions to variation with order
    for (let j = 0; j < finalQuestions.length; j++) {
      await ExamQuestion.create({
        examId: exam.id,
        variationId: variation.id,
        questionId: finalQuestions[j].id,
        questionOrder: j
      });
    }

    // Generate QR code
    try {
      const qrResult = await qrService.generateExamQR(exam.id, variation.id, variation.variationNumber);
      variation.qrCode = qrResult.qrCode;
      await variation.save();
    } catch (error) {
      console.error('Error generating QR code for variation:', variation.id, error);
    }
  }
};

module.exports = {
  getPublicExams,
  getExamByAccessCode,
  getExamForTaking,
  getExams,
  getExamsStats,
  createExam,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  unpublishExam,
  duplicateExam,
  getExamVariations,
  getExamAnalytics,
  downloadQRCodes
};