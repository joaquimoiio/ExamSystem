// backend/src/controllers/subjectController.js
const { Subject, Question, Exam } = require('../models');
const { AppError, catchAsync } = require('../utils/appError');
const { Op } = require('sequelize');

// Função auxiliar para verificar autenticação
const checkAuthentication = (req, next) => {
  if (!req.user || !req.user.userId) {
    next(new AppError('Usuário não autenticado', 401));
    return false;
  }
  return true;
};

// Função auxiliar para validar dados da disciplina
const validateSubjectData = (data) => {
  const errors = [];
  
  if (!data.name || !data.name.trim()) {
    errors.push('Nome da disciplina é obrigatório');
  }
  
  if (data.name && (data.name.trim().length < 2 || data.name.trim().length > 100)) {
    errors.push('Nome deve ter entre 2 e 100 caracteres');
  }
  
  if (!data.color || !/^#[0-9A-F]{6}$/i.test(data.color)) {
    errors.push('Cor é obrigatória e deve estar no formato hexadecimal (#RRGGBB)');
  }
  
  if (data.description && data.description.length > 500) {
    errors.push('Descrição deve ter no máximo 500 caracteres');
  }
  
  return errors;
};

// Get all subjects with pagination and filters
const getSubjects = catchAsync(async (req, res, next) => {
  console.log('🔍 Iniciando getSubjects...');
  
  if (!checkAuthentication(req, next)) return;

  const userId = req.user.id;
  console.log('👤 Usuário ID:', userId);

  // Parâmetros de paginação e filtros
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const isActive = req.query.isActive;
  
  console.log('📋 Parâmetros:', { page, limit, offset, search, isActive });

  // Construir condições da consulta
  const whereConditions = { userId };
  
  if (search) {
    whereConditions[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (isActive !== undefined) {
    whereConditions.isActive = isActive === 'true';
  }

  try {
    console.log('🔍 Buscando disciplinas com condições:', whereConditions);

    // Buscar disciplinas com contagens
    const { count, rows: subjects } = await Subject.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: {
        include: [
          // Subconsulta para contar questões
          [
            Subject.sequelize.literal(`(
              SELECT COUNT(*)
              FROM questions
              WHERE questions."subjectId" = "Subject"."id"
              AND questions."isActive" = true
            )`),
            'questionsCount'
          ],
          // Subconsulta para contar provas
          [
            Subject.sequelize.literal(`(
              SELECT COUNT(*)
              FROM exams
              WHERE exams."subjectId" = "Subject"."id"
            )`),
            'examsCount'
          ]
        ]
      }
    });

    console.log('✅ Disciplinas encontradas:', subjects.length);

    // Calcular dados de paginação
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage
    };

    res.json({
      success: true,
      message: count === 0 ? 'Nenhuma disciplina encontrada' : 'Disciplinas carregadas com sucesso',
      data: {
        subjects: subjects.map(subject => ({
          ...subject.toJSON(),
          questionsCount: parseInt(subject.dataValues.questionsCount) || 0,
          examsCount: parseInt(subject.dataValues.examsCount) || 0
        })),
        pagination
      }
    });

  } catch (error) {
    console.error('❌ Erro em getSubjects:', error);
    
    // Fallback para garantir resposta mesmo com erro
    const fallbackPagination = {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: limit,
      hasNextPage: false,
      hasPrevPage: false
    };

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      data: {
        subjects: [],
        pagination: fallbackPagination
      }
    });
  }
});

// Get subjects statistics for dashboard
const getSubjectsStats = catchAsync(async (req, res, next) => {
  console.log('📊 Iniciando getSubjectsStats...');
  
  if (!checkAuthentication(req, next)) return;

  const userId = req.user.id;

  try {
    console.log('📊 Calculando estatísticas para usuário:', userId);

    const [totalSubjects, totalQuestions, totalExams] = await Promise.all([
      Subject.count({ where: { userId } }),
      Question.count({ where: { userId } }),
      Exam.count({ where: { userId } })
    ]);

    // Buscar disciplinas recentes
    const recentSubjects = await Subject.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'color', 'createdAt']
    });

    console.log('📊 Estatísticas calculadas:', {
      totalSubjects,
      totalQuestions,
      totalExams,
      recentSubjects: recentSubjects.length
    });

    res.json({
      success: true,
      data: {
        total: totalSubjects,
        totalQuestions,
        totalExams,
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
  console.log('🆕 Iniciando createSubject...');
  
  if (!checkAuthentication(req, next)) return;

  const { name, description, color, isActive } = req.body;
  const userId = req.user.id;
  
  console.log('🆕 Dados recebidos:', { name, description, color, isActive, userId });
  
  // Validar dados
  const validationErrors = validateSubjectData(req.body);
  if (validationErrors.length > 0) {
    console.log('❌ Erros de validação:', validationErrors);
    return next(new AppError(validationErrors[0], 400));
  }

  try {
    // Verificar se já existe disciplina com o mesmo nome
    const existingByName = await Subject.findOne({
      where: { 
        name: name.trim(),
        userId 
      }
    });

    if (existingByName) {
      console.log('❌ Disciplina já existe com nome:', name);
      return next(new AppError('Já existe uma disciplina com este nome', 400));
    }

    // Preparar dados para criação
    const subjectData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      userId: userId
    };

    console.log('🆕 Criando disciplina com dados:', subjectData);

    // Criar disciplina
    const subject = await Subject.create(subjectData);

    console.log('✅ Disciplina criada com sucesso:', {
      id: subject.id,
      name: subject.name,
      userId: subject.userId
    });

    // Retornar disciplina criada com contagens zeradas
    const subjectWithCounts = {
      ...subject.toJSON(),
      questionsCount: 0,
      examsCount: 0
    };

    res.status(201).json({
      success: true,
      message: 'Disciplina criada com sucesso',
      data: { subject: subjectWithCounts }
    });

  } catch (error) {
    console.error('❌ Erro ao criar disciplina:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return next(new AppError(`Erro de validação: ${validationErrors}`, 400));
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Já existe uma disciplina com estes dados', 400));
    }

    return next(new AppError('Erro interno do servidor ao criar disciplina', 500));
  }
});

// Get subject by ID
const getSubjectById = catchAsync(async (req, res, next) => {
  console.log('🔍 Iniciando getSubjectById...');
  
  if (!checkAuthentication(req, next)) return;

  const { id } = req.params;
  const userId = req.user.id;
  
  console.log('🔍 Buscando disciplina ID:', id, 'para usuário:', userId);
  
  try {
    const subject = await Subject.findOne({
      where: {
        id,
        userId
      }
    });
    
    if (!subject) {
      console.log('❌ Disciplina não encontrada');
      return next(new AppError('Disciplina não encontrada', 404));
    }

    console.log('✅ Disciplina encontrada:', subject.name);

    // Buscar contagens
    const [questionsCount, examsCount] = await Promise.all([
      Question.count({ 
        where: { 
          subjectId: id, 
          isActive: true 
        } 
      }),
      Exam.count({ 
        where: { 
          subjectId: id 
        } 
      })
    ]);

    const subjectWithCounts = {
      ...subject.toJSON(),
      questionsCount,
      examsCount
    };

    console.log('✅ Disciplina com contagens:', {
      name: subject.name,
      questionsCount,
      examsCount
    });

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
  console.log('✏️ Iniciando updateSubject...');
  
  if (!checkAuthentication(req, next)) return;

  const { id } = req.params;
  const { name, description, color, isActive } = req.body;
  const userId = req.user.id;
  
  console.log('✏️ Atualizando disciplina:', { id, userId });
  
  try {
    const subject = await Subject.findOne({
      where: {
        id,
        userId
      }
    });
    
    if (!subject) {
      console.log('❌ Disciplina não encontrada para atualização');
      return next(new AppError('Disciplina não encontrada', 404));
    }

    // Verificar nome único (se alterado)
    if (name && name.trim() !== subject.name) {
      const existingByName = await Subject.findOne({
        where: { 
          name: name.trim(),
          userId,
          id: { [Op.ne]: id }
        }
      });

      if (existingByName) {
        return next(new AppError('Já existe uma disciplina com este nome', 400));
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : '';
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    console.log('✏️ Dados para atualização:', updateData);

    await subject.update(updateData);

    console.log('✅ Disciplina atualizada com sucesso');

    // Buscar contagens atualizadas
    const [questionsCount, examsCount] = await Promise.all([
      Question.count({ 
        where: { 
          subjectId: id, 
          isActive: true 
        } 
      }),
      Exam.count({ 
        where: { 
          subjectId: id 
        } 
      })
    ]);

    const updatedSubjectWithCounts = {
      ...subject.toJSON(),
      questionsCount,
      examsCount
    };

    res.json({
      success: true,
      message: 'Disciplina atualizada com sucesso',
      data: { subject: updatedSubjectWithCounts }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar disciplina:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return next(new AppError(`Erro de validação: ${validationErrors}`, 400));
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Já existe uma disciplina com estes dados', 400));
    }

    return next(new AppError('Erro interno do servidor ao atualizar disciplina', 500));
  }
});

// Delete subject
const deleteSubject = catchAsync(async (req, res, next) => {
  console.log('🗑️ Iniciando deleteSubject...');

  if (!checkAuthentication(req, next)) return;

  const { id } = req.params;
  const userId = req.user.id;

  console.log('🗑️ Excluindo disciplina ID:', id, 'para usuário:', userId);

  try {
    const subject = await Subject.findOne({
      where: {
        id,
        userId
      }
    });

    if (!subject) {
      console.log('❌ Disciplina não encontrada para exclusão');
      return next(new AppError('Disciplina não encontrada', 404));
    }

    // Verificar quantas questões e provas serão excluídas junto
    const [questionsCount, examsCount] = await Promise.all([
      Question.count({ where: { subjectId: id } }),
      Exam.count({ where: { subjectId: id } })
    ]);

    console.log('🗑️ Excluindo disciplina:', subject.name);
    console.log(`📋 Será excluída junto com ${questionsCount} questão${questionsCount !== 1 ? 'ões' : ''} e ${examsCount} prova${examsCount !== 1 ? 's' : ''}`);

    // Excluir todas as provas da disciplina primeiro (devido ao onDelete: 'RESTRICT')
    if (examsCount > 0) {
      await Exam.destroy({
        where: { subjectId: id }
      });
      console.log(`✅ ${examsCount} prova${examsCount !== 1 ? 's' : ''} excluída${examsCount !== 1 ? 's' : ''} fisicamente`);
    }

    // Excluir todas as questões da disciplina (devido ao onDelete: 'RESTRICT')
    if (questionsCount > 0) {
      await Question.destroy({
        where: { subjectId: id }
      });
      console.log(`✅ ${questionsCount} questão${questionsCount !== 1 ? 'ões' : ''} excluída${questionsCount !== 1 ? 's' : ''} fisicamente`);
    }

    // Agora excluir a disciplina
    await subject.destroy();

    console.log('✅ Disciplina excluída com sucesso');

    // Mensagem diferente dependendo se havia questões e provas
    let message = 'Disciplina excluída com sucesso';
    if (questionsCount > 0 || examsCount > 0) {
      const parts = [];
      if (questionsCount > 0) {
        parts.push(`${questionsCount} questão${questionsCount !== 1 ? 'ões' : ''}`);
      }
      if (examsCount > 0) {
        parts.push(`${examsCount} prova${examsCount !== 1 ? 's' : ''}`);
      }
      message = `Disciplina excluída com sucesso junto com ${parts.join(' e ')}`;
    }

    res.json({
      success: true,
      message,
      data: {
        deletedQuestionsCount: questionsCount,
        deletedExamsCount: examsCount
      }
    });

  } catch (error) {
    console.error('❌ Erro ao excluir disciplina:', error);

    // Log more specific error details
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('❌ Erro de constraint de chave estrangeira:', error.message);
      return next(new AppError('Não é possível excluir a disciplina devido a restrições do banco de dados', 400));
    }

    return next(new AppError('Erro ao excluir disciplina', 500));
  }
});

module.exports = {
  getSubjects,
  getSubjectsStats,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject
};