const { Exam, ExamVariation, Question, Subject, Answer, ExamQuestion } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const pdfService = require('../services/pdfService');
const qrService = require('../services/qrService');

// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate variation letters (A, B, C, D, E, etc.)
const generateVariationLetter = (index) => {
  return String.fromCharCode(65 + index); // A=65, B=66, etc.
};

// Get all exams for the authenticated user
const getExams = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    subjectId, 
    isPublished, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;
  
  const userId = req.user.id;
  const offset = (page - 1) * limit;

  const whereClause = { userId, isActive: true };

  // Filter by subject
  if (subjectId) {
    whereClause.subjectId = subjectId;
  }

  // Filter by published status
  if (isPublished !== undefined) {
    whereClause.isPublished = isPublished === 'true';
  }

  // Search in title or description
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const validSortFields = ['createdAt', 'updatedAt', 'title', 'totalQuestions'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

  const { count, rows: exams } = await Exam.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      },
      {
        model: ExamVariation,
        as: 'variations',
        attributes: ['id', 'variationNumber', 'variationLetter']
      }
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortField, sortDirection]]
  });

  // Get statistics for each exam
  const examsWithStats = await Promise.all(
    exams.map(async (exam) => {
      const stats = await exam.getStatistics();
      return {
        ...exam.toJSON(),
        statistics: stats
      };
    })
  );

  res.json({
    success: true,
    data: {
      exams: examsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get a single exam by ID
const getExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId },
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      },
      {
        model: ExamVariation,
        as: 'variations',
        attributes: ['id', 'variationNumber', 'variationLetter', 'qrCode', 'createdAt']
      },
      {
        model: Question,
        as: 'questions',
        through: { attributes: ['order', 'points'] },
        attributes: ['id', 'text', 'difficulty']
      }
    ]
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  const statistics = await exam.getStatistics();

  res.json({
    success: true,
    data: {
      exam: {
        ...exam.toJSON(),
        statistics
      }
    }
  });
});

// Create a new exam with intelligent variation generation
const createExam = catchAsync(async (req, res) => {
  const {
    title,
    description,
    subjectId,
    totalQuestions,
    easyQuestions,
    mediumQuestions,
    hardQuestions,
    totalVariations,
    timeLimit,
    passingScore,
    instructions,
    allowReview,
    showCorrectAnswers,
    randomizeQuestions,
    randomizeAlternatives,
    expiresAt
  } = req.body;

  const userId = req.user.id;

  // Verify user owns the subject
  const subject = await Subject.findOne({
    where: { id: subjectId, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Check if subject has enough questions
  const canCreate = await subject.canCreateExam({
    easyQuestions,
    mediumQuestions,
    hardQuestions
  });

  if (!canCreate.canCreate) {
    return res.status(400).json({
      success: false,
      message: 'Not enough questions available in the subject',
      data: {
        required: canCreate.required,
        available: canCreate.available
      }
    });
  }

  // Create the exam
  const exam = await Exam.create({
    title,
    description,
    subjectId,
    totalQuestions,
    easyQuestions,
    mediumQuestions,
    hardQuestions,
    totalVariations,
    timeLimit,
    passingScore,
    instructions,
    allowReview,
    showCorrectAnswers,
    randomizeQuestions,
    randomizeAlternatives,
    expiresAt,
    userId
  });

  // Generate exam variations
  const variations = await generateExamVariations(exam, subject);

  // Include variations in response
  const examWithVariations = await Exam.findByPk(exam.id, {
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      },
      {
        model: ExamVariation,
        as: 'variations',
        attributes: ['id', 'variationNumber', 'variationLetter', 'qrCode']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Exam and variations created successfully',
    data: {
      exam: examWithVariations.toJSON(),
      variationsGenerated: variations.length
    }
  });
});

// CORE ALGORITHM: Generate exam variations with intelligent question shuffling
const generateExamVariations = async (exam, subject) => {
  try {
    // Get questions by difficulty
    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      Question.findAll({
        where: { 
          subjectId: exam.subjectId, 
          userId: exam.userId, 
          difficulty: 'easy', 
          isActive: true 
        },
        order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']]
      }),
      Question.findAll({
        where: { 
          subjectId: exam.subjectId, 
          userId: exam.userId, 
          difficulty: 'medium', 
          isActive: true 
        },
        order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']]
      }),
      Question.findAll({
        where: { 
          subjectId: exam.subjectId, 
          userId: exam.userId, 
          difficulty: 'hard', 
          isActive: true 
        },
        order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']]
      })
    ]);

    const variations = [];

    for (let i = 0; i < exam.totalVariations; i++) {
      // Select questions for this variation
      const selectedEasy = shuffleArray(easyQuestions).slice(0, exam.easyQuestions);
      const selectedMedium = shuffleArray(mediumQuestions).slice(0, exam.mediumQuestions);
      const selectedHard = shuffleArray(hardQuestions).slice(0, exam.hardQuestions);

      // Combine all selected questions
      let allQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];

      // Shuffle questions if randomizeQuestions is enabled
      if (exam.randomizeQuestions) {
        allQuestions = shuffleArray(allQuestions);
      }

      // Process each question for this variation
      const variationQuestions = allQuestions.map((question, index) => {
        let alternatives = [...question.alternatives];
        let correctAnswer = question.correctAnswer;

        // Shuffle alternatives if randomizeAlternatives is enabled
        if (exam.randomizeAlternatives) {
          const shuffleResult = question.shuffleAlternatives();
          alternatives = shuffleResult.alternatives;
          correctAnswer = shuffleResult.correctAnswer;
        }

        return {
          id: question.id,
          order: index + 1,
          text: question.text,
          alternatives,
          correctAnswer,
          difficulty: question.difficulty,
          tags: question.tags
        };
      });

      // Generate answer key for this variation
      const answerKey = variationQuestions.map(q => ({
        questionId: q.id,
        correctAnswer: q.correctAnswer,
        order: q.order
      }));

      // Generate QR code for this variation
      const variationLetter = generateVariationLetter(i);
      const qrData = await qrService.generateExamVariationQR(exam.id, `temp_${i}`);

      // Create variation
      const variation = await ExamVariation.create({
        examId: exam.id,
        variationNumber: i + 1,
        variationLetter,
        questions: variationQuestions,
        qrCode: qrData.qrCode,
        answerKey
      });

      // Update QR code with actual variation ID
      const updatedQrData = await qrService.generateExamVariationQR(exam.id, variation.id);
      await variation.update({ qrCode: updatedQrData.qrCode });

      variations.push(variation);

      // Update question usage count
      await Promise.all(
        allQuestions.map(question => question.incrementUsage())
      );
    }

    // Create ExamQuestion associations for tracking
    const examQuestions = [];
    const allUniqueQuestions = [...new Set(
      variations.flatMap(v => v.questions.map(q => q.id))
    )];

    allUniqueQuestions.forEach((questionId, index) => {
      examQuestions.push({
        examId: exam.id,
        questionId,
        order: index + 1,
        points: 1.0,
        weight: 1.0
      });
    });

    await ExamQuestion.bulkCreate(examQuestions);

    return variations;
  } catch (error) {
    console.error('Error generating exam variations:', error);
    throw new AppError('Failed to generate exam variations', 500);
  }
};

// Update an exam
const updateExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    timeLimit,
    passingScore,
    instructions,
    allowReview,
    showCorrectAnswers,
    expiresAt,
    isActive
  } = req.body;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId }
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if exam is published and has submissions
  if (exam.isPublished) {
    const submissionCount = await Answer.count({ where: { examId: id } });
    if (submissionCount > 0) {
      // Only allow limited updates for published exams with submissions
      const allowedUpdates = { description, instructions, allowReview, expiresAt };
      const restrictedFields = Object.keys(req.body).filter(
        key => !Object.keys(allowedUpdates).includes(key) && req.body[key] !== undefined
      );
      
      if (restrictedFields.length > 0) {
        throw new AppError(
          `Cannot modify ${restrictedFields.join(', ')} for published exam with submissions`,
          400
        );
      }
    }
  }

  await exam.update({
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(timeLimit && { timeLimit }),
    ...(passingScore && { passingScore }),
    ...(instructions !== undefined && { instructions }),
    ...(allowReview !== undefined && { allowReview }),
    ...(showCorrectAnswers !== undefined && { showCorrectAnswers }),
    ...(expiresAt && { expiresAt }),
    ...(isActive !== undefined && { isActive })
  });

  res.json({
    success: true,
    message: 'Exam updated successfully',
    data: {
      exam: exam.toJSON()
    }
  });
});

// Publish an exam
const publishExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId },
    include: [
      {
        model: ExamVariation,
        as: 'variations'
      }
    ]
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  if (exam.variations.length === 0) {
    throw new AppError('Cannot publish exam without variations', 400);
  }

  await exam.publish();

  res.json({
    success: true,
    message: 'Exam published successfully',
    data: {
      exam: exam.toJSON()
    }
  });
});

// Unpublish an exam
const unpublishExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId }
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  await exam.unpublish();

  res.json({
    success: true,
    message: 'Exam unpublished successfully',
    data: {
      exam: exam.toJSON()
    }
  });
});

// Delete an exam
const deleteExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId }
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if exam has submissions
  const submissionCount = await Answer.count({ where: { examId: id } });
  
  if (submissionCount > 0) {
    // Soft delete to preserve data
    await exam.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Exam deactivated successfully (has submissions)'
    });
  } else {
    // Hard delete if no submissions
    await exam.destroy();
    
    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  }
});

// Generate PDFs for all exam variations
const generateExamPDFs = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { includeAnswerKey = false, customHeader } = req.body;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId },
    include: [
      {
        model: Subject,
        as: 'subject'
      },
      {
        model: ExamVariation,
        as: 'variations'
      }
    ]
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  if (exam.variations.length === 0) {
    throw new AppError('No variations found for this exam', 400);
  }

  const pdfResults = [];

  // Generate PDF for each variation
  for (const variation of exam.variations) {
    try {
      const pdfResult = await pdfService.generateExamPDF(exam, variation, {
        includeAnswerKey,
        customHeader
      });
      
      // Update variation with PDF path
      await variation.update({ pdfPath: pdfResult.filepath });
      
      pdfResults.push({
        variationId: variation.id,
        variationLetter: variation.variationLetter,
        ...pdfResult
      });
    } catch (error) {
      console.error(`Error generating PDF for variation ${variation.variationLetter}:`, error);
      pdfResults.push({
        variationId: variation.id,
        variationLetter: variation.variationLetter,
        error: error.message
      });
    }
  }

  // Generate answer key PDF if requested
  let answerKeyPDF = null;
  if (includeAnswerKey) {
    try {
      answerKeyPDF = await pdfService.generateAnswerKeyPDF(exam, exam.variations);
    } catch (error) {
      console.error('Error generating answer key PDF:', error);
    }
  }

  res.json({
    success: true,
    message: 'PDFs generated successfully',
    data: {
      examPDFs: pdfResults,
      answerKeyPDF,
      totalVariations: exam.variations.length,
      successfulPDFs: pdfResults.filter(p => !p.error).length
    }
  });
});

// Get exam by QR code (for student access)
const getExamByQR = catchAsync(async (req, res) => {
  const { qrCode } = req.params;

  // Extract exam data from QR code
  const examData = qrService.extractExamData(qrCode);
  
  if (!examData) {
    throw new AppError('Invalid QR code', 400);
  }

  const variation = await ExamVariation.findOne({
    where: { 
      id: examData.variationId,
      qrCode 
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
    throw new AppError('Exam is not available for taking', 400);
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
        // Note: correctAnswer is not included
      }))
    }
  };

  res.json({
    success: true,
    data: {
      exam: examForStudent
    }
  });
});

// Regenerate exam variations
const regenerateVariations = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId },
    include: [
      {
        model: Subject,
        as: 'subject'
      }
    ]
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  if (exam.isPublished) {
    throw new AppError('Cannot regenerate variations for published exam', 400);
  }

  // Check if exam has submissions
  const submissionCount = await Answer.count({ where: { examId: id } });
  if (submissionCount > 0) {
    throw new AppError('Cannot regenerate variations for exam with submissions', 400);
  }

  // Delete existing variations
  await ExamVariation.destroy({ where: { examId: id } });
  await ExamQuestion.destroy({ where: { examId: id } });

  // Generate new variations
  const variations = await generateExamVariations(exam, exam.subject);

  res.json({
    success: true,
    message: 'Exam variations regenerated successfully',
    data: {
      variationsGenerated: variations.length,
      variations: variations.map(v => ({
        id: v.id,
        variationNumber: v.variationNumber,
        variationLetter: v.variationLetter,
        qrCode: v.qrCode
      }))
    }
  });
});

// Get exam statistics
const getExamStatistics = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const exam = await Exam.findOne({
    where: { id, userId },
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name']
      },
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

  // Get overall exam statistics
  const examStats = await exam.getStatistics();

  // Get statistics by variation
  const variationStats = await Promise.all(
    exam.variations.map(async (variation) => {
      const stats = await variation.getStatistics();
      return stats;
    })
  );

  // Get question performance statistics
  const questionStats = await Answer.findAll({
    where: { examId: id },
    attributes: [],
    include: [
      {
        model: ExamVariation,
        as: 'examVariation',
        attributes: ['questions']
      }
    ],
    raw: true
  });

  // Analyze question performance
  const questionPerformance = {};
  questionStats.forEach(answer => {
    if (answer['examVariation.questions']) {
      const questions = JSON.parse(answer['examVariation.questions']);
      questions.forEach(q => {
        if (!questionPerformance[q.id]) {
          questionPerformance[q.id] = {
            questionId: q.id,
            text: q.text.substring(0, 100) + '...',
            difficulty: q.difficulty,
            totalAnswers: 0,
            correctAnswers: 0
          };
        }
        questionPerformance[q.id].totalAnswers++;
      });
    }
  });

  // Calculate correct percentages
  Object.values(questionPerformance).forEach(qp => {
    qp.correctPercentage = qp.totalAnswers > 0 ? 
      (qp.correctAnswers / qp.totalAnswers) * 100 : 0;
  });

  res.json({
    success: true,
    data: {
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject
      },
      overallStatistics: examStats,
      variationStatistics: variationStats,
      questionPerformance: Object.values(questionPerformance),
      totalVariations: exam.variations.length
    }
  });
});

// Preview exam questions before generation
const previewExamQuestions = catchAsync(async (req, res) => {
  const { 
    subjectId, 
    easyQuestions, 
    mediumQuestions, 
    hardQuestions,
    randomizeQuestions = true 
  } = req.query;
  const userId = req.user.id;

  // Verify user owns the subject
  const subject = await Subject.findOne({
    where: { id: subjectId, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Get available questions by difficulty
  const [easyQs, mediumQs, hardQs] = await Promise.all([
    Question.findAll({
      where: { 
        subjectId, 
        userId, 
        difficulty: 'easy', 
        isActive: true 
      },
      order: [['timesUsed', 'ASC']],
      limit: parseInt(easyQuestions) * 2
    }),
    Question.findAll({
      where: { 
        subjectId, 
        userId, 
        difficulty: 'medium', 
        isActive: true 
      },
      order: [['timesUsed', 'ASC']],
      limit: parseInt(mediumQuestions) * 2
    }),
    Question.findAll({
      where: { 
        subjectId, 
        userId, 
        difficulty: 'hard', 
        isActive: true 
      },
      order: [['timesUsed', 'ASC']],
      limit: parseInt(hardQuestions) * 2
    })
  ]);

  // Check availability
  const available = {
    easy: easyQs.length,
    medium: mediumQs.length,
    hard: hardQs.length
  };

  const required = {
    easy: parseInt(easyQuestions),
    medium: parseInt(mediumQuestions),
    hard: parseInt(hardQuestions)
  };

  const canGenerate = available.easy >= required.easy && 
                     available.medium >= required.medium && 
                     available.hard >= required.hard;

  // Sample questions for preview
  let sampleQuestions = [];
  if (canGenerate) {
    const selectedEasy = shuffleArray(easyQs).slice(0, required.easy);
    const selectedMedium = shuffleArray(mediumQs).slice(0, required.medium);
    const selectedHard = shuffleArray(hardQs).slice(0, required.hard);
    
    sampleQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];
    
    if (randomizeQuestions) {
      sampleQuestions = shuffleArray(sampleQuestions);
    }
  }

  res.json({
    success: true,
    data: {
      canGenerate,
      available,
      required,
      sampleQuestions: sampleQuestions.map((q, index) => ({
        order: index + 1,
        id: q.id,
        text: q.text.substring(0, 150) + (q.text.length > 150 ? '...' : ''),
        difficulty: q.difficulty,
        alternativeCount: q.alternatives.length,
        tags: q.tags
      }))
    }
  });
});

// Duplicate an exam
const duplicateExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.user.id;

  const originalExam = await Exam.findOne({
    where: { id, userId },
    include: [
      {
        model: Subject,
        as: 'subject'
      }
    ]
  });

  if (!originalExam) {
    throw new AppError('Exam not found', 404);
  }

  // Create duplicate exam
  const duplicatedExam = await Exam.create({
    title: title || `${originalExam.title} (Cópia)`,
    description: originalExam.description,
    subjectId: originalExam.subjectId,
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
    userId,
    // Reset publication status
    isPublished: false,
    publishedAt: null
  });

  // Generate new variations for the duplicated exam
  const variations = await generateExamVariations(duplicatedExam, originalExam.subject);

  res.status(201).json({
    success: true,
    message: 'Exam duplicated successfully',
    data: {
      exam: {
        ...duplicatedExam.toJSON(),
        variationsGenerated: variations.length
      }
    }
  });
});

module.exports = {
  getExams,
  getExam,
  createExam,
  updateExam,
  publishExam,
  unpublishExam,
  deleteExam,
  generateExamPDFs,
  getExamByQR,
  regenerateVariations,
  getExamStatistics,
  previewExamQuestions,
  duplicateExam,
  generateExamVariations // Export for use in other modules
};