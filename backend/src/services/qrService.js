const QRCode = require('qrcode');
const { AppError } = require('../utils/appError');

/**
 * QR Code Service for generating answer key QR codes
 */
class QRService {
  constructor() {
    this.defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    };
  }

  /**
   * Generate QR code with answer key for teacher correction
   */
  async generateAnswerKeyQR(exam, variation, examQuestions) {
    try {
      // Create answer key data using ExamQuestion data which includes exam-specific points
      const answerKey = examQuestions.map((examQuestion, index) => ({
        questionNumber: index + 1,
        questionId: examQuestion.question.id,
        correctAnswer: examQuestion.question.type === 'essay' ? null : 
          (examQuestion.shuffledAlternatives ? examQuestion.shuffledAlternatives.correctAnswer : examQuestion.question.correctAnswer),
        points: examQuestion.points || 1, // Use exam-specific points
        type: examQuestion.question.type,
        difficulty: examQuestion.question.difficulty
      }));

      const qrData = {
        type: 'answer_key',
        examId: exam.id,
        examTitle: exam.title,
        variationId: variation.id,
        variationNumber: variation.variationNumber,
        subjectName: exam.subject?.name,
        totalQuestions: examQuestions.length,
        totalPoints: examQuestions.reduce((sum, eq) => sum + (parseFloat(eq.points) || 1), 0),
        answerKey,
        generatedAt: new Date().toISOString(),
        version: '2.0'
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), this.defaultOptions);
      
      return {
        qrCode: qrCodeDataURL,
        qrData,
        answerKey
      };
    } catch (error) {
      throw new AppError(`Failed to generate answer key QR code: ${error.message}`, 500);
    }
  }

  /**
   * Generate QR code as buffer (for PDF generation)
   */
  async generateQRBuffer(data, options = {}) {
    try {
      const qrOptions = { 
        ...this.defaultOptions, 
        ...options,
        type: 'png'
      };
      
      const buffer = await QRCode.toBuffer(data, qrOptions);
      return buffer;
    } catch (error) {
      throw new AppError(`Failed to generate QR code buffer: ${error.message}`, 500);
    }
  }

  /**
   * Generate compact answer key for visual comparison
   */
  generateVisualAnswerKey(questions) {
    return questions.map((question, index) => {
      if (question.type === 'essay') {
        return {
          number: index + 1,
          answer: 'DISSERTATIVA',
          points: question.points || 1
        };
      }

      // For multiple choice, show letter (A, B, C, D, E)
      const letters = ['A', 'B', 'C', 'D', 'E'];
      return {
        number: index + 1,
        answer: letters[question.correctAnswer] || '?',
        points: question.points || 1
      };
    });
  }

  /**
   * Validate answer key QR code data
   */
  validateAnswerKeyQR(qrData) {
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      if (data.type !== 'answer_key') {
        return {
          valid: false,
          message: 'QR code is not an answer key'
        };
      }

      const requiredFields = ['examId', 'variationId', 'answerKey'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      if (!Array.isArray(data.answerKey) || data.answerKey.length === 0) {
        return {
          valid: false,
          message: 'Answer key must be a non-empty array'
        };
      }
      
      return { valid: true, data };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid QR code data format'
      };
    }
  }

  /**
   * Compare student answers with answer key from QR code
   */
  correctExam(answerKeyData, studentAnswers) {
    if (!answerKeyData || !answerKeyData.answerKey) {
      throw new Error('Invalid answer key data');
    }

    const results = [];
    let totalPoints = 0;
    let earnedPoints = 0;

    answerKeyData.answerKey.forEach((keyItem, index) => {
      const studentAnswer = studentAnswers[index];
      const maxPoints = keyItem.points || 1;
      totalPoints += maxPoints;

      let isCorrect = false;
      let points = 0;

      if (keyItem.type === 'essay') {
        // Essay questions need manual grading
        isCorrect = null; // Will be graded manually
        points = 0; // Will be assigned manually
      } else {
        // Multiple choice questions
        isCorrect = parseInt(studentAnswer) === keyItem.correctAnswer;
        points = isCorrect ? maxPoints : 0;
        earnedPoints += points;
      }

      results.push({
        questionNumber: keyItem.questionNumber,
        questionId: keyItem.questionId,
        studentAnswer,
        correctAnswer: keyItem.correctAnswer,
        isCorrect,
        points,
        maxPoints,
        type: keyItem.type,
        difficulty: keyItem.difficulty
      });
    });

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0;

    return {
      examId: answerKeyData.examId,
      variationId: answerKeyData.variationId,
      totalQuestions: results.length,
      totalPoints,
      earnedPoints,
      score: parseFloat(score.toFixed(2)),
      results,
      correctedAt: new Date().toISOString()
    };
  }

  /**
   * Generate multiple answer key QR codes for exam variations
   */
  async generateVariationAnswerKeys(exam, variations) {
    try {
      const answerKeys = [];
      
      for (const variation of variations) {
        // Get questions for this variation in the correct order
        const questions = await variation.getQuestionsWithOrder();
        
        const answerKeyResult = await this.generateAnswerKeyQR(exam, variation, questions);
        
        answerKeys.push({
          variationId: variation.id,
          variationNumber: variation.variationNumber,
          ...answerKeyResult
        });
      }
      
      return answerKeys;
    } catch (error) {
      throw new AppError(`Failed to generate variation answer keys: ${error.message}`, 500);
    }
  }
}

module.exports = new QRService();