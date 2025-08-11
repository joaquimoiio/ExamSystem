const { Question, Subject, Exam } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get all questions with filters
const getQuestions = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    subjectId, 
    difficulty, 
    tags, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;
  
  const userId = req.user.id;
  const offset = (page - 1) * limit;

  const whereClause = { userId, isActive: true };

  // Filter by subject
  if (subjectId) {
    // Verify user owns the subject
    const subject = await Subject.findOne({
      where: { id: subjectId, userId }
    });
    
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    
    whereClause.subjectId = subjectId;
  }

  // Filter by difficulty
  if (difficulty) {
    whereClause.difficulty = difficulty;
  }

  // Filter by tags
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    whereClause.tags = {
      [Op.overlap]: tagArray
    };
  }

  // Search in question text
  if (search) {
    whereClause.text = {
      [Op.iLike]: `%${search}%`
    };
  }

  const validSortFields = ['createdAt', 'updatedAt', 'difficulty', 'timesUsed'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

  const { count, rows: questions } = await Question.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortField, sortDirection]]
  });

  // Get statistics for each question
  const questionsWithStats = await Promise.all(
    questions.map(async (question) => {
      const stats = await question.getStatistics();
      return {
        ...question.toJSON(),
        statistics: stats
      };
    })
  );

  res.json({
    success: true,
    data: {
      questions: questionsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get a single question by ID
const getQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const question = await Question.findOne({
    where: { id, userId },
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ]
  });

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Get detailed statistics
  const statistics = await question.getStatistics();

  res.json({
    success: true,
    data: {
      question: {
        ...question.toJSON(),
        statistics
      }
    }
  });
});

// Create a new question
const createQuestion = catchAsync(async (req, res) => {
  const { text, alternatives, correctAnswer, difficulty, tags, subjectId } = req.body;
  const userId = req.user.id;

  // Verify user owns the subject
  const subject = await Subject.findOne({
    where: { id: subjectId, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Validate alternatives order and letters
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const sortedAlternatives = alternatives.map((alt, index) => ({
    letter: letters[index],
    text: alt.text
  }));

  // Validate correct answer exists in alternatives
  const validAnswers = sortedAlternatives.map(alt => alt.letter);
  if (!validAnswers.includes(correctAnswer)) {
    throw new AppError('Correct answer must match one of the alternatives', 400);
  }

  const question = await Question.create({
    text,
    alternatives: sortedAlternatives,
    correctAnswer,
    difficulty,
    tags: tags || [],
    subjectId,
    userId
  });

  // Include subject in response
  const questionWithSubject = await Question.findByPk(question.id, {
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: {
      question: questionWithSubject.toJSON()
    }
  });
});

// Update a question
const updateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { text, alternatives, correctAnswer, difficulty, tags, isActive } = req.body;
  const userId = req.user.id;

  const question = await Question.findOne({
    where: { id, userId }
  });

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  const updateData = {};

  if (text !== undefined) updateData.text = text;
  if (difficulty !== undefined) updateData.difficulty = difficulty;
  if (tags !== undefined) updateData.tags = tags;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Handle alternatives update
  if (alternatives) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const sortedAlternatives = alternatives.map((alt, index) => ({
      letter: letters[index],
      text: alt.text
    }));
    updateData.alternatives = sortedAlternatives;

    // Update correct answer if provided
    if (correctAnswer) {
      const validAnswers = sortedAlternatives.map(alt => alt.letter);
      if (!validAnswers.includes(correctAnswer)) {
        throw new AppError('Correct answer must match one of the alternatives', 400);
      }
      updateData.correctAnswer = correctAnswer;
    }
  } else if (correctAnswer) {
    // Validate against existing alternatives
    const validAnswers = question.alternatives.map(alt => alt.letter);
    if (!validAnswers.includes(correctAnswer)) {
      throw new AppError('Correct answer must match one of the alternatives', 400);
    }
    updateData.correctAnswer = correctAnswer;
  }

  await question.update(updateData);

  // Get updated question with subject
  const updatedQuestion = await Question.findByPk(id, {
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
    message: 'Question updated successfully',
    data: {
      question: updatedQuestion.toJSON()
    }
  });
});

// Delete a question
const deleteQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const question = await Question.findOne({
    where: { id, userId }
  });

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Check if question is used in any active exams
  const examCount = await Exam.count({
    include: [
      {
        model: Question,
        as: 'questions',
        where: { id },
        through: { attributes: [] }
      }
    ],
    where: { isActive: true }
  });

  if (examCount > 0) {
    // Soft delete to preserve exam integrity
    await question.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Question deactivated successfully (used in active exams)'
    });
  } else {
    // Hard delete if not used in exams
    await question.destroy();
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  }
});

// Bulk create questions
const bulkCreateQuestions = catchAsync(async (req, res) => {
  const { questions, subjectId } = req.body;
  const userId = req.user.id;

  // Verify user owns the subject
  const subject = await Subject.findOne({
    where: { id: subjectId, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('Questions array is required and cannot be empty', 400);
  }

  // Validate and prepare questions
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const questionsToCreate = questions.map((q, index) => {
    // Validate required fields
    if (!q.text || !q.alternatives || !q.correctAnswer || !q.difficulty) {
      throw new AppError(`Question at index ${index} is missing required fields`, 400);
    }

    // Sort alternatives
    const sortedAlternatives = q.alternatives.map((alt, altIndex) => ({
      letter: letters[altIndex],
      text: alt.text
    }));

    // Validate correct answer
    const validAnswers = sortedAlternatives.map(alt => alt.letter);
    if (!validAnswers.includes(q.correctAnswer)) {
      throw new AppError(`Question at index ${index}: correct answer must match one of the alternatives`, 400);
    }

    return {
      text: q.text,
      alternatives: sortedAlternatives,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      tags: q.tags || [],
      subjectId,
      userId
    };
  });

  // Create questions
  const createdQuestions = await Question.bulkCreate(questionsToCreate);

  res.status(201).json({
    success: true,
    message: `${createdQuestions.length} questions created successfully`,
    data: {
      questions: createdQuestions,
      count: createdQuestions.length
    }
  });
});

// Duplicate a question
const duplicateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const originalQuestion = await Question.findOne({
    where: { id, userId }
  });

  if (!originalQuestion) {
    throw new AppError('Question not found', 404);
  }

  // Create duplicate
  const duplicatedQuestion = await Question.create({
    text: `${originalQuestion.text} (Cópia)`,
    alternatives: originalQuestion.alternatives,
    correctAnswer: originalQuestion.correctAnswer,
    difficulty: originalQuestion.difficulty,
    tags: originalQuestion.tags,
    subjectId: originalQuestion.subjectId,
    userId
  });

  // Get with subject info
  const questionWithSubject = await Question.findByPk(duplicatedQuestion.id, {
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'color']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Question duplicated successfully',
    data: {
      question: questionWithSubject.toJSON()
    }
  });
});

// Get questions for exam generation
const getQuestionsForExam = catchAsync(async (req, res) => {
  const { subjectId, easyCount = 0, mediumCount = 0, hardCount = 0 } = req.query;
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
    easyQuestions: parseInt(easyCount),
    mediumQuestions: parseInt(mediumCount),
    hardQuestions: parseInt(hardCount)
  });

  if (!canCreate.canCreate) {
    return res.status(400).json({
      success: false,
      message: 'Not enough questions available',
      data: {
        required: canCreate.required,
        available: canCreate.available
      }
    });
  }

  // Get questions by difficulty
  const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
    Question.findAll({
      where: { 
        subjectId, 
        userId, 
        difficulty: 'easy', 
        isActive: true 
      },
      order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(easyCount) * 2 // Get more for randomization
    }),
    Question.findAll({
      where: { 
        subjectId, 
        userId, 
        difficulty: 'medium', 
        isActive: true 
      },
      order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(mediumCount) * 2
    }),
    Question.findAll({
      where: { 
        subjectId, 
        userId, 
        difficulty: 'hard', 
        isActive: true 
      },
      order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(hardCount) * 2
    })
  ]);

  res.json({
    success: true,
    data: {
      questions: {
        easy: easyQuestions,
        medium: mediumQuestions,
        hard: hardQuestions
      },
      available: canCreate.available,
      canCreate: canCreate.canCreate
    }
  });
});

// Get question tags (for autocomplete)
const getQuestionTags = catchAsync(async (req, res) => {
  const { subjectId } = req.query;
  const userId = req.user.id;

  const whereClause = { userId, isActive: true };
  
  if (subjectId) {
    whereClause.subjectId = subjectId;
  }

  const questions = await Question.findAll({
    where: whereClause,
    attributes: ['tags'],
    raw: true
  });

  // Extract and flatten all tags
  const allTags = questions
    .filter(q => q.tags && Array.isArray(q.tags))
    .flatMap(q => q.tags)
    .filter(tag => tag && tag.trim().length > 0);

  // Count occurrences and remove duplicates
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  // Sort by frequency
  const sortedTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([tag, count]) => ({ tag, count }));

  res.json({
    success: true,
    data: {
      tags: sortedTags,
      totalUniqueTags: sortedTags.length
    }
  });
});

// Import questions from file
const importQuestions = catchAsync(async (req, res) => {
  const { subjectId } = req.body;
  const userId = req.user.id;

  if (!req.file) {
    throw new AppError('File is required', 400);
  }

  // Verify user owns the subject
  const subject = await Subject.findOne({
    where: { id: subjectId, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Process file based on type
  const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
  let questions = [];

  try {
    if (fileExtension === 'json') {
      const fileContent = require('fs').readFileSync(req.file.path, 'utf8');
      const data = JSON.parse(fileContent);
      questions = Array.isArray(data) ? data : [data];
    } else if (fileExtension === 'csv') {
      // You can implement CSV parsing here using a library like csv-parse
      throw new AppError('CSV import not yet implemented', 400);
    } else {
      throw new AppError('Unsupported file format. Use JSON or CSV.', 400);
    }

    // Validate and create questions
    const validQuestions = [];
    const errors = [];

    questions.forEach((q, index) => {
      try {
        if (!q.text || !q.alternatives || !q.correctAnswer || !q.difficulty) {
          errors.push(`Question ${index + 1}: Missing required fields`);
          return;
        }

        const letters = ['A', 'B', 'C', 'D', 'E'];
        const sortedAlternatives = q.alternatives.map((alt, altIndex) => ({
          letter: letters[altIndex],
          text: typeof alt === 'string' ? alt : alt.text
        }));

        if (!sortedAlternatives.map(alt => alt.letter).includes(q.correctAnswer)) {
          errors.push(`Question ${index + 1}: Correct answer doesn't match alternatives`);
          return;
        }

        validQuestions.push({
          text: q.text,
          alternatives: sortedAlternatives,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          tags: q.tags || [],
          subjectId,
          userId
        });
      } catch (error) {
        errors.push(`Question ${index + 1}: ${error.message}`);
      }
    });

    if (validQuestions.length === 0) {
      throw new AppError('No valid questions found in file', 400);
    }

    // Create questions
    const createdQuestions = await Question.bulkCreate(validQuestions);

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} questions imported successfully`,
      data: {
        imported: createdQuestions.length,
        errors: errors.length > 0 ? errors : undefined,
        questions: createdQuestions
      }
    });

  } catch (error) {
    // Clean up uploaded file
    if (require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }
    throw error;
  }
});

// Export questions
const exportQuestions = catchAsync(async (req, res) => {
  const { subjectId, difficulty, format = 'json' } = req.query;
  const userId = req.user.id;

  const whereClause = { userId, isActive: true };
  
  if (subjectId) {
    whereClause.subjectId = subjectId;
  }
  
  if (difficulty) {
    whereClause.difficulty = difficulty;
  }

  const questions = await Question.findAll({
    where: whereClause,
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  if (format === 'json') {
    res.json({
      success: true,
      data: {
        questions: questions.map(q => ({
          text: q.text,
          alternatives: q.alternatives,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          tags: q.tags,
          subject: q.subject?.name
        })),
        exportedAt: new Date().toISOString(),
        totalQuestions: questions.length
      }
    });
  } else {
    throw new AppError('Only JSON format is currently supported', 400);
  }
});

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
  duplicateQuestion,
  getQuestionsForExam,
  getQuestionTags,
  importQuestions,
  exportQuestions
};