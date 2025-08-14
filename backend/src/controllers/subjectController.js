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
  if (search && search.trim()) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { description: { [Op.iLike]: `%${search.trim()}%` } }
    ];
  }

  try {
    // Busca básica primeiro
    const { count, rows: subjects } = await Subject.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: ['id', 'name', 'description', 'color', 'code', 'credits', 'isActive', 'createdAt', 'updatedAt']
    });

    // Adicionar contagens separadamente para cada disciplina
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        try {
          const [questionsCount, examsCount] = await Promise.all([
            Question.count({ 
              where: { 
                subjectId: subject.id, 
                isActive: true 
              } 
            }).catch(() => 0),
            Exam.count({ 
              where: { 
                subjectId: subject.id 
              } 
            }).catch(() => 0)
          ]);

          return {
            ...subject.toJSON(),
            questionsCount,
            examsCount
          };
        } catch (error) {
          console.warn(`Erro ao buscar contagens para disciplina ${subject.id}:`, error.message);
          return {
            ...subject.toJSON(),
            questionsCount: 0,
            examsCount: 0
          };
        }
      })
    );

    const pagination = buildPaginationMeta(page, limit, count);

    res.json({
      success: true,
      data: {
        subjects: subjectsWithCounts,
        pagination
      }
    });

  } catch (error) {
    console.error('Erro em getSubjects:', error);
    return next(new AppError('Erro ao buscar disciplinas', 500));
  }
});

// Get subjects statistics for dashboard
const getSubjectsStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const [totalSubjects, totalQuestions, totalExams] = await Promise.all([
      Subject.count({ where: { userId } }).catch(() => 0),
      Question.count({ where: { userId } }).catch(() => 0),
      Exam.count({ where: { userId } }).catch(() => 0)
    ]);

    // Buscar disciplinas recentes
    const recentSubjects = await Subject.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'color', 'createdAt']
    }).catch(() => []);

    res.json({
      success: true,
      data: {
        overview: {
          totalSubjects,
          totalQuestions,
          totalExams
        },
        subjects: recentSubjects
      }
    });

  } catch (error) {
    console.error('Erro em getSubjectsStats:', error);
    return next(new AppError('Erro ao buscar estatísticas', 500));
  }
});

// Create new subject
const createSubject = catchAsync(async (req, res, next) => {
  const { name, description, color, code, credits, isActive } = req.body;
  
  // Validar campos obrigatórios
  if (!name || !name.trim()) {
    return next(new AppError('Nome da disciplina é obrigatório', 400));
  }

  if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
    return next(new AppError('Cor é obrigatória e deve estar no formato hexadecimal', 400));
  }

  try {
    // Check if subject name already exists for this user
    const existingSubject = await Subject.findOne({
      where: { 
        name: name.trim(),
        userId: req.user.id 
      }
    });

    if (existingSubject) {
      return next(new AppError('Já existe uma disciplina com este nome', 400));
    }

    // Validar código se fornecido
    if (code && code.trim()) {
      const existingCode = await Subject.findOne({
        where: { 
          code: code.trim(),
          userId: req.user.id 
        }
      });

      if (existingCode) {
        return next(new AppError('Já existe uma disciplina com este código', 400));
      }
    }

    const subject = await Subject.create({
      name: name.trim(),
      description: description?.trim() || '',
      color: color,
      code: code?.trim() || null,
      credits: parseInt(credits) || 1,
      isActive: Boolean(isActive !== undefined ? isActive : true),
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Disciplina criada com sucesso',
      data: { subject }
    });

  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return next(new AppError(`Erro de validação: ${validationErrors}`, 400));
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Já existe uma disciplina com este nome', 400));
    }

    return next(new AppError('Erro interno do servidor ao criar disciplina', 500));
  }
});

// Get subject by ID
const getSubjectById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    // Buscar contagens separadamente
    const [questionsCount, examsCount] = await Promise.all([
      Question.count({ 
        where: { 
          subjectId: id, 
          isActive: true 
        } 
      }).catch(() => 0),
      Exam.count({ 
        where: { 
          subjectId: id 
        } 
      }).catch(() => 0)
    ]);

    const subjectWithCounts = {
      ...subject.toJSON(),
      questionsCount,
      examsCount
    };

    res.json({
      success: true,
      data: { subject: subjectWithCounts }
    });

  } catch (error) {
    console.error('Erro ao buscar disciplina:', error);
    return next(new AppError('Erro ao buscar disciplina', 500));
  }
});

// Update subject
const updateSubject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, color, code, credits, isActive } = req.body;
  
  try {
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    // Check if name already exists for another subject of this user
    if (name && name.trim()) {
      const existingSubject = await Subject.findOne({
        where: { 
          name: name.trim(),
          userId: req.user.id,
          id: { [Op.ne]: id }
        }
      });

      if (existingSubject) {
        return next(new AppError('Já existe uma disciplina com este nome', 400));
      }
    }

    // Check if code already exists for another subject of this user
    if (code && code.trim()) {
      const existingCode = await Subject.findOne({
        where: { 
          code: code.trim(),
          userId: req.user.id,
          id: { [Op.ne]: id }
        }
      });

      if (existingCode) {
        return next(new AppError('Já existe uma disciplina com este código', 400));
      }
    }

    await subject.update({
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || '' }),
      ...(color && { color }),
      ...(code !== undefined && { code: code?.trim() || null }),
      ...(credits !== undefined && { credits: parseInt(credits) || 1 }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) })
    });

    res.json({
      success: true,
      message: 'Disciplina atualizada com sucesso',
      data: { subject }
    });

  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return next(new AppError(`Erro de validação: ${validationErrors}`, 400));
    }
    
    return next(new AppError('Erro interno do servidor ao atualizar disciplina', 500));
  }
});

// Delete subject
const deleteSubject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    // Check if subject has questions or exams
    const [questionsCount, examsCount] = await Promise.all([
      Question.count({ where: { subjectId: id } }).catch(() => 0),
      Exam.count({ where: { subjectId: id } }).catch(() => 0)
    ]);

    if (questionsCount > 0 || examsCount > 0) {
      return next(new AppError('Não é possível excluir uma disciplina que possui questões ou provas', 400));
    }

    await subject.destroy();

    res.json({
      success: true,
      message: 'Disciplina excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir disciplina:', error);
    return next(new AppError('Erro interno do servidor ao excluir disciplina', 500));
  }
});

// Get questions count by difficulty for a subject
const getQuestionsCount = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    // Buscar contagens por dificuldade
    const questionsCount = await Question.findAll({
      where: { subjectId: id, isActive: true },
      attributes: [
        'difficulty',
        [Question.sequelize.fn('COUNT', Question.sequelize.col('id')), 'count']
      ],
      group: ['difficulty'],
      raw: true
    }).catch(() => []);

    const result = {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0
    };

    questionsCount.forEach(item => {
      const count = parseInt(item.count) || 0;
      result[item.difficulty] = count;
      result.total += count;
    });

    res.json({
      success: true,
      data: { questionsCount: result }
    });

  } catch (error) {
    console.error('Erro ao buscar contagem de questões:', error);
    return next(new AppError('Erro ao buscar contagem de questões', 500));
  }
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

  try {
    const { count, rows: exams } = await Exam.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      order: [['createdAt', 'DESC']],
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
    }).catch(() => ({ count: 0, rows: [] }));

    const pagination = buildPaginationMeta(page, limit, count);

    res.json({
      success: true,
      data: {
        exams,
        pagination
      }
    });

  } catch (error) {
    console.error('Erro ao buscar provas da disciplina:', error);
    res.json({
      success: true,
      data: {
        exams: [],
        pagination: buildPaginationMeta(page, limit, 0)
      }
    });
  }
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
    where.statement = { [Op.iLike]: `%${search}%` };
  }

  try {
    const { count, rows: questions } = await Question.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['userId'] }
    }).catch(() => ({ count: 0, rows: [] }));

    const pagination = buildPaginationMeta(page, limit, count);

    res.json({
      success: true,
      data: {
        questions,
        pagination
      }
    });

  } catch (error) {
    console.error('Erro ao buscar questões da disciplina:', error);
    res.json({
      success: true,
      data: {
        questions: [],
        pagination: buildPaginationMeta(page, limit, 0)
      }
    });
  }
});

// Check if subject can create exam with given requirements
const checkExamRequirements = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { easyQuestions = 0, mediumQuestions = 0, hardQuestions = 0 } = req.body;
  
  try {
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    const requirements = {
      easy: parseInt(easyQuestions),
      medium: parseInt(mediumQuestions),
      hard: parseInt(hardQuestions)
    };

    // Buscar contagens disponíveis
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      Question.count({
        where: { 
          subjectId: id, 
          difficulty: 'easy', 
          isActive: true 
        }
      }).catch(() => 0),
      Question.count({
        where: { 
          subjectId: id, 
          difficulty: 'medium', 
          isActive: true 
        }
      }).catch(() => 0),
      Question.count({
        where: { 
          subjectId: id, 
          difficulty: 'hard', 
          isActive: true 
        }
      }).catch(() => 0)
    ]);

    const available = { easy: easyCount, medium: mediumCount, hard: hardCount };
    const canCreate = available.easy >= requirements.easy && 
                     available.medium >= requirements.medium && 
                     available.hard >= requirements.hard;

    const result = { canCreate, available, required: requirements };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erro ao verificar requisitos do exame:', error);
    return next(new AppError('Erro ao verificar requisitos do exame', 500));
  }
});

// Duplicate subject
const duplicateSubject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  
  try {
    const originalSubject = await Subject.findByPk(id);
    
    if (!originalSubject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    // Verificar se o novo nome já existe
    const existingSubject = await Subject.findOne({
      where: { 
        name: name.trim(),
        userId: req.user.id 
      }
    });

    if (existingSubject) {
      return next(new AppError('Já existe uma disciplina com este nome', 400));
    }

    const duplicatedSubject = await Subject.create({
      name: name.trim(),
      description: originalSubject.description,
      color: originalSubject.color,
      code: null, // Não duplicar código
      credits: originalSubject.credits,
      isActive: originalSubject.isActive,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Disciplina duplicada com sucesso',
      data: { subject: duplicatedSubject }
    });

  } catch (error) {
    console.error('Erro ao duplicar disciplina:', error);
    return next(new AppError('Erro interno do servidor ao duplicar disciplina', 500));
  }
});

// Archive/Unarchive subject
const archiveSubject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    await subject.update({ isActive: false });

    res.json({
      success: true,
      message: 'Disciplina arquivada com sucesso',
      data: { subject }
    });

  } catch (error) {
    console.error('Erro ao arquivar disciplina:', error);
    return next(new AppError('Erro interno do servidor ao arquivar disciplina', 500));
  }
});

const unarchiveSubject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return next(new AppError('Disciplina não encontrada', 404));
    }

    await subject.update({ isActive: true });

    res.json({
      success: true,
      message: 'Disciplina desarquivada com sucesso',
      data: { subject }
    });

  } catch (error) {
    console.error('Erro ao desarquivar disciplina:', error);
    return next(new AppError('Erro interno do servidor ao desarquivar disciplina', 500));
  }
});

// Get archived subjects
const getArchivedSubjects = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);
  
  const where = { userId: req.user.id, isActive: false };
  
  if (search && search.trim()) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { description: { [Op.iLike]: `%${search.trim()}%` } }
    ];
  }

  try {
    const { count, rows: subjects } = await Subject.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      order: [['updatedAt', 'DESC']]
    });

    const pagination = buildPaginationMeta(page, limit, count);

    res.json({
      success: true,
      data: {
        subjects,
        pagination
      }
    });

  } catch (error) {
    console.error('Erro ao buscar disciplinas arquivadas:', error);
    return next(new AppError('Erro ao buscar disciplinas arquivadas', 500));
  }
});

// Bulk operations
const bulkDeleteSubjects = catchAsync(async (req, res, next) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new AppError('IDs das disciplinas são obrigatórios', 400));
  }

  try {
    // Verificar se todas as disciplinas pertencem ao usuário
    const subjects = await Subject.findAll({
      where: {
        id: { [Op.in]: ids },
        userId: req.user.id
      }
    });

    if (subjects.length !== ids.length) {
      return next(new AppError('Algumas disciplinas não foram encontradas', 400));
    }

    // Verificar se alguma disciplina tem questões ou provas
    const [questionsCount, examsCount] = await Promise.all([
      Question.count({ where: { subjectId: { [Op.in]: ids } } }),
      Exam.count({ where: { subjectId: { [Op.in]: ids } } })
    ]);

    if (questionsCount > 0 || examsCount > 0) {
      return next(new AppError('Não é possível excluir disciplinas que possuem questões ou provas', 400));
    }

    await Subject.destroy({
      where: {
        id: { [Op.in]: ids },
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      message: `${subjects.length} disciplina(s) excluída(s) com sucesso`
    });

  } catch (error) {
    console.error('Erro ao excluir disciplinas em lote:', error);
    return next(new AppError('Erro interno do servidor ao excluir disciplinas', 500));
  }
});

const bulkArchiveSubjects = catchAsync(async (req, res, next) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new AppError('IDs das disciplinas são obrigatórios', 400));
  }

  try {
    const [affectedCount] = await Subject.update(
      { isActive: false },
      {
        where: {
          id: { [Op.in]: ids },
          userId: req.user.id
        }
      }
    );

    res.json({
      success: true,
      message: `${affectedCount} disciplina(s) arquivada(s) com sucesso`
    });

  } catch (error) {
    console.error('Erro ao arquivar disciplinas em lote:', error);
    return next(new AppError('Erro interno do servidor ao arquivar disciplinas', 500));
  }
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
  checkExamRequirements,
  duplicateSubject,
  archiveSubject,
  unarchiveSubject,
  getArchivedSubjects,
  bulkDeleteSubjects,
  bulkArchiveSubjects
};