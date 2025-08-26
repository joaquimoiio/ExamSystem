module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define('Exam', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 200]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    examHeaderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exam_headers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    selectedQuestions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of {questionId, points} objects for custom exam creation'
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100
      }
    },
    easyQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    mediumQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    hardQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    totalVariations: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 50
      }
    },
    totalPoints: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Total points for the exam'
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      comment: 'Time limit in minutes'
    },
    passingScore: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 6.00,
      validate: {
        min: 0,
        max: 10
      }
    },
    instructions: {
      type: DataTypes.TEXT
    },
    allowReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    showCorrectAnswers: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    randomizeQuestions: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    randomizeAlternatives: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    publishedAt: {
      type: DataTypes.DATE
    },
    expiresAt: {
      type: DataTypes.DATE
    },
    accessCode: {
      type: DataTypes.STRING(20)
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    showResults: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    requireFullScreen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preventCopyPaste: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    shuffleAnswers: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'exams',
    timestamps: true,
    indexes: [
      {
        fields: ['subjectId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['isPublished']
      },
      {
        fields: ['publishedAt']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['accessCode']
      },
      {
        fields: ['createdAt']
      }
    ],
    validate: {
      questionsDistributionValid() {
        const total = this.easyQuestions + this.mediumQuestions + this.hardQuestions;
        if (total !== this.totalQuestions) {
          throw new Error('Questions distribution must sum to total questions');
        }
      }
    }
  });

  // Instance methods
  Exam.prototype.canTakeExam = function() {
    if (!this.isPublished) return false;
    if (this.expiresAt && new Date() > new Date(this.expiresAt)) return false;
    return true;
  };

  Exam.prototype.publish = async function() {
    // Validate that we have enough questions
    const Subject = sequelize.models.Subject;
    const subject = await Subject.findByPk(this.subjectId);
    
    const canCreate = await subject.canCreateExam({
      easy: this.easyQuestions,
      medium: this.mediumQuestions,
      hard: this.hardQuestions
    });

    if (!canCreate.canCreate) {
      throw new Error('Not enough questions available to publish this exam');
    }

    // Generate access code if not provided
    if (!this.accessCode) {
      this.accessCode = this.generateAccessCode();
    }

    this.isPublished = true;
    this.publishedAt = new Date();
    
    await this.save();
    
    // Generate variations
    await this.generateVariations();
    
    return this;
  };

  Exam.prototype.generateAccessCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  Exam.prototype.generateVariations = async function() {
    const Question = sequelize.models.Question;
    const ExamVariation = sequelize.models.ExamVariation;
    
    // Get questions for each difficulty
    const questions = await Question.getRandomQuestions(this.subjectId, {
      easy: this.easyQuestions,
      medium: this.mediumQuestions,
      hard: this.hardQuestions
    });

    if (questions.length < this.totalQuestions) {
      throw new Error('Not enough questions available');
    }

    // Create variations
    const variations = [];
    for (let i = 0; i < this.totalVariations; i++) {
      const variation = await ExamVariation.create({
        examId: this.id,
        variationNumber: i + 1,
        qrCode: null // Will be generated after creation
      });

      // Shuffle questions for this variation
      const shuffledQuestions = this.shuffleArray([...questions]);
      
      // Add questions to variation
      await variation.addQuestions(shuffledQuestions, {
        through: {
          examId: this.id,
          questionOrder: shuffledQuestions.map((_, index) => index)
        }
      });

      // Generate QR code
      await variation.generateQrCode();
      
      variations.push(variation);
    }

    return variations;
  };

  Exam.prototype.shuffleArray = function(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  Exam.prototype.getStatistics = async function() {
    const Answer = sequelize.models.Answer;
    
    const totalSubmissions = await Answer.count({
      where: { examId: this.id }
    });

    const passedSubmissions = await Answer.count({
      where: { 
        examId: this.id,
        score: { [sequelize.Sequelize.Op.gte]: this.passingScore }
      }
    });

    const averageScore = await Answer.findOne({
      where: { examId: this.id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avg']
      ],
      raw: true
    });

    const scoreDistribution = await Answer.findAll({
      where: { examId: this.id },
      attributes: [
        [sequelize.fn('FLOOR', sequelize.col('score')), 'scoreRange'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('FLOOR', sequelize.col('score'))],
      order: [[sequelize.fn('FLOOR', sequelize.col('score')), 'ASC']],
      raw: true
    });

    return {
      totalSubmissions,
      passedSubmissions,
      failedSubmissions: totalSubmissions - passedSubmissions,
      passRate: totalSubmissions > 0 ? ((passedSubmissions / totalSubmissions) * 100).toFixed(2) : 0,
      averageScore: averageScore?.avg ? parseFloat(averageScore.avg).toFixed(2) : 0,
      scoreDistribution
    };
  };

  Exam.prototype.duplicate = async function(newTitle) {
    const duplicated = await Exam.create({
      title: newTitle || `${this.title} (Copy)`,
      description: this.description,
      subjectId: this.subjectId,
      userId: this.userId,
      totalQuestions: this.totalQuestions,
      easyQuestions: this.easyQuestions,
      mediumQuestions: this.mediumQuestions,
      hardQuestions: this.hardQuestions,
      totalVariations: this.totalVariations,
      timeLimit: this.timeLimit,
      passingScore: this.passingScore,
      instructions: this.instructions,
      allowReview: this.allowReview,
      showCorrectAnswers: this.showCorrectAnswers,
      randomizeQuestions: this.randomizeQuestions,
      randomizeAlternatives: this.randomizeAlternatives,
      maxAttempts: this.maxAttempts,
      showResults: this.showResults,
      requireFullScreen: this.requireFullScreen,
      preventCopyPaste: this.preventCopyPaste,
      shuffleAnswers: this.shuffleAnswers,
      metadata: this.metadata
    });

    return duplicated;
  };

  // Class methods
  Exam.findByUser = function(userId, options = {}) {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: sequelize.models.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ],
      ...options
    });
  };

  Exam.findPublished = function(options = {}) {
    return this.findAll({
      where: { 
        isPublished: true,
        [sequelize.Sequelize.Op.or]: [
          { expiresAt: null },
          { expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } }
        ]
      },
      order: [['publishedAt', 'DESC']],
      include: [
        {
          model: sequelize.models.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ],
      ...options
    });
  };

  Exam.findByAccessCode = function(accessCode) {
    return this.findOne({
      where: { 
        accessCode,
        isPublished: true,
        [sequelize.Sequelize.Op.or]: [
          { expiresAt: null },
          { expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } }
        ]
      },
      include: [
        {
          model: sequelize.models.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        },
        {
          model: sequelize.models.ExamVariation,
          as: 'variations',
          attributes: ['id', 'variationNumber', 'qrCode']
        }
      ]
    });
  };

  return Exam;
};