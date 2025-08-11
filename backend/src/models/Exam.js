const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define('Exam', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Exam title cannot be empty'
        },
        len: {
          args: [3, 200],
          msg: 'Exam title must be between 3 and 200 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Description cannot exceed 1000 characters'
        }
      }
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
      }
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Must have at least 1 question'
        },
        max: {
          args: [100],
          msg: 'Cannot have more than 100 questions'
        }
      }
    },
    easyQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Easy questions cannot be negative'
        }
      }
    },
    mediumQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Medium questions cannot be negative'
        }
      }
    },
    hardQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Hard questions cannot be negative'
        }
      }
    },
    totalVariations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: 'Must have at least 1 variation'
        },
        max: {
          args: [50],
          msg: 'Cannot have more than 50 variations'
        }
      }
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'mixed'),
      allowNull: false,
      defaultValue: 'mixed'
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [1],
          msg: 'Time limit must be at least 1 minute'
        },
        max: {
          args: [480],
          msg: 'Time limit cannot exceed 8 hours (480 minutes)'
        }
      }
    },
    passingScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 60.0,
      validate: {
        min: {
          args: [0],
          msg: 'Passing score cannot be negative'
        },
        max: {
          args: [100],
          msg: 'Passing score cannot exceed 100'
        }
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    allowReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    showCorrectAnswers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    randomizeQuestions: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    randomizeAlternatives: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
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
        fields: ['isActive']
      },
      {
        fields: ['isPublished']
      },
      {
        fields: ['publishedAt']
      },
      {
        fields: ['expiresAt']
      }
    ],
    validate: {
      questionsSum: function() {
        if (this.easyQuestions + this.mediumQuestions + this.hardQuestions !== this.totalQuestions) {
          throw new Error('Sum of easy, medium, and hard questions must equal total questions');
        }
      }
    }
  });

  // Instance methods
  Exam.prototype.publish = async function() {
    this.isPublished = true;
    this.publishedAt = new Date();
    await this.save();
    return this;
  };

  Exam.prototype.unpublish = async function() {
    this.isPublished = false;
    this.publishedAt = null;
    await this.save();
    return this;
  };

  Exam.prototype.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
  };

  Exam.prototype.canTakeExam = function() {
    return this.isActive && this.isPublished && !this.isExpired();
  };

  Exam.prototype.getStatistics = async function() {
    const { Answer } = require('./index');
    
    const stats = await Answer.findAll({
      where: { examId: this.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAnswers'],
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
        [sequelize.fn('MIN', sequelize.col('score')), 'minScore'],
        [sequelize.fn('MAX', sequelize.col('score')), 'maxScore'],
        [sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN score >= ${this.passingScore} THEN 1 END`)
        ), 'passedCount']
      ],
      raw: true
    });

    const result = stats[0] || {};
    
    return {
      totalAnswers: parseInt(result.totalAnswers || 0),
      averageScore: parseFloat(result.averageScore || 0),
      minScore: parseFloat(result.minScore || 0),
      maxScore: parseFloat(result.maxScore || 0),
      passedCount: parseInt(result.passedCount || 0),
      passRate: result.totalAnswers > 0 ? 
        (parseInt(result.passedCount || 0) / parseInt(result.totalAnswers || 1)) * 100 : 0
    };
  };

  Exam.prototype.getDifficultyDistribution = function() {
    const total = this.totalQuestions;
    return {
      easy: {
        count: this.easyQuestions,
        percentage: total > 0 ? (this.easyQuestions / total) * 100 : 0
      },
      medium: {
        count: this.mediumQuestions,
        percentage: total > 0 ? (this.mediumQuestions / total) * 100 : 0
      },
      hard: {
        count: this.hardQuestions,
        percentage: total > 0 ? (this.hardQuestions / total) * 100 : 0
      }
    };
  };

  Exam.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return {
      ...values,
      isExpired: this.isExpired(),
      canTakeExam: this.canTakeExam(),
      difficultyDistribution: this.getDifficultyDistribution()
    };
  };

  return Exam;
};