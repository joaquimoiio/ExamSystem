const QRCode = require('qrcode');
const { AppError } = require('../utils/appError');

/**
 * QR Code Service for generating exam QR codes
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
      width: 256
    };
  }

  /**
   * Generate QR code for exam variation
   */
  async generateExamQR(examId, variationId, variationNumber) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const qrData = {
        type: 'exam',
        examId,
        variationId,
        variationNumber,
        url: `${frontendUrl}/exam/take/${examId}/${variationId}`,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), this.defaultOptions);
      
      return {
        qrCode: qrCodeDataURL,
        qrData,
        url: qrData.url
      };
    } catch (error) {
      throw new AppError(`Failed to generate QR code: ${error.message}`, 500);
    }
  }

  /**
   * Generate QR code with custom data
   */
  async generateCustomQR(data, options = {}) {
    try {
      const qrOptions = { ...this.defaultOptions, ...options };
      const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
      
      return qrCodeDataURL;
    } catch (error) {
      throw new AppError(`Failed to generate custom QR code: ${error.message}`, 500);
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
   * Generate QR code as SVG string
   */
  async generateQRSVG(data, options = {}) {
    try {
      const qrOptions = { 
        ...this.defaultOptions, 
        ...options,
        type: 'svg'
      };
      
      const svg = await QRCode.toString(data, qrOptions);
      return svg;
    } catch (error) {
      throw new AppError(`Failed to generate QR code SVG: ${error.message}`, 500);
    }
  }

  /**
   * Validate QR code data
   */
  validateQRData(qrData) {
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      if (data.type === 'exam') {
        const requiredFields = ['examId', 'variationId', 'url'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
          return {
            valid: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
          };
        }
        
        // Validate UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(data.examId) || !uuidRegex.test(data.variationId)) {
          return {
            valid: false,
            message: 'Invalid exam or variation ID format'
          };
        }
        
        // Validate URL
        try {
          new URL(data.url);
        } catch {
          return {
            valid: false,
            message: 'Invalid URL format'
          };
        }
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
   * Generate multiple QR codes for exam variations
   */
  async generateExamVariationQRs(exam, variations) {
    try {
      const qrCodes = [];
      
      for (const variation of variations) {
        const qrResult = await this.generateExamQR(
          exam.id,
          variation.id,
          variation.variationNumber
        );
        
        qrCodes.push({
          variationId: variation.id,
          variationNumber: variation.variationNumber,
          ...qrResult
        });
      }
      
      return qrCodes;
    } catch (error) {
      throw new AppError(`Failed to generate variation QR codes: ${error.message}`, 500);
    }
  }

  /**
   * Generate QR code with exam information embedded
   */
  async generateExamInfoQR(exam, variation) {
    try {
      const qrData = {
        type: 'exam_info',
        examId: exam.id,
        examTitle: exam.title,
        variationId: variation.id,
        variationNumber: variation.variationNumber,
        subjectName: exam.subject?.name,
        totalQuestions: exam.totalQuestions,
        timeLimit: exam.timeLimit,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/exam/take/${exam.id}/${variation.id}`,
        accessCode: exam.accessCode,
        timestamp: new Date().toISOString()
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        ...this.defaultOptions,
        width: 300 // Larger size for more data
      });
      
      return {
        qrCode: qrCodeDataURL,
        qrData,
        url: qrData.url
      };
    } catch (error) {
      throw new AppError(`Failed to generate exam info QR code: ${error.message}`, 500);
    }
  }

  /**
   * Create QR code for exam access without variation (general exam access)
   */
  async generateExamAccessQR(exam) {
    try {
      const qrData = {
        type: 'exam_access',
        examId: exam.id,
        examTitle: exam.title,
        accessCode: exam.accessCode,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/exam/access/${exam.accessCode}`,
        timestamp: new Date().toISOString()
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), this.defaultOptions);
      
      return {
        qrCode: qrCodeDataURL,
        qrData,
        url: qrData.url
      };
    } catch (error) {
      throw new AppError(`Failed to generate exam access QR code: ${error.message}`, 500);
    }
  }

  /**
   * Batch generate QR codes
   */
  async batchGenerateQR(items, type = 'exam') {
    try {
      const results = [];
      
      for (const item of items) {
        let qrResult;
        
        switch (type) {
          case 'exam':
            qrResult = await this.generateExamQR(item.examId, item.variationId, item.variationNumber);
            break;
          case 'exam_info':
            qrResult = await this.generateExamInfoQR(item.exam, item.variation);
            break;
          case 'exam_access':
            qrResult = await this.generateExamAccessQR(item.exam);
            break;
          default:
            qrResult = await this.generateCustomQR(item.data, item.options);
        }
        
        results.push({
          id: item.id,
          ...qrResult
        });
      }
      
      return results;
    } catch (error) {
      throw new AppError(`Failed to batch generate QR codes: ${error.message}`, 500);
    }
  }
}

module.exports = new QRService();