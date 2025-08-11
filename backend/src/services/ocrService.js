const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class OCRService {
  constructor() {
    this.tesseractOptions = {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    };
  }

  /**
   * Process image for better OCR recognition
   */
  async preprocessImage(imagePath) {
    try {
      const processedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
      
      await sharp(imagePath)
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toFile(processedPath);
      
      return processedPath;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      return imagePath; // Return original if preprocessing fails
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractTextFromImage(imagePath) {
    try {
      const processedImagePath = await this.preprocessImage(imagePath);
      
      const { data: { text } } = await Tesseract.recognize(
        processedImagePath,
        'por+eng', // Portuguese and English
        this.tesseractOptions
      );

      // Clean up processed image if different from original
      if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
        fs.unlinkSync(processedImagePath);
      }

      return text.trim();
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse answer sheet from extracted text
   */
  parseAnswerSheet(extractedText, totalQuestions) {
    const answers = [];
    const lines = extractedText.split('\n').map(line => line.trim());
    
    // Common patterns for answer sheets
    const patterns = [
      /(\d+)[\s\-\.]+([A-E])/g,  // "1. A" or "1 - A" or "1 A"
      /([A-E])[\s]*(\d+)/g,      // "A 1" or "A1"
      /(\d+)[\s]*([A-E])/g       // "1A" or "1 A"
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const matches = [...extractedText.matchAll(pattern)];
      
      if (matches.length >= totalQuestions * 0.5) { // At least 50% matches
        matches.forEach(match => {
          let questionNum, answer;
          
          if (/\d/.test(match[1])) {
            questionNum = parseInt(match[1]);
            answer = match[2];
          } else {
            questionNum = parseInt(match[2]);
            answer = match[1];
          }
          
          if (questionNum >= 1 && questionNum <= totalQuestions && /^[A-E]$/.test(answer)) {
            answers[questionNum - 1] = answer;
          }
        });
        break;
      }
    }

    // Fill missing answers with null
    for (let i = 0; i < totalQuestions; i++) {
      if (!answers[i]) {
        answers[i] = null;
      }
    }

    return answers;
  }

  /**
   * Process multiple answer sheet images
   */
  async processAnswerSheets(imagePaths, totalQuestions) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const extractedText = await this.extractTextFromImage(imagePath);
        const answers = this.parseAnswerSheet(extractedText, totalQuestions);
        
        results.push({
          imagePath,
          success: true,
          extractedText,
          answers,
          confidence: this.calculateConfidence(answers, totalQuestions)
        });
      } catch (error) {
        results.push({
          imagePath,
          success: false,
          error: error.message,
          answers: null,
          confidence: 0
        });
      }
    }
    
    return results;
  }

  /**
   * Calculate confidence score based on extracted answers
   */
  calculateConfidence(answers, totalQuestions) {
    const validAnswers = answers.filter(answer => answer !== null).length;
    return (validAnswers / totalQuestions) * 100;
  }

  /**
   * Detect QR codes in image
   */
  async detectQRCode(imagePath) {
    try {
      // For QR code detection, we would typically use a specialized library
      // For now, we'll use OCR to try to find QR code-like patterns
      const text = await this.extractTextFromImage(imagePath);
      
      // Look for URL patterns that might be from QR codes
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urls = text.match(urlPattern);
      
      if (urls && urls.length > 0) {
        return {
          found: true,
          qrCode: urls[0],
          confidence: 80
        };
      }
      
      return {
        found: false,
        qrCode: null,
        confidence: 0
      };
    } catch (error) {
      console.error('QR code detection error:', error);
      return {
        found: false,
        qrCode: null,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Extract student information from answer sheet
   */
  async extractStudentInfo(imagePath) {
    try {
      const text = await this.extractTextFromImage(imagePath);
      const lines = text.split('\n').map(line => line.trim());
      
      let studentName = null;
      let studentId = null;
      
      // Common patterns for student information
      const namePatterns = [
        /nome[\s\:]+([a-záàâãéèêíîóôõúçñ\s]+)/i,
        /aluno[\s\:]+([a-záàâãéèêíîóôõúçñ\s]+)/i,
        /estudante[\s\:]+([a-záàâãéèêíîóôõúçñ\s]+)/i
      ];
      
      const idPatterns = [
        /matrícula[\s\:]+(\d+)/i,
        /registro[\s\:]+(\d+)/i,
        /ra[\s\:]+(\d+)/i,
        /id[\s\:]+(\d+)/i
      ];
      
      // Extract student name
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match) {
          studentName = match[1].trim();
          break;
        }
      }
      
      // Extract student ID
      for (const pattern of idPatterns) {
        const match = text.match(pattern);
        if (match) {
          studentId = match[1].trim();
          break;
        }
      }
      
      return {
        studentName,
        studentId,
        confidence: (studentName ? 50 : 0) + (studentId ? 50 : 0)
      };
    } catch (error) {
      console.error('Student info extraction error:', error);
      return {
        studentName: null,
        studentId: null,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Process complete answer sheet with all information
   */
  async processCompleteAnswerSheet(imagePath, totalQuestions) {
    try {
      const [text, qrResult, studentInfo] = await Promise.all([
        this.extractTextFromImage(imagePath),
        this.detectQRCode(imagePath),
        this.extractStudentInfo(imagePath)
      ]);
      
      const answers = this.parseAnswerSheet(text, totalQuestions);
      const answersConfidence = this.calculateConfidence(answers, totalQuestions);
      
      return {
        success: true,
        extractedText: text,
        answers: {
          data: answers,
          confidence: answersConfidence
        },
        qrCode: qrResult,
        studentInfo: {
          ...studentInfo
        },
        overallConfidence: (answersConfidence + qrResult.confidence + studentInfo.confidence) / 3
      };
    } catch (error) {
      console.error('Complete answer sheet processing error:', error);
      return {
        success: false,
        error: error.message,
        answers: null,
        qrCode: null,
        studentInfo: null,
        overallConfidence: 0
      };
    }
  }

  /**
   * Batch process multiple answer sheets
   */
  async batchProcessAnswerSheets(imagePaths, totalQuestions) {
    const results = [];
    const batchSize = 3; // Process 3 images at a time to avoid memory issues
    
    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (imagePath) => {
        try {
          const result = await this.processCompleteAnswerSheet(imagePath, totalQuestions);
          return {
            imagePath,
            filename: path.basename(imagePath),
            ...result
          };
        } catch (error) {
          return {
            imagePath,
            filename: path.basename(imagePath),
            success: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches
      if (i + batchSize < imagePaths.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return {
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        averageConfidence: results
          .filter(r => r.success)
          .reduce((sum, r) => sum + (r.overallConfidence || 0), 0) / 
          Math.max(1, results.filter(r => r.success).length)
      }
    };
  }

  /**
   * Clean up temporary files
   */
  cleanupFiles(filePaths) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
      }
    });
  }
}

module.exports = new OCRService();