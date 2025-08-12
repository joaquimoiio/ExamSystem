const { Subject, Question, User, Exam } = require('../models')
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
    new winston.transports.File({ filename: 'subject-controller.log' })
  ]
})

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
  } = req.query
  
  const userId = req.user.id
  const offset = (page - 1) * limit

  // Build where clause
  const where = { userId }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ]
  }

  // Validate sort parameters
  const allowedSortFields = ['name', 'createdAt', 'updatedAt']
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'
  const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC'

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
    })

    // Calculate statistics for each subject
    const subjectsWithStats = await Promise.all(subjects.map(async (subject) => {
      const questions = subject.questions || []
      
      // Basic question counts
      const questionsCount = questions.length
      const easyCount = questions.filter(q => q.difficulty === 'easy').length
      const mediumCount = questions.filter(q => q.difficulty === 'medium').length
      const hardCount = questions.filter(q => q.difficulty === 'hard').length

      // Enhanced statistics if requested
      let enhancedStats = {}
      if (includeStats === 'true') {
        const examCount = await Exam.count({ where: { subjectId: subject.id } })
        const publishedExamCount = await Exam.count({ 
          where: { subjectId: subject.id, isPublished: true } 
        })

        enhancedStats = {
          examCount,
          publishedExamCount,
          canCreateExam: questionsCount >= 5, // Minimum questions for exam
          lastQuestionAdded: questions.length > 0 ? 
            Math.max(...questions.map(q => new Date(q.createdAt).getTime())) : null,
          questionDistributionBalance: calculateDistributionBalance(easyCount, mediumCount, hardCount)
        }
      }

      return {
        id: subject.id,
        name: subject.name,
        description: subject.description,
        color: subject.color,
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
        questionsCount,
        easyQuestionsCount: easyCount,
        mediumQuestionsCount: mediumCount,
        hardQuestionsCount: hardCount,
        ...enhancedStats
      }
    }))

    res.json({
      success: true,
      data: {
        subjects: subjectsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        },
        summary: {
          total: count,
          totalQuestions: subjectsWithStats.reduce((sum, s) => sum + s.questionsCount, 0),
          avgQuestionsPerSubject: count > 0 ? Math.round(
            subjectsWithStats.reduce((sum, s) => sum + s.questionsCount, 0) / count
          ) : 0
        }
      }
    })

  } catch (error) {
    logger.error('Error fetching subjects:', error)
    throw new AppError('Erro ao buscar disciplinas', 500)
  }
})

/**
 * Calculate distribution balance score for questions
 */
const calculateDistributionBalance = (easy, medium, hard) => {
  const total = easy + medium + hard
  if (total === 0) return 0

  const idealRatio = { easy: 0.4, medium: 0.4, hard: 0.2 }
  const actualRatio = {
    easy: easy / total,
    medium: medium / total,
    hard: hard / total
  }

  // Calculate deviation from ideal
  const deviation = Math.abs(actualRatio.easy - idealRatio.easy) +
                   Math.abs(actualRatio.medium - idealRatio.medium) +
                   Math.abs(actualRatio.hard - idealRatio.hard)

  // Convert to score (0-100, where 100 is perfect balance)
  return Math.max(0, Math.round((1 - deviation) * 100))
}

/**
 * Get single subject with detailed information
 */
const getSubject = catchAsync(async (req, res) => {
  const { id } = req.params
  const { includeQuestions = 'false' } = req.query
  const userId = req.user.id

  try {
    const includeOptions = [
      {
        model: Question,
        as: 'questions',
        where: { isActive: true },
        required: false,
        attributes: includeQuestions === 'true' ? 
          ['id', 'text', 'difficulty', 'alternatives', 'correctAnswer', 'tags', 'createdAt', 'timesUsed'] :
          ['id', 'difficulty', 'createdAt']
      }
    ]

    const subject = await Subject.findOne({
      where: { id, userId },
      include: includeOptions
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    // Calculate detailed statistics
    const questions = subject.questions || []
    const stats = {
      totalQuestions: questions.length,
      byDifficulty: {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length
      },
      distributionBalance: calculateDistributionBalance(
        questions.filter(q => q.difficulty === 'easy').length,
        questions.filter(q => q.difficulty === 'medium').length,
        questions.filter(q => q.difficulty === 'hard').length
      ),
      averageUsage: questions.length > 0 ? 
        Math.round(questions.reduce((sum, q) => sum + (q.timesUsed || 0), 0) / questions.length) : 0,
      recentlyAdded: questions.filter(q => 
        new Date(q.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }

    // Get exam count
    const examCount = await Exam.count({ where: { subjectId: id } })

    res.json({
      success: true,
      data: { 
        subject: {
          ...subject.toJSON(),
          statistics: stats,
          examCount,
          canCreateExam: questions.length >= 5
        }
      }
    })

  } catch (error) {
    logger.error('Error fetching subject:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao buscar disciplina', 500)
  }
})

/**
 * Create new subject with validation
 */
const createSubject = catchAsync(async (req, res) => {
  const { name, description, color } = req.body
  const userId = req.user.id

  // Validation
  if (!name || !name.trim()) {
    throw new AppError('Nome da disciplina é obrigatório', 400)
  }

  if (name.length > 100) {
    throw new AppError('Nome da disciplina deve ter no máximo 100 caracteres', 400)
  }

  if (description && description.length > 500) {
    throw new AppError('Descrição deve ter no máximo 500 caracteres', 400)
  }

  const validColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
  ]

  if (color && !validColors.includes(color)) {
    throw new AppError('Cor inválida selecionada', 400)
  }

  try {
    // Check if subject name already exists for this user
    const existingSubject = await Subject.findOne({
      where: { 
        name: name.trim(), 
        userId 
      }
    })

    if (existingSubject) {
      throw new AppError('Já existe uma disciplina com este nome', 409)
    }

    const subject = await Subject.create({
      name: name.trim(),
      description: description?.trim(),
      color: color || '#3B82F6',
      userId
    })

    logger.info(`Subject created: ${subject.id}`, { userId, name: subject.name })

    res.status(201).json({
      success: true,
      message: 'Disciplina criada com sucesso',
      data: { subject }
    })

  } catch (error) {
    logger.error('Error creating subject:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao criar disciplina', 500)
  }
})

/**
 * Update subject with comprehensive validation
 */
const updateSubject = catchAsync(async (req, res) => {
  const { id } = req.params
  const { name, description, color } = req.body
  const userId = req.user.id

  try {
    const subject = await Subject.findOne({
      where: { id, userId }
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    // Validation
    const updateData = {}

    if (name !== undefined) {
      if (!name.trim()) {
        throw new AppError('Nome da disciplina não pode estar vazio', 400)
      }
      if (name.length > 100) {
        throw new AppError('Nome da disciplina deve ter no máximo 100 caracteres', 400)
      }

      // Check for name conflicts
      if (name.trim() !== subject.name) {
        const existingSubject = await Subject.findOne({
          where: { 
            name: name.trim(), 
            userId, 
            id: { [Op.ne]: id } 
          }
        })

        if (existingSubject) {
          throw new AppError('Já existe uma disciplina com este nome', 409)
        }
      }

      updateData.name = name.trim()
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        throw new AppError('Descrição deve ter no máximo 500 caracteres', 400)
      }
      updateData.description = description?.trim()
    }

    if (color !== undefined) {
      const validColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
      ]

      if (color && !validColors.includes(color)) {
        throw new AppError('Cor inválida selecionada', 400)
      }
      updateData.color = color
    }

    await subject.update(updateData)

    logger.info(`Subject updated: ${id}`, { userId, changes: Object.keys(updateData) })

    res.json({
      success: true,
      message: 'Disciplina atualizada com sucesso',
      data: { subject }
    })

  } catch (error) {
    logger.error('Error updating subject:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao atualizar disciplina', 500)
  }
})

/**
 * Delete subject with safety checks
 */
const deleteSubject = catchAsync(async (req, res) => {
  const { id } = req.params
  const { force = false } = req.query
  const userId = req.user.id

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
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    // Check for dependencies
    const questionCount = subject.questions?.length || 0
    const examCount = await Exam.count({ where: { subjectId: id } })

    if (questionCount > 0 && !force) {
      throw new AppError(
        `Não é possível excluir esta disciplina pois ela possui ${questionCount} questão${questionCount !== 1 ? 'ões' : ''} cadastrada${questionCount !== 1 ? 's' : ''}. Remova todas as questões primeiro ou use force=true.`,
        400
      )
    }

    if (examCount > 0 && !force) {
      throw new AppError(
        `Não é possível excluir esta disciplina pois ela possui ${examCount} prova${examCount !== 1 ? 's' : ''} associada${examCount !== 1 ? 's' : ''}. Remova todas as provas primeiro ou use force=true.`,
        400
      )
    }

    // If force delete, handle cascading deletion
    if (force && (questionCount > 0 || examCount > 0)) {
      await sequelize.transaction(async (transaction) => {
        // Soft delete questions (set isActive to false)
        if (questionCount > 0) {
          await Question.update(
            { isActive: false },
            { 
              where: { subjectId: id },
              transaction 
            }
          )
        }

        // Handle exams - either delete unpublished or transfer published
        if (examCount > 0) {
          const exams = await Exam.findAll({ where: { subjectId: id } })
          
          for (const exam of exams) {
            if (exam.isPublished) {
              // For published exams, you might want to handle differently
              // For now, we'll prevent deletion even with force
              throw new AppError('Não é possível excluir disciplina com provas publicadas', 400)
            } else {
              await exam.destroy({ transaction })
            }
          }
        }

        await subject.destroy({ transaction })
      })
    } else {
      await subject.destroy()
    }

    logger.info(`Subject deleted: ${id}`, { userId, force })

    res.json({
      success: true,
      message: 'Disciplina excluída com sucesso'
    })

  } catch (error) {
    logger.error('Error deleting subject:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao excluir disciplina', 500)
  }
})

/**
 * Get subject questions with advanced filtering
 */
const getSubjectQuestions = catchAsync(async (req, res) => {
  const { id } = req.params
  const { 
    page = 1, 
    limit = 20, 
    difficulty, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    tags
  } = req.query
  const userId = req.user.id
  const offset = (page - 1) * limit

  try {
    // Verify subject ownership
    const subject = await Subject.findOne({
      where: { id, userId }
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    // Build where clause for questions
    const where = { subjectId: id, isActive: true }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (search) {
      where.text = { [Op.iLike]: `%${search}%` }
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags]
      where.tags = { [Op.overlap]: tagArray }
    }

    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'updatedAt', 'difficulty', 'timesUsed']
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

    const { count, rows: questions } = await Question.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[finalSortBy, finalSortOrder]]
    })

    // Get tag statistics
    const allQuestions = await Question.findAll({
      where: { subjectId: id, isActive: true },
      attributes: ['tags']
    })

    const tagCounts = {}
    allQuestions.forEach(q => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
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
          pages: Math.ceil(count / limit)
        },
        filters: {
          availableTags: Object.keys(tagCounts).sort(),
          tagCounts,
          difficultyDistribution: {
            easy: questions.filter(q => q.difficulty === 'easy').length,
            medium: questions.filter(q => q.difficulty === 'medium').length,
            hard: questions.filter(q => q.difficulty === 'hard').length
          }
        },
        subject: {
          id: subject.id,
          name: subject.name
        }
      }
    })

  } catch (error) {
    logger.error('Error fetching subject questions:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao buscar questões da disciplina', 500)
  }
})

/**
 * Check if subject can create exam with specific requirements
 */
const canCreateExam = catchAsync(async (req, res) => {
  const { id } = req.params
  const { 
    easyQuestions = 0, 
    mediumQuestions = 0, 
    hardQuestions = 0,
    totalVariations = 1
  } = req.query
  const userId = req.user.id

  try {
    const subject = await Subject.findOne({
      where: { id, userId }
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    // Count questions by difficulty
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      Question.count({
        where: { subjectId: id, difficulty: 'easy', isActive: true }
      }),
      Question.count({
        where: { subjectId: id, difficulty: 'medium', isActive: true }
      }),
      Question.count({
        where: { subjectId: id, difficulty: 'hard', isActive: true }
      })
    ])

    const available = { easy: easyCount, medium: mediumCount, hard: hardCount }
    const required = { 
      easy: parseInt(easyQuestions), 
      medium: parseInt(mediumQuestions), 
      hard: parseInt(hardQuestions) 
    }

    // Calculate if we have enough questions for all variations
    const totalRequired = required.easy + required.medium + required.hard
    const variationsCount = parseInt(totalVariations)

    // For multiple variations, we need more questions to ensure variety
    const minRequiredForVariations = {
      easy: Math.ceil(required.easy * Math.min(variationsCount, 3) * 0.8),
      medium: Math.ceil(required.medium * Math.min(variationsCount, 3) * 0.8),
      hard: Math.ceil(required.hard * Math.min(variationsCount, 3) * 0.8)
    }

    const canCreateBasic = available.easy >= required.easy && 
                          available.medium >= required.medium && 
                          available.hard >= required.hard

    const canCreateWithVariations = available.easy >= minRequiredForVariations.easy && 
                                   available.medium >= minRequiredForVariations.medium && 
                                   available.hard >= minRequiredForVariations.hard

    const recommendations = []

    if (!canCreateBasic) {
      if (available.easy < required.easy) {
        recommendations.push({
          type: 'add_questions',
          difficulty: 'easy',
          needed: required.easy - available.easy
        })
      }
      if (available.medium < required.medium) {
        recommendations.push({
          type: 'add_questions',
          difficulty: 'medium',
          needed: required.medium - available.medium
        })
      }
      if (available.hard < required.hard) {
        recommendations.push({
          type: 'add_questions',
          difficulty: 'hard',
          needed: required.hard - available.hard
        })
      }
    } else if (variationsCount > 1 && !canCreateWithVariations) {
      recommendations.push({
        type: 'reduce_variations',
        maxRecommended: Math.floor(Math.min(
          available.easy / Math.max(required.easy, 1),
          available.medium / Math.max(required.medium, 1),
          available.hard / Math.max(required.hard, 1)
        ))
      })
    }

    res.json({
      success: true,
      data: {
        canCreate: canCreateBasic,
        canCreateWithVariations,
        available,
        required,
        totalRequired,
        variationsCount,
        recommendations,
        subject: {
          id: subject.id,
          name: subject.name
        }
      }
    })

  } catch (error) {
    logger.error('Error checking exam creation capability:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao verificar capacidade de criação de prova', 500)
  }
})

/**
 * Get comprehensive subject statistics
 */
const getSubjectStats = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

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
    })

    if (!subject) {
      throw new AppError('Disciplina não encontrada', 404)
    }

    const questions = subject.questions || []
    
    // Basic statistics
    const basicStats = {
      totalQuestions: questions.length,
      easyQuestions: questions.filter(q => q.difficulty === 'easy').length,
      mediumQuestions: questions.filter(q => q.difficulty === 'medium').length,
      hardQuestions: questions.filter(q => q.difficulty === 'hard').length,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt
    }

    // Usage statistics
    const usageStats = {
      totalTimesUsed: questions.reduce((sum, q) => sum + (q.timesUsed || 0), 0),
      averageUsage: questions.length > 0 ? 
        Math.round(questions.reduce((sum, q) => sum + (q.timesUsed || 0), 0) / questions.length) : 0,
      mostUsedQuestion: questions.length > 0 ? 
        questions.reduce((max, q) => (q.timesUsed || 0) > (max.timesUsed || 0) ? q : max) : null,
      unusedQuestions: questions.filter(q => (q.timesUsed || 0) === 0).length
    }

    // Time-based statistics
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const timeStats = {
      questionsAddedThisWeek: questions.filter(q => new Date(q.createdAt) > lastWeek).length,
      questionsAddedThisMonth: questions.filter(q => new Date(q.createdAt) > lastMonth).length,
      lastQuestionAdded: questions.length > 0 ? 
        questions.reduce((latest, q) => new Date(q.createdAt) > new Date(latest.createdAt) ? q : latest).createdAt : null
    }

    // Exam statistics
    const examCount = await Exam.count({ where: { subjectId: id } })
    const publishedExamCount = await Exam.count({ 
      where: { subjectId: id, isPublished: true } 
    })

    const examStats = {
      totalExams: examCount,
      publishedExams: publishedExamCount,
      draftExams: examCount - publishedExamCount
    }

    // Quality metrics
    const qualityMetrics = {
      distributionBalance: calculateDistributionBalance(
        basicStats.easyQuestions,
        basicStats.mediumQuestions,
        basicStats.hardQuestions
      ),
      readinessScore: calculateSubjectReadiness(subject, basicStats, examStats),
      completenessScore: calculateCompletenessScore(subject, basicStats)
    }

    res.json({
      success: true,
      data: {
        basic: basicStats,
        usage: usageStats,
        time: timeStats,
        exams: examStats,
        quality: qualityMetrics
      }
    })

  } catch (error) {
    logger.error('Error getting subject statistics:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao obter estatísticas da disciplina', 500)
  }
})

/**
 * Calculate subject readiness score
 */
const calculateSubjectReadiness = (subject, basicStats, examStats) => {
  let score = 0

  // Basic information (20 points)
  if (subject.name && subject.name.trim()) score += 10
  if (subject.description && subject.description.trim()) score += 10

  // Question quantity (30 points)
  if (basicStats.totalQuestions >= 20) score += 30
  else if (basicStats.totalQuestions >= 10) score += 20
  else if (basicStats.totalQuestions >= 5) score += 10

  // Question distribution (30 points)
  const balance = calculateDistributionBalance(
    basicStats.easyQuestions,
    basicStats.mediumQuestions,
    basicStats.hardQuestions
  )
  score += Math.round(balance * 0.3)

  // Exam creation capability (20 points)
  if (basicStats.totalQuestions >= 10) score += 20
  else if (basicStats.totalQuestions >= 5) score += 10

  return Math.min(score, 100)
}

/**
 * Calculate completeness score
 */
const calculateCompletenessScore = (subject, basicStats) => {
  let score = 0

  // Required fields
  if (subject.name) score += 25
  if (subject.description) score += 15
  if (subject.color) score += 10

  // Question content
  if (basicStats.totalQuestions > 0) score += 25
  if (basicStats.easyQuestions > 0 && basicStats.mediumQuestions > 0 && basicStats.hardQuestions > 0) score += 25

  return Math.min(score, 100)
}

/**
 * Bulk operations for subjects
 */
const bulkOperations = catchAsync(async (req, res) => {
  const { operation, subjectIds, data = {} } = req.body
  const userId = req.user.id

  if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
    throw new AppError('IDs das disciplinas são obrigatórios', 400)
  }

  try {
    // Verify ownership of all subjects
    const subjects = await Subject.findAll({
      where: { 
        id: { [Op.in]: subjectIds }, 
        userId 
      }
    })

    if (subjects.length !== subjectIds.length) {
      throw new AppError('Algumas disciplinas não foram encontradas', 404)
    }

    let results = []

    switch (operation) {
      case 'delete':
        // Check for dependencies
        for (const subject of subjects) {
          const questionCount = await Question.count({ 
            where: { subjectId: subject.id, isActive: true } 
          })
          const examCount = await Exam.count({ where: { subjectId: subject.id } })

          if (questionCount > 0 || examCount > 0) {
            results.push({ 
              id: subject.id, 
              status: 'skipped', 
              reason: 'has_dependencies',
              dependencies: { questions: questionCount, exams: examCount }
            })
          } else {
            await subject.destroy()
            results.push({ id: subject.id, status: 'deleted' })
          }
        }
        break

      case 'update':
        if (!data || Object.keys(data).length === 0) {
          throw new AppError('Dados para atualização são obrigatórios', 400)
        }
        
        const allowedFields = ['description', 'color']
        const filteredData = {}
        Object.keys(data).forEach(key => {
          if (allowedFields.includes(key)) {
            filteredData[key] = data[key]
          }
        })

        await Subject.update(filteredData, {
          where: { id: { [Op.in]: subjectIds } }
        })
        results = subjectIds.map(id => ({ id, status: 'updated' }))
        break

      default:
        throw new AppError('Operação não suportada', 400)
    }

    logger.info(`Bulk operation ${operation} completed`, { 
      userId, 
      subjectIds, 
      results: results.length 
    })

    res.json({
      success: true,
      message: `Operação ${operation} realizada com sucesso`,
      data: { results }
    })

  } catch (error) {
    logger.error('Error in bulk operations:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro na operação em lote', 500)
  }
})

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectQuestions,
  canCreateExam,
  getSubjectStats,
  bulkOperations
}