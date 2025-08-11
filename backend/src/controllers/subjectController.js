const { Subject, Question, Exam } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get all subjects for the authenticated user
const getSubjects = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;
  const userId = req.user.id;
  const offset = (page - 1) * limit;

  const whereClause = { userId };

  // Add search filter
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Add active filter
  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  const { count, rows: subjects } = await Subject.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Question,
        as: 'questions',
        attributes: [],
        where: { isActive: true },
        required: false
      }
    ],
    attributes: {
      include: [
        [
          require('sequelize').fn('COUNT', require('sequelize').col('questions.id')),
          'questionCount'
        ]
      ]
    },
    group: ['Subject.id'],
    subQuery: false
  });

  // Get question counts by difficulty for each subject
  const subjectsWithStats = await Promise.all(
    subjects.map(async (subject) => {
      const questionCounts = await subject.getQuestionCounts();
      return {
        ...subject.toJSON(),
        questionCounts
      };
    })
  );

  res.json({
    success: true,
    data: {
      subjects: subjectsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count.length || 0,
        pages: Math.ceil((count.length || 0) / limit)
      }
    }
  });
});

// Get a single subject by ID
const getSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const subject = await Subject.findOne({
    where: { id, userId },
    include: [
      {
        model: Question,
        as: 'questions',
        where: { isActive: true },
        required: false,
        attributes: ['id', 'text', 'difficulty', 'createdAt']
      }
    ]
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Get detailed question counts
  const questionCounts = await subject.getQuestionCounts();

  // Get recent exams for this subject
  const recentExams = await Exam.findAll({
    where: { 
      subjectId: id,
      userId,
      isActive: true 
    },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'title', 'totalQuestions', 'isPublished', 'createdAt']
  });

  res.json({
    success: true,
    data: {
      subject: {
        ...subject.toJSON(),
        questionCounts,
        recentExams
      }
    }
  });
});

// Create a new subject
const createSubject = catchAsync(async (req, res) => {
  const { name, description, color } = req.body;
  const userId = req.user.id;

  // Check if subject with same name already exists for this user
  const existingSubject = await Subject.findOne({
    where: { name, userId }
  });

  if (existingSubject) {
    throw new AppError('Subject with this name already exists', 409);
  }

  const subject = await Subject.create({
    name,
    description,
    color,
    userId
  });

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: {
      subject: subject.toJSON()
    }
  });
});

// Update a subject
const updateSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, color, isActive } = req.body;
  const userId = req.user.id;

  const subject = await Subject.findOne({
    where: { id, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Check if name is being changed and if it conflicts
  if (name && name !== subject.name) {
    const existingSubject = await Subject.findOne({
      where: { 
        name, 
        userId,
        id: { [Op.ne]: id }
      }
    });

    if (existingSubject) {
      throw new AppError('Subject with this name already exists', 409);
    }
  }

  await subject.update({
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(color && { color }),
    ...(isActive !== undefined && { isActive })
  });

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: {
      subject: subject.toJSON()
    }
  });
});

// Delete a subject (soft delete by setting isActive to false)
const deleteSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const subject = await Subject.findOne({
    where: { id, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Check if subject has associated questions or exams
  const [questionCount, examCount] = await Promise.all([
    Question.count({ where: { subjectId: id, isActive: true } }),
    Exam.count({ where: { subjectId: id, isActive: true } })
  ]);

  if (questionCount > 0 || examCount > 0) {
    // Soft delete to preserve data integrity
    await subject.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Subject deactivated successfully (contains questions or exams)'
    });
  } else {
    // Hard delete if no associated data
    await subject.destroy();
    
    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  }
});

// Get subject statistics
const getSubjectStats = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const subject = await Subject.findOne({
    where: { id, userId }
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Get question statistics
  const questionStats = await Question.findAll({
    where: { subjectId: id, isActive: true },
    attributes: [
      'difficulty',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG', require('sequelize').col('averageScore')), 'avgScore']
    ],
    group: ['difficulty'],
    raw: true
  });

  // Get exam statistics
  const examStats = await Exam.findAll({
    where: { subjectId: id, userId, isActive: true },
    attributes: [
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalExams'],
      [require('sequelize').fn('COUNT', 
        require('sequelize').literal('CASE WHEN "isPublished" = true THEN 1 END')
      ), 'publishedExams']
    ],
    raw: true
  });

  // Get answer/submission statistics
  const { Answer } = require('../models');
  const submissionStats = await Answer.findAll({
    include: [{
      model: Exam,
      as: 'exam',
      where: { subjectId: id, userId },
      attributes: []
    }],
    attributes: [
      [require('sequelize').fn('COUNT', require('sequelize').col('Answer.id')), 'totalSubmissions'],
      [require('sequelize').fn('AVG', require('sequelize').col('Answer.score')), 'avgScore'],
      [require('sequelize').fn('COUNT', 
        require('sequelize').literal('CASE WHEN "Answer"."isPassed" = true THEN 1 END')
      ), 'passedSubmissions']
    ],
    raw: true
  });

  const stats = {
    questions: {
      total: questionStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      byDifficulty: questionStats.reduce((acc, stat) => {
        acc[stat.difficulty] = {
          count: parseInt(stat.count),
          averageScore: parseFloat(stat.avgScore) || 0
        };
        return acc;
      }, { easy: { count: 0, averageScore: 0 }, medium: { count: 0, averageScore: 0 }, hard: { count: 0, averageScore: 0 } })
    },
    exams: {
      total: parseInt(examStats[0]?.totalExams || 0),
      published: parseInt(examStats[0]?.publishedExams || 0)
    },
    submissions: {
      total: parseInt(submissionStats[0]?.totalSubmissions || 0),
      averageScore: parseFloat(submissionStats[0]?.avgScore || 0),
      passed: parseInt(submissionStats[0]?.passedSubmissions || 0),
      passRate: submissionStats[0]?.totalSubmissions > 0 ? 
        (parseInt(submissionStats[0]?.passedSubmissions || 0) / parseInt(submissionStats[0]?.totalSubmissions)) * 100 : 0
    }
  };

  res.json({
    success: true,
    data: {
      subject: subject.toJSON(),
      stats
    }
  });
});

// Duplicate a subject
const duplicateSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  const originalSubject = await Subject.findOne({
    where: { id, userId },
    include: [
      {
        model: Question,
        as: 'questions',
        where: { isActive: true },
        required: false
      }
    ]
  });

  if (!originalSubject) {
    throw new AppError('Subject not found', 404);
  }

  // Check if new name already exists
  const existingSubject = await Subject.findOne({
    where: { name, userId }
  });

  if (existingSubject) {
    throw new AppError('Subject with this name already exists', 409);
  }

  // Create new subject
  const newSubject = await Subject.create({
    name,
    description: originalSubject.description,
    color: originalSubject.color,
    userId
  });

  // Duplicate questions
  if (originalSubject.questions && originalSubject.questions.length > 0) {
    const questionsToCreate = originalSubject.questions.map(question => ({
      text: question.text,
      alternatives: question.alternatives,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      tags: question.tags,
      subjectId: newSubject.id,
      userId
    }));

    await Question.bulkCreate(questionsToCreate);
  }

  // Get the new subject with question count
  const subjectWithStats = await Subject.findByPk(newSubject.id);
  const questionCounts = await subjectWithStats.getQuestionCounts();

  res.status(201).json({
    success: true,
    message: 'Subject duplicated successfully',
    data: {
      subject: {
        ...subjectWithStats.toJSON(),
        questionCounts
      }
    }
  });
});

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectStats,
  duplicateSubject
};