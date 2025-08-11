const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Student name cannot be empty'
        },
        len: {
          args: [2, 100],
          msg: 'Student name must be between 2 and 100 characters'
        }
      }
    },
    studentId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Student ID cannot exceed 50 characters'
        }
      }
    },
    studentEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Invalid email format'
        }
      }
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'id'
      }
    },
    examVariationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exam_variations',
        key: 'id'
      }
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidAnswers: function(value) {
          if (!Array.isArray(value)) {
            throw new Error('Answers must be an array');
          }
          
          value.forEach((answer, index) => {
            if (!answer.questionId) {
              throw new Error(`Answer at index ${index} is missing questionId`);
            }
            if (answer.answer && !/^[A-E]$/.test(answer.answer)) {
              throw new Error(`Answer at index ${index} must be A, B, C, D, or E`);
            }
            if (typeof answer.correct !== 'boolean') {
              throw new Error(`Answer at index ${index} must have a boolean 'correct' field`);
            }
          });
        }
      }
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Score cannot be negative'
        },
        max: {
          args: [100],
          msg: 'Score cannot exceed 100'
        }
      }
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Total questions must be at least 1'
        }
      }
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Correct answers cannot be negative'
        }
      }
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time spent in seconds'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isReviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    certificateGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'answers',
    timestamps: true,
    indexes: [
      {
        fields: ['examId']
      },
      {
        fields: ['examVariationId']
      },
      {
        fields: ['studentName']
      },
      {
        fields: ['studentId']
      },
      {
        fields: ['studentEmail']
      },
      {
        fields: ['score']
      },
      {
        fields: ['submittedAt']
      },
      {
        fields: ['isPassed']
      },
      {
        fields: ['isReviewed']
      }
    ]
  });

  // Instance methods
  Answer.prototype.getPercentage = function() {
    return this.totalQuestions > 0 ? (this.correctAnswers / this.totalQuestions) * 100 : 0;
  };

  Answer.prototype.getGrade = function() {
    const percentage = this.getPercentage();
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  Answer.prototype.getDetailedResults = function() {
    return this.answers.map((answer, index) => ({
      questionNumber: index + 1,
      questionId: answer.questionId,
      studentAnswer: answer.answer,
      isCorrect: answer.correct,
      difficulty: answer.difficulty || 'unknown'
    }));
  };

  Answer.prototype.getStatsByDifficulty = function() {
    const stats = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    };

    this.answers.forEach(answer => {
      const difficulty = answer.difficulty || 'medium';
      if (stats[difficulty]) {
        stats[difficulty].total++;
        if (answer.correct) {
          stats[difficulty].correct++;
        }
      }
    });

    // Calculate percentages
    Object.keys(stats).forEach(difficulty => {
      const stat = stats[difficulty];
      stat.percentage = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
    });

    return stats;
  };

  Answer.prototype.markAsReviewed = async function(reviewerId, feedback = null) {
    this.isReviewed = true;
    this.reviewedAt = new Date();
    this.reviewedBy = reviewerId;
    if (feedback) {
      this.feedback = feedback;
    }
    await this.save();
    return this;
  };

  Answer.prototype.getFormattedDuration = function() {
    if (!this.timeSpent) return 'N/A';
    
    const hours = Math.floor(this.timeSpent / 3600);
    const minutes = Math.floor((this.timeSpent % 3600) / 60);
    const seconds = this.timeSpent % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  Answer.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return {
      ...values,
      percentage: this.getPercentage(),
      grade: this.getGrade(),
      formattedDuration: this.getFormattedDuration(),
      statsByDifficulty: this.getStatsByDifficulty()
    };
  };

  return Answer;
};