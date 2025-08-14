const QRCode = require('qrcode');

module.exports = (sequelize, DataTypes) => {
  const ExamVariation = sequelize.define('ExamVariation', {
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
    variationNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    qrCode: {
      type: DataTypes.TEXT
    },
    qrCodeData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'exam_variations',
    timestamps: true,
    indexes: [
      {
        fields: ['examId']
      },
      {
        unique: true,
        fields: ['examId', 'variationNumber']
      }
    ]
  });

  // Instance methods
  ExamVariation.prototype.generateQrCode = async function() {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrData = {
      examId: this.examId,
      variationId: this.id,
      variationNumber: this.variationNumber,
      url: `${frontendUrl}/exam/take/${this.examId}/${this.id}`,
      timestamp: new Date().toISOString()
    };

    try {
      this.qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      this.qrCodeData = qrData;
      await this.save();
      
      return this.qrCode;
    } catch (error) {
      throw new Error('Failed to generate QR code: ' + error.message);
    }
  };

  ExamVariation.prototype.getQuestionsWithOrder = async function() {
    const ExamQuestion = sequelize.models.ExamQuestion;
    const Question = sequelize.models.Question;
    
    const examQuestions = await ExamQuestion.findAll({
      where: { 
        variationId: this.id,
        examId: this.examId 
      },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] }
        }
      ],
      order: [['questionOrder', 'ASC']]
    });

    return examQuestions.map((eq, index) => {
      const question = eq.question.toJSON();
      
      // Shuffle alternatives if exam requires it
      if (this.exam && this.exam.randomizeAlternatives) {
        const shuffled = question.shuffleAlternatives ? 
          question.shuffleAlternatives() : 
          { alternatives: question.alternatives, correctAnswer: question.correctAnswer };
        
        question.alternatives = shuffled.alternatives;
        question.correctAnswer = shuffled.correctAnswer;
      }
      
      return {
        ...question,
        order: index,
        examQuestionId: eq.id
      };
    });
  };

  ExamVariation.prototype.calculateScore = function(studentAnswers) {
    if (!this.questions || this.questions.length === 0) {
      throw new Error('No questions found for this variation');
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;
    const detailedResults = [];

    this.questions.forEach((question, index) => {
      const studentAnswer = studentAnswers[index];
      const isCorrect = parseInt(studentAnswer) === question.correctAnswer;
      const points = isCorrect ? (question.points || 1) : 0;

      totalPoints += (question.points || 1);
      earnedPoints += points;
      
      if (isCorrect) correctCount++;

      detailedResults.push({
        questionId: question.id,
        studentAnswer: parseInt(studentAnswer),
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        maxPoints: question.points || 1,
        difficulty: question.difficulty,
        explanation: question.explanation
      });
    });

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0;

    return {
      score: parseFloat(score.toFixed(2)),
      totalQuestions: this.questions.length,
      correctCount,
      earnedPoints,
      totalPoints,
      detailedResults
    };
  };

  ExamVariation.prototype.isValidSubmission = function(studentAnswers) {
    if (!Array.isArray(studentAnswers)) {
      return { valid: false, message: 'Answers must be an array' };
    }

    if (!this.questions || this.questions.length === 0) {
      return { valid: false, message: 'No questions found for this variation' };
    }

    if (studentAnswers.length !== this.questions.length) {
      return { 
        valid: false, 
        message: `Expected ${this.questions.length} answers, got ${studentAnswers.length}` 
      };
    }

    for (let i = 0; i < studentAnswers.length; i++) {
      const answer = studentAnswers[i];
      const question = this.questions[i];
      
      if (answer === null || answer === undefined || answer === '') {
        return { 
          valid: false, 
          message: `Answer for question ${i + 1} is required` 
        };
      }

      const answerIndex = parseInt(answer);
      if (isNaN(answerIndex) || answerIndex < 0 || answerIndex >= question.alternatives.length) {
        return { 
          valid: false, 
          message: `Invalid answer for question ${i + 1}` 
        };
      }
    }

    return { valid: true };
  };

  ExamVariation.prototype.getSubmissionsCount = async function() {
    const Answer = sequelize.models.Answer;
    
    return await Answer.count({
      where: { 
        examId: this.examId,
        variationId: this.id 
      }
    });
  };

  // Class methods
  ExamVariation.findByExam = function(examId) {
    return this.findAll({
      where: { examId },
      order: [['variationNumber', 'ASC']]
    });
  };

  ExamVariation.findWithQuestions = function(variationId) {
    const Question = sequelize.models.Question;
    const ExamQuestion = sequelize.models.ExamQuestion;
    
    return this.findByPk(variationId, {
      include: [
        {
          model: Question,
          as: 'questions',
          through: {
            model: ExamQuestion,
            as: 'examQuestion',
            attributes: ['questionOrder']
          },
          attributes: { exclude: ['userId'] }
        },
        {
          model: sequelize.models.Exam,
          as: 'exam',
          attributes: ['id', 'title', 'timeLimit', 'instructions', 'randomizeAlternatives']
        }
      ]
    });
  };

  return ExamVariation;
};