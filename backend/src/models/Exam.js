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
        fields: ['userId']
      },
      {
        fields: ['subjectId']
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
        fields: ['createdAt']
      },
      {
        fields: ['accessCode']
      }
    ],
    validate: {
      questionDistributionValid() {
        if (this.easyQuestions + this.mediumQuestions + this.hardQuestions !== this.totalQuestions) {
          throw new Error('A soma das questões por dificuldade deve ser igual ao total')
        }
      },
      expirationValid() {
        if (this.expiresAt && this.expiresAt <= new Date()) {
          throw new Error('Data de expiração deve ser no futuro')
        }
      }
    }
  })

  // Instance methods
  Exam.prototype.canTakeExam = function() {
    if (!this.isPublished) return false
    if (this.expiresAt && new Date() > this.expiresAt) return false
    return true
  }

  Exam.prototype.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt
  }

  Exam.prototype.getStatus = function() {
    if (!this.isPublished) return 'draft'
    if (this.isExpired()) return 'expired'
    return 'active'
  }

  return Exam
}