module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
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
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    studentEmail: {
      type: DataTypes.STRING(255)
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Array of student answers indexed by question order'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2)
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      comment: 'Time spent in seconds'
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
    feedback: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'answers',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
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
        fields: ['studentEmail']
      },
      {
        fields: ['submittedAt']
      },
      {
        fields: ['status']
      },
      {
        fields: ['score']
      }
    ]
  })

  // Instance methods
  Answer.prototype.calculateScore = async function() {
    const ExamQuestion = sequelize.models.ExamQuestion
    const Question = sequelize.models.Question

    const examQuestions = await ExamQuestion.findAll({
      where: { variationId: this.variationId },
      include: [{
        model: Question,
        as: 'question'
      }],
      order: [['order', 'ASC']]
    })

    let correctCount = 0
    let totalPoints = 0
    let earnedPoints = 0

    examQuestions.forEach((examQuestion, index) => {
      const question = examQuestion.question
      const studentAnswer = this.answers[index]
      const correctAnswer = question.correctAnswer
      const points = parseFloat(examQuestion.points)

      totalPoints += points

      if (studentAnswer !== undefined && studentAnswer === correctAnswer) {
        correctCount++
        earnedPoints += points
      }
    })

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0

    await this.update({
      correctAnswers: correctCount,
      score: parseFloat(score.toFixed(2)),
      status: 'graded'
    })

    return {
      score: parseFloat(score.toFixed(2)),
      correctAnswers: correctCount,
      totalQuestions: examQuestions.length,
      percentage: totalPoints > 0 ? (earnedPoints / totalPoints * 100).toFixed(1) : 0
    }
  }

  Answer.prototype.isPassing = function() {
    if (!this.score) return false
    
    return new Promise(async (resolve) => {
      const exam = await this.getExam()
      resolve(this.score >= exam.passingScore)
    })
  }

  return Answer
}