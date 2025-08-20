module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
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
    variationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exam_variations',
        key: 'id'
      }
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    studentId: {
      type: DataTypes.STRING(50),
      comment: 'Student registration number or ID'
    },
    studentEmail: {
      type: DataTypes.STRING(255),
      validate: {
        isEmail: true
      }
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Array of student answers with question details'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      validate: {
        min: 0,
        max: 10
      }
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    earnedPoints: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    totalPoints: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      comment: 'Time spent in seconds'
    },
    startedAt: {
      type: DataTypes.DATE
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded', 'reviewed'),
      defaultValue: 'submitted'
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    feedback: {
      type: DataTypes.TEXT
    },
    ipAddress: {
      type: DataTypes.STRING(45)
    },
    userAgent: {
      type: DataTypes.TEXT
    },
    correctionMethod: {
      type: DataTypes.STRING(20),
      defaultValue: 'automatic'
    },
    correctionData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'answers',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['examId'] },
      { fields: ['variationId'] },
      { fields: ['studentId'] },
      { fields: ['studentEmail'] },
      { fields: ['status'] },
      { fields: ['isPassed'] },
      { fields: ['submittedAt'] },
      { fields: ['score'] }
    ]
  });

  // Instance methods
  Answer.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return values;
  };

  Answer.prototype.calculateGrade = function() {
    if (!this.score) return 'N/A';
    
    const score = parseFloat(this.score);
    
    if (score >= 9.0) return 'A';
    if (score >= 8.0) return 'B';
    if (score >= 7.0) return 'C';
    if (score >= 6.0) return 'D';
    return 'F';
  };

  Answer.prototype.getPerformanceByDifficulty = function() {
    if (!this.answers || !Array.isArray(this.answers)) return {};
    
    const performance = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    this.answers.forEach(answer => {
      const difficulty = answer.difficulty || 'medium';
      if (performance[difficulty]) {
        performance[difficulty].total++;
        if (answer.correct) {
          performance[difficulty].correct++;
        }
      }
    });

    // Calculate percentages
    Object.keys(performance).forEach(difficulty => {
      const perf = performance[difficulty];
      perf.percentage = perf.total > 0 ? ((perf.correct / perf.total) * 100).toFixed(1) : 0;
    });

    return performance;
  };

  Answer.prototype.getDetailedResults = function() {
    if (!this.answers || !Array.isArray(this.answers)) return [];
    
    return this.answers.map((answer, index) => ({
      questionNumber: index + 1,
      questionId: answer.questionId,
      studentAnswer: answer.answer,
      correctAnswer: answer.correctAnswer,
      isCorrect: answer.correct,
      difficulty: answer.difficulty,
      points: answer.points || 0,
      maxPoints: answer.maxPoints || 1,
      explanation: answer.explanation
    }));
  };

  Answer.prototype.getTimeSpentFormatted = function() {
    if (!this.timeSpent) return 'N/A';
    
    const hours = Math.floor(this.timeSpent / 3600);
    const minutes = Math.floor((this.timeSpent % 3600) / 60);
    const seconds = this.timeSpent % 60;
    
    let formatted = '';
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0) formatted += `${minutes}m `;
    formatted += `${seconds}s`;
    
    return formatted.trim();
  };

  // Class methods
  Answer.findByExam = function(examId, options = {}) {
    return this.findAll({
      where: { examId },
      order: [['submittedAt', 'DESC']],
      ...options
    });
  };

  Answer.findByStudent = function(studentIdentifier, options = {}) {
    const where = {};
    
    // Check if it's an email or student ID
    if (studentIdentifier.includes('@')) {
      where.studentEmail = studentIdentifier;
    } else {
      where.studentId = studentIdentifier;
    }

    return this.findAll({
      where,
      order: [['submittedAt', 'DESC']],
      ...options
    });
  };

  Answer.getExamStatistics = async function(examId) {
    const stats = await this.findAll({
      where: { examId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSubmissions'],
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
        [sequelize.fn('MIN', sequelize.col('score')), 'minScore'],
        [sequelize.fn('MAX', sequelize.col('score')), 'maxScore'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isPassed" = true THEN 1 END')), 'passedCount']
      ],
      raw: true
    });

    const result = stats[0] || {};
    
    return {
      totalSubmissions: parseInt(result.totalSubmissions) || 0,
      averageScore: result.averageScore ? parseFloat(result.averageScore).toFixed(2) : 0,
      minScore: result.minScore ? parseFloat(result.minScore).toFixed(2) : 0,
      maxScore: result.maxScore ? parseFloat(result.maxScore).toFixed(2) : 0,
      passedCount: parseInt(result.passedCount) || 0,
      failedCount: (parseInt(result.totalSubmissions) || 0) - (parseInt(result.passedCount) || 0),
      passRate: result.totalSubmissions > 0 ? 
        ((parseInt(result.passedCount) / parseInt(result.totalSubmissions)) * 100).toFixed(2) : 0
    };
  };

  Answer.getQuestionAnalysis = async function(examId) {
    const answers = await this.findAll({
      where: { examId },
      attributes: ['answers']
    });

    const questionStats = {};

    answers.forEach(answer => {
      if (answer.answers && Array.isArray(answer.answers)) {
        answer.answers.forEach((questionAnswer, index) => {
          const questionId = questionAnswer.questionId;
          
          if (!questionStats[questionId]) {
            questionStats[questionId] = {
              questionNumber: index + 1,
              totalAttempts: 0,
              correctAttempts: 0,
              difficulty: questionAnswer.difficulty,
              alternativeDistribution: {}
            };
          }

          questionStats[questionId].totalAttempts++;
          
          if (questionAnswer.correct) {
            questionStats[questionId].correctAttempts++;
          }

          // Track answer distribution
          const studentAnswer = questionAnswer.answer;
          if (!questionStats[questionId].alternativeDistribution[studentAnswer]) {
            questionStats[questionId].alternativeDistribution[studentAnswer] = 0;
          }
          questionStats[questionId].alternativeDistribution[studentAnswer]++;
        });
      }
    });

    // Calculate success rates
    Object.keys(questionStats).forEach(questionId => {
      const stats = questionStats[questionId];
      stats.successRate = stats.totalAttempts > 0 ? 
        ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(2) : 0;
      
      // Determine difficulty based on success rate
      const successRate = parseFloat(stats.successRate);
      if (successRate >= 80) {
        stats.calculatedDifficulty = 'easy';
      } else if (successRate >= 50) {
        stats.calculatedDifficulty = 'medium';
      } else {
        stats.calculatedDifficulty = 'hard';
      }
    });

    return questionStats;
  };

  return Answer;
};