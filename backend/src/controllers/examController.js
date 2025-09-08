const { Exam, ExamVariation, ExamQuestion, Question, Subject, Answer, ExamHeader } = require('../models');
const db = require('../models');
const { catchAsync, AppError } = require('../utils/appError');
const { paginate, buildPaginationMeta, generateAccessCode, shuffleArray } = require('../utils/helpers');
const { Op } = require('sequelize');
const pdfService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

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
      total: totalExams,
      published: publishedExams,
      drafts: totalExams - publishedExams,
      submissions: totalSubmissions,
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
    examHeaderId,
    questions = [], // Array of {id, points}
    variations = 1,
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
    title, description, subjectId, questions, variations
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
    examHeaderId: examHeaderId || null,
    userId: req.user.id,
    totalQuestions: questions.length,
    easyQuestions: difficultyCount.easy,
    mediumQuestions: difficultyCount.medium,
    hardQuestions: difficultyCount.hard,
    totalVariations: variations,
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
      },
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
            FROM exam_questions
            WHERE exam_questions."examId" = "Exam".id
          )`),
          'questionsCount'
        ]
      ]
    }
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  // Get questions from the first variation (to avoid duplicates)
  const firstVariation = await ExamVariation.findOne({
    where: { examId: id }
  });

  if (firstVariation) {
    const questions = await Question.findAll({
      include: [
        {
          model: ExamQuestion,
          as: 'examQuestions',
          where: { 
            examId: id,
            variationId: firstVariation.id
          },
          attributes: ['points', 'questionOrder']
        }
      ],
      attributes: ['id', 'title', 'text', 'type', 'difficulty', 'points', 'alternatives', 'correctAnswer'],
      order: [[{ model: ExamQuestion, as: 'examQuestions' }, 'questionOrder', 'ASC']]
    });

    // Format questions with ExamQuestion data
    exam.dataValues.questions = questions.map(q => ({
      ...q.dataValues,
      ExamQuestion: q.examQuestions[0]?.dataValues
    }));
  } else {
    exam.dataValues.questions = [];
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

// Generate answer sheet (gabarito)
const generateAnswerSheet = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const exam = await Exam.findByPk(id, {
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name']
      },
      {
        model: Question,
        as: 'questions',
        attributes: ['id', 'title', 'text', 'type', 'difficulty', 'alternatives'],
        through: {
          attributes: ['points', 'questionOrder']
        }
      },
      {
        model: ExamHeader,
        as: 'examHeader',
        attributes: ['schoolName', 'subjectName', 'year', 'instructions']
      }
    ]
  });

  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (exam.userId !== req.user.id) {
    return next(new AppError('Unauthorized', 403));
  }

  // Generate gabarito data
  const gabaritoData = {
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      totalQuestions: exam.totalQuestions,
      subject: exam.subject?.name || 'N/A'
    },
    examHeader: exam.examHeader || null,
    questions: exam.questions.map((question, index) => ({
      number: index + 1,
      id: question.id,
      text: question.text || question.title,
      type: question.type,
      difficulty: question.difficulty,
      points: question.ExamQuestion?.points || 1,
      alternatives: question.alternatives || [],
      hasAlternatives: question.alternatives && question.alternatives.length > 0
    })),
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email
    }
  };

  res.json({
    success: true,
    data: { gabarito: gabaritoData }
  });
});

// Validate and correct answers using QR code data
const validateQRAnswers = catchAsync(async (req, res, next) => {
  const { qrData, studentAnswers, studentInfo } = req.body;

  console.log('🔍 QR Correction - Received data:', {
    qrDataType: typeof qrData,
    answersCount: studentAnswers?.length,
    hasStudentInfo: !!studentInfo
  });

  if (!qrData || !studentAnswers || !Array.isArray(studentAnswers)) {
    return next(new AppError('Dados do QR code ou respostas inválidos', 400));
  }

  // Validate and parse QR code data
  const qrService = require('../services/qrService');
  const validation = qrService.validateAnswerKeyQR(qrData);
  
  if (!validation.valid) {
    return next(new AppError(`QR Code inválido: ${validation.message}`, 400));
  }

  const answerKeyData = validation.data;
  console.log('✅ QR Code validated:', {
    examId: answerKeyData.examId,
    variationId: answerKeyData.variationId,
    questionsCount: answerKeyData.answerKey?.length
  });

  // Verify exam exists
  const exam = await Exam.findByPk(answerKeyData.examId);
  if (!exam) {
    return next(new AppError('Prova não encontrada', 404));
  }

  // Check ownership
  if (exam.userId !== req.user.id) {
    return next(new AppError('Não autorizado para corrigir esta prova', 403));
  }

  // Perform correction using QR service
  try {
    const correctionResult = qrService.correctExam(answerKeyData, studentAnswers);
    
    console.log('✅ Correction completed:', {
      score: correctionResult.score,
      totalQuestions: correctionResult.totalQuestions,
      correctAnswers: correctionResult.results.filter(r => r.isCorrect).length
    });

    // Save correction result if student info provided
    if (studentInfo && (studentInfo.name || studentInfo.email || studentInfo.studentId)) {
      try {
        const correctionRecord = await Answer.create({
          examId: answerKeyData.examId,
          variationId: answerKeyData.variationId,
          studentName: studentInfo.name,
          studentEmail: studentInfo.email,
          studentId: studentInfo.studentId,
          answers: JSON.stringify(studentAnswers),
          score: correctionResult.score,
          earnedPoints: correctionResult.earnedPoints,
          totalPoints: correctionResult.totalPoints,
          isPassed: correctionResult.score >= (exam.passingScore || 6.0),
          submittedAt: new Date(),
          correctedAt: new Date(),
          metadata: {
            correctionMethod: 'qr_code',
            variationNumber: answerKeyData.variationNumber,
            qrCodeVersion: answerKeyData.version,
            correctedBy: req.user.id,
            correctionData: correctionResult
          }
        });
        
        console.log('✅ Correction result saved:', correctionRecord.id);
        correctionResult.savedRecord = {
          id: correctionRecord.id,
          studentName: correctionRecord.studentName
        };
      } catch (saveError) {
        console.warn('⚠️ Could not save correction record:', saveError.message);
      }
    }

    res.json({
      success: true,
      message: 'Correção realizada com sucesso via QR Code',
      data: {
        examTitle: exam.title,
        variationNumber: answerKeyData.variationNumber,
        studentInfo: studentInfo,
        ...correctionResult
      }
    });

  } catch (correctionError) {
    console.error('❌ Correction error:', correctionError);
    return next(new AppError(`Erro na correção: ${correctionError.message}`, 500));
  }
});

// Generate PDF with all exam variations
const generateAllVariationsPDF = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    console.log(`📊 Buscando exame: ${id}`);
    
    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name']
        },
        {
          model: ExamVariation,
          as: 'variations',
          include: [{
            model: ExamQuestion,
            as: 'examQuestions',
            required: false,
            include: [{
              model: Question,
              as: 'question',
              attributes: ['id', 'title', 'text', 'type', 'difficulty', 'alternatives', 'correctAnswer', 'points']
            }],
            order: [['questionOrder', 'ASC']]
          }],
          order: [['variationNumber', 'ASC']]
        },
        {
          model: ExamHeader,
          as: 'examHeader',
          attributes: ['schoolName', 'subjectName', 'year', 'instructions', 'evaluationCriteria']
        }
      ]
    });

    if (!exam) {
      console.log('❌ Exame não encontrado');
      return next(new AppError('Exam not found', 404));
    }

    if (exam.userId !== req.user.id) {
      console.log('❌ Usuário não autorizado');
      return next(new AppError('Unauthorized', 403));
    }

    console.log(`📊 Exame encontrado: ${exam.title}`);
    console.log(`📋 Variações encontradas: ${exam.variations?.length || 0}`);
    
    if (!exam.variations || exam.variations.length === 0) {
      console.log('❌ Nenhuma variação encontrada');
      return next(new AppError('Nenhuma variação encontrada para esta prova', 400));
    }

    // Verificar se pelo menos uma variação tem questões
    const variationsWithQuestions = exam.variations.filter(v => v.examQuestions && v.examQuestions.length > 0);
    console.log(`📋 Variações com questões: ${variationsWithQuestions.length}`);
    
    if (variationsWithQuestions.length === 0) {
      console.log('❌ Nenhuma variação com questões encontrada');
      return next(new AppError('Nenhuma variação com questões encontrada para esta prova', 400));
    }

    // Log detailed information about variations
    exam.variations.forEach((variation, index) => {
      console.log(`📝 Variação ${variation.variationNumber}: ${variation.examQuestions?.length || 0} questões`);
      if (variation.examQuestions && variation.examQuestions.length > 0) {
        variation.examQuestions.forEach((eq, qIndex) => {
          console.log(`  - Questão ${qIndex + 1}: ${eq.question?.id || 'ID não encontrado'} - ${eq.question?.title?.substring(0, 50) || 'Título não encontrado'}...`);
        });
      }
    });

    const timestamp = Date.now();
    const filename = `exam_all_variations_${exam.id}_${timestamp}.pdf`;
    const outputPath = path.join(process.cwd(), 'temp', filename);

    console.log(`📄 Gerando PDF: ${filename}`);
    console.log(`📍 Caminho: ${outputPath}`);

    // Ensure temp directory exists
    const tempDir = path.dirname(outputPath);
    if (!fs.existsSync(tempDir)) {
      console.log(`📁 Criando diretório: ${tempDir}`);
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Get layout parameter from query (default to 'single')
    const layout = req.query.layout === 'double' ? 'double' : 'single';
    console.log(`📊 Layout selecionado: ${layout}`);

    // Generate PDF with all variations
    console.log('🔄 Iniciando geração do PDF...');
    await pdfService.generateAllVariationsPDF(
      exam,
      variationsWithQuestions, // Use only variations that have questions
      exam.examHeader,
      outputPath,
      layout
    );
    console.log('✅ PDF gerado com sucesso');

    // Send file
    res.download(outputPath, filename, (err) => {
      if (err) {
        console.error('❌ Error sending PDF:', err);
        return next(new AppError('Erro ao enviar PDF', 500));
      }
      
      // Clean up file after sending
      setTimeout(() => {
        pdfService.cleanupTempFiles([outputPath]);
      }, 5000);
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PDF com todas as variações:', error);
    console.error('Stack trace:', error.stack);
    return next(new AppError(`Erro ao gerar PDF: ${error.message}`, 500));
  }
});

// Generate PDF for a single exam variation
const generateSingleVariationPDF = catchAsync(async (req, res, next) => {
  const { id, variationId } = req.params;

  try {
    console.log(`📊 Buscando exame: ${id}, variação: ${variationId}`);
    
    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name']
        },
        {
          model: ExamHeader,
          as: 'examHeader',
          attributes: ['schoolName', 'subjectName', 'year', 'instructions', 'evaluationCriteria']
        }
      ]
    });

    if (!exam) {
      console.log('❌ Exame não encontrado');
      return next(new AppError('Exam not found', 404));
    }

    if (exam.userId !== req.user.id) {
      console.log('❌ Usuário não autorizado');
      return next(new AppError('Unauthorized', 403));
    }

    // Get the specific variation with questions
    const variation = await ExamVariation.findOne({
      where: { id: variationId, examId: id },
      include: [{
        model: ExamQuestion,
        as: 'examQuestions',
        include: [{
          model: Question,
          as: 'question',
          attributes: ['id', 'title', 'text', 'type', 'difficulty', 'alternatives', 'correctAnswer', 'points']
        }],
        order: [['questionOrder', 'ASC']]
      }]
    });

    if (!variation) {
      console.log('❌ Variação não encontrada');
      return next(new AppError('Variation not found', 404));
    }

    if (!variation.examQuestions || variation.examQuestions.length === 0) {
      console.log('❌ Nenhuma questão encontrada na variação');
      console.log('🔄 Tentando regenerar variações do exame...');
      
      try {
        // Try to regenerate exam variations if they are empty
        if (exam.metadata && exam.metadata.selectedQuestions) {
          // Get the questions for this exam
          const questions = await Question.findAll({
            where: {
              id: exam.metadata.selectedQuestions.map(q => q.id)
            }
          });
          
          if (questions.length > 0) {
            console.log(`🔄 Regenerando variações com ${questions.length} questões...`);
            await generateExamVariationsWithSelectedQuestions(exam, questions);
            
            // Retry getting the variation
            const retryVariation = await ExamVariation.findOne({
              where: { id: variationId, examId: id },
              include: [{
                model: ExamQuestion,
                as: 'examQuestions',
                include: [{
                  model: Question,
                  as: 'question',
                  attributes: ['id', 'title', 'text', 'type', 'difficulty', 'alternatives', 'correctAnswer', 'points']
                }],
                order: [['questionOrder', 'ASC']]
              }]
            });
            
            if (retryVariation && retryVariation.examQuestions && retryVariation.examQuestions.length > 0) {
              console.log(`✅ Variação regenerada com ${retryVariation.examQuestions.length} questões`);
              // Update the variation reference
              Object.assign(variation, retryVariation.toJSON());
            }
          }
        }
        
        // Check again after regeneration attempt
        if (!variation.examQuestions || variation.examQuestions.length === 0) {
          return next(new AppError('Esta variação não possui questões. Por favor, regenere as variações da prova.', 400));
        }
      } catch (regenerationError) {
        console.error('❌ Erro ao regenerar variações:', regenerationError);
        return next(new AppError('Esta variação não possui questões. Por favor, regenere as variações da prova.', 400));
      }
    }

    console.log(`📝 Variação ${variation.variationNumber}: ${variation.examQuestions.length} questões`);

    const timestamp = Date.now();
    const filename = `exam_variation_${variation.variationNumber}_${exam.id}_${timestamp}.pdf`;
    const outputPath = path.join(process.cwd(), 'temp', filename);

    console.log(`📄 Gerando PDF: ${filename}`);
    console.log(`📍 Caminho: ${outputPath}`);

    // Ensure temp directory exists
    const tempDir = path.dirname(outputPath);
    if (!fs.existsSync(tempDir)) {
      console.log(`📁 Criando diretório: ${tempDir}`);
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate PDF for single variation
    console.log('🔄 Iniciando geração do PDF...');
    await pdfService.generateAllVariationsPDF(
      exam,
      [variation], // Array with single variation
      exam.examHeader,
      outputPath
    );
    console.log('✅ PDF gerado com sucesso');

    // Send file
    res.download(outputPath, filename, (err) => {
      if (err) {
        console.error('❌ Error sending PDF:', err);
        return next(new AppError('Erro ao enviar PDF', 500));
      }
      
      // Clean up file after sending
      setTimeout(() => {
        pdfService.cleanupTempFiles([outputPath]);
      }, 5000);
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PDF da variação:', error);
    console.error('Stack trace:', error.stack);
    return next(new AppError(`Erro ao gerar PDF: ${error.message}`, 500));
  }
});


// Helper function to generate exam variations with selected questions
const generateExamVariationsWithSelectedQuestions = async (exam, selectedQuestions) => {
  console.log('🔄 Generating variations for exam:', exam.id);
  console.log('📋 Selected questions:', selectedQuestions.map(q => ({ id: q.id, difficulty: q.difficulty })));
  console.log('📋 Exam metadata:', JSON.stringify(exam.metadata, null, 2));

  // Create variations
  for (let i = 0; i < exam.totalVariations; i++) {
    console.log(`🔄 Creating variation ${i + 1}/${exam.totalVariations}`);
    
    // Shuffle questions for this variation if randomization is enabled
    let questionsForVariation = [...selectedQuestions];
    if (exam.randomizeQuestions) {
      questionsForVariation = shuffleArray(questionsForVariation);
      console.log(`🔀 Questions shuffled for variation ${i + 1}`);
    }

    // Create variation
    const variation = await ExamVariation.create({
      examId: exam.id,
      variationNumber: i + 1
    });

    console.log('✅ Created variation:', variation.id, 'Number:', variation.variationNumber);

    // Add questions to variation with order and shuffled alternatives
    // Respect the totalQuestions limit configured for the exam
    const questionsToAdd = Math.min(questionsForVariation.length, exam.totalQuestions);
    console.log(`📊 Adding ${questionsToAdd} questions (limit: ${exam.totalQuestions}) to variation ${i + 1}`);
    
    for (let j = 0; j < questionsToAdd; j++) {
      const question = questionsForVariation[j];
      const selectedQuestion = exam.metadata?.selectedQuestions?.find(q => q.id === question.id);
      const points = selectedQuestion ? parseFloat(selectedQuestion.points) || 1.0 : 1.0;
      
      // Prepare shuffled alternatives for this question in this variation
      let shuffledAlternatives = null;
      if (exam.randomizeAlternatives && question.alternatives && question.alternatives.length > 0) {
        shuffledAlternatives = shuffleAlternativesAndUpdateAnswer(question.alternatives, question.correctAnswer);
        console.log(`🔀 Alternatives shuffled for question ${question.id} in variation ${variation.variationNumber}`);
      }
      
      await ExamQuestion.create({
        examId: exam.id,
        variationId: variation.id,
        questionId: question.id,
        questionOrder: j,
        points: points,
        shuffledAlternatives: shuffledAlternatives // Store shuffled alternatives for this variation
      });
      
      console.log(`✅ Added question ${question.id} to variation ${variation.variationNumber} at position ${j} with ${points} points`);
    }
  }
  
  console.log('✅ All variations created successfully');
};

/**
 * Helper function to shuffle alternatives and update correct answer index
 * @param {Array} alternatives - Original alternatives array
 * @param {number} correctAnswerIndex - Index of correct answer (0-based)
 * @returns {Object} - Object with shuffled alternatives and new correct answer index
 */
const shuffleAlternativesAndUpdateAnswer = (alternatives, correctAnswerIndex) => {
  if (!alternatives || alternatives.length === 0 || correctAnswerIndex === undefined) {
    return null;
  }

  // Create array with alternatives and their original indices
  const indexedAlternatives = alternatives.map((alt, index) => ({
    text: alt,
    originalIndex: index
  }));

  // Shuffle the indexed alternatives
  const shuffled = shuffleArray(indexedAlternatives);

  // Find new position of correct answer
  const newCorrectAnswerIndex = shuffled.findIndex(item => item.originalIndex === correctAnswerIndex);

  return {
    alternatives: shuffled.map(item => item.text),
    correctAnswer: newCorrectAnswerIndex,
    originalCorrectAnswer: correctAnswerIndex
  };
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

  // Check if exam has selected questions in metadata
  if (!exam.metadata || !exam.metadata.selectedQuestions || exam.metadata.selectedQuestions.length === 0) {
    return next(new AppError('No selected questions found in exam. Please update the exam first.', 400));
  }

  // Get the selected questions from the database
  const selectedQuestions = await Question.findAll({
    where: {
      id: exam.metadata.selectedQuestions.map(q => q.id)
    }
  });

  if (selectedQuestions.length === 0) {
    return next(new AppError('Selected questions not found in database.', 400));
  }

  console.log(`🔄 Regenerating variations for exam ${id} with ${selectedQuestions.length} questions`);

  // Generate new variations using the selected questions
  await generateExamVariationsWithSelectedQuestions(exam, selectedQuestions);

  res.json({
    success: true,
    message: 'Exam variations regenerated successfully',
    data: { questionsCount: selectedQuestions.length }
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

// Manual correction function
const correctExamManually = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { submissionId, corrections } = req.body;

  if (!submissionId || !corrections || !Array.isArray(corrections)) {
    return next(new AppError('Submission ID and corrections array are required', 400));
  }

  // Find the answer/submission
  const answer = await Answer.findOne({
    where: { id: submissionId, examId: id }
  });

  if (!answer) {
    return next(new AppError('Submission not found', 404));
  }

  // Calculate new score based on manual corrections
  let totalScore = 0;
  let totalPoints = 0;

  corrections.forEach(correction => {
    totalPoints += parseFloat(correction.maxPoints || 1);
    totalScore += parseFloat(correction.earnedPoints || 0);
  });

  const finalScore = totalPoints > 0 ? (totalScore / totalPoints) * 10 : 0;

  // Update the answer with manual correction data
  await answer.update({
    score: parseFloat(finalScore.toFixed(2)),
    isPassed: finalScore >= (answer.exam?.passingScore || 6),
    metadata: {
      ...answer.metadata,
      correctionMethod: 'manual',
      manualCorrections: corrections,
      correctedAt: new Date().toISOString(),
      correctedBy: req.user.id
    }
  });

  res.json({
    success: true,
    message: 'Exam corrected manually',
    data: {
      submissionId,
      newScore: finalScore,
      totalScore,
      totalPoints,
      corrections
    }
  });
});

// Update exam questions
const updateExamQuestions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { questions } = req.body;

  console.log(`📝 Updating questions for exam ${id}:`, questions);

  // Verify exam exists and belongs to user
  const exam = await Exam.findByPk(id);
  if (!exam) {
    return next(new AppError('Exam not found', 404));
  }

  if (exam.userId !== req.user.id) {
    return next(new AppError('Unauthorized to update this exam', 403));
  }

  try {
    // Get existing variations for this exam
    const variations = await ExamVariation.findAll({
      where: { examId: id }
    });

    if (variations.length === 0) {
      return next(new AppError('No exam variations found. Please generate variations first.', 400));
    }

    // Remove all existing questions for this exam
    await ExamQuestion.destroy({
      where: { examId: id }
    });

    // Add new questions to ALL variations
    if (questions && questions.length > 0) {
      const examQuestionsToCreate = [];
      
      for (const variation of variations) {
        for (const q of questions) {
          examQuestionsToCreate.push({
            examId: id,
            variationId: variation.id,
            questionId: q.questionId,
            questionOrder: q.questionOrder || 0,
            points: q.points || 1
          });
        }
      }

      await ExamQuestion.bulkCreate(examQuestionsToCreate);
    }

    // Calculate difficulty distribution from actual questions
    let easyCount = 0;
    let mediumCount = 0; 
    let hardCount = 0;
    
    if (questions && questions.length > 0) {
      // Get question details to calculate difficulty distribution
      const questionIds = questions.map(q => q.questionId);
      const questionDetails = await Question.findAll({
        where: { id: questionIds },
        attributes: ['id', 'difficulty']
      });
      
      const difficultyMap = {};
      questionDetails.forEach(q => {
        difficultyMap[q.id] = q.difficulty;
      });
      
      // Count questions by difficulty
      questions.forEach(q => {
        const difficulty = difficultyMap[q.questionId];
        switch (difficulty) {
          case 'Easy':
          case 'easy':
            easyCount++;
            break;
          case 'Medium':  
          case 'medium':
            mediumCount++;
            break;
          case 'Hard':
          case 'hard':
            hardCount++;
            break;
          default:
            // Default to easy if difficulty is not set
            easyCount++;
            break;
        }
      });
    }

    // Get full question details for metadata
    const questionIds = questions?.map(q => q.questionId) || [];
    const questionDetails = await Question.findAll({
      where: { id: questionIds },
      attributes: ['id', 'title', 'text', 'difficulty', 'type', 'points']
    });

    // Create selectedQuestions metadata
    const selectedQuestionsMetadata = questions?.map(q => {
      const questionDetail = questionDetails.find(qd => qd.id === q.questionId);
      return {
        id: q.questionId,
        title: questionDetail?.title || (questionDetail?.text?.substring(0, 50) ? questionDetail.text.substring(0, 50) + '...' : 'Questão sem título'),
        difficulty: questionDetail?.difficulty || 'medium',
        type: questionDetail?.type || 'multiple_choice',
        points: q.points || questionDetail?.points || 1,
        questionOrder: q.questionOrder || 0
      };
    }) || [];

    // Update exam with correct totals, distribution, and metadata
    await exam.update({
      totalQuestions: questions?.length || 0,
      easyQuestions: easyCount,
      mediumQuestions: mediumCount,
      hardQuestions: hardCount,
      metadata: {
        ...exam.metadata,
        selectedQuestions: selectedQuestionsMetadata
      }
    });

    console.log(`✅ Successfully updated ${questions?.length || 0} questions for exam ${id}`);

    res.json({
      success: true,
      message: 'Exam questions updated successfully',
      data: {
        examId: id,
        questionsCount: questions?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Error updating exam questions:', error);
    return next(new AppError('Failed to update exam questions', 500));
  }
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
  bulkGradeExam,
  generateAnswerSheet,
  validateQRAnswers,
  generateAllVariationsPDF,
  generateSingleVariationPDF,
  correctExamManually,
  updateExamQuestions
};