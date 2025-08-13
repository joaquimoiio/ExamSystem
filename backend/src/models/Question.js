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
        isCorrectAnswerValid(value) {
          if (this.alternatives && value >= this.alternatives.length) {
            throw new Error('Resposta correta deve ser um índice válido das alternativas')
          }
        }
      }
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false,
      defaultValue: 'medium'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      validate: {
        isValidTags(value) {
          if (!Array.isArray(value)) {
            throw new Error('Tags devem ser um array')
          }
          if (value.length > 10) {
            throw new Error('Máximo de 10 tags por questão')
          }
          value.forEach(tag => {
            if (typeof tag !== 'string' || tag.length > 20) {
              throw new Error('Cada tag deve ser uma string de até 20 caracteres')
            }
          })
        }
      }
    },
    explanation: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    timesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    averageScore: {
      type: DataTypes.DECIMAL(3, 2),
      validate: {
        min: 0,
        max: 10
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
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'questions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['subjectId']
      },
      {
        fields: ['difficulty']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['timesUsed']
      },
      {
        fields: ['averageScore']
      }
    ],
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      byDifficulty(difficulty) {
        return {
          where: {
            difficulty: difficulty,
            isActive: true
          }
        }
      },
      bySubject(subjectId) {
        return {
          where: {
            subjectId: subjectId,
            isActive: true
          }
        }
      },
      withTag(tag) {
        return {
          where: {
            tags: {
              [sequelize.Sequelize.Op.contains]: [tag]
            },
            isActive: true
          }
        }
      }
    }
  })

  // Instance methods
  Question.prototype.incrementUsage = async function() {
    await this.increment('timesUsed')
    return this
  }

  Question.prototype.updateAverageScore = async function(scores) {
    if (!Array.isArray(scores) || scores.length === 0) return this
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    await this.update({ averageScore: parseFloat(average.toFixed(2)) })
    return this
  }

  Question.prototype.toSafeJSON = function() {
    const question = this.toJSON()
    // Remove correct answer from public view
    if (!this.showCorrectAnswer) {
      delete question.correctAnswer
      delete question.explanation
    }
    return question
  }

  Question.prototype.shuffleAlternatives = function() {
    const alternatives = [...this.alternatives]
    const correctAnswer = this.correctAnswer
    const correctText = alternatives[correctAnswer].text

    // Fisher-Yates shuffle
    for (let i = alternatives.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]]
    }

    // Find new position of correct answer
    const newCorrectAnswer = alternatives.findIndex(alt => alt.text === correctText)

    return {
      alternatives,
      correctAnswer: newCorrectAnswer
    }
  }

  // Class methods
  Question.getStatsBySubject = async function(subjectId) {
    const questions = await this.findAll({
      where: { subjectId, isActive: true },
      attributes: ['difficulty', 'timesUsed', 'averageScore']
    })

    return {
      total: questions.length,
      byDifficulty: {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length
      },
      averageUsage: questions.reduce((sum, q) => sum + q.timesUsed, 0) / questions.length || 0,
      averageScore: questions
        .filter(q => q.averageScore !== null)
        .reduce((sum, q) => sum + parseFloat(q.averageScore), 0) / 
        questions.filter(q => q.averageScore !== null).length || 0
    }
  }

  Question.findForExam = async function(criteria) {
    const { subjectId, difficulties, count, excludeIds = [] } = criteria
    
    const where = {
      subjectId,
      isActive: true,
      id: {
        [sequelize.Sequelize.Op.notIn]: excludeIds
      }
    }

    if (difficulties && difficulties.length > 0) {
      where.difficulty = {
        [sequelize.Sequelize.Op.in]: difficulties
      }
    }

    return await this.findAll({
      where,
      limit: count,
      order: sequelize.literal('RANDOM()') // PostgreSQL random
    })
  }

  return Question
}