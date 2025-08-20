module.exports = (sequelize, DataTypes) => {
  const ExamQuestion = sequelize.define('ExamQuestion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    variationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exam_variations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    questionOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    shuffledAlternatives: {
      type: DataTypes.JSONB,
      comment: 'Stores shuffled alternatives and correct answer mapping'
    },
    points: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0.1,
        max: 100.0
      },
      comment: 'Points for this specific question in this exam (overrides question default points)'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'exam_questions',
    timestamps: true,
    indexes: [
      {
        fields: ['examId']
      },
      {
        fields: ['variationId']
      },
      {
        fields: ['questionId']
      },
      {
        fields: ['questionOrder']
      },
      {
        unique: true,
        fields: ['variationId', 'questionId']
      },
      {
        unique: true,
        fields: ['variationId', 'questionOrder']
      }
    ]
  });

  // Instance methods
  ExamQuestion.prototype.getShuffledQuestion = function() {
    const question = this.question;
    
    if (!question) {
      throw new Error('Question not loaded');
    }

    // If shuffled alternatives are stored, use them
    if (this.shuffledAlternatives) {
      return {
        ...question.toJSON(),
        alternatives: this.shuffledAlternatives.alternatives,
        correctAnswer: this.shuffledAlternatives.correctAnswer,
        order: this.questionOrder
      };
    }

    // Otherwise return original question
    return {
      ...question.toJSON(),
      order: this.questionOrder
    };
  };

  ExamQuestion.prototype.shuffleAndStore = async function() {
    const question = this.question;
    
    if (!question) {
      throw new Error('Question not loaded');
    }

    // Shuffle alternatives
    const alternatives = [...question.alternatives];
    const correctAnswer = question.correctAnswer;
    const correctText = alternatives[correctAnswer];
    
    // Fisher-Yates shuffle
    for (let i = alternatives.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]];
    }
    
    // Find new position of correct answer
    const newCorrectAnswer = alternatives.indexOf(correctText);
    
    // Store shuffled data
    this.shuffledAlternatives = {
      alternatives,
      correctAnswer: newCorrectAnswer,
      originalCorrectAnswer: correctAnswer,
      shuffledAt: new Date().toISOString()
    };
    
    await this.save();
    
    return this.shuffledAlternatives;
  };

  ExamQuestion.prototype.checkAnswer = function(studentAnswer) {
    const question = this.question;
    const correctAnswer = this.shuffledAlternatives ? 
      this.shuffledAlternatives.correctAnswer : 
      question.correctAnswer;
    
    const isCorrect = parseInt(studentAnswer) === correctAnswer;
    const questionPoints = this.points || 1; // Use exam-specific points
    const points = isCorrect ? questionPoints : 0;
    
    return {
      isCorrect,
      points,
      correctAnswer,
      maxPoints: questionPoints,
      explanation: question.explanation
    };
  };

  // Class methods
  ExamQuestion.findByVariation = function(variationId, options = {}) {
    return this.findAll({
      where: { variationId },
      order: [['questionOrder', 'ASC']],
      include: [
        {
          model: sequelize.models.Question,
          as: 'question',
          attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] }
        }
      ],
      ...options
    });
  };

  ExamQuestion.findByExam = function(examId, options = {}) {
    return this.findAll({
      where: { examId },
      order: [['variationId', 'ASC'], ['questionOrder', 'ASC']],
      include: [
        {
          model: sequelize.models.Question,
          as: 'question'
        },
        {
          model: sequelize.models.ExamVariation,
          as: 'variation',
          attributes: ['id', 'variationNumber']
        }
      ],
      ...options
    });
  };

  ExamQuestion.bulkCreateForVariation = async function(variationId, examId, questions) {
    const examQuestions = questions.map((question, index) => ({
      examId,
      variationId,
      questionId: question.id,
      questionOrder: index,
      points: question.examPoints || question.points || 1.0 // Use exam-specific points if provided
    }));

    return await this.bulkCreate(examQuestions);
  };

  ExamQuestion.getQuestionsByDifficulty = async function(variationId) {
    const examQuestions = await this.findAll({
      where: { variationId },
      include: [
        {
          model: sequelize.models.Question,
          as: 'question',
          attributes: ['id', 'difficulty', 'points']
        }
      ]
    });

    const distribution = {
      easy: 0,
      medium: 0,
      hard: 0,
      totalPoints: 0
    };

    examQuestions.forEach(eq => {
      const difficulty = eq.question.difficulty;
      const points = eq.points || 1; // Use exam-specific points
      
      distribution[difficulty]++;
      distribution.totalPoints += parseFloat(points);
    });

    return distribution;
  };

  return ExamQuestion;
};