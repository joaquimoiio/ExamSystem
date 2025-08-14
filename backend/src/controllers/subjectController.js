const { Subject, Question, Exam } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { Op } = require('sequelize');

// Get subjects with pagination and search
const getSubjects = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);
  
  const where = { userId: req.user.id };
  
  // Add search filter
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: subjects } = await Subject.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    attributes: {
      include: [
        // Count questions for each subject
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM questions
            WHERE questions.subject_id = "Subject".id
            AND questions.is_active = true
          )`),
          'questionsCount'
        ],
        // Count exams for each subject
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM exams
            WHERE exams.subject_id = "Subject".id
          )`),
          'examsCount'
        ]
      ]
    }
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: {
      subjects,
      pagination
    }
  });
});

// Get subjects statistics for dashboard
const getSubjectsStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Get total counts
  const totalSubjects = await Subject.count({ where: { userId } });
  const totalQuestions = await Question.count({ where: { userId } });
  const totalExams = await Exam.count({ where: { userId } });

  // Get subjects with their question counts by difficulty
  const subjectsWithStats = await Subject.findAll({
    where: { userId },
    attributes: {
      include: [
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM questions
            WHERE questions.subject_id = "Subject".id
            AND questions.is_active = true
            AND questions.difficulty = 'easy'
          )`),
          'easyQuestionsCount'
        ],
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM questions
            WHERE questions.subject_id = "Subject".id
            AND questions.is_active = true
            AND questions.difficulty = 'medium'
          )`),
          'mediumQuestionsCount'
        ],
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM questions
            WHERE questions.subject_id = "Subject".id
            AND questions.is_active = true
            AND questions.difficulty = 'hard'
          )`),
          'hardQuestionsCount'
        ],
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM exams
            WHERE exams.subject_id = "Subject".id
            AND exams.is_published = true
          )`),
          'publishedExamsCount'
        ]
      ]
    },
    order: [['createdAt', 'DESC']],
    limit: 10
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalSubjects,
        totalQuestions,
        totalExams
      },
      subjects: subjectsWithStats
    }
  });
});

// Create new subject
const createSubject = catchAsync(async (req, res, next) => {
  const { name, description, color } = req.body;
  
  // Check if subject name already exists for this user
  const existingSubject = await Subject.findOne({
    where: { 
      name: name.trim(),
      userId: req.user.id 
    }
  });

  if (existingSubject) {
    return next(new AppError('Subject with this name already exists', 400));
  }

  const subject = await Subject.create({
    name: name.trim(),
    description: description?.trim(),
    color: color || '#3B82F6',
    userId: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: { subject }
  });
});

// Get subject by ID
const getSubjectById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const subject = await Subject.findByPk(id, {
    attributes: {
      include: [
        // Count questions by difficulty
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM questions
            WHERE questions.subject_id = "Subject".id
            AND questions.is_active = true
            AND questions.difficulty = 'easy'
          )`),
          'easyQuestionsCount'
        ],
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM questions
            WHERE questions.subject_id = "Subject".id
            AND questions.is_active = true
            AND questions.difficulty = 'medium'
          )`),
          'mediumQuestionsCount'
        ],
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM questions
            WHERE questions.subject_id = "Subject".id
            AND questions.is_active = true
            AND questions.difficulty = 'hard'
          )`),
          'hardQuestionsCount'
        ],
        // Count exams
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM exams
            WHERE exams.subject_id = "Subject".id
          )`),
          'totalExamsCount'
        ],
        [
          Subject.sequelize.literal(`(
            SELECT COUNT(*)
            FROM exams
            WHERE exams.subject_id = "Subject".id
            AND exams.is_published = true
          )`),
          'publishedExamsCount'
        ]
      ]
    }
  });

  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  res.json({
    success: true,
    data: { subject }
  });
});

// Update subject
const updateSubject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, color } = req.body;
  
  const subject = await Subject.findByPk(id);
  
  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  // Check if new name conflicts with existing subjects
  if (name && name.trim() !== subject.name) {
    const existingSubject = await Subject.findOne({
      where: { 
        name: name.trim(),
        userId: req.user.id,
        id: { [Op.ne]: id }
      }
    });

    if (existingSubject) {
      return next(new AppError('Subject with this name already exists', 400));
    }
  }

  await subject.update({
    ...(name && { name: name.trim() }),
    ...(description !== undefined && { description: description?.trim() }),
    ...(color && { color })
  });

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: { subject }
  });
});

// Delete subject
const deleteSubject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const subject = await Subject.findByPk(id);
  
  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  // Check if subject has questions or exams
  const [questionsCount, examsCount] = await Promise.all([
    Question.count({ where: { subjectId: id } }),
    Exam.count({ where: { subjectId: id } })
  ]);

  if (questionsCount > 0 || examsCount > 0) {
    return next(new AppError('Cannot delete subject with existing questions or exams', 400));
  }

  await subject.destroy();

  res.json({
    success: true,
    message: 'Subject deleted successfully'
  });
});

// Get questions count by difficulty for a subject
const getQuestionsCount = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const subject = await Subject.findByPk(id);
  
  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  const questionsCount = await subject.getQuestionsCount();

  res.json({
    success: true,
    data: { questionsCount }
  });
});

// Get exams for a subject
const getSubjectExams = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);
  
  const where = { subjectId: id };
  
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
    attributes: {
      include: [
        // Count submissions
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

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: {
      exams,
      pagination
    }
  });
});

// Get questions for a subject
const getSubjectQuestions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10, difficulty, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);
  
  const where = { subjectId: id, isActive: true };
  
  if (difficulty) {
    where.difficulty = difficulty;
  }
  
  if (search) {
    where.text = { [Op.iLike]: `%${search}%` };
  }

  const { count, rows: questions } = await Question.findAndCountAll({
    where,
    limit: queryLimit,
    offset,
    order: [['createdAt', 'DESC']],
    attributes: { exclude: ['userId'] }
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: {
      questions,
      pagination
    }
  });
});

// Check if subject can create exam with given requirements
const checkExamRequirements = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { easyQuestions = 0, mediumQuestions = 0, hardQuestions = 0 } = req.body;
  
  const subject = await Subject.findByPk(id);
  
  if (!subject) {
    return next(new AppError('Subject not found', 404));
  }

  const requirements = {
    easy: parseInt(easyQuestions),
    medium: parseInt(mediumQuestions),
    hard: parseInt(hardQuestions)
  };

  const result = await subject.canCreateExam(requirements);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getSubjects,
  getSubjectsStats,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getQuestionsCount,
  getSubjectExams,
  getSubjectQuestions,
  checkExamRequirements
};