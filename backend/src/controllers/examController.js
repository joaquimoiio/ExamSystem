const { Exam, ExamVariation, ExamQuestion, Question, Subject, Answer, ExamHeader } = require('../models');
const db = require('../models');
const { catchAsync, AppError } = require('../utils/appError');
const { paginate, buildPaginationMeta, generateAccessCode, shuffleArray } = require('../utils/helpers');
const { Op } = require('sequelize');
const pdfService = require('../services/pdfService');
const path = require('path');

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
        attributes: ['id', 'variationNumber']
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
            WHERE answers."examId" = "Exam".id
          )`),
          'submissionsCount'
        ],
        [
          Exam.sequelize.literal(`(
            SELECT COUNT(*)
            FROM exam_variations
            WHERE exam_variations."examId" = "Exam".id
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
            WHERE answers."examId" = "Exam".id
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
  console.log('📝 CreateExam - Dados recebidos:', JSON.stringify(req.body, null, 2));
  
  const {
    title,
    description,
    subjectId,
    questions = [], // Array of {id, points}
    variations = 1,
    duration = 60,
    instructions,
    shuffleQuestions = true,
    shuffleAlternatives = true,
    allowReview = true,
    showResults = true,
    maxAttempts = 1,
    passingScore = 6.0,
    requireFullScreen = false,
    preventCopyPaste = false
  } = req.body;
  
  console.log('📝 Parsed data:', {
    title, description, subjectId, questions, variations, duration
  });

  // Validate subject exists and belongs to user
  const subject = await Subject.findOne({
    where: { id: subjectId, userId: req.user.id }
  });

  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  // Validate questions array
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return next(new AppError('At least one question must be selected', 400));
  }

  if (questions.length > 50) {
    return next(new AppError('Maximum 50 questions per exam', 400));
  }

  // Validate that all questions exist and belong to the subject
  const questionIds = questions.map(q => q.id);
  const existingQuestions = await Question.findAll({
    where: {
      id: questionIds,
      subjectId,
      isActive: true
    }
  });

  if (existingQuestions.length !== questions.length) {
    return next(new AppError('Some selected questions are invalid or not available', 400));
  }

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + (parseFloat(q.points) || 1.0), 0);

  // Calculate difficulty distribution based on selected questions
  const difficultyCount = {
    easy: 0,
    medium: 0,
    hard: 0
  };

  existingQuestions.forEach(q => {
    if (q.difficulty === 'easy') difficultyCount.easy++;
    else if (q.difficulty === 'medium') difficultyCount.medium++;
    else if (q.difficulty === 'hard') difficultyCount.hard++;
  });

  // Create exam with the selected questions and their individual points
  const exam = await Exam.create({
    title: title.trim(),
    description: description?.trim(),
    subjectId,
    userId: req.user.id,
    totalQuestions: questions.length,
    easyQuestions: difficultyCount.easy,
    mediumQuestions: difficultyCount.medium,
    hardQuestions: difficultyCount.hard,
    totalVariations: variations,
    timeLimit: duration,
    totalPoints, // Store total points
    passingScore,
    instructions: instructions?.trim(),
    allowReview,
    showCorrectAnswers: showResults,
    randomizeQuestions: shuffleQuestions,
    randomizeAlternatives: shuffleAlternatives,
    maxAttempts,
    showResults,
    requireFullScreen,
    preventCopyPaste,
    // Store selected questions with their points in metadata
    metadata: {
      selectedQuestions: questions
    }
  });

  // Generate exam variations with the selected questions
  await generateExamVariationsWithSelectedQuestions(exam, existingQuestions);

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
        attributes: ['id', 'variationNumber']
      }
    ],
    attributes: {
      include: [
        [
          Exam.sequelize.literal(`(
            SELECT COUNT(*)
            FROM answers
            WHERE answers."examId" = "Exam".id
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

  console.log(`🗑️ Iniciando exclusão da prova: ${id}`);

  const exam = await Exam.findByPk(id);

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Check ownership
  if (exam.userId !== req.user.id) {
    return next(new AppError('Not authorized to delete this exam', 403));
  }

  // Check if exam has submissions
  const submissionsCount = await Answer.count({ where: { examId: id } });

  if (submissionsCount > 0) {
    console.log(`❌ Não é possível excluir prova com ${submissionsCount} respostas`);
    return next(new AppError('Cannot delete exam with existing submissions', 400));
  }

  try {
    // Start transaction for safe deletion
    await db.sequelize.transaction(async (transaction) => {
      console.log('🔄 Iniciando transação para exclusão');

      // 1. Delete exam questions (exam_questions table)
      const deletedQuestions = await ExamQuestion.destroy({
        where: { examId: id },
        transaction
      });
      console.log(`✅ ${deletedQuestions} registros de exam_questions excluídos`);

      // 2. Delete exam variations (exam_variations table)
      const deletedVariations = await ExamVariation.destroy({
        where: { examId: id },
        transaction
      });
      console.log(`✅ ${deletedVariations} variações excluídas`);

      // 3. Delete the exam itself
      await exam.destroy({ transaction });
      console.log(`✅ Prova ${id} excluída com sucesso`);
    });

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });

  } catch (error) {
    console.error('❌ Erro ao excluir prova:', error);
    return next(new AppError('Error deleting exam: ' + error.message, 500));
  }
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
            WHERE answers."variationId" = "ExamVariation".id
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


// Helper function to generate exam variations with selected questions
const generateExamVariationsWithSelectedQuestions = async (exam, selectedQuestions) => {
  console.log('🔄 Generating variations for exam:', exam.id);
  console.log('📋 Selected questions:', selectedQuestions.map(q => ({ id: q.id, difficulty: q.difficulty })));

  // Create variations
  for (let i = 0; i < exam.totalVariations; i++) {
    console.log(`🔄 Creating variation ${i + 1}/${exam.totalVariations}`);
    
    // Shuffle questions for this variation if randomization is enabled
    let questionsForVariation = [...selectedQuestions];
    if (exam.randomizeQuestions) {
      questionsForVariation = shuffleArray(questionsForVariation);
    }

    // Create variation
    const variation = await ExamVariation.create({
      examId: exam.id,
      variationNumber: i + 1
    });

    console.log('✅ Created variation:', variation.id, 'Number:', variation.variationNumber);

    // Add questions to variation with order
    for (let j = 0; j < questionsForVariation.length; j++) {
      const question = questionsForVariation[j];
      const selectedQuestion = exam.metadata.selectedQuestions.find(q => q.id === question.id);
      const points = selectedQuestion ? parseFloat(selectedQuestion.points) || 1.0 : 1.0;
      
      await ExamQuestion.create({
        examId: exam.id,
        variationId: variation.id,
        questionId: question.id,
        questionOrder: j,
        points: points
      });
      
      console.log(`✅ Added question ${question.id} to variation ${variation.variationNumber} at position ${j} with ${points} points`);
    }
  }
  
  console.log('✅ All variations created successfully');
};

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

  }
};

// Get recent exams
const getRecentExams = catchAsync(async (req, res, next) => {
  const recentExams = await Exam.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 10,
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['name', 'color']
      }
    ],
    attributes: {
      include: [
        [
          Exam.sequelize.literal(`(
            SELECT COUNT(*)
            FROM answers
            WHERE answers."examId" = "Exam".id
          )`),
          'submissionsCount'
        ]
      ]
    }
  });

  res.json({
    success: true,
    data: { exams: recentExams }
  });
});

// Get specific exam variation
const getExamVariation = catchAsync(async (req, res, next) => {
  const { id, variationId } = req.params;

  const variation = await ExamVariation.findOne({
    where: { id: variationId, examId: id }
  });

  if (!variation) {
    return next(new AppError('Variation not found', 404));
  }

  // Get questions for this variation through ExamQuestion
  const questions = await variation.getQuestionsWithOrder();

  res.json({
    success: true,
    data: { 
      variation: {
        ...variation.toJSON(),
        questions
      }
    }
  });
});

// Get exam answers/submissions
const getExamAnswers = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const { count, rows: answers } = await Answer.findAndCountAll({
    where: { examId: id },
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
    data: { answers, pagination }
  });
});

// Export exam results
const exportExamResults = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { format = 'json' } = req.body;

  const answers = await Answer.findAll({
    where: { examId: id },
    include: [
      {
        model: ExamVariation,
        as: 'variation',
        attributes: ['variationNumber']
      }
    ],
    order: [['submittedAt', 'DESC']]
  });

  res.json({
    success: true,
    message: `Export in ${format} format ready`,
    data: { 
      answers: answers.map(answer => ({
        studentName: answer.studentName,
        studentEmail: answer.studentEmail,
        score: answer.score,
        isPassed: answer.isPassed,
        submittedAt: answer.submittedAt,
        variation: answer.variation?.variationNumber
      })),
      format,
      count: answers.length
    }
  });
});

// Generate exam report
const generateExamReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id, {
    include: [
      { model: Subject, as: 'subject', attributes: ['name'] }
    ]
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Basic report data
  const submissionsCount = await Answer.count({ where: { examId: id } });
  
  res.json({
    success: true,
    message: 'Report generated successfully',
    data: {
      exam: {
        title: exam.title,
        subject: exam.subject.name,
        totalSubmissions: submissionsCount,
        generatedAt: new Date()
      }
    }
  });
});

// Bulk grade exam submissions
const bulkGradeExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { action = 'auto-grade' } = req.body;

  res.json({
    success: true,
    message: `Bulk grading (${action}) functionality to be implemented`,
    data: { examId: id }
  });
});

// Regenerate variations
const regenerateVariations = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id);

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Delete existing variations
  await ExamVariation.destroy({ where: { examId: id } });
  await ExamQuestion.destroy({ where: { examId: id } });

  // Generate new variations
  await generateExamVariations(exam);

  res.json({
    success: true,
    message: 'Exam variations regenerated successfully'
  });
});

// Generate exam PDF with QR codes
const generateExamPDF = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { variationId, examHeaderId } = req.body;

  const exam = await Exam.findByPk(id, {
    include: [{ model: Subject, as: 'subject', attributes: ['name'] }]
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Get variation
  const variation = await ExamVariation.findByPk(variationId);
  if (!variation) {
    return next(new AppError('Variation not found', 404));
  }

  // Get questions for this variation
  const questions = await variation.getQuestionsWithOrder();

  // Get exam header
  let examHeader;
  if (examHeaderId) {
    examHeader = await ExamHeader.findByPk(examHeaderId);
  } else {
    // Get default header
    examHeader = await ExamHeader.findOne({ where: { isDefault: true } });
  }

  if (!examHeader) {
    return next(new AppError('Exam header not found', 404));
  }

  // Generate PDF
  const filename = `exam_${exam.id}_variation_${variation.variationNumber}.pdf`;
  const outputPath = path.join(__dirname, '../uploads/temp', filename);

  // Ensure temp directory exists
  pdfService.ensureOutputDir(outputPath);

  await pdfService.generateExamPDF(exam, variation, questions, examHeader, outputPath);

  // Send file
  res.download(outputPath, filename, (err) => {
    if (err) {
      console.error('Error sending PDF:', err);
    }
    // Clean up file after sending
    setTimeout(() => {
      pdfService.cleanupTempFiles([outputPath]);
    }, 5000);
  });
});

// Generate all exam variations PDFs
const generateAllExamPDFs = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { examHeaderId } = req.body;

  const exam = await Exam.findByPk(id, {
    include: [{ model: Subject, as: 'subject', attributes: ['name'] }]
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Get all variations
  const variations = await ExamVariation.findAll({
    where: { examId: id },
    order: [['variationNumber', 'ASC']]
  });

  if (variations.length === 0) {
    return next(new AppError('No variations found for this exam', 404));
  }

  // Get exam header
  let examHeader;
  if (examHeaderId) {
    examHeader = await ExamHeader.findByPk(examHeaderId);
  } else {
    examHeader = await ExamHeader.findOne({ where: { isDefault: true } });
  }

  if (!examHeader) {
    return next(new AppError('Exam header not found', 404));
  }

  // Generate single PDF with all variations
  const filename = `exam_${exam.id}_all_variations.pdf`;
  const outputPath = path.join(__dirname, '../uploads/temp', filename);

  // Ensure temp directory exists
  pdfService.ensureOutputDir(outputPath);

  await pdfService.generateAllVariationsPDF(exam, variations, examHeader, outputPath);

  // Send file
  res.download(outputPath, filename, (err) => {
    if (err) {
      console.error('Error sending PDF:', err);
    }
    // Clean up file after sending
    setTimeout(() => {
      pdfService.cleanupTempFiles([outputPath]);
    }, 5000);
  });
});

module.exports = {
  getPublicExams,
  getExamByAccessCode,
  getExamForTaking,
  getExams,
  getExamsStats,
  getRecentExams,
  createExam,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  unpublishExam,
  duplicateExam,
  regenerateVariations,
  getExamVariations,
  getExamVariation,
  getExamAnswers,
  getExamAnalytics,
  exportExamResults,
  generateExamReport,
  generateExamPDF,
  generateAllExamPDFs,
  bulkGradeExam
};