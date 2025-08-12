// backend/src/models/index.js
const { Sequelize } = require('sequelize')
const config = require('../config/database')

const sequelize = new Sequelize(config)

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes)
const Subject = require('./Subject')(sequelize, Sequelize.DataTypes)
const Question = require('./Question')(sequelize, Sequelize.DataTypes)
const Exam = require('./Exam')(sequelize, Sequelize.DataTypes)
const ExamVariation = require('./ExamVariation')(sequelize, Sequelize.DataTypes)
const ExamQuestion = require('./ExamQuestion')(sequelize, Sequelize.DataTypes)
const Answer = require('./Answer')(sequelize, Sequelize.DataTypes)

// Define associations
const models = {
  User,
  Subject,
  Question,
  Exam,
  ExamVariation,
  ExamQuestion,
  Answer
}

// User associations
User.hasMany(Subject, { foreignKey: 'userId', as: 'subjects' })
User.hasMany(Question, { foreignKey: 'userId', as: 'questions' })
User.hasMany(Exam, { foreignKey: 'userId', as: 'exams' })
User.hasMany(Answer, { foreignKey: 'userId', as: 'answers' })

// Subject associations
Subject.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Subject.hasMany(Question, { foreignKey: 'subjectId', as: 'questions' })
Subject.hasMany(Exam, { foreignKey: 'subjectId', as: 'exams' })

// Question associations
Question.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Question.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' })
Question.belongsToMany(ExamVariation, { 
  through: ExamQuestion, 
  foreignKey: 'questionId',
  otherKey: 'variationId',
  as: 'examVariations'
})

// Exam associations
Exam.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Exam.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' })
Exam.hasMany(ExamVariation, { foreignKey: 'examId', as: 'variations' })
Exam.hasMany(Answer, { foreignKey: 'examId', as: 'answers' })

// ExamVariation associations
ExamVariation.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' })
ExamVariation.belongsToMany(Question, { 
  through: ExamQuestion, 
  foreignKey: 'variationId',
  otherKey: 'questionId',
  as: 'questions'
})
ExamVariation.hasMany(Answer, { foreignKey: 'variationId', as: 'answers' })

// ExamQuestion associations
ExamQuestion.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' })
ExamQuestion.belongsTo(ExamVariation, { foreignKey: 'variationId', as: 'variation' })
ExamQuestion.belongsTo(Question, { foreignKey: 'questionId', as: 'question' })

// Answer associations
Answer.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Answer.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' })
Answer.belongsTo(ExamVariation, { foreignKey: 'variationId', as: 'variation' })
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' })

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

module.exports = {
  sequelize,
  Sequelize,
  ...models
}

// backend/src/models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase())
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'teacher', 'student'),
      allowNull: false,
      defaultValue: 'teacher'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    refreshToken: {
      type: DataTypes.TEXT
    },
    passwordResetToken: {
      type: DataTypes.STRING
    },
    passwordResetExpires: {
      type: DataTypes.DATE
    },
    deactivatedAt: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      }
    ],
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      withoutPassword: {
        attributes: {
          exclude: ['password', 'refreshToken', 'passwordResetToken']
        }
      }
    }
  })

  // Instance methods
  User.prototype.toSafeJSON = function() {
    const { password, refreshToken, passwordResetToken, ...safeUser } = this.toJSON()
    return safeUser
  }

  return User
}

// backend/src/models/Subject.js
module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#3B82F6',
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
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
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['name']
      },
      {
        fields: ['createdAt']
      },
      {
        unique: true,
        fields: ['userId', 'name']
      }
    ]
  })

  // Instance methods
  Subject.prototype.canCreateExam = async function(requirements) {
    const Question = sequelize.models.Question
    
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      Question.count({
        where: { 
          subjectId: this.id, 
          difficulty: 'easy', 
          isActive: true 
        }
      }),
      Question.count({
        where: { 
          subjectId: this.id, 
          difficulty: 'medium', 
          isActive: true 
        }
      }),
      Question.count({
        where: { 
          subjectId: this.id, 
          difficulty: 'hard', 
          isActive: true 
        }
      })
    ])

    const available = { easy: easyCount, medium: mediumCount, hard: hardCount }
    const required = requirements || { easy: 0, medium: 0, hard: 0 }

    const canCreate = available.easy >= required.easy && 
                     available.medium >= required.medium && 
                     available.hard >= required.hard

    return { canCreate, available, required }
  }

  return Subject
}

// backend/src/models/Question.js
module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 5000]
      }
    },
    alternatives: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidAlternatives(value) {
          if (!Array.isArray(value) || value.length < 2 || value.length > 5) {
            throw new Error('Deve ter entre 2 e 5 alternativas')
          }
          value.forEach((alt, index) => {
            if (!alt.text || typeof alt.text !== 'string' || !alt.text.trim()) {
              throw new Error(`Alternativa ${index + 1} deve ter texto válido`)
            }
          })
        }
      }
    },
    correctAnswer: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 4,
        isValidAnswer(value) {
          if (this.alternatives && value >= this.alternatives.length) {
            throw new Error('Resposta correta inválida')
          }
        }
      }
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 1.00,
      validate: {
        min: 0.1,
        max: 10.0
      }
    },
    timeEstimate: {
      type: DataTypes.INTEGER,
      comment: 'Estimated time to answer in seconds'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    timesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'questions',
    timestamps: true,
    paranoid: true,
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
        fields: ['timesUsed']
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['createdAt']
      }
    ]
  })

  // Instance methods
  Question.prototype.incrementUsage = function() {
    return this.increment('timesUsed')
  }

  Question.prototype.getCorrectAlternative = function() {
    return this.alternatives[this.correctAnswer]
  }

  return Question
}