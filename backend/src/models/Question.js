module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 500]
      }
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 2000]
      }
    },
    type: {
      type: DataTypes.ENUM('multiple_choice', 'essay'),
      allowNull: false,
      defaultValue: 'multiple_choice'
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    alternatives: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidAlternatives(value) {
          // Para questões dissertativas, alternativas podem ser null
          if (this.type === 'essay') {
            return;
          }
          
          if (!Array.isArray(value) || value.length < 2 || value.length > 5) {
            throw new Error('Must have between 2 and 5 alternatives');
          }
          
          value.forEach((alt, index) => {
            if (!alt || typeof alt !== 'string' || alt.trim().length === 0) {
              throw new Error(`Alternative ${index + 1} cannot be empty`);
            }
            if (alt.length > 500) {
              throw new Error(`Alternative ${index + 1} is too long (max 500 characters)`);
            }
          });
        }
      }
    },
    correctAnswer: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 4,
        isCorrectIndex(value) {
          // Para questões dissertativas, correctAnswer pode ser null
          if (this.type === 'essay') {
            return;
          }
          
          if (this.alternatives && value >= this.alternatives.length) {
            throw new Error('Correct answer index is out of range');
          }
        }
      }
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false,
      defaultValue: 'medium'
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
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    explanation: {
      type: DataTypes.TEXT
    },
    points: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 1.0,
      validate: {
        min: 0.1,
        max: 10.0
      }
    },
    averageScore: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: null
    },
    timesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    timesCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'questions',
    timestamps: true,
    indexes: [
      {
        fields: ['subjectId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['difficulty']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['tags'],
        using: 'gin'
      }
    ]
  });

  // Instance methods
  Question.prototype.shuffleAlternatives = function() {
    const alternatives = [...this.alternatives];
    const correctAnswer = this.correctAnswer;
    const correctText = alternatives[correctAnswer];
    
    // Fisher-Yates shuffle
    for (let i = alternatives.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]];
    }
    
    // Find new position of correct answer
    const newCorrectAnswer = alternatives.indexOf(correctText);
    
    return {
      alternatives,
      correctAnswer: newCorrectAnswer
    };
  };

  Question.prototype.checkAnswer = function(studentAnswer) {
    if (this.type === 'essay') {
      // Para questões dissertativas, não há correção automática
      return {
        isCorrect: null, // Será avaliado manualmente
        points: 0, // Será definido manualmente
        correctAnswer: null,
        explanation: this.explanation,
        essayAnswer: studentAnswer
      };
    }
    
    const isCorrect = parseInt(studentAnswer) === this.correctAnswer;
    const points = isCorrect ? this.points : 0;
    
    return {
      isCorrect,
      points,
      correctAnswer: this.correctAnswer,
      explanation: this.explanation
    };
  };

  Question.prototype.updateAverageScore = async function(isCorrect) {
    this.timesUsed += 1;
    if (isCorrect) {
      this.timesCorrect += 1;
    }
    
    this.averageScore = (this.timesCorrect / this.timesUsed) * 100;
    
    await this.save();
  };

  Question.prototype.getSuccessRate = function() {
    if (this.timesUsed === 0) return null;
    return ((this.timesCorrect / this.timesUsed) * 100).toFixed(2);
  };

  Question.prototype.getDifficultyLevel = function() {
    const successRate = this.getSuccessRate();
    if (!successRate) return this.difficulty;
    
    if (successRate >= 80) return 'easy';
    if (successRate >= 50) return 'medium';
    return 'hard';
  };

  // Class methods
  Question.findBySubject = function(subjectId, options = {}) {
    return this.findAll({
      where: { subjectId, isActive: true },
      order: [['createdAt', 'DESC']],
      ...options
    });
  };

  Question.findByDifficulty = function(subjectId, difficulty, limit = 10) {
    return this.findAll({
      where: {
        subjectId,
        difficulty,
        isActive: true
      },
      limit,
      order: sequelize.random()
    });
  };

  Question.findByDifficultyMultipleSubjects = function(subjectIds, difficulty, limit = 10) {
    return this.findAll({
      where: {
        subjectId: { [sequelize.Sequelize.Op.in]: subjectIds },
        difficulty,
        isActive: true
      },
      limit,
      order: sequelize.random()
    });
  };

  Question.getRandomQuestions = async function(subjectId, distribution) {
    const { easy = 0, medium = 0, hard = 0 } = distribution;

    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      easy > 0 ? this.findByDifficulty(subjectId, 'easy', easy) : [],
      medium > 0 ? this.findByDifficulty(subjectId, 'medium', medium) : [],
      hard > 0 ? this.findByDifficulty(subjectId, 'hard', hard) : []
    ]);

    return [...easyQuestions, ...mediumQuestions, ...hardQuestions];
  };

  Question.getRandomQuestionsMultipleSubjects = async function(subjectIds, distribution) {
    const { easy = 0, medium = 0, hard = 0 } = distribution;

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return [];
    }

    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      easy > 0 ? this.findByDifficultyMultipleSubjects(subjectIds, 'easy', easy) : [],
      medium > 0 ? this.findByDifficultyMultipleSubjects(subjectIds, 'medium', medium) : [],
      hard > 0 ? this.findByDifficultyMultipleSubjects(subjectIds, 'hard', hard) : []
    ]);

    return [...easyQuestions, ...mediumQuestions, ...hardQuestions];
  };

  Question.searchQuestions = function(userId, searchParams) {
    const { 
      text, 
      subjectId, 
      difficulty, 
      tags, 
      page = 1, 
      limit = 10 
    } = searchParams;

    const where = { userId, isActive: true };
    
    if (text) {
      where.text = { [sequelize.Sequelize.Op.iLike]: `%${text}%` };
    }
    
    if (subjectId) {
      where.subjectId = subjectId;
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (tags && tags.length > 0) {
      where.tags = { [sequelize.Sequelize.Op.overlap]: tags };
    }

    const offset = (page - 1) * limit;

    return this.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: sequelize.models.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'color']
        }
      ]
    });
  };

  return Question;
};