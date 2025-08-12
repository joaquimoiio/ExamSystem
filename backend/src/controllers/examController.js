const { Exam, Subject, Question, ExamVariation, ExamQuestion, User, Answer } = require('../models')
const { catchAsync } = require('../utils/catchAsync')
const { AppError } = require('../utils/AppError')
const { generateExamPDF } = require('../services/pdfService')
const { generateQRCode } = require('../services/qrService')
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
    new winston.transports.File({ filename: 'exam-controller.log' })
  ]
})

/**
 * Get all exams for authenticated user with filtering and pagination
 */
const getExams = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    status, 
    subjectId,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query
  
  const userId = req.user.id
  const offset = (page - 1) * limit

  // Build where clause
  const where = { userId }

  // Search by title or description
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ]
  }

  // Filter by status
  if (status) {
    if (status === 'published') {
      where.isPublished = true
    } else if (status === 'draft') {
      where.isPublished = false
    } else if (status === 'active') {
      where.isPublished = true
      where.expiresAt = { [Op.gt]: new Date() }
    } else if (status === 'expired') {
      where.expiresAt = { [Op.lt]: new Date() }
    }
  }

  // Filter by subject
  if (subjectId) {
    where.subjectId = subjectId
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt[Op.gte] = new Date(startDate)
    }
    if (endDate) {
      where.createdAt[Op.lte] = new Date(endDate)
    }
  }

  // Validate sort parameters
  const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'publishedAt']
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
  const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  try {
    const { count, rows: exams } = await Exam.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[finalSortBy, finalSortOrder]],
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        },
        {
          model: ExamVariation,
          as: 'variations',
          attributes: ['id', 'variationNumber', 'variationLetter'],
          separate: true // Prevents N+1 query issues
        }
      ],
      distinct: true // Ensure correct count with includes
    })

    // Calculate additional statistics for each exam
    const examsWithStats = await Promise.all(exams.map(async (exam) => {
      const examJson = exam.toJSON()
      
      // Get submission count (when correction system is implemented)
      const submissionCount = 0 // await Answer.count({ where: { examId: exam.id } })
      
      // Calculate status
      let examStatus = 'draft'
      if (exam.isPublished) {
        if (exam.expiresAt && new Date() > exam.expiresAt) {
          examStatus = 'expired'
        } else {
          examStatus = 'active'
        }
      }

      return {
        ...examJson,
        variationsCount: exam.variations.length,
        submissionCount,
        status: examStatus,
        canEdit: !exam.isPublished || req.user.role === 'admin',
        canDelete: submissionCount === 0,
        daysUntilExpiry: exam.expiresAt ? 
          Math.ceil((exam.expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null
      }
    }))

    res.json({
      success: true,
      data: {
        exams: examsWithStats,
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
          published: examsWithStats.filter(e => e.isPublished).length,
          draft: examsWithStats.filter(e => !e.isPublished).length,
          active: examsWithStats.filter(e => e.status === 'active').length,
          expired: examsWithStats.filter(e => e.status === 'expired').length
        }
      }
    })

  } catch (error) {
    logger.error('Error fetching exams:', error)
    throw new AppError('Erro ao buscar provas', 500)
  }
})

/**
 * Get single exam with full details
 */
const getExam = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const exam = await Exam.findOne({
      where: { id, userId },
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color', 'description']
        },
        {
          model: ExamVariation,
          as: 'variations',
          include: [
            {
              model: Question,
              as: 'questions',
              through: { 
                attributes: ['order'],
                as: 'examQuestion'
              },
              attributes: ['id', 'text', 'difficulty', 'alternatives', 'correctAnswer', 'tags', 'points']
            }
          ]
        }
      ]
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    // Calculate exam statistics
    const totalQuestions = exam.totalQuestions
    const variationsCount = exam.variations.length
    
    // Get submission statistics (when implemented)
    const submissionCount = 0 // await Answer.count({ where: { examId: id } })
    const averageScore = 0 // Calculate when submissions are available

    const examStats = {
      totalQuestions,
      variationsCount,
      submissionCount,
      averageScore,
      difficultyDistribution: {
        easy: exam.easyQuestions,
        medium: exam.mediumQuestions,
        hard: exam.hardQuestions
      },
      timeEstimate: calculateEstimatedTime(totalQuestions, exam.timeLimit),
      readinessScore: calculateReadinessScore(exam)
    }

    res.json({
      success: true,
      data: { 
        exam: {
          ...exam.toJSON(),
          statistics: examStats
        }
      }
    })

  } catch (error) {
    logger.error('Error fetching exam:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao buscar prova', 500)
  }
})

/**
 * Create new exam with intelligent variation generation
 */
const createExam = catchAsync(async (req, res) => {
  const {
    title,
    description,
    subjectId,
    totalQuestions,
    easyQuestions = 0,
    mediumQuestions = 0,
    hardQuestions = 0,
    totalVariations = 1,
    timeLimit,
    passingScore = 6,
    instructions,
    allowReview = true,
    showCorrectAnswers = true,
    randomizeQuestions = true,
    randomizeAlternatives = true,
    expiresAt,
    questionSelection,
    accessCode,
    maxAttempts = 1,
    showResults = true,
    requireFullScreen = false,
    preventCopyPaste = false,
    shuffleAnswers = true
  } = req.body

  const userId = req.user.id

  // Validate required fields
  if (!title || !title.trim()) {
    throw new AppError('Título da prova é obrigatório', 400)
  }

  if (!totalQuestions || totalQuestions <= 0) {
    throw new AppError('Número de questões deve ser maior que zero', 400)
  }

  if (totalVariations < 1 || totalVariations > 50) {
    throw new AppError('Número de variações deve estar entre 1 e 50', 400)
  }

  // Handle multiple subjects for question selection
  const subjectIds = questionSelection?.subjectIds || [subjectId]
  
  if (!subjectIds || subjectIds.length === 0) {
    throw new AppError('Pelo menos uma disciplina deve ser selecionada', 400)
  }

  try {
    // Verify subject ownership
    const subjects = await Subject.findAll({
      where: { 
        id: { [Op.in]: subjectIds }, 
        userId 
      }
    })

    if (subjects.length === 0) {
      throw new AppError('Nenhuma disciplina válida encontrada', 404)
    }

    if (subjects.length !== subjectIds.length) {
      throw new AppError('Algumas disciplinas não foram encontradas', 404)
    }

    // Validate question distribution
    const sumByDifficulty = easyQuestions + mediumQuestions + hardQuestions
    if (sumByDifficulty !== totalQuestions) {
      throw new AppError(
        `A soma das questões por dificuldade (${sumByDifficulty}) deve ser igual ao total de questões (${totalQuestions})`, 
        400
      )
    }

    // Check questions availability across all subjects
    const questionsAvailable = await checkQuestionsAvailability(subjectIds, userId, {
      easy: easyQuestions,
      medium: mediumQuestions,
      hard: hardQuestions
    })

    if (!questionsAvailable.canCreate) {
      return res.status(400).json({
        success: false,
        message: 'Não há questões suficientes nas disciplinas selecionadas',
        error: 'INSUFFICIENT_QUESTIONS',
        data: {
          required: questionsAvailable.required,
          available: questionsAvailable.available,
          missing: questionsAvailable.missing,
          suggestions: generateQuestionSuggestions(questionsAvailable)
        }
      })
    }

    // Validate expiration date
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      throw new AppError('Data de expiração deve ser no futuro', 400)
    }

    // Validate time limit
    if (timeLimit && (timeLimit < 5 || timeLimit > 480)) {
      throw new AppError('Tempo limite deve estar entre 5 e 480 minutos', 400)
    }

    // Validate passing score
    if (passingScore < 0 || passingScore > 10) {
      throw new AppError('Nota de aprovação deve estar entre 0 e 10', 400)
    }

    // Start transaction for atomic operation
    const result = await sequelize.transaction(async (transaction) => {
      // Create the exam
      const exam = await Exam.create({
        title: title.trim(),
        description: description?.trim(),
        subjectId: subjects[0].id, // Primary subject for compatibility
        totalQuestions,
        easyQuestions,
        mediumQuestions,
        hardQuestions,
        totalVariations,
        timeLimit,
        passingScore,
        instructions: instructions?.trim(),
        allowReview,
        showCorrectAnswers,
        randomizeQuestions,
        randomizeAlternatives,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        accessCode,
        maxAttempts,
        showResults,
        requireFullScreen,
        preventCopyPaste,
        shuffleAnswers,
        userId,
        // Additional metadata
        metadata: {
          subjectIds,
          createdBy: req.user.name,
          createdAt: new Date(),
          questionSelection: questionSelection || { type: 'automatic' }
        }
      }, { transaction })

      // Generate exam variations with intelligent distribution
      const variations = await generateExamVariations(exam, subjects, {
        easy: easyQuestions,
        medium: mediumQuestions,
        hard: hardQuestions
      }, transaction)

      return { exam, variations }
    })

    // Fetch complete exam data for response
    const examWithVariations = await Exam.findByPk(result.exam.id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        },
        {
          model: ExamVariation,
          as: 'variations',
          attributes: ['id', 'variationNumber', 'variationLetter', 'qrCode']
        }
      ]
    })

    logger.info(`Exam created successfully: ${result.exam.id}`, {
      userId,
      examId: result.exam.id,
      variationsCount: result.variations.length
    })

    res.status(201).json({
      success: true,
      message: 'Prova criada com sucesso',
      data: {
        exam: {
          ...examWithVariations.toJSON(),
          variationsGenerated: result.variations.length,
          readinessScore: calculateReadinessScore(examWithVariations)
        }
      }
    })

  } catch (error) {
    logger.error('Error creating exam:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao criar prova', 500)
  }
})

/**
 * Helper function to check questions availability across subjects
 */
const checkQuestionsAvailability = async (subjectIds, userId, requirements) => {
  try {
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      Question.count({
        where: { 
          subjectId: { [Op.in]: subjectIds }, 
          userId, 
          difficulty: 'easy', 
          isActive: true 
        }
      }),
      Question.count({
        where: { 
          subjectId: { [Op.in]: subjectIds }, 
          userId, 
          difficulty: 'medium', 
          isActive: true 
        }
      }),
      Question.count({
        where: { 
          subjectId: { [Op.in]: subjectIds }, 
          userId, 
          difficulty: 'hard', 
          isActive: true 
        }
      })
    ])

    const available = { easy: easyCount, medium: mediumCount, hard: hardCount }
    const required = requirements
    const missing = {
      easy: Math.max(0, required.easy - available.easy),
      medium: Math.max(0, required.medium - available.medium),
      hard: Math.max(0, required.hard - available.hard)
    }

    const canCreate = missing.easy === 0 && missing.medium === 0 && missing.hard === 0

    return { canCreate, available, required, missing }

  } catch (error) {
    logger.error('Error checking questions availability:', error)
    throw new AppError('Erro ao verificar disponibilidade de questões', 500)
  }
}

/**
 * Generate suggestions for question distribution when insufficient questions
 */
const generateQuestionSuggestions = (questionsAvailable) => {
  const { available, required, missing } = questionsAvailable
  const suggestions = []

  if (missing.easy > 0) {
    suggestions.push({
      type: 'create_questions',
      difficulty: 'easy',
      count: missing.easy,
      message: `Crie mais ${missing.easy} questão${missing.easy > 1 ? 'ões' : ''} fácil${missing.easy > 1 ? 'eis' : ''}`
    })
  }

  if (missing.medium > 0) {
    suggestions.push({
      type: 'create_questions',
      difficulty: 'medium',
      count: missing.medium,
      message: `Crie mais ${missing.medium} questão${missing.medium > 1 ? 'ões' : ''} média${missing.medium > 1 ? 's' : ''}`
    })
  }

  if (missing.hard > 0) {
    suggestions.push({
      type: 'create_questions',
      difficulty: 'hard',
      count: missing.hard,
      message: `Crie mais ${missing.hard} questão${missing.hard > 1 ? 'ões' : ''} difícil${missing.hard > 1 ? 'eis' : ''}`
    })
  }

  // Suggest redistribution if possible
  const totalAvailable = available.easy + available.medium + available.hard
  const totalRequired = required.easy + required.medium + required.hard

  if (totalAvailable >= totalRequired) {
    suggestions.push({
      type: 'redistribute',
      message: 'Considere redistribuir as questões entre os níveis de dificuldade',
      possibleDistribution: calculateOptimalDistribution(available, totalRequired)
    })
  }

  return suggestions
}

/**
 * Calculate optimal question distribution based on available questions
 */
const calculateOptimalDistribution = (available, total) => {
  const ratio = total / (available.easy + available.medium + available.hard)
  
  return {
    easy: Math.min(Math.floor(available.easy * ratio), available.easy),
    medium: Math.min(Math.floor(available.medium * ratio), available.medium),
    hard: Math.min(Math.floor(available.hard * ratio), available.hard)
  }
}

/**
 * CORE ALGORITHM: Generate exam variations with intelligent question distribution
 */
const generateExamVariations = async (exam, subjects, distribution, transaction = null) => {
  try {
    const subjectIds = subjects.map(s => s.id)
    
    // Get questions by difficulty from all subjects with optimized queries
    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      Question.findAll({
        where: { 
          subjectId: { [Op.in]: subjectIds }, 
          userId: exam.userId, 
          difficulty: 'easy', 
          isActive: true 
        },
        order: [
          ['timesUsed', 'ASC'], 
          ['createdAt', 'DESC'],
          [sequelize.fn('RANDOM')] // Add randomization to base selection
        ],
        transaction
      }),
      Question.findAll({
        where: { 
          subjectId: { [Op.in]: subjectIds }, 
          userId: exam.userId, 
          difficulty: 'medium', 
          isActive: true 
        },
        order: [
          ['timesUsed', 'ASC'], 
          ['createdAt', 'DESC'],
          [sequelize.fn('RANDOM')]
        ],
        transaction
      }),
      Question.findAll({
        where: { 
          subjectId: { [Op.in]: subjectIds }, 
          userId: exam.userId, 
          difficulty: 'hard', 
          isActive: true 
        },
        order: [
          ['timesUsed', 'ASC'], 
          ['createdAt', 'DESC'],
          [sequelize.fn('RANDOM')]
        ],
        transaction
      })
    ])

    if (easyQuestions.length < distribution.easy || 
        mediumQuestions.length < distribution.medium || 
        hardQuestions.length < distribution.hard) {
      throw new AppError('Questões insuficientes para gerar as variações', 400)
    }

    const variations = []
    const usedQuestionCombinations = new Set() // Prevent duplicate combinations

    for (let i = 0; i < exam.totalVariations; i++) {
      let attempts = 0
      let selectedQuestions
      let combinationKey

      // Try to generate unique question combination
      do {
        // Smart selection algorithm with rotation and randomization
        const selectedEasy = selectQuestionsWithAdvancedRotation(
          easyQuestions, 
          distribution.easy, 
          i, 
          attempts
        )
        const selectedMedium = selectQuestionsWithAdvancedRotation(
          mediumQuestions, 
          distribution.medium, 
          i, 
          attempts
        )
        const selectedHard = selectQuestionsWithAdvancedRotation(
          hardQuestions, 
          distribution.hard, 
          i, 
          attempts
        )

        selectedQuestions = [
          ...selectedEasy,
          ...selectedMedium,
          ...selectedHard
        ]

        // Create combination key for uniqueness check
        combinationKey = selectedQuestions
          .map(q => q.id)
          .sort()
          .join('-')

        attempts++
      } while (usedQuestionCombinations.has(combinationKey) && attempts < 10)

      usedQuestionCombinations.add(combinationKey)

      // Shuffle questions if randomization is enabled
      if (exam.randomizeQuestions) {
        shuffleArray(selectedQuestions)
      }

      // Generate variation letter (A, B, C, etc.)
      const variationLetter = String.fromCharCode(65 + i)

      // Create initial QR code data structure
      const qrCodeData = {
        examId: exam.id,
        variationId: null, // Will be updated after creation
        variationLetter,
        type: 'exam_access',
        timestamp: new Date().toISOString()
      }

      // Create exam variation
      const variation = await ExamVariation.create({
        examId: exam.id,
        variationNumber: i + 1,
        variationLetter,
        qrCode: JSON.stringify(qrCodeData),
        questionsOrder: selectedQuestions.map(q => q.id),
        metadata: {
          generatedAt: new Date(),
          questionDistribution: {
            easy: distribution.easy,
            medium: distribution.medium,
            hard: distribution.hard
          },
          totalQuestions: selectedQuestions.length
        }
      }, { transaction })

      // Update QR code with variation ID
      qrCodeData.variationId = variation.id
      await variation.update({
        qrCode: JSON.stringify(qrCodeData)
      }, { transaction })

      // Create exam questions with order and metadata
      const examQuestions = selectedQuestions.map((question, index) => ({
        examId: exam.id,
        variationId: variation.id,
        questionId: question.id,
        order: index + 1,
        points: question.points || calculateQuestionPoints(question.difficulty),
        metadata: {
          originalDifficulty: question.difficulty,
          subjectId: question.subjectId,
          addedAt: new Date()
        }
      }))

      await ExamQuestion.bulkCreate(examQuestions, { transaction })

      // Update question usage statistics
      const questionIds = selectedQuestions.map(q => q.id)
      await Question.increment('timesUsed', {
        where: { id: { [Op.in]: questionIds } }
      }, { transaction })

      // Prepare variation data for response
      variations.push({
        ...variation.toJSON(),
        questions: selectedQuestions.map((q, index) => ({
          ...q.toJSON(),
          order: index + 1,
          points: examQuestions[index].points
        }))
      })

      logger.info(`Generated variation ${i + 1}/${exam.totalVariations}`, {
        examId: exam.id,
        variationId: variation.id,
        questionsCount: selectedQuestions.length
      })
    }

    return variations

  } catch (error) {
    logger.error('Error generating exam variations:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao gerar variações da prova', 500)
  }
}

/**
 * Advanced question selection with rotation, randomization and balancing
 */
const selectQuestionsWithAdvancedRotation = (questions, count, variationIndex, attempt = 0) => {
  if (questions.length === 0 || count === 0) return []
  
  // Ensure we don't select more questions than available
  const actualCount = Math.min(count, questions.length)
  
  // Calculate starting index with rotation and attempt offset
  const baseOffset = (variationIndex * actualCount) % questions.length
  const attemptOffset = (attempt * Math.floor(actualCount / 2)) % questions.length
  const startIndex = (baseOffset + attemptOffset) % questions.length
  
  const selected = []
  const usedIndices = new Set()
  
  // Select questions with rotation and avoid duplicates
  for (let i = 0; i < actualCount; i++) {
    let index = (startIndex + i) % questions.length
    
    // Avoid duplicates within the same variation
    let attempts = 0
    while (usedIndices.has(index) && attempts < questions.length) {
      index = (index + 1) % questions.length
      attempts++
    }
    
    usedIndices.add(index)
    selected.push(questions[index])
  }
  
  // If we need more variety and have enough questions, add some randomization
  if (questions.length > actualCount * 2) {
    const randomElements = Math.floor(actualCount * 0.3) // 30% random selection
    for (let i = 0; i < randomElements && i < selected.length; i++) {
      const randomIndex = Math.floor(Math.random() * questions.length)
      if (!selected.find(q => q.id === questions[randomIndex].id)) {
        selected[i] = questions[randomIndex]
      }
    }
  }
  
  return selected
}

/**
 * Fisher-Yates shuffle algorithm for array randomization
 */
const shuffleArray = (array) => {
  const arr = [...array] // Create copy to avoid mutation
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Calculate question points based on difficulty
 */
const calculateQuestionPoints = (difficulty) => {
  const pointsMap = {
    easy: 1,
    medium: 2,
    hard: 3
  }
  return pointsMap[difficulty] || 1
}

/**
 * Calculate estimated time for exam completion
 */
const calculateEstimatedTime = (totalQuestions, timeLimit) => {
  const avgTimePerQuestion = 2 // minutes
  const estimatedTime = totalQuestions * avgTimePerQuestion
  
  return {
    estimated: estimatedTime,
    provided: timeLimit,
    ratio: timeLimit ? (timeLimit / estimatedTime).toFixed(2) : null,
    recommendation: timeLimit < estimatedTime ? 'increase' : timeLimit > estimatedTime * 2 ? 'decrease' : 'adequate'
  }
}

/**
 * Calculate exam readiness score
 */
const calculateReadinessScore = (exam) => {
  let score = 0
  const maxScore = 100
  
  // Basic information (20 points)
  if (exam.title && exam.title.trim()) score += 10
  if (exam.description && exam.description.trim()) score += 5
  if (exam.instructions && exam.instructions.trim()) score += 5
  
  // Question distribution (30 points)
  if (exam.totalQuestions > 0) score += 15
  if (exam.easyQuestions + exam.mediumQuestions + exam.hardQuestions === exam.totalQuestions) score += 15
  
  // Configuration (25 points)
  if (exam.timeLimit && exam.timeLimit > 0) score += 10
  if (exam.passingScore >= 0 && exam.passingScore <= 10) score += 10
  if (exam.totalVariations >= 1) score += 5
  
  // Advanced settings (15 points)
  if (exam.allowReview !== null) score += 5
  if (exam.showCorrectAnswers !== null) score += 5
  if (exam.randomizeQuestions !== null) score += 5
  
  // Variations generated (10 points)
  if (exam.variations && exam.variations.length > 0) score += 10
  
  return Math.min(score, maxScore)
}

/**
 * Update exam with validation and security checks
 */
const updateExam = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const updateData = req.body

  try {
    const exam = await Exam.findOne({
      where: { id, userId },
      include: [
        {
          model: ExamVariation,
          as: 'variations'
        }
      ]
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    // Security check: Don't allow updates to published exams unless explicitly allowed
    if (exam.isPublished && !updateData.allowPublishedUpdate && req.user.role !== 'admin') {
      throw new AppError('Não é possível editar uma prova já publicada', 400)
    }

    // Validate update data
    const allowedFields = [
      'title', 'description', 'timeLimit', 'passingScore', 'instructions',
      'allowReview', 'showCorrectAnswers', 'expiresAt', 'accessCode',
      'maxAttempts', 'showResults', 'requireFullScreen', 'preventCopyPaste'
    ]

    const filteredUpdateData = {}
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key]
      }
    })

    // Validate specific fields
    if (filteredUpdateData.title && !filteredUpdateData.title.trim()) {
      throw new AppError('Título não pode estar vazio', 400)
    }

    if (filteredUpdateData.timeLimit && (filteredUpdateData.timeLimit < 5 || filteredUpdateData.timeLimit > 480)) {
      throw new AppError('Tempo limite deve estar entre 5 e 480 minutos', 400)
    }

    if (filteredUpdateData.passingScore !== undefined && 
        (filteredUpdateData.passingScore < 0 || filteredUpdateData.passingScore > 10)) {
      throw new AppError('Nota de aprovação deve estar entre 0 e 10', 400)
    }

    if (filteredUpdateData.expiresAt && new Date(filteredUpdateData.expiresAt) <= new Date()) {
      throw new AppError('Data de expiração deve ser no futuro', 400)
    }

    // Update exam
    await exam.update({
      ...filteredUpdateData,
      updatedAt: new Date()
    })

    // Fetch updated exam with relationships
    const updatedExam = await Exam.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'subject'
        },
        {
          model: ExamVariation,
          as: 'variations'
        }
      ]
    })

    logger.info(`Exam updated: ${id}`, { userId, changes: Object.keys(filteredUpdateData) })

    res.json({
      success: true,
      message: 'Prova atualizada com sucesso',
      data: { exam: updatedExam }
    })

  } catch (error) {
    logger.error('Error updating exam:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao atualizar prova', 500)
  }
})

/**
 * Publish exam - make it available for students
 */
const publishExam = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const exam = await Exam.findOne({
      where: { id, userId },
      include: [
        {
          model: ExamVariation,
          as: 'variations'
        }
      ]
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    if (exam.isPublished) {
      throw new AppError('Prova já está publicada', 400)
    }

    // Validate exam readiness
    const readinessScore = calculateReadinessScore(exam)
    if (readinessScore < 80) {
      throw new AppError('Prova não está pronta para publicação. Complete todas as configurações necessárias.', 400)
    }

    if (!exam.variations || exam.variations.length === 0) {
      throw new AppError('Prova deve ter pelo menos uma variação antes de ser publicada', 400)
    }

    await exam.update({
      isPublished: true,
      publishedAt: new Date()
    })

    logger.info(`Exam published: ${id}`, { userId })

    res.json({
      success: true,
      message: 'Prova publicada com sucesso',
      data: { exam }
    })

  } catch (error) {
    logger.error('Error publishing exam:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao publicar prova', 500)
  }
})

/**
 * Unpublish exam - remove from student access
 */
const unpublishExam = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const exam = await Exam.findOne({
      where: { id, userId }
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    if (!exam.isPublished) {
      throw new AppError('Prova não está publicada', 400)
    }

    // Check if there are ongoing submissions
    // const ongoingSubmissions = await Answer.count({
    //   where: { examId: id, status: 'in_progress' }
    // })
    
    // if (ongoingSubmissions > 0) {
    //   throw new AppError('Não é possível despublicar prova com submissões em andamento', 400)
    // }

    await exam.update({
      isPublished: false,
      publishedAt: null
    })

    logger.info(`Exam unpublished: ${id}`, { userId })

    res.json({
      success: true,
      message: 'Prova despublicada com sucesso',
      data: { exam }
    })

  } catch (error) {
    logger.error('Error unpublishing exam:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao despublicar prova', 500)
  }
})

/**
 * Delete exam with cascade deletion of related data
 */
const deleteExam = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const exam = await Exam.findOne({
      where: { id, userId },
      include: [
        {
          model: ExamVariation,
          as: 'variations'
        }
      ]
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    // Check if exam has submissions
    // const submissionCount = await Answer.count({ where: { examId: id } })
    // if (submissionCount > 0) {
    //   throw new AppError('Não é possível excluir prova com submissões', 400)
    // }

    // Delete in transaction to ensure data consistency
    await sequelize.transaction(async (transaction) => {
      // Delete exam questions relationships
      await ExamQuestion.destroy({ 
        where: { examId: id },
        transaction 
      })

      // Delete exam variations
      await ExamVariation.destroy({ 
        where: { examId: id },
        transaction 
      })

      // Delete the exam itself
      await exam.destroy({ transaction })
    })

    logger.info(`Exam deleted: ${id}`, { userId })

    res.json({
      success: true,
      message: 'Prova excluída com sucesso'
    })

  } catch (error) {
    logger.error('Error deleting exam:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao excluir prova', 500)
  }
})

/**
 * Generate PDFs for all exam variations
 */
const generateExamPDFs = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const exam = await Exam.findOne({
      where: { id, userId },
      include: [
        {
          model: Subject,
          as: 'subject'
        },
        {
          model: ExamVariation,
          as: 'variations',
          include: [
            {
              model: Question,
              as: 'questions',
              through: { attributes: ['order'] }
            }
          ]
        }
      ]
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    if (!exam.variations || exam.variations.length === 0) {
      throw new AppError('Prova não possui variações para gerar PDF', 400)
    }

    const pdfFiles = []

    // Generate PDF for each variation
    for (const variation of exam.variations) {
      try {
        const pdfBuffer = await generateExamPDF(exam, variation)
        pdfFiles.push({
          variationId: variation.id,
          variationLetter: variation.variationLetter,
          filename: `${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}_Variacao_${variation.variationLetter}.pdf`,
          size: pdfBuffer.length,
          buffer: pdfBuffer
        })
      } catch (pdfError) {
        logger.error(`Error generating PDF for variation ${variation.id}:`, pdfError)
        // Continue with other variations
      }
    }

    if (pdfFiles.length === 0) {
      throw new AppError('Erro ao gerar PDFs', 500)
    }

    logger.info(`PDFs generated for exam ${id}`, { 
      userId, 
      variationsCount: pdfFiles.length 
    })

    res.json({
      success: true,
      message: `${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''} gerado${pdfFiles.length > 1 ? 's' : ''} com sucesso`,
      data: {
        files: pdfFiles.length,
        totalSize: pdfFiles.reduce((sum, file) => sum + file.size, 0),
        downloadUrl: `/api/exams/${id}/download-pdfs`,
        variations: pdfFiles.map(f => ({
          variationId: f.variationId,
          variationLetter: f.variationLetter,
          filename: f.filename
        }))
      }
    })

  } catch (error) {
    logger.error('Error generating exam PDFs:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao gerar PDFs da prova', 500)
  }
})

/**
 * Get exam by QR code (for students)
 */
const getExamByQR = catchAsync(async (req, res) => {
  const { qrCode } = req.params

  try {
    // Decode QR code data
    let qrData
    try {
      qrData = JSON.parse(decodeURIComponent(qrCode))
    } catch (parseError) {
      throw new AppError('QR Code inválido', 400)
    }

    const { examId, variationId } = qrData

    if (!examId || !variationId) {
      throw new AppError('QR Code não contém informações válidas da prova', 400)
    }

    const variation = await ExamVariation.findOne({
      where: { id: variationId, examId },
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [
            {
              model: Subject,
              as: 'subject',
              attributes: ['id', 'name', 'color']
            }
          ]
        },
        {
          model: Question,
          as: 'questions',
          through: { 
            attributes: ['order'],
            as: 'examQuestion'
          },
          attributes: ['id', 'text', 'alternatives', 'difficulty', 'tags']
        }
      ]
    })

    if (!variation) {
      throw new AppError('Variação da prova não encontrada', 404)
    }

    const exam = variation.exam

    // Check if exam is published and available
    if (!exam.isPublished) {
      throw new AppError('Esta prova não está disponível', 400)
    }

    // Check if exam has expired
    if (exam.expiresAt && new Date() > exam.expiresAt) {
      throw new AppError('Esta prova expirou', 400)
    }

    // Prepare exam data for student (without correct answers)
    const examForStudent = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      instructions: exam.instructions,
      timeLimit: exam.timeLimit,
      totalQuestions: exam.totalQuestions,
      passingScore: exam.passingScore,
      allowReview: exam.allowReview,
      maxAttempts: exam.maxAttempts,
      requireFullScreen: exam.requireFullScreen,
      preventCopyPaste: exam.preventCopyPaste,
      subject: exam.subject,
      variation: {
        id: variation.id,
        variationLetter: variation.variationLetter,
        questions: variation.questions
          .sort((a, b) => a.examQuestion.order - b.examQuestion.order)
          .map(q => ({
            id: q.id,
            text: q.text,
            alternatives: exam.randomizeAlternatives ? 
              shuffleArray(q.alternatives) : q.alternatives,
            order: q.examQuestion.order,
            difficulty: q.difficulty // Can be useful for UI styling
          }))
      },
      metadata: {
        accessedAt: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    }

    // Log access for analytics
    logger.info(`Exam accessed via QR code`, {
      examId,
      variationId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      success: true,
      data: { exam: examForStudent }
    })

  } catch (error) {
    logger.error('Error getting exam by QR code:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao acessar prova via QR Code', 500)
  }
})

/**
 * Regenerate exam variations
 */
const regenerateVariations = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const exam = await Exam.findOne({
      where: { id, userId },
      include: [{ model: Subject, as: 'subject' }]
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    // Check if exam is published
    if (exam.isPublished) {
      throw new AppError('Não é possível regenerar variações de uma prova publicada', 400)
    }

    // Check if there are existing submissions
    // const submissionCount = await Answer.count({ where: { examId: id } })
    // if (submissionCount > 0) {
    //   throw new AppError('Não é possível regenerar variações com submissões existentes', 400)
    // }

    await sequelize.transaction(async (transaction) => {
      // Delete existing variations and questions
      await ExamQuestion.destroy({ 
        where: { examId: id },
        transaction 
      })
      
      await ExamVariation.destroy({ 
        where: { examId: id },
        transaction 
      })

      // Generate new variations
      const variations = await generateExamVariations(exam, [exam.subject], {
        easy: exam.easyQuestions,
        medium: exam.mediumQuestions,
        hard: exam.hardQuestions
      }, transaction)

      return variations
    })

    logger.info(`Variations regenerated for exam ${id}`, { userId })

    res.json({
      success: true,
      message: 'Variações regeneradas com sucesso',
      data: {
        variationsGenerated: exam.totalVariations
      }
    })

  } catch (error) {
    logger.error('Error regenerating variations:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao regenerar variações', 500)
  }
})

/**
 * Get comprehensive exam statistics
 */
const getExamStatistics = catchAsync(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const exam = await Exam.findOne({
      where: { id, userId },
      include: [
        {
          model: Subject,
          as: 'subject'
        },
        {
          model: ExamVariation,
          as: 'variations'
        }
      ]
    })

    if (!exam) {
      throw new AppError('Prova não encontrada', 404)
    }

    // Basic exam statistics
    const basicStats = {
      totalVariations: exam.variations.length,
      isPublished: exam.isPublished,
      createdAt: exam.createdAt,
      publishedAt: exam.publishedAt,
      updatedAt: exam.updatedAt,
      expiresAt: exam.expiresAt,
      timeLimit: exam.timeLimit,
      passingScore: exam.passingScore,
      totalQuestions: exam.totalQuestions,
      difficultyDistribution: {
        easy: exam.easyQuestions,
        medium: exam.mediumQuestions,
        hard: exam.hardQuestions
      }
    }

    // TODO: Add submission statistics when correction system is implemented
    const submissionStats = {
      totalSubmissions: 0,
      completedSubmissions: 0,
      averageScore: 0,
      averageTime: 0,
      passRate: 0,
      difficultyAnalysis: {
        easy: { correct: 0, total: 0, percentage: 0 },
        medium: { correct: 0, total: 0, percentage: 0 },
        hard: { correct: 0, total: 0, percentage: 0 }
      }
    }

    // Performance metrics
    const performanceStats = {
      readinessScore: calculateReadinessScore(exam),
      estimatedTime: calculateEstimatedTime(exam.totalQuestions, exam.timeLimit),
      accessCount: 0, // Track QR code scans
      popularVariations: exam.variations.map(v => ({
        id: v.id,
        letter: v.variationLetter,
        accessCount: 0 // Would track individual variation access
      }))
    }

    // Exam health check
    const healthCheck = {
      hasTitle: !!exam.title,
      hasInstructions: !!exam.instructions,
      hasTimeLimit: !!exam.timeLimit,
      hasVariations: exam.variations.length > 0,
      isConfigured: exam.easyQuestions + exam.mediumQuestions + exam.hardQuestions === exam.totalQuestions,
      isReady: exam.variations.length > 0 && exam.title && exam.totalQuestions > 0
    }

    res.json({
      success: true,
      data: {
        basic: basicStats,
        submissions: submissionStats,
        performance: performanceStats,
        health: healthCheck,
        recommendations: generateExamRecommendations(exam, healthCheck)
      }
    })

  } catch (error) {
    logger.error('Error getting exam statistics:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao obter estatísticas da prova', 500)
  }
})

/**
 * Generate recommendations for exam improvement
 */
const generateExamRecommendations = (exam, healthCheck) => {
  const recommendations = []

  if (!healthCheck.hasInstructions) {
    recommendations.push({
      type: 'info',
      title: 'Adicionar Instruções',
      message: 'Considere adicionar instruções claras para os alunos',
      priority: 'medium'
    })
  }

  if (!healthCheck.hasTimeLimit) {
    recommendations.push({
      type: 'warning',
      title: 'Definir Tempo Limite',
      message: 'Recomendamos definir um tempo limite para a prova',
      priority: 'high'
    })
  }

  if (exam.totalVariations < 3) {
    recommendations.push({
      type: 'info',
      title: 'Aumentar Variações',
      message: 'Considere criar mais variações para reduzir a possibilidade de cola',
      priority: 'low'
    })
  }

  const timeEstimate = calculateEstimatedTime(exam.totalQuestions, exam.timeLimit)
  if (timeEstimate.recommendation === 'increase') {
    recommendations.push({
      type: 'warning',
      title: 'Tempo Insuficiente',
      message: 'O tempo limite pode ser insuficiente para o número de questões',
      priority: 'high'
    })
  } else if (timeEstimate.recommendation === 'decrease') {
    recommendations.push({
      type: 'info',
      title: 'Tempo Excessivo',
      message: 'O tempo limite pode ser maior que o necessário',
      priority: 'low'
    })
  }

  return recommendations
}

/**
 * Preview exam questions before creation
 */
const previewExamQuestions = catchAsync(async (req, res) => {
  const { 
    subjectIds, 
    easyQuestions = 0, 
    mediumQuestions = 0, 
    hardQuestions = 0 
  } = req.query
  const userId = req.user.id

  try {
    if (!subjectIds) {
      throw new AppError('IDs das disciplinas são obrigatórios', 400)
    }

    const subjectIdsArray = Array.isArray(subjectIds) ? subjectIds : [subjectIds]

    // Verify subject ownership
    const subjects = await Subject.findAll({
      where: { 
        id: { [Op.in]: subjectIdsArray }, 
        userId 
      }
    })

    if (subjects.length !== subjectIdsArray.length) {
      throw new AppError('Algumas disciplinas não foram encontradas', 404)
    }

    // Get sample questions by difficulty
    const [easy, medium, hard] = await Promise.all([
      Question.findAll({
        where: { 
          subjectId: { [Op.in]: subjectIdsArray }, 
          userId, 
          difficulty: 'easy', 
          isActive: true 
        },
        limit: Math.min(parseInt(easyQuestions) || 0, 20), // Limit preview
        attributes: ['id', 'text', 'difficulty', 'alternatives', 'tags'],
        order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']]
      }),
      Question.findAll({
        where: { 
          subjectId: { [Op.in]: subjectIdsArray }, 
          userId, 
          difficulty: 'medium', 
          isActive: true 
        },
        limit: Math.min(parseInt(mediumQuestions) || 0, 20),
        attributes: ['id', 'text', 'difficulty', 'alternatives', 'tags'],
        order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']]
      }),
      Question.findAll({
        where: { 
          subjectId: { [Op.in]: subjectIdsArray }, 
          userId, 
          difficulty: 'hard', 
          isActive: true 
        },
        limit: Math.min(parseInt(hardQuestions) || 0, 20),
        attributes: ['id', 'text', 'difficulty', 'alternatives', 'tags'],
        order: [['timesUsed', 'ASC'], ['createdAt', 'DESC']]
      })
    ])

    const allQuestions = [...easy, ...medium, ...hard]

    // Check availability
    const availability = await checkQuestionsAvailability(subjectIdsArray, userId, {
      easy: parseInt(easyQuestions) || 0,
      medium: parseInt(mediumQuestions) || 0,
      hard: parseInt(hardQuestions) || 0
    })

    res.json({
      success: true,
      data: {
        questions: allQuestions.map(q => ({
          id: q.id,
          text: q.text.substring(0, 150) + (q.text.length > 150 ? '...' : ''),
          difficulty: q.difficulty,
          alternativeCount: q.alternatives.length,
          tags: q.tags || []
        })),
        availability,
        subjects: subjects.map(s => ({
          id: s.id,
          name: s.name,
          color: s.color
        })),
        summary: {
          totalPreview: allQuestions.length,
          byDifficulty: {
            easy: easy.length,
            medium: medium.length,
            hard: hard.length
          }
        }
      }
    })

  } catch (error) {
    logger.error('Error previewing exam questions:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao visualizar questões da prova', 500)
  }
})

/**
 * Duplicate an existing exam
 */
const duplicateExam = catchAsync(async (req, res) => {
  const { id } = req.params
  const { title, includeVariations = true } = req.body
  const userId = req.user.id

  try {
    const originalExam = await Exam.findOne({
      where: { id, userId },
      include: [
        {
          model: Subject,
          as: 'subject'
        }
      ]
    })

    if (!originalExam) {
      throw new AppError('Prova original não encontrada', 404)
    }

    const duplicatedExam = await sequelize.transaction(async (transaction) => {
      // Create duplicate exam
      const newExam = await Exam.create({
        title: title || `${originalExam.title} (Cópia)`,
        description: originalExam.description,
        subjectId: originalExam.subjectId,
        totalQuestions: originalExam.totalQuestions,
        easyQuestions: originalExam.easyQuestions,
        mediumQuestions: originalExam.mediumQuestions,
        hardQuestions: originalExam.hardQuestions,
        totalVariations: originalExam.totalVariations,
        timeLimit: originalExam.timeLimit,
        passingScore: originalExam.passingScore,
        instructions: originalExam.instructions,
        allowReview: originalExam.allowReview,
        showCorrectAnswers: originalExam.showCorrectAnswers,
        randomizeQuestions: originalExam.randomizeQuestions,
        randomizeAlternatives: originalExam.randomizeAlternatives,
        accessCode: null, // Reset access code
        maxAttempts: originalExam.maxAttempts,
        showResults: originalExam.showResults,
        requireFullScreen: originalExam.requireFullScreen,
        preventCopyPaste: originalExam.preventCopyPaste,
        shuffleAnswers: originalExam.shuffleAnswers,
        userId,
        // Reset publication status
        isPublished: false,
        publishedAt: null,
        expiresAt: null // Reset expiration
      }, { transaction })

      // Generate new variations if requested
      let variations = []
      if (includeVariations) {
        variations = await generateExamVariations(newExam, [originalExam.subject], {
          easy: originalExam.easyQuestions,
          medium: originalExam.mediumQuestions,
          hard: originalExam.hardQuestions
        }, transaction)
      }

      return { exam: newExam, variations }
    })

    logger.info(`Exam duplicated: ${id} -> ${duplicatedExam.exam.id}`, { userId })

    res.status(201).json({
      success: true,
      message: 'Prova duplicada com sucesso',
      data: {
        exam: {
          ...duplicatedExam.exam.toJSON(),
          variationsGenerated: duplicatedExam.variations.length
        }
      }
    })

  } catch (error) {
    logger.error('Error duplicating exam:', error)
    if (error instanceof AppError) throw error
    throw new AppError('Erro ao duplicar prova', 500)
  }
})

/**
 * Bulk operations for exams
 */
const bulkOperations = catchAsync(async (req, res) => {
  const { operation, examIds, data = {} } = req.body
  const userId = req.user.id

  if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
    throw new AppError('IDs das provas são obrigatórios', 400)
  }

  try {
    // Verify ownership of all exams
    const exams = await Exam.findAll({
      where: { 
        id: { [Op.in]: examIds }, 
        userId 
      }
    })

    if (exams.length !== examIds.length) {
      throw new AppError('Algumas provas não foram encontradas', 404)
    }

    let results = []

    switch (operation) {
      case 'delete':
        await sequelize.transaction(async (transaction) => {
          await ExamQuestion.destroy({ 
            where: { examId: { [Op.in]: examIds } },
            transaction 
          })
          await ExamVariation.destroy({ 
            where: { examId: { [Op.in]: examIds } },
            transaction 
          })
          await Exam.destroy({ 
            where: { id: { [Op.in]: examIds } },
            transaction 
          })
        })
        results = examIds.map(id => ({ id, status: 'deleted' }))
        break

      case 'publish':
        for (const exam of exams) {
          if (!exam.isPublished && calculateReadinessScore(exam) >= 80) {
            await exam.update({
              isPublished: true,
              publishedAt: new Date()
            })
            results.push({ id: exam.id, status: 'published' })
          } else {
            results.push({ 
              id: exam.id, 
              status: 'skipped', 
              reason: exam.isPublished ? 'already_published' : 'not_ready' 
            })
          }
        }
        break

      case 'unpublish':
        await Exam.update(
          { isPublished: false, publishedAt: null },
          { where: { id: { [Op.in]: examIds } } }
        )
        results = examIds.map(id => ({ id, status: 'unpublished' }))
        break

      case 'update':
        if (!data || Object.keys(data).length === 0) {
          throw new AppError('Dados para atualização são obrigatórios', 400)
        }
        
        const allowedFields = ['timeLimit', 'passingScore', 'expiresAt']
        const filteredData = {}
        Object.keys(data).forEach(key => {
          if (allowedFields.includes(key)) {
            filteredData[key] = data[key]
          }
        })

        await Exam.update(filteredData, {
          where: { id: { [Op.in]: examIds } }
        })
        results = examIds.map(id => ({ id, status: 'updated' }))
        break

      default:
        throw new AppError('Operação não suportada', 400)
    }

    logger.info(`Bulk operation ${operation} completed`, { 
      userId, 
      examIds, 
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
  getExams,
  getExam,
  createExam,
  updateExam,
  publishExam,
  unpublishExam,
  deleteExam,
  generateExamPDFs,
  getExamByQR,
  regenerateVariations,
  getExamStatistics,
  previewExamQuestions,
  duplicateExam,
  bulkOperations,
  generateExamVariations, // Export for use in other modules
  checkQuestionsAvailability // Export for use in other modules
}