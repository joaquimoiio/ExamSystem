// backend/src/controllers/subjectController.js

const { Subject, Question, Exam } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { Op } = require('sequelize');

// Função auxiliar para verificar autenticação
const checkAuthentication = (req, next) => {
  if (!req.user || !req.user.id) {
    console.error('❌ Usuário não autenticado:', req.user);
    return next(new AppError('Authentication required', 401));
  }
  return true;
};

// Get subjects with pagination and search
const getSubjects = catchAsync(async (req, res, next) => {
  // Verificar autenticação
  if (!checkAuthentication(req, next)) return;

  const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  
  console.log('🔍 Parâmetros de busca:', { page, limit, search, sortBy, sortOrder });
  console.log('👤 Usuário autenticado:', { id: req.user.id, email: req.user.email });

  try {
    const { limit: queryLimit, offset } = paginate(page, limit);
    
    const where = { userId: req.user.id };
    
    // Add search filter
    if (search && search.trim()) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } }
      ];
    }

    console.log('🔍 Condições de busca:', where);

    // Busca básica primeiro
    const { count, rows: subjects } = await Subject.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: ['id', 'name', 'description', 'color', 'code', 'credits', 'isActive', 'createdAt', 'updatedAt']
    });

    console.log(`✅ Encontradas ${count} disciplinas, retornando ${subjects.length}`);

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
            }).catch(() => {
              console.warn(`⚠️ Erro ao contar questões da disciplina ${subject.id}`);
              return 0;
            }),
            Exam.count({ 
              where: { 
                subjectId: subject.id 
              } 
            }).catch(() => {
              console.warn(`⚠️ Erro ao contar provas da disciplina ${subject.id}`);
              return 0;
            })
          ]);

          return {
            ...subject.toJSON(),
            questionsCount,
            examsCount
          };
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar contagens para disciplina ${subject.id}:`, error.message);
          return {
            ...subject.toJSON(),
            questionsCount: 0,
            examsCount: 0
          };
        }
      })
    );

    const pagination = buildPaginationMeta(page, limit, count);

    console.log('📊 Metadados de paginação:', pagination);

    res.json({
      success: true,
      data: {
        subjects: subjectsWithCounts,
        pagination
      }
    });

  } catch (error) {
    console.error('❌ Erro em getSubjects:', error);
    
    // Resposta de fallback em caso de erro
    const fallbackPagination = buildPaginationMeta(1, 10, 0);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar disciplinas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: {
        subjects: [],
        pagination: fallbackPagination
      }
    });
  }
});

// Get subjects statistics for dashboard
const getSubjectsStats = catchAsync(async (req, res, next) => {
  // Verificar autenticação
  if (!checkAuthentication(req, next)) return;

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
    console.error('❌ Erro em getSubjectsStats:', error);
    return next(new AppError('Erro ao buscar estatísticas', 500));
  }
});

// Create new subject
const createSubject = catchAsync(async (req, res, next) => {
  // Verificar autenticação
  if (!checkAuthentication(req, next)) return;

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
    console.error('❌ Erro ao criar disciplina:', error);
    
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
  // Verificar autenticação
  if (!checkAuthentication(req, next)) return;

  const { id } = req.params;
  
  try {
    const subject = await Subject.findOne({
      where: {
        id,
        userId: req.user.id // Garantir que o usuário só acessa suas próprias disciplinas
      }
    });
    
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
    console.error('❌ Erro ao buscar disciplina:', error);
    return next(new AppError('Erro ao buscar disciplina', 500));
  }
});

// Update subject
const updateSubject = catchAsync(async (req, res, next) => {
  // Verificar autenticação
  if (!checkAuthentication(req, next)) return;

  const { id } = req.params;
  const { name, description, color, code, credits, isActive } = req.body;
  
  try {
    const subject = await Subject.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    
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
    console.error('❌ Erro ao atualizar disciplina:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return next(new AppError(`Erro de validação: ${validationErrors}`, 400));
    }
    
    return next(new AppError('Erro interno do servidor ao atualizar disciplina', 500));
  }
});

// Delete subject
const deleteSubject = catchAsync(async (req, res, next) => {
  // Verificar autenticação
  if (!checkAuthentication(req, next)) return;

  const { id } = req.params;
  
  try {
    const subject = await Subject.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    
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
    console.error('❌ Erro ao excluir disciplina:', error);
    return next(new AppError('Erro interno do servidor ao excluir disciplina', 500));
  }
});

// Export all functions
module.exports = {
  getSubjects,
  getSubjectsStats,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject
};