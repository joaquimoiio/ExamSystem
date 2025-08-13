const { Question, Subject, Exam, ExamQuestion } = require('../models');
const { Op } = require('sequelize');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');
const logger = require('../utils/logger');
const Papa = require('papaparse');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get questions with filtering, pagination and statistics
 */
const getQuestions = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    subjectId,
    difficulty,
    tags,
    search,
    isActive = true,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const userId = req.user.id;

  try {
    const whereClause = { userId };

    // Apply filters
    if (subjectId) whereClause.subjectId = subjectId;
    if (difficulty) whereClause.difficulty = difficulty;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      whereClause.tags = { [Op.overlap]: tagArray };
    }

    if (search) {
      whereClause[Op.or] = [
        { text: { [Op.iLike]: `%${search}%` } },
        { explanation: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    const { count, rows: questions } = await Question.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate statistics
    const stats = {
      totalQuestions: count,
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      bySubject: {},
      popularTags: {},
      averageUsage: 0
    };

    // Calculate stats from all user questions (not just current page)
    const allQuestions = await Question.findAll({
      where: { userId, isActive: true },
      attributes: ['difficulty', 'subjectId', 'tags', 'timesUsed'],
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['name']
        }
      ]
    });

    let totalUsage = 0;
    allQuestions.forEach(q => {
      // Difficulty stats
      if (q.difficulty) stats.byDifficulty[q.difficulty]++;
      
      // Subject stats
      if (q.subject) {
        stats.bySubject[q.subject.name] = (stats.bySubject[q.subject.name] || 0) + 1;
      }
      
      // Usage stats
      totalUsage += q.timesUsed || 0;
      
      // Tags stats
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(tag => {
          stats.popularTags[tag] = (stats.popularTags[tag] || 0) + 1;
        });
      }
    });

    stats.averageUsage = allQuestions.length > 0 ? totalUsage / allQuestions.length : 0;

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        },
        statistics: stats
      }
    });

  } catch (error) {
    logger.error('Error fetching questions:', error);
    throw new AppError('Erro ao buscar questões', 500);
  }
});

/**
 * Get single question with full details
 */
const getQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
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
      throw new AppError('Questão não encontrada', 404);
    }

    res.json({
      success: true,
      data: { question }
    });

  } catch (error) {
    logger.error('Error fetching question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar questão', 500);
  }
});

/**
 * Create new question with comprehensive validation
 */
const createQuestion = catchAsync(async (req, res) => {
  const {
    text,
    alternatives,
    correctAnswer,
    difficulty,
    subjectId,
    tags = [],
    explanation,
    points = 1,
    timeEstimate
  } = req.body;
  const userId = req.user.id;

  try {
    // Validate required fields
    if (!text || !text.trim()) {
      throw new AppError('Texto da questão é obrigatório', 400);
    }

    if (!alternatives || !Array.isArray(alternatives) || alternatives.length < 2) {
      throw new AppError('A questão deve ter pelo menos 2 alternativas', 400);
    }

    if (alternatives.length > 5) {
      throw new AppError('A questão pode ter no máximo 5 alternativas', 400);
    }

    if (correctAnswer === undefined || correctAnswer === null || correctAnswer < 0 || correctAnswer >= alternatives.length) {
      throw new AppError('Resposta correta inválida', 400);
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new AppError('Dificuldade deve ser: easy, medium ou hard', 400);
    }

    // Verify subject ownership
    const subject = await Subject.findOne({
      where: { id: subjectId, userId }
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    // Validate alternatives content
    for (let i = 0; i < alternatives.length; i++) {
      if (!alternatives[i] || !alternatives[i].trim()) {
        throw new AppError(`Alternativa ${i + 1} não pode estar vazia`, 400);
      }
    }

    // Create question
    const question = await Question.create({
      text: text.trim(),
      alternatives,
      correctAnswer,
      difficulty,
      subjectId,
      userId,
      tags: Array.isArray(tags) ? tags : [],
      explanation: explanation ? explanation.trim() : null,
      points: points && points > 0 ? parseInt(points) : 1,
      timeEstimate: timeEstimate && timeEstimate > 0 ? parseInt(timeEstimate) : null,
      isActive: true,
      timesUsed: 0,
      metadata: {
        createdBy: req.user.name,
        createdAt: new Date(),
        version: 1
      }
    });

    // Fetch complete question data for response
    const createdQuestion = await Question.findByPk(question.id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ]
    });

    logger.info(`Question created: ${question.id}`, { 
      userId, 
      subjectId, 
      difficulty 
    });

    res.status(201).json({
      success: true,
      message: 'Questão criada com sucesso',
      data: { question: createdQuestion }
    });

  } catch (error) {
    logger.error('Error creating question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao criar questão', 500);
  }
});

/**
 * Update question with validation and versioning
 */
const updateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    text,
    alternatives,
    correctAnswer,
    difficulty,
    tags,
    explanation,
    points,
    timeEstimate,
    isActive
  } = req.body;
  const userId = req.user.id;

  try {
    const question = await Question.findOne({
      where: { id, userId }
    });

    if (!question) {
      throw new AppError('Questão não encontrada', 404);
    }

    // Check if question is being used in published exams
    if (question.timesUsed > 0 && !req.body.allowUpdateUsed) {
      throw new AppError('Questão em uso não pode ser editada. Use allowUpdateUsed=true para forçar.', 400);
    }

    // Validate fields if provided
    if (text !== undefined && (!text || !text.trim())) {
      throw new AppError('Texto da questão é obrigatório', 400);
    }

    if (alternatives !== undefined) {
      if (!Array.isArray(alternatives) || alternatives.length < 2) {
        throw new AppError('A questão deve ter pelo menos 2 alternativas', 400);
      }
      if (alternatives.length > 5) {
        throw new AppError('A questão pode ter no máximo 5 alternativas', 400);
      }
      
      // Validate alternatives content
      for (let i = 0; i < alternatives.length; i++) {
        if (!alternatives[i] || !alternatives[i].trim()) {
          throw new AppError(`Alternativa ${i + 1} não pode estar vazia`, 400);
        }
      }
    }

    if (correctAnswer !== undefined) {
      const altLength = alternatives ? alternatives.length : question.alternatives.length;
      if (correctAnswer < 0 || correctAnswer >= altLength) {
        throw new AppError('Resposta correta inválida', 400);
      }
    }

    if (difficulty !== undefined && !['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new AppError('Dificuldade deve ser: easy, medium ou hard', 400);
    }

    // Prepare update data
    const updateData = {};
    if (text !== undefined) updateData.text = text.trim();
    if (alternatives !== undefined) updateData.alternatives = alternatives;
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (explanation !== undefined) updateData.explanation = explanation ? explanation.trim() : null;
    if (points !== undefined) updateData.points = points && points > 0 ? parseInt(points) : 1;
    if (timeEstimate !== undefined) updateData.timeEstimate = timeEstimate && timeEstimate > 0 ? parseInt(timeEstimate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update metadata
    updateData.metadata = {
      ...question.metadata,
      lastModifiedBy: req.user.name,
      lastModifiedAt: new Date(),
      version: (question.metadata?.version || 1) + 1
    };

    await question.update(updateData);

    // Fetch updated question
    const updatedQuestion = await Question.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ]
    });

    logger.info(`Question updated: ${id}`, { userId });

    res.json({
      success: true,
      message: 'Questão atualizada com sucesso',
      data: { question: updatedQuestion }
    });

  } catch (error) {
    logger.error('Error updating question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar questão', 500);
  }
});

/**
 * Delete question with dependency check
 */
const deleteQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { force = false } = req.query;
  const userId = req.user.id;

  try {
    const question = await Question.findOne({
      where: { id, userId }
    });

    if (!question) {
      throw new AppError('Questão não encontrada', 404);
    }

    // Check if question is being used in exams
    if (question.timesUsed > 0 && !force) {
      throw new AppError(
        `Questão foi utilizada ${question.timesUsed} vez${question.timesUsed > 1 ? 'es' : ''} em provas. Use force=true para excluir mesmo assim.`,
        400
      );
    }

    if (force && question.timesUsed > 0) {
      // Soft delete for questions in use
      await question.update({ 
        isActive: false,
        deletedAt: new Date(),
        metadata: {
          ...question.metadata,
          deletedBy: req.user.name,
          deletedAt: new Date(),
          reason: 'force_delete'
        }
      });
    } else {
      // Hard delete for unused questions
      await question.destroy();
    }

    logger.info(`Question deleted: ${id}`, { userId, force });

    res.json({
      success: true,
      message: 'Questão excluída com sucesso'
    });

  } catch (error) {
    logger.error('Error deleting question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao excluir questão', 500);
  }
});

/**
 * Get unique tags from user's questions
 */
const getQuestionTags = catchAsync(async (req, res) => {
  const userId = req.user.id;

  try {
    const questions = await Question.findAll({
      where: { userId, isActive: true },
      attributes: ['tags']
    });

    const allTags = new Set();
    questions.forEach(question => {
      if (question.tags && Array.isArray(question.tags)) {
        question.tags.forEach(tag => allTags.add(tag));
      }
    });

    const tags = Array.from(allTags).sort();

    res.json({
      success: true,
      data: { tags }
    });

  } catch (error) {
    logger.error('Error fetching question tags:', error);
    throw new AppError('Erro ao buscar tags', 500);
  }
});

/**
 * Get questions for exam creation
 */
const getQuestionsForExam = catchAsync(async (req, res) => {
  const { 
    subjectId, 
    difficulty, 
    tags, 
    excludeUsed = false,
    limit = 50 
  } = req.query;
  const userId = req.user.id;

  try {
    const whereClause = { 
      userId, 
      isActive: true 
    };

    if (subjectId) whereClause.subjectId = subjectId;
    if (difficulty) whereClause.difficulty = difficulty;
    if (excludeUsed) whereClause.timesUsed = 0;
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      whereClause.tags = { [Op.overlap]: tagArray };
    }

    const questions = await Question.findAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { questions }
    });

  } catch (error) {
    logger.error('Error fetching questions for exam:', error);
    throw new AppError('Erro ao buscar questões para prova', 500);
  }
});

/**
 * Bulk create questions from import
 */
const bulkCreateQuestions = catchAsync(async (req, res) => {
  const { questions, subjectId, validateOnly = false } = req.body;
  const userId = req.user.id;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new AppError('Lista de questões é obrigatória', 400);
  }

  if (questions.length > 100) {
    throw new AppError('Máximo de 100 questões por importação', 400);
  }

  try {
    // Verify subject ownership
    const subject = await Subject.findOne({
      where: { id: subjectId, userId }
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    const results = [];
    const errors = [];

    // Validate all questions first
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];
      
      try {
        // Validate required fields
        if (!questionData.text || !questionData.text.trim()) {
          throw new Error('Texto da questão é obrigatório');
        }

        if (!questionData.alternatives || !Array.isArray(questionData.alternatives) || questionData.alternatives.length < 2) {
          throw new Error('Pelo menos 2 alternativas são obrigatórias');
        }

        if (questionData.alternatives.length > 5) {
          throw new Error('Máximo de 5 alternativas permitidas');
        }

        if (questionData.correctAnswer === undefined || 
            questionData.correctAnswer < 0 || 
            questionData.correctAnswer >= questionData.alternatives.length) {
          throw new Error('Resposta correta inválida');
        }

        if (!['easy', 'medium', 'hard'].includes(questionData.difficulty)) {
          throw new Error('Dificuldade deve ser: easy, medium ou hard');
        }

        // Validate alternatives content
        for (let j = 0; j < questionData.alternatives.length; j++) {
          if (!questionData.alternatives[j] || !questionData.alternatives[j].trim()) {
            throw new Error(`Alternativa ${j + 1} não pode estar vazia`);
          }
        }

        results.push({
          index: i,
          valid: true,
          data: questionData
        });

      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          data: questionData
        });
      }
    }

    // If validation only, return results
    if (validateOnly) {
      return res.json({
        success: true,
        data: {
          valid: results.length,
          invalid: errors.length,
          results,
          errors
        }
      });
    }

    // If there are errors, don't proceed with creation
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${errors.length} questões inválidas encontradas`,
        data: {
          valid: results.length,
          invalid: errors.length,
          errors
        }
      });
    }

    // Create questions in bulk
    const createdQuestions = [];
    for (const result of results) {
      const questionData = result.data;
      
      const question = await Question.create({
        text: questionData.text.trim(),
        alternatives: questionData.alternatives,
        correctAnswer: questionData.correctAnswer,
        difficulty: questionData.difficulty,
        subjectId,
        userId,
        tags: Array.isArray(questionData.tags) ? questionData.tags : [],
        explanation: questionData.explanation ? questionData.explanation.trim() : null,
        points: questionData.points && questionData.points > 0 ? parseInt(questionData.points) : 1,
        timeEstimate: questionData.timeEstimate && questionData.timeEstimate > 0 ? parseInt(questionData.timeEstimate) : null,
        isActive: true,
        timesUsed: 0,
        metadata: {
          createdBy: req.user.name,
          createdAt: new Date(),
          version: 1,
          importedAt: new Date()
        }
      });

      createdQuestions.push(question);
    }

    logger.info(`Bulk created ${createdQuestions.length} questions`, { userId, subjectId });

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} questões criadas com sucesso`,
      data: {
        created: createdQuestions.length,
        questions: createdQuestions
      }
    });

  } catch (error) {
    logger.error('Error bulk creating questions:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao criar questões em lote', 500);
  }
});

/**
 * Duplicate question
 */
const duplicateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { subjectId: newSubjectId } = req.body;
  const userId = req.user.id;

  try {
    const originalQuestion = await Question.findOne({
      where: { id, userId }
    });

    if (!originalQuestion) {
      throw new AppError('Questão não encontrada', 404);
    }

    // If changing subject, verify new subject ownership
    let targetSubjectId = originalQuestion.subjectId;
    if (newSubjectId && newSubjectId !== originalQuestion.subjectId) {
      const newSubject = await Subject.findOne({
        where: { id: newSubjectId, userId }
      });

      if (!newSubject) {
        throw new AppError('Nova disciplina não encontrada', 404);
      }

      targetSubjectId = newSubjectId;
    }

    const duplicatedQuestion = await Question.create({
      text: originalQuestion.text,
      alternatives: originalQuestion.alternatives,
      correctAnswer: originalQuestion.correctAnswer,
      difficulty: originalQuestion.difficulty,
      subjectId: targetSubjectId,
      userId,
      tags: originalQuestion.tags,
      explanation: originalQuestion.explanation,
      points: originalQuestion.points,
      timeEstimate: originalQuestion.timeEstimate,
      isActive: true,
      timesUsed: 0, // Reset usage for duplicate
      metadata: {
        ...originalQuestion.metadata,
        duplicatedFrom: originalQuestion.id,
        duplicatedAt: new Date(),
        duplicatedBy: req.user.name
      }
    });

    // Fetch complete duplicated question
    const createdQuestion = await Question.findByPk(duplicatedQuestion.id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ]
    });

    logger.info(`Question duplicated: ${id} -> ${duplicatedQuestion.id}`, { userId });

    res.status(201).json({
      success: true,
      message: 'Questão duplicada com sucesso',
      data: { question: createdQuestion }
    });

  } catch (error) {
    logger.error('Error duplicating question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao duplicar questão', 500);
  }
});

/**
 * Import questions from file
 */
const importQuestions = catchAsync(async (req, res) => {
  const { subjectId } = req.body;
  const userId = req.user.id;

  if (!req.file) {
    throw new AppError('Arquivo é obrigatório', 400);
  }

  try {
    // Verify subject ownership
    const subject = await Subject.findOne({
      where: { id: subjectId, userId }
    });

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404);
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let questions = [];

    // Parse different file formats
    if (fileExtension === '.csv') {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsed = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
      });

      questions = parsed.data.map(row => ({
        text: row.text || row.question,
        alternatives: [
          row.alternative1 || row.a,
          row.alternative2 || row.b,
          row.alternative3 || row.c,
          row.alternative4 || row.d,
          row.alternative5 || row.e
        ].filter(alt => alt && alt.trim()),
        correctAnswer: parseInt(row.correctAnswer || row.correct) || 0,
        difficulty: row.difficulty || 'medium',
        tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
        explanation: row.explanation || '',
        points: parseInt(row.points) || 1
      }));
    } else if (fileExtension === '.json') {
      const fileContent = await fs.readFile(filePath, 'utf8');
      questions = JSON.parse(fileContent);
    } else {
      throw new AppError('Formato de arquivo não suportado. Use CSV ou JSON.', 400);
    }

    // Clean up uploaded file
    await fs.unlink(filePath);

    // Validate and create questions
    const result = await bulkCreateQuestions.bind(this)({
      ...req,
      body: { questions, subjectId, validateOnly: false }
    }, res);

    return result;

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }
    }

    logger.error('Error importing questions:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao importar questões', 500);
  }
});

/**
 * Export questions to file
 */
const exportQuestions = catchAsync(async (req, res) => {
  const { 
    subjectId, 
    difficulty, 
    tags, 
    format = 'csv' 
  } = req.query;
  const userId = req.user.id;

  try {
    const whereClause = { userId, isActive: true };

    if (subjectId) whereClause.subjectId = subjectId;
    if (difficulty) whereClause.difficulty = difficulty;
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      whereClause.tags = { [Op.overlap]: tagArray };
    }

    const questions = await Question.findAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (format === 'csv') {
      const csvData = questions.map(q => ({
        text: q.text,
        alternative1: q.alternatives[0] || '',
        alternative2: q.alternatives[1] || '',
        alternative3: q.alternatives[2] || '',
        alternative4: q.alternatives[3] || '',
        alternative5: q.alternatives[4] || '',
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        subject: q.subject?.name || '',
        tags: q.tags ? q.tags.join(',') : '',
        explanation: q.explanation || '',
        points: q.points,
        timesUsed: q.timesUsed
      }));

      const csv = Papa.unparse(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=questions.json');
      res.json({
        exportedAt: new Date().toISOString(),
        totalQuestions: questions.length,
        questions: questions.map(q => ({
          text: q.text,
          alternatives: q.alternatives,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          subject: q.subject?.name || '',
          tags: q.tags || [],
          explanation: q.explanation || '',
          points: q.points,
          metadata: q.metadata
        }))
      });
    }

  } catch (error) {
    logger.error('Error exporting questions:', error);
    throw new AppError('Erro ao exportar questões', 500);
  }
});

/**
 * Get question statistics
 */
const getQuestionStats = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const question = await Question.findOne({
      where: { id, userId }
    });

    if (!question) {
      throw new AppError('Questão não encontrada', 404);
    }

    // Get usage statistics from exams
    const examUsage = await ExamQuestion.findAll({
      where: { questionId: id },
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'status', 'createdAt']
        }
      ]
    });

    const stats = {
      question: {
        id: question.id,
        timesUsed: question.timesUsed,
        difficulty: question.difficulty,
        tags: question.tags || []
      },
      usage: {
        totalExams: examUsage.length,
        activeExams: examUsage.filter(eu => eu.exam.status === 'published').length,
        draftExams: examUsage.filter(eu => eu.exam.status === 'draft').length
      },
      exams: examUsage.map(eu => ({
        id: eu.exam.id,
        title: eu.exam.title,
        status: eu.exam.status,
        createdAt: eu.exam.createdAt
      }))
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    logger.error('Error fetching question stats:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar estatísticas da questão', 500);
  }
});

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionTags,
  getQuestionsForExam,
  bulkCreateQuestions,
  duplicateQuestion,
  importQuestions,
  exportQuestions,
  getQuestionStats
};