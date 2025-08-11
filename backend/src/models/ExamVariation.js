const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ExamVariation = sequelize.define('ExamVariation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'id'
      }
    },
    variationNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Variation number must be at least 1'
        }
      }
    },
    variationLetter: {
      type: DataTypes.STRING(1),
      allowNull: false,
      validate: {
        isIn: {
          args: [['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']],
          msg: 'Variation letter must be A-Z'
        }
      }
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidQuestions: function(value) {
          if (!Array.isArray(value)) {
            throw new Error('Questions must be an array');
          }
          if (value.length === 0) {
            throw new Error('Questions array cannot be empty');
          }
          
          value.forEach((question, index) => {
            if (!question.id || !question.text || !question.alternatives || !question.correctAnswer) {
              throw new Error(`Question at index ${index} is missing required fields`);
            }
            if (!Array.isArray(question.alternatives)) {
              throw new Error(`Question at index ${index} alternatives must be an array`);
            }
            if (question.alternatives.length < 2 || question.alternatives.length > 5) {
              throw new Error(`Question at index ${index} must have 2-5 alternatives`);
            }
          });
        }
      }
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    answerKey: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidAnswerKey: function(value) {
          if (!Array.isArray(value)) {
            throw new Error('Answer key must be an array');
          }
          
          value.forEach((answer, index) => {
            if (!answer.questionId || !answer.correctAnswer) {
              throw new Error(`Answer key at index ${index} is missing required fields`);
            }
            if (!/^[A-E]$/.test(answer.correctAnswer)) {
              throw new Error(`Answer key at index ${index} correct answer must be A-E`);
            }
          });
        }
      }
    },
    pdfPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'exam_variations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['examId', 'variationNumber']
      },
      {
        unique: true,
        fields: ['examId', 'variationLetter']
      },
      {
        unique: true,
        fields: ['qrCode']
      },
      {
        fields: ['examId']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Instance methods
  ExamVariation.prototype.getQuestionById = function(questionId) {
    return this.questions.find(q => q.id === questionId);
  };

  ExamVariation.prototype.getCorrectAnswer = function(questionId) {
    const answerKey = this.answerKey.find(a => a.questionId === questionId);
    return answerKey ? answerKey.correctAnswer : null;
  };

  ExamVariation.prototype.checkAnswer = function(questionId, studentAnswer) {
    const correctAnswer = this.getCorrectAnswer(questionId);
    return correctAnswer === studentAnswer;
  };

  ExamVariation.prototype.calculateScore = function(studentAnswers) {
    let correctCount = 0;
    const totalQuestions = this.questions.length;
    const detailedResults = [];

    this.questions.forEach((question, index) => {
      const studentAnswer = studentAnswers[index] || null;
      const correctAnswer = this.getCorrectAnswer(question.id);
      const isCorrect = studentAnswer === correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }

      detailedResults.push({
        questionId: question.id,
        questionNumber: index + 1,
        questionText: question.text,
        studentAnswer,
        correctAnswer,
        isCorrect,
        difficulty: question.difficulty
      });
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      correctCount,
      totalQuestions,
      percentage: score,
      detailedResults
    };
  };

  ExamVariation.prototype.getStatistics = async function() {
    const { Answer } = require('./index');
    
    const stats = await Answer.findAll({
      where: { examVariationId: this.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAnswers'],
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
        [sequelize.fn('MIN', sequelize.col('score')), 'minScore'],
        [sequelize.fn('MAX', sequelize.col('score')), 'maxScore']
      ],
      raw: true
    });

    const result = stats[0] || {};
    
    return {
      variationNumber: this.variationNumber,
      variationLetter: this.variationLetter,
      totalAnswers: parseInt(result.totalAnswers || 0),
      averageScore: parseFloat(result.averageScore || 0),
      minScore: parseFloat(result.minScore || 0),
      maxScore: parseFloat(result.maxScore || 0)
    };
  };

  ExamVariation.prototype.generateVariationName = function() {
    return `Versão ${this.variationLetter}`;
  };

  ExamVariation.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return {
      ...values,
      variationName: this.generateVariationName()
    };
  };

  return ExamVariation;
};