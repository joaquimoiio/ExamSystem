const { Subject, Question, User, Exam } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/AppError');
const { Op, sequelize } = require('sequelize');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'subject-controller.log' })
  ]
});

/**
 * Get all subjects for authenticated user with enhanced filtering
 */
const getSubjects = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    sortBy = 'name',
    sortOrder = 'ASC',
    includeStats = 'false'
  } = req.query;
  
  const userId = req.user.id;
  const offset = (page - 1) * limit;

  // Build where clause
  const where = { userId };

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Validate sort parameters
  const allowedSortFields = ['name', 'createdAt', 'updatedAt'];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

  try {
    const { count, rows: subjects } = await Subject.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[finalSortBy, finalSortOrder]],
      include: [
        {
          model: Question,
          as: 'questions',
          attributes: ['id', 'difficulty', 'isActive'],
          where: { isActive: true },
          required: false
        }
      ],
      distinct: true
    });

    // Calculate statistics for each subject
    const subjectsWithStats = await Promise.all(subjects.map(async (subject) => {
      const questions = subject.questions || [];
      
      // Basic question counts
      const questionsCount = questions.length;
      const easyCount = questions.filter(q => q.difficulty === 'easy').length;
      const mediumCount = questions.filter(q => q.difficulty === 'medium').length;
      const hardCount = questions.filter(q => q.difficulty === 'hard').length;

      // Enhanced statistics if requested
      let enhancedStats = {};
      if (includeStats === 'true') {
        const examCount = await Exam.count({ where: { subjectId: subject.id } });
        const publishedExamCount = await Exam.count({ 
          where: { subjectId: subject.id, isPublished: true } 
        });

        enhancedStats = {
          examCount,
          publishedExamCount,
          canCreateExam: questionsCount >= 5, // Minimum questions for exam
          lastQuestionAdded: questions.length > 0 ? 
            Math.max(...questions.map(q => new Date(q.createdAt))) : null
        };
      }

      return {
        ...subject.toJSON(),
        stats: {
          questionsCount,
          easyCount,
          mediumCount,
          hardCount,
          ...enhancedStats
        }
      };
    }));

    logger.info(`Retrieved ${count} subjects for user ${userId}`);

    res.json({
      success: true,
      data: {
        subjects: subjectsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error getting subjects:', error);
    throw new AppError('Erro ao buscar disciplinas', 500);
  }
});

/**
 * Get single subject by ID
 */
const getSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const subject = await Subject.findOne({
      where: { id, userId },
      include: [
        {
          model: Question,
          as: 'questions',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'text', 'difficulty', 'tags', 'createdAt']
        }
      ]
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    logger.info(`Retrieved subject: ${id}`, { userId });

    res.json({
      success: true,
      data: { subject }
    });

  } catch (error) {
    logger.error('Error getting subject:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar disciplina', 500);
  }
});

/**
 * Create new subject
 */
const createSubject = catchAsync(async (req, res) => {
  const { name, description, color } = req.body;
  const userId = req.user.id;

  try {
    // Validation
    if (!name || !name.trim()) {
      throw new AppError('Nome da disciplina é obrigatório', 400);
    }

    if (name.length > 100) {
      throw new AppError('Nome da disciplina deve ter no máximo 100 caracteres', 400);
    }

    if (description && description.length > 500) {
      throw new AppError('Descrição deve ter no máximo 500 caracteres', 400);
    }

    // Check for duplicate names
    const existingSubject = await Subject.findOne({
      where: { name: name.trim(), userId }
    });

    if (existingSubject) {
      throw new AppError('Já existe uma disciplina com este nome', 409);
    }

    const subject = await Subject.create({
      name: name.trim(),
      description: description?.trim(),
      color: color || '#3B82F6',
      userId
    });

    logger.info(`Subject created: ${subject.id}`, { userId, name: subject.name });

    res.status(201).json({
      success: true,
      message: 'Disciplina criada com sucesso',
      data: { subject }
    });

  } catch (error) {
    logger.error('Error creating subject:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao criar disciplina', 500);
  }
});

/**
 * Update subject
 */
const updateSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;
  const userId = req.user.id;

  try {
    const subject = await Subject.findOne({
      where: { id, userId }
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    // Validation
    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        throw new AppError('Nome da disciplina não pode estar vazio', 400);
      }
      if (name.length > 100) {
        throw new AppError('Nome da disciplina deve ter no máximo 100 caracteres', 400);
      }

      // Check for name conflicts
      if (name.trim() !== subject.name) {
        const existingSubject = await Subject.findOne({
          where: { 
            name: name.trim(), 
            userId, 
            id: { [Op.ne]: id } 
          }
        });

        if (existingSubject) {
          throw new AppError('Já existe uma disciplina com este nome', 409);
        }
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        throw new AppError('Descrição deve ter no máximo 500 caracteres', 400);
      }
      updateData.description = description?.trim();
    }

    if (color !== undefined) {
      const validColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
      ];

      if (color && !validColors.includes(color)) {
        throw new AppError('Cor inválida selecionada', 400);
      }
      updateData.color = color;
    }

    await subject.update(updateData);

    logger.info(`Subject updated: ${id}`, { userId, changes: Object.keys(updateData) });

    res.json({
      success: true,
      message: 'Disciplina atualizada com sucesso',
      data: { subject }
    });

  } catch (error) {
    logger.error('Error updating subject:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar disciplina', 500);
  }
});

/**
 * Delete subject
 */
const deleteSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { force = false } = req.query;
  const userId = req.user.id;

  try {
    const subject = await Subject.findOne({
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

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    // Check for dependencies
    const questionCount = subject.questions?.length || 0;
    const examCount = await Exam.count({ where: { subjectId: id } });

    if (questionCount > 0 && !force) {
      throw new AppError(
        `Não é possível excluir esta disciplina pois ela possui ${questionCount} questão${questionCount !== 1 ? 'ões' : ''} cadastrada${questionCount !== 1 ? 's' : ''}. Remova todas as questões primeiro ou use force=true.`,
        400
      );
    }

    if (examCount > 0 && !force) {
      throw new AppError(
        `Não é possível excluir esta disciplina pois ela possui ${examCount} prova${examCount !== 1 ? 's' : ''} associada${examCount !== 1 ? 's' : ''}.`,
        400
      );
    }

    await subject.destroy();

    logger.info(`Subject deleted: ${id}`, { userId, force: !!force });

    res.json({
      success: true,
      message: 'Disciplina excluída com sucesso'
    });

  } catch (error) {
    logger.error('Error deleting subject:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao excluir disciplina', 500);
  }
});

/**
 * Get subject questions
 */
const getSubjectQuestions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const subject = await Subject.findOne({
      where: { id, userId }
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    const questions = await Question.findAll({
      where: { subjectId: id, isActive: true },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { questions }
    });

  } catch (error) {
    logger.error('Error getting subject questions:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar questões da disciplina', 500);
  }
});

/**
 * Check if can create exam for subject
 */
const canCreateExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { requirements } = req.body;
  const userId = req.user.id;

  try {
    const subject = await Subject.findOne({
      where: { id, userId }
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    const result = await subject.canCreateExam(requirements);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error checking exam creation:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao verificar possibilidade de criar prova', 500);
  }
});

/**
 * Get subject statistics
 */
const getSubjectStats = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const subject = await Subject.findOne({
      where: { id, userId }
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    const stats = await Question.getStatsBySubject(id);

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    logger.error('Error getting subject stats:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar estatísticas da disciplina', 500);
  }
});

/**
 * Duplicate subject
 */
const duplicateSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  try {
    const originalSubject = await Subject.findOne({
      where: { id, userId }
    });

    if (!originalSubject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    // Check if new name is provided and valid
    const newName = name || `${originalSubject.name} (Cópia)`;
    
    const existingSubject = await Subject.findOne({
      where: { name: newName, userId }
    });

    if (existingSubject) {
      throw new AppError('Já existe uma disciplina com este nome', 409);
    }

    const duplicatedSubject = await Subject.create({
      name: newName,
      description: originalSubject.description,
      color: originalSubject.color,
      userId
    });

    logger.info(`Subject duplicated: ${id} -> ${duplicatedSubject.id}`, { userId });

    res.status(201).json({
      success: true,
      message: 'Disciplina duplicada com sucesso',
      data: { subject: duplicatedSubject }
    });

  } catch (error) {
    logger.error('Error duplicating subject:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao duplicar disciplina', 500);
  }
});

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectQuestions,
  canCreateExam,
  getSubjectStats,
  duplicateSubject
};