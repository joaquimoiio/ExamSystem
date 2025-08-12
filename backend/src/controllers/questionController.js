const { Question, Subject, User } = require('../models')
const { catchAsync } = require('../utils/catchAsync')
const { AppError } = require('../utils/AppError')
const { Op, sequelize } = require('sequelize')
const winston = require('winston')

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'question-controller.log' })
  ]
})

/**
 * Get questions with advanced filtering and pagination
 */
const getQuestions = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    difficulty,
    subjectId,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    includeInactive = 'false'
  } = req.query
  
  const userId = req.user.id
  const offset = (page - 1) * limit

  // Build where clause
  const where = { userId }

  if (includeInactive === 'false') {
    where.isActive = true
  }

  if (search) {
    where.text = { [Op.iLike]: `%${search}%` }
  }

  if (difficulty) {
    where.difficulty = difficulty
  }

  if (subjectId) {
    where.subjectId = subjectId
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags]
    where.tags = { [Op.overlap]: tagArray }
  }

  // Validate sort parameters
  const allowedSortFields = ['createdAt', 'updatedAt', 'difficulty', 'timesUsed', 'text']
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
  const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  try {
    const { count, rows: questions } = await Question.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[finalSortBy, finalSortOrder]],
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ],
      distinct: true
    })

    // Get aggregated statistics
    const allQuestions = await Question.findAll({
      where: { userId, isActive: true },
      attributes: ['difficulty', 'tags', 'subjectId']
    })

    const stats = {
      total: count,
      byDifficulty: {
        easy: allQuestions.filter(q => q.difficulty === 'easy').length,
        medium: allQuestions.filter(q => q.difficulty === 'medium').length,
        hard: allQuestions.filter(q => q.difficulty === 'hard').length
      },
      bySubject: {},
      popularTags: {}
    }

    // Calculate subject distribution
    allQuestions.forEach(q => {
      stats.bySubject[q.subjectId] = (stats.bySubject[q.subjectId] || 0) + 1
    })

    // Calculate tag frequency
    allQuestions.forEach(q => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(tag => {
          stats.popularTags[tag] = (stats.popularTags[tag] || 0) + 1
        })
      }
    })

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
    })

  } catch (error) {
    logger.error('Error fetching questions:', error)
    throw new AppError('Erro ao buscar questões', 500)
  }
})

/**
 * Get single question with full details
 */
const getQuestion = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

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
    })

    if (!question) {
      throw new AppError('Questão não encontrada', 404)
    }

    res.json({
      success: true,
      data: { question }
    })

  } catch (error) {
    logger.error('Error fetching question:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao buscar questão', 500)
  }
})

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
  } = req.body
  const userId = req.user.id

  try {
    // Validate required fields
    if (!text || !text.trim()) {
      throw new AppError('Texto da questão é obrigatório', 400)
    }

    if (!alternatives || !Array.isArray(alternatives) || alternatives.length < 2) {
      throw new AppError('A questão deve ter pelo menos 2 alternativas', 400)
    }

    if (alternatives.length > 5) {
      throw new AppError('A questão pode ter no máximo 5 alternativas', 400)
    }

    if (correctAnswer === undefined || correctAnswer === null || correctAnswer < 0 || correctAnswer >= alternatives.length) {
      throw new AppError('Resposta correta inválida', 400)
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new AppError('Nível de dificuldade inválido', 400)
    }

    // Verify subject ownership
    const subject = await Subject.findOne({
      where: { id: subjectId, userId }
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    // Validate alternatives
    const cleanAlternatives = alternatives.map(alt => {
      if (typeof alt === 'string') {
        return { text: alt.trim() }
      } else if (alt && typeof alt === 'object' && alt.text) {
        return { 
          text: alt.text.trim(),
          explanation: alt.explanation?.trim()
        }
      } else {
        throw new AppError('Formato de alternativa inválido', 400)
      }
    })

    // Check for duplicate alternatives
    const alternativeTexts = cleanAlternatives.map(alt => alt.text.toLowerCase())
    const uniqueTexts = new Set(alternativeTexts)
    if (uniqueTexts.size !== alternativeTexts.length) {
      throw new AppError('Alternativas duplicadas não são permitidas', 400)
    }

    // Validate tags
    let cleanTags = []
    if (tags && Array.isArray(tags)) {
      cleanTags = tags
        .filter(tag => tag && typeof tag === 'string')
        .map(tag => tag.trim().toLowerCase())
        .filter((tag, index, arr) => tag && arr.indexOf(tag) === index) // Remove duplicates
        .slice(0, 10) // Limit to 10 tags
    }

    // Validate points
    const questionPoints = parseFloat(points)
    if (isNaN(questionPoints) || questionPoints < 0.1 || questionPoints > 10) {
      throw new AppError('Pontuação deve estar entre 0.1 e 10', 400)
    }

    // Create question
    const question = await Question.create({
      text: text.trim(),
      alternatives: cleanAlternatives,
      correctAnswer: parseInt(correctAnswer),
      difficulty,
      subjectId,
      userId,
      tags: cleanTags,
      explanation: explanation?.trim(),
      points: questionPoints,
      timeEstimate: timeEstimate ? parseInt(timeEstimate) : null,
      isActive: true,
      timesUsed: 0,
      metadata: {
        createdBy: req.user.name,
        createdAt: new Date(),
        version: 1
      }
    })

    // Fetch complete question data for response
    const createdQuestion = await Question.findByPk(question.id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ]
    })

    logger.info(`Question created: ${question.id}`, { 
      userId, 
      subjectId, 
      difficulty 
    })

    res.status(201).json({
      success: true,
      message: 'Questão criada com sucesso',
      data: { question: createdQuestion }
    })

  } catch (error) {
    logger.error('Error creating question:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao criar questão', 500)
  }
})

/**
 * Update question with validation and versioning
 */
const updateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params
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
  } = req.body
  const userId = req.user.id

  try {
    const question = await Question.findOne({
      where: { id, userId }
    })

    if (!question) {
      throw new AppError('Questão não encontrada', 404)
    }

    // Check if question is being used in published exams
    if (question.timesUsed > 0 && !req.body.allowUpdateUsed) {
      throw new AppError('Questão em uso não pode ser editada. Use allowUpdateUsed=true para forçar.', 400)
    }

    const updateData = {}

    // Validate and update text
    if (text !== undefined) {
      if (!text.trim()) {
        throw new AppError('Texto da questão não pode estar vazio', 400)
      }
      updateData.text = text.trim()
    }

    // Validate and update alternatives
    if (alternatives !== undefined) {
      if (!Array.isArray(alternatives) || alternatives.length < 2) {
        throw new AppError('A questão deve ter pelo menos 2 alternativas', 400)
      }

      if (alternatives.length > 5) {
        throw new AppError('A questão pode ter no máximo 5 alternativas', 400)
      }

      const cleanAlternatives = alternatives.map(alt => {
        if (typeof alt === 'string') {
          return { text: alt.trim() }
        } else if (alt && typeof alt === 'object' && alt.text) {
          return { 
            text: alt.text.trim(),
            explanation: alt.explanation?.trim()
          }
        } else {
          throw new AppError('Formato de alternativa inválido', 400)
        }
      })

      // Check for duplicate alternatives
      const alternativeTexts = cleanAlternatives.map(alt => alt.text.toLowerCase())
      const uniqueTexts = new Set(alternativeTexts)
      if (uniqueTexts.size !== alternativeTexts.length) {
        throw new AppError('Alternativas duplicadas não são permitidas', 400)
      }

      updateData.alternatives = cleanAlternatives
    }

    // Validate correct answer
    if (correctAnswer !== undefined) {
      const alts = alternatives || question.alternatives
      if (correctAnswer < 0 || correctAnswer >= alts.length) {
        throw new AppError('Resposta correta inválida', 400)
      }
      updateData.correctAnswer = parseInt(correctAnswer)
    }

    // Validate difficulty
    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new AppError('Nível de dificuldade inválido', 400)
      }
      updateData.difficulty = difficulty
    }

    // Validate and update tags
    if (tags !== undefined) {
      let cleanTags = []
      if (Array.isArray(tags)) {
        cleanTags = tags
          .filter(tag => tag && typeof tag === 'string')
          .map(tag => tag.trim().toLowerCase())
          .filter((tag, index, arr) => tag && arr.indexOf(tag) === index)
          .slice(0, 10)
      }
      updateData.tags = cleanTags
    }

    // Update explanation
    if (explanation !== undefined) {
      updateData.explanation = explanation?.trim()
    }

    // Validate points
    if (points !== undefined) {
      const questionPoints = parseFloat(points)
      if (isNaN(questionPoints) || questionPoints < 0.1 || questionPoints > 10) {
        throw new AppError('Pontuação deve estar entre 0.1 e 10', 400)
      }
      updateData.points = questionPoints
    }

    // Update time estimate
    if (timeEstimate !== undefined) {
      updateData.timeEstimate = timeEstimate ? parseInt(timeEstimate) : null
    }

    // Update active status
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    // Update metadata
    updateData.metadata = {
      ...question.metadata,
      lastModifiedBy: req.user.name,
      lastModifiedAt: new Date(),
      version: (question.metadata?.version || 1) + 1
    }

    await question.update(updateData)

    // Fetch updated question
    const updatedQuestion = await Question.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ]
    })

    logger.info(`Question updated: ${id}`, { 
      userId, 
      changes: Object.keys(updateData) 
    })

    res.json({
      success: true,
      message: 'Questão atualizada com sucesso',
      data: { question: updatedQuestion }
    })

  } catch (error) {
    logger.error('Error updating question:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao atualizar questão', 500)
  }
})

/**
 * Delete question (soft delete)
 */
const deleteQuestion = catchAsync(async (req, res) => {
  const { id } = req.params
  const { force = false } = req.query
  const userId = req.user.id

  try {
    const question = await Question.findOne({
      where: { id, userId }
    })

    if (!question) {
      throw new AppError('Questão não encontrada', 404)
    }

    // Check if question is being used
    if (question.timesUsed > 0 && !force) {
      throw new AppError(
        `Esta questão foi usada ${question.timesUsed} vez${question.timesUsed !== 1 ? 'es' : ''} em provas. Use force=true para excluir mesmo assim.`,
        400
      )
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
      })
    } else {
      // Hard delete for unused questions
      await question.destroy()
    }

    logger.info(`Question deleted: ${id}`, { userId, force })

    res.json({
      success: true,
      message: 'Questão excluída com sucesso'
    })

  } catch (error) {
    logger.error('Error deleting question:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao excluir questão', 500)
  }
})

/**
 * Bulk create questions from import
 */
const bulkCreateQuestions = catchAsync(async (req, res) => {
  const { questions, subjectId, validateOnly = false } = req.body
  const userId = req.user.id

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new AppError('Lista de questões é obrigatória', 400)
  }

  if (questions.length > 100) {
    throw new AppError('Máximo de 100 questões por importação', 400)
  }

  try {
    // Verify subject ownership
    const subject = await Subject.findOne({
      where: { id: subjectId, userId }
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    const results = []
    const errors = []

    // Validate all questions first
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i]
      
      try {
        // Validate required fields
        if (!questionData.text || !questionData.text.trim()) {
          throw new Error('Texto da questão é obrigatório')
        }

        if (!questionData.alternatives || !Array.isArray(questionData.alternatives) || questionData.alternatives.length < 2) {
          throw new Error('Pelo menos 2 alternativas são obrigatórias')
        }

        if (questionData.alternatives.length > 5) {
          throw new Error('Máximo de 5 alternativas permitidas')
        }

        if (questionData.correctAnswer === undefined || 
            questionData.correctAnswer < 0 || 
            questionData.correctAnswer >= questionData.alternatives.length) {
          throw new Error('Resposta correta inválida')
        }

        if (!['easy', 'medium', 'hard'].includes(questionData.difficulty)) {
          throw new Error('Nível de dificuldade inválido')
        }

        results.push({
          index: i,
          status: 'valid',
          data: questionData
        })

      } catch (validationError) {
        errors.push({
          index: i,
          error: validationError.message,
          data: questionData
        })
      }
    }

    // If validation only, return results
    if (validateOnly) {
      return res.json({
        success: true,
        data: {
          validQuestions: results.length,
          invalidQuestions: errors.length,
          totalQuestions: questions.length,
          errors,
          readyForImport: errors.length === 0
        }
      })
    }

    // Stop if there are validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${errors.length} questão${errors.length !== 1 ? 'ões' : ''} com erro${errors.length !== 1 ? 's' : ''}`,
        data: { errors }
      })
    }

    // Create questions in transaction
    const createdQuestions = await sequelize.transaction(async (transaction) => {
      const questionPromises = results.map(result => {
        const questionData = result.data
        
        return Question.create({
          text: questionData.text.trim(),
          alternatives: questionData.alternatives.map(alt => 
            typeof alt === 'string' ? { text: alt.trim() } : alt
          ),
          correctAnswer: questionData.correctAnswer,
          difficulty: questionData.difficulty,
          subjectId,
          userId,
          tags: questionData.tags || [],
          explanation: questionData.explanation?.trim(),
          points: questionData.points || 1,
          timeEstimate: questionData.timeEstimate,
          isActive: true,
          timesUsed: 0,
          metadata: {
            createdBy: req.user.name,
            createdAt: new Date(),
            importedAt: new Date(),
            version: 1
          }
        }, { transaction })
      })

      return Promise.all(questionPromises)
    })

    logger.info(`Bulk questions created: ${createdQuestions.length}`, { 
      userId, 
      subjectId 
    })

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} questão${createdQuestions.length !== 1 ? 'ões' : ''} importada${createdQuestions.length !== 1 ? 's' : ''} com sucesso`,
      data: {
        questionsCreated: createdQuestions.length,
        questions: createdQuestions.map(q => ({
          id: q.id,
          text: q.text.substring(0, 100) + (q.text.length > 100 ? '...' : ''),
          difficulty: q.difficulty
        }))
      }
    })

  } catch (error) {
    logger.error('Error in bulk create questions:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro na importação em lote', 500)
  }
})

/**
 * Get question statistics
 */
const getQuestionStats = catchAsync(async (req, res) => {
  const userId = req.user.id

  try {
    const questions = await Question.findAll({
      where: { userId, isActive: true },
      attributes: ['difficulty', 'timesUsed', 'points', 'createdAt', 'subjectId'],
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['name']
        }
      ]
    })

    const stats = {
      total: questions.length,
      byDifficulty: {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length
      },
      usage: {
        totalUsage: questions.reduce((sum, q) => sum + q.timesUsed, 0),
        averageUsage: questions.length > 0 ? 
          Math.round(questions.reduce((sum, q) => sum + q.timesUsed, 0) / questions.length) : 0,
        unused: questions.filter(q => q.timesUsed === 0).length,
        mostUsed: questions.reduce((max, q) => 
          q.timesUsed > max.timesUsed ? q : max, 
          { timesUsed: 0 }
        )
      },
      points: {
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        averagePoints: questions.length > 0 ? 
          Math.round((questions.reduce((sum, q) => sum + q.points, 0) / questions.length) * 100) / 100 : 0
      },
      creation: {
        thisWeek: questions.filter(q => 
          new Date(q.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        thisMonth: questions.filter(q => 
          new Date(q.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length
      }
    }

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    logger.error('Error getting question statistics:', error)
    throw new AppError('Erro ao obter estatísticas das questões', 500)
  }
})

/**
 * Duplicate question
 */
const duplicateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params
  const { subjectId: newSubjectId } = req.body
  const userId = req.user.id

  try {
    const originalQuestion = await Question.findOne({
      where: { id, userId }
    })

    if (!originalQuestion) {
      throw new AppError('Questão original não encontrada', 404)
    }

    // If changing subject, verify new subject ownership
    let targetSubjectId = originalQuestion.subjectId
    if (newSubjectId && newSubjectId !== originalQuestion.subjectId) {
      const newSubject = await Subject.findOne({
        where: { id: newSubjectId, userId }
      })

      if (!newSubject) {
        throw new AppError('Nova disciplina não encontrada', 404)
      }

      targetSubjectId = newSubjectId
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
    })

    // Fetch complete duplicated question
    const createdQuestion = await Question.findByPk(duplicatedQuestion.id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ]
    })

    logger.info(`Question duplicated: ${id} -> ${duplicatedQuestion.id}`, { userId })

    res.status(201).json({
      success: true,
      message: 'Questão duplicada com sucesso',
      data: { question: createdQuestion }
    })

  } catch (error) {
    logger.error('Error duplicating question:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao duplicar questão', 500)
  }
})

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
  getQuestionStats,
  duplicateQuestion
}